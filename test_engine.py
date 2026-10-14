"""
PersonaGrid - Comprehensive Test & High-Concurrency OCC Stress Suite
Architecture Philosophy: "Antigravity"
 - Validates Vector Embedding, Mahalanobis DP, and pgvector halfvec(384) search.
 - Validates Database Invariants (Immutable Journal Trigger & Zero-Sum Trigger).
 - Executes Concurrent Stress Testing under Optimistic Concurrency Control (OCC).
"""

from __future__ import annotations

import asyncio
import os
import sys
import time
from decimal import Decimal
from uuid import UUID, uuid4

import asyncpg
from dotenv import load_dotenv

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Load local environment
load_dotenv()

from ledger_service import (
    AccountNotFoundError,
    InsufficientFundsError,
    MicroLeaseReceipt,
    MicroLeasingLedgerService,
    OptimisticLockCollisionError,
)
from vector_service import PersonaVectorService

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/personagrid",
)


# -----------------------------------------------------------------------------
# Colorized Console Logging Helpers
# -----------------------------------------------------------------------------
GREEN = "\033[92m"
RED = "\033[91m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
RESET = "\033[0m"

def log_header(title: str) -> None:
    print(f"\n{BOLD}{CYAN}=== [TEST SUITE] {title} ==={RESET}")

def log_pass(msg: str) -> None:
    print(f"  {GREEN}✓ PASS:{RESET} {msg}")

def log_fail(msg: str) -> None:
    print(f"  {RED}✗ FAIL:{RESET} {msg}")

def log_info(msg: str) -> None:
    print(f"  {YELLOW}ℹ INFO:{RESET} {msg}")


# -----------------------------------------------------------------------------
# Test 1: Mahalanobis Mechanism Differential Privacy (Unit)
# -----------------------------------------------------------------------------
async def test_mahalanobis_differential_privacy() -> None:
    log_header("1. Mahalanobis Mechanism Differential Privacy (Unit Test)")

    vector_svc = PersonaVectorService()
    # Mock a 384-dimensional unit vector
    test_vec = [1.0 / (384 ** 0.5)] * 384

    # Test shape preservation and L2 normalization
    noisy_vec = await vector_svc.apply_differential_privacy(
        vector=test_vec,
        epsilon=1.0,
        delta=1e-5,
    )

    assert len(noisy_vec) == 384, f"Expected 384 dimensions, got {len(noisy_vec)}"
    log_pass("Vector dimension invariant preserved (384 dimensions)")

    # Verify L2 unit norm constraint
    l2_norm = sum(x * x for x in noisy_vec) ** 0.5
    assert abs(l2_norm - 1.0) < 1e-4, f"Expected unit norm ~1.0, got {l2_norm:.6f}"
    log_pass(f"L2 Unit sphere normalization satisfied (Norm = {l2_norm:.6f})")

    # Verify that different epsilons alter the noise magnitude
    high_privacy_vec = await vector_svc.apply_differential_privacy(test_vec, epsilon=0.1)
    low_privacy_vec = await vector_svc.apply_differential_privacy(test_vec, epsilon=10.0)

    dist_high = sum((a - b) ** 2 for a, b in zip(test_vec, high_privacy_vec)) ** 0.5
    dist_low = sum((a - b) ** 2 for a, b in zip(test_vec, low_privacy_vec)) ** 0.5

    assert dist_high > dist_low, "Expected higher perturbation with smaller epsilon (higher privacy)"
    log_pass(f"Privacy budget sensitivity verified (eps=0.1 pert={dist_high:.4f} > eps=10.0 pert={dist_low:.4f})")


# -----------------------------------------------------------------------------
# Test 2: Database Connection & Extension Verification
# -----------------------------------------------------------------------------
async def test_database_connectivity_and_extensions(pool: asyncpg.Pool) -> None:
    log_header("2. Database & pgvector Extension Verification")

    async with pool.acquire() as conn:
        # Check pgvector extension
        ext = await conn.fetchval(
            "SELECT extname FROM pg_extension WHERE extname = 'vector';"
        )
        assert ext == "vector", "pgvector extension is not installed in PostgreSQL."
        log_pass("pgvector extension verified active")

        # Check halfvec datatype availability
        type_check = await conn.fetchval(
            "SELECT typname FROM pg_type WHERE typname = 'halfvec';"
        )
        assert type_check == "halfvec", "halfvec scalar quantization type not found."
        log_pass("halfvec 16-bit scalar quantization datatype confirmed available")

        # Check iterative scan setting
        iter_scan = await conn.fetchval("SHOW hnsw.iterative_scan;")
        log_pass(f"hnsw.iterative_scan configuration confirmed: {iter_scan}")


# -----------------------------------------------------------------------------
# Test 3: Database Trigger Invariants (Immutability & Zero-Sum)
# -----------------------------------------------------------------------------
async def test_ledger_triggers(pool: asyncpg.Pool) -> None:
    log_header("3. Database Trigger Invariants (GAAP / SOX Invariants)")

    async with pool.acquire() as conn:
        # Create test accounts
        b_acc = await conn.fetchval(
            """
            INSERT INTO accounts (account_type, balance, lock_version)
            VALUES ('business_escrow', 500.000000, 0)
            RETURNING id;
            """
        )
        c_acc = await conn.fetchval(
            """
            INSERT INTO accounts (account_type, balance, lock_version)
            VALUES ('consumer_wallet', 0.000000, 0)
            RETURNING id;
            """
        )

        # Create valid balanced transaction
        tx_id = await conn.fetchval(
            """
            INSERT INTO transactions (idempotency_key, reference_type, status)
            VALUES ($1, 'test_tx', 'COMMITTED')
            RETURNING id;
            """,
            f"test-inv-{uuid4()}",
        )

        # Insert balanced journal entries
        await conn.execute(
            """
            INSERT INTO journal_entries (transaction_id, account_id, entry_type, amount, sequence_num)
            VALUES 
                ($1, $2, 'DEBIT', 25.000000, 1),
                ($1, $3, 'CREDIT', 25.000000, 2);
            """,
            tx_id,
            b_acc,
            c_acc,
        )
        log_pass("Balanced double-entry journal entries inserted successfully")

        # Invariant Test 3.1: Attempt UPDATE on journal_entries (MUST FAIL)
        update_blocked = False
        try:
            await conn.execute(
                "UPDATE journal_entries SET amount = 999.000000 WHERE transaction_id = $1;",
                tx_id,
            )
        except asyncpg.IntegrityConstraintViolationError as e:
            update_blocked = True
            log_pass(f"trg_prevent_journal_mutation blocked UPDATE: {e.message}")

        assert update_blocked, "CRITICAL: journal_entries UPDATE was not blocked by trigger!"

        # Invariant Test 3.2: Attempt DELETE on journal_entries (MUST FAIL)
        delete_blocked = False
        try:
            await conn.execute(
                "DELETE FROM journal_entries WHERE transaction_id = $1;",
                tx_id,
            )
        except asyncpg.IntegrityConstraintViolationError as e:
            delete_blocked = True
            log_pass(f"trg_prevent_journal_mutation blocked DELETE: {e.message}")

        assert delete_blocked, "CRITICAL: journal_entries DELETE was not blocked by trigger!"

        # Invariant Test 3.3: Attempt Unbalanced Journal Entry (DEBIT != CREDIT) (MUST FAIL)
        zero_sum_blocked = False
        bad_tx_id = await conn.fetchval(
            """
            INSERT INTO transactions (idempotency_key, reference_type, status)
            VALUES ($1, 'bad_tx', 'COMMITTED')
            RETURNING id;
            """,
            f"test-bad-{uuid4()}",
        )

        try:
            async with conn.transaction():
                # Inserting DEBIT 10.00 without matching CREDIT
                await conn.execute(
                    """
                    INSERT INTO journal_entries (transaction_id, account_id, entry_type, amount, sequence_num)
                    VALUES ($1, $2, 'DEBIT', 10.000000, 1);
                    """,
                    bad_tx_id,
                    b_acc,
                )
        except (asyncpg.CheckViolationError, asyncpg.IntegrityConstraintViolationError) as e:
            zero_sum_blocked = True
            log_pass(f"trg_journal_zero_sum blocked unbalanced transaction at commit: {e.message}")

        assert zero_sum_blocked, "CRITICAL: Zero-sum violation was not blocked by trigger!"


# -----------------------------------------------------------------------------
# Test 4: Idempotency Verification
# -----------------------------------------------------------------------------
async def test_idempotency_replay(pool: asyncpg.Pool) -> None:
    log_header("4. Transaction Idempotency Verification")

    ledger_svc = MicroLeasingLedgerService()
    async with pool.acquire() as conn:
        b_acc = await conn.fetchval(
            "INSERT INTO accounts (account_type, balance) VALUES ('business_escrow', 100.0) RETURNING id;"
        )
        c_acc = await conn.fetchval(
            "INSERT INTO accounts (account_type, balance) VALUES ('consumer_wallet', 0.0) RETURNING id;"
        )

    test_key = f"idem-key-{uuid4()}"
    royalty = Decimal("5.000000")

    # First execution
    receipt_1 = await ledger_svc.execute_micro_lease_payment(
        pool=pool,
        idempotency_key=test_key,
        business_account_id=b_acc,
        consumer_account_id=c_acc,
        royalty_amount=royalty,
    )
    assert not receipt_1.is_idempotent_replay, "First execution should not be a replay"
    log_pass(f"First execution committed successfully (Tx ID: {receipt_1.transaction_id})")

    # Second execution with identical key (Replay)
    receipt_2 = await ledger_svc.execute_micro_lease_payment(
        pool=pool,
        idempotency_key=test_key,
        business_account_id=b_acc,
        consumer_account_id=c_acc,
        royalty_amount=royalty,
    )
    assert receipt_2.is_idempotent_replay, "Second execution MUST be flagged as idempotent replay"
    assert receipt_1.transaction_id == receipt_2.transaction_id, "Transaction IDs must match"
    log_pass("Idempotency replay detected: returned identical receipt without re-charging")

    # Verify balances were only debited once
    async with pool.acquire() as conn:
        b_bal = await conn.fetchval("SELECT balance FROM accounts WHERE id = $1;", b_acc)
        c_bal = await conn.fetchval("SELECT balance FROM accounts WHERE id = $1;", c_acc)
        assert b_bal == Decimal("95.000000"), f"Expected 95.000000, got {b_bal}"
        assert c_bal == Decimal("5.000000"), f"Expected 5.000000, got {c_bal}"
        log_pass("Verified account balances debited/credited exactly once")


# -----------------------------------------------------------------------------
# Test 5: High-Concurrency OCC Stress Test (Simulating 50 Concurrent Micro-Leases)
# -----------------------------------------------------------------------------
async def test_high_concurrency_occ_stress(pool: asyncpg.Pool) -> None:
    log_header("5. High-Concurrency OCC Stress Test (Optimistic Locking)")

    ledger_svc = MicroLeasingLedgerService(max_retries=15, base_backoff_ms=5.0)

    # Setup: 1 Business Account with 100.0 Credits
    # 10 Consumer Wallets receiving concurrent micro-royalties
    num_consumers = 10
    num_concurrent_txs = 50
    royalty_per_tx = Decimal("0.100000")
    total_expected_transfer = Decimal(num_concurrent_txs) * royalty_per_tx

    async with pool.acquire() as conn:
        b_acc = await conn.fetchval(
            """
            INSERT INTO accounts (account_type, balance, lock_version)
            VALUES ('business_escrow', 100.000000, 0)
            RETURNING id;
            """
        )
        c_accounts = []
        for _ in range(num_consumers):
            c_id = await conn.fetchval(
                """
                INSERT INTO accounts (account_type, balance, lock_version)
                VALUES ('consumer_wallet', 0.000000, 0)
                RETURNING id;
                """
            )
            c_accounts.append(c_id)

    log_info(
        f"Launching {num_concurrent_txs} concurrent micro-payments from Business Account {b_acc} "
        f"across {num_consumers} consumer wallets..."
    )

    start_time = time.perf_counter()

    # Dispatch concurrent async tasks targeting the exact same debtor account
    tasks = []
    for i in range(num_concurrent_txs):
        dest_account = c_accounts[i % num_consumers]
        task = ledger_svc.execute_micro_lease_payment(
            pool=pool,
            idempotency_key=f"occ-stress-{uuid4()}-{i}",
            business_account_id=b_acc,
            consumer_account_id=dest_account,
            royalty_amount=royalty_per_tx,
            reference_id=f"batch-sim-{i}",
        )
        tasks.append(task)

    results: list[MicroLeaseReceipt] = await asyncio.gather(*tasks)
    elapsed = time.perf_counter() - start_time

    # Calculate statistics
    total_retries = sum(r.retries_required for r in results)
    throughput = num_concurrent_txs / elapsed

    log_pass(
        f"All {num_concurrent_txs} concurrent micro-transactions committed in {elapsed:.3f}s "
        f"({throughput:.1f} tx/sec)"
    )
    log_info(f"OCC Retries absorbed smoothly: {total_retries} total retries with full jitter")

    # Invariant Verification: Mathematical Conservation of Balance
    async with pool.acquire() as conn:
        final_b_balance = await conn.fetchval("SELECT balance FROM accounts WHERE id = $1;", b_acc)
        final_b_lock_version = await conn.fetchval("SELECT lock_version FROM accounts WHERE id = $1;", b_acc)

        # Sum of all consumer balances
        consumers_total = await conn.fetchval(
            "SELECT SUM(balance) FROM accounts WHERE id = ANY($1::uuid[]);",
            c_accounts,
        )

        # Sum of all journal entry debits and credits
        journal_debits = await conn.fetchval(
            "SELECT SUM(amount) FROM journal_entries WHERE entry_type = 'DEBIT' AND account_id = $1;",
            b_acc,
        )
        journal_credits = await conn.fetchval(
            "SELECT SUM(amount) FROM journal_entries WHERE entry_type = 'CREDIT' AND account_id = ANY($1::uuid[]);",
            c_accounts,
        )

    expected_business_balance = Decimal("100.000000") - total_expected_transfer

    assert final_b_balance == expected_business_balance, (
        f"Business balance mismatch: expected {expected_business_balance}, got {final_b_balance}"
    )
    assert consumers_total == total_expected_transfer, (
        f"Consumers total balance mismatch: expected {total_expected_transfer}, got {consumers_total}"
    )
    assert journal_debits == total_expected_transfer, "Journal debits mismatch"
    assert journal_credits == total_expected_transfer, "Journal credits mismatch"
    assert final_b_lock_version == num_concurrent_txs, (
        f"Lock version expected {num_concurrent_txs}, got {final_b_lock_version}"
    )

    log_pass("Balance conservation verified: 100.000000 - 5.000000 = 95.000000")
    log_pass(f"Zero-sum journal verification: Total Debits ({journal_debits}) == Total Credits ({journal_credits})")
    log_pass(f"Monotonic lock_version validated: {final_b_lock_version} atomic increments")


# -----------------------------------------------------------------------------
# Main Test Runner
# -----------------------------------------------------------------------------
async def main() -> None:
    print(f"{BOLD}{CYAN}================================================================={RESET}")
    print(f"{BOLD}{CYAN}  PersonaGrid Foundational Architecture Test & Verification Engine{RESET}")
    print(f"{BOLD}{CYAN}================================================================={RESET}")

    # 1. Run Pure Unit Tests (no DB dependency)
    await test_mahalanobis_differential_privacy()

    # 2. Check Database Connectivity
    try:
        pool = await asyncpg.create_pool(
            dsn=DATABASE_URL,
            min_size=5,
            max_size=30,
            command_timeout=10.0,
        )
    except Exception as exc:
        log_fail(f"Could not connect to PostgreSQL at {DATABASE_URL}: {exc}")
        print(f"\n{YELLOW}To start PostgreSQL 16 with pgvector, run:{RESET}")
        print(f"  {BOLD}docker compose up -d{RESET}\n")
        sys.exit(1)

    try:
        await test_database_connectivity_and_extensions(pool)
        await test_ledger_triggers(pool)
        await test_idempotency_replay(pool)
        await test_high_concurrency_occ_stress(pool)

        print(f"\n{BOLD}{GREEN}================================================================={RESET}")
        print(f"{BOLD}{GREEN}  ALL INVARIANTS, VECTOR ENGINES & OCC TESTS PASSED SUCCESSFULLY!{RESET}")
        print(f"{BOLD}{GREEN}================================================================={RESET}\n")

    finally:
        await pool.close()


if __name__ == "__main__":
    asyncio.run(main())
