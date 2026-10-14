"""
PersonaGrid - Double-Entry Micro-Leasing Ledger Service
Architecture Philosophy: "Antigravity"
 - Pure Optimistic Concurrency Control (OCC) using monotonic `lock_version`.
 - Elimination of row-level lock contention (`SELECT FOR UPDATE`), preventing
   database lock queues, deadlocks, and latency degradation at high concurrency.
 - Strict idempotency guarantees to prevent double-billing during network jitter.
 - Zero-sum double-entry invariant enforced at both application and database engine layers.
"""

from __future__ import annotations

import asyncio
import json
import random
from dataclasses import dataclass
from decimal import Decimal
from typing import Any
from uuid import UUID

import asyncpg


# -----------------------------------------------------------------------------
# Custom Domain Exceptions
# -----------------------------------------------------------------------------

class LedgerError(Exception):
    """Base exception for all ledger operations."""


class InsufficientFundsError(LedgerError):
    """Raised when the debtor account balance is less than the royalty payment."""


class OptimisticLockCollisionError(LedgerError):
    """Raised when a concurrent update modified the account lock_version before commit."""


class AccountFrozenError(LedgerError):
    """Raised when an account is administratively frozen or suspended."""


class AccountNotFoundError(LedgerError):
    """Raised when a referenced account does not exist in the ledger."""


# -----------------------------------------------------------------------------
# Data Transfer Objects (DTOs)
# -----------------------------------------------------------------------------

@dataclass(slots=True, frozen=True)
class AccountSnapshot:
    account_id: UUID
    account_type: str
    balance: Decimal
    lock_version: int
    currency: str
    is_frozen: bool


@dataclass(slots=True, frozen=True)
class MicroLeaseReceipt:
    transaction_id: UUID
    idempotency_key: str
    business_account_id: UUID
    consumer_account_id: UUID
    royalty_amount: Decimal
    status: str
    is_idempotent_replay: bool
    retries_required: int


class MicroLeasingLedgerService:
    """
    Executes double-entry financial settlements with Optimistic Concurrency Control (OCC).

    Why OCC over Pessimistic Locking (SELECT ... FOR UPDATE)?
    In micro-leasing marketplaces, high-reputation personas and platform escrows experience
    hundreds of read/write queries per second. Traditional pessimistic row locks force PostgreSQL
    to serialize transactions, accumulating locks in shared memory and causing transaction
    queuing cascades.

    OCC reads the current `lock_version` and only commits if `lock_version` matches at the
    exact moment of the update. If a concurrent writer won the race, the loser detects 0
    affected rows, rolls back cleanly, and retries with randomized exponential backoff.
    """

    def __init__(
        self,
        max_retries: int = 5,
        base_backoff_ms: float = 8.0,
        max_backoff_ms: float = 120.0,
    ) -> None:
        self.max_retries = max_retries
        self.base_backoff_ms = base_backoff_ms
        self.max_backoff_ms = max_backoff_ms

    async def get_account_snapshot(
        self, conn: asyncpg.Connection, account_id: UUID
    ) -> AccountSnapshot:
        """
        Fetches the current state of an account without acquiring exclusive row locks.
        """
        row = await conn.fetchrow(
            """
            SELECT id, account_type, balance, lock_version, currency, is_frozen
            FROM accounts
            WHERE id = $1;
            """,
            account_id,
        )
        if not row:
            raise AccountNotFoundError(f"Account {account_id} does not exist.")

        return AccountSnapshot(
            account_id=row["id"],
            account_type=row["account_type"],
            balance=Decimal(str(row["balance"])),
            lock_version=row["lock_version"],
            currency=row["currency"],
            is_frozen=row["is_frozen"],
        )

    async def execute_micro_lease_payment(
        self,
        pool: asyncpg.Pool,
        idempotency_key: str,
        business_account_id: UUID,
        consumer_account_id: UUID,
        royalty_amount: Decimal,
        reference_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> MicroLeaseReceipt:
        """
        Executes a micro-leasing transaction between a market research business and a persona owner.

        Double-entry invariants:
          1. Business Escrow Account: DEBIT royalty_amount (Assets/Cash decrease)
          2. Consumer Wallet Account: CREDIT royalty_amount (Royalty Revenue increase)
          3. Total Debits == Total Credits (Zero-Sum Invariant checked by DB trigger).
        """
        if royalty_amount <= Decimal("0.000000"):
            raise ValueError(f"Royalty amount must be positive, got {royalty_amount}")

        # Quantize to 6 decimal places (micro-credit precision)
        royalty_amount = royalty_amount.quantize(Decimal("0.000001"))

        # ---------------------------------------------------------------------
        # Phase 1: Fast-Path Idempotency Verification
        # ---------------------------------------------------------------------
        async with pool.acquire() as conn:
            existing_tx = await conn.fetchrow(
                """
                SELECT id, status 
                FROM transactions 
                WHERE idempotency_key = $1;
                """,
                idempotency_key,
            )
            if existing_tx:
                # Idempotency replay: Return existing receipt without double-charging
                return MicroLeaseReceipt(
                    transaction_id=existing_tx["id"],
                    idempotency_key=idempotency_key,
                    business_account_id=business_account_id,
                    consumer_account_id=consumer_account_id,
                    royalty_amount=royalty_amount,
                    status=existing_tx["status"],
                    is_idempotent_replay=True,
                    retries_required=0,
                )

        # ---------------------------------------------------------------------
        # Phase 2: OCC Execution Loop with Exponential Backoff + Jitter
        # ---------------------------------------------------------------------
        last_exception: Exception | None = None

        for attempt in range(self.max_retries):
            try:
                async with pool.acquire() as conn:
                    async with conn.transaction():
                        # Read snapshots (non-blocking, no locks held)
                        business = await self.get_account_snapshot(conn, business_account_id)
                        consumer = await self.get_account_snapshot(conn, consumer_account_id)

                        if business.is_frozen or consumer.is_frozen:
                            raise AccountFrozenError("One or both accounts are frozen.")

                        if business.balance < royalty_amount:
                            raise InsufficientFundsError(
                                f"Business account {business_account_id} balance ({business.balance}) "
                                f"is insufficient for royalty payment ({royalty_amount})."
                            )

                        # 1. Optimistic Update on Debtor (Business)
                        # Atomically check lock_version and decrement balance
                        debit_update = await conn.execute(
                            """
                            UPDATE accounts
                            SET balance = balance - $1,
                                lock_version = lock_version + 1,
                                updated_at = clock_timestamp()
                            WHERE id = $2 
                              AND lock_version = $3
                              AND balance >= $1;
                            """,
                            royalty_amount,
                            business.account_id,
                            business.lock_version,
                        )
                        # asyncpg returns "UPDATE <count>"
                        if debit_update != "UPDATE 1":
                            raise OptimisticLockCollisionError(
                                f"Collision detected updating business account {business_account_id}"
                            )

                        # 2. Optimistic Update on Creditor (Consumer)
                        # Atomically check lock_version and increment balance
                        credit_update = await conn.execute(
                            """
                            UPDATE accounts
                            SET balance = balance + $1,
                                lock_version = lock_version + 1,
                                updated_at = clock_timestamp()
                            WHERE id = $2 
                              AND lock_version = $3;
                            """,
                            royalty_amount,
                            consumer.account_id,
                            consumer.lock_version,
                        )
                        if credit_update != "UPDATE 1":
                            raise OptimisticLockCollisionError(
                                f"Collision detected updating consumer account {consumer_account_id}"
                            )

                        # 3. Create Transaction Header
                        tx_id: UUID = await conn.fetchval(
                            """
                            INSERT INTO transactions (
                                idempotency_key,
                                reference_type,
                                reference_id,
                                status,
                                metadata
                            ) VALUES (
                                $1,
                                'micro_lease_royalty',
                                $2,
                                'COMMITTED',
                                $3
                            )
                            RETURNING id;
                            """,
                            idempotency_key,
                            reference_id,
                            json.dumps(metadata) if metadata else None,
                        )

                        # 4. Insert Immutable Journal Entries (Zero-sum double entry)
                        # Entry 1: DEBIT business account
                        # Entry 2: CREDIT consumer account
                        await conn.execute(
                            """
                            INSERT INTO journal_entries (
                                transaction_id, account_id, entry_type, amount, sequence_num
                            ) VALUES 
                                ($1, $2, 'DEBIT', $4, 1),
                                ($1, $3, 'CREDIT', $4, 2);
                            """,
                            tx_id,
                            business_account_id,
                            consumer_account_id,
                            royalty_amount,
                        )

                        # Transaction commits here!
                        # PL/pgSQL deferred constraint trigger `trg_journal_zero_sum`
                        # verifies debits == credits before allowing commit.

                        return MicroLeaseReceipt(
                            transaction_id=tx_id,
                            idempotency_key=idempotency_key,
                            business_account_id=business_account_id,
                            consumer_account_id=consumer_account_id,
                            royalty_amount=royalty_amount,
                            status="COMMITTED",
                            is_idempotent_replay=False,
                            retries_required=attempt,
                        )

            except OptimisticLockCollisionError as exc:
                last_exception = exc
                # Calculate Full Jitter backoff to avoid thundering herd on popular accounts:
                # sleep = min(max_backoff, Uniform(0, base_backoff * 2^attempt))
                backoff_limit = min(
                    self.max_backoff_ms,
                    self.base_backoff_ms * (2.0 ** attempt),
                )
                jitter_sleep_s = random.uniform(0.001, backoff_limit / 1000.0)
                await asyncio.sleep(jitter_sleep_s)

            except asyncpg.UniqueViolationError:
                # Concurrent transaction with same idempotency key committed while we were looping
                async with pool.acquire() as conn:
                    existing_tx = await conn.fetchrow(
                        "SELECT id, status FROM transactions WHERE idempotency_key = $1;",
                        idempotency_key,
                    )
                    if existing_tx:
                        return MicroLeaseReceipt(
                            transaction_id=existing_tx["id"],
                            idempotency_key=idempotency_key,
                            business_account_id=business_account_id,
                            consumer_account_id=consumer_account_id,
                            royalty_amount=royalty_amount,
                            status=existing_tx["status"],
                            is_idempotent_replay=True,
                            retries_required=attempt,
                        )
                raise

        raise OptimisticLockCollisionError(
            f"Exceeded maximum OCC retry limit ({self.max_retries}) for transaction: {last_exception}"
        )
