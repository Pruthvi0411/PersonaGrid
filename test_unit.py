"""
PersonaGrid - Zero-Dependency In-Memory Unit Test Suite
Architecture Philosophy: "Antigravity"
 - Tests Mahalanobis Differential Privacy invariants.
 - Tests Optimistic Concurrency Control (OCC) conflict detection algorithm.
 - Runs completely in-memory with zero database or network dependencies.
"""

from __future__ import annotations

import asyncio
import math
import random
import sys
from decimal import Decimal
from typing import Sequence
from uuid import uuid4

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


# -----------------------------------------------------------------------------
# Test 1: Mahalanobis Differential Privacy Math
# -----------------------------------------------------------------------------
def apply_mahalanobis_dp_noise_sync(
    vector: Sequence[float],
    epsilon: float = 1.0,
    delta: float = 1e-5,
    covariance_diagonal: Sequence[float] | None = None,
) -> list[float]:
    if epsilon <= 0.0:
        raise ValueError("Epsilon must be positive")
    sigma = (math.sqrt(2.0 * math.log(1.25 / delta))) / epsilon
    cov_diag = covariance_diagonal or [1.0] * len(vector)

    noisy_vector = []
    for x, var in zip(vector, cov_diag):
        noise = random.gauss(0.0, sigma * math.sqrt(var))
        noisy_vector.append(x + noise)

    norm = math.sqrt(sum(v * v for v in noisy_vector))
    if norm > 1e-12:
        return [v / norm for v in noisy_vector]
    return noisy_vector


def test_dp_math():
    print("\n--- 1. Testing Mahalanobis Differential Privacy (Unit Math) ---")
    dims = 384
    base_vector = [1.0 / math.sqrt(dims)] * dims

    # Verify dimension preservation
    perturbed = apply_mahalanobis_dp_noise_sync(base_vector, epsilon=1.0)
    assert len(perturbed) == dims, f"Expected {dims} dimensions, got {len(perturbed)}"
    print("  ✓ Vector dimensionality invariant preserved (384 dimensions)")

    # Verify unit sphere constraint
    norm = math.sqrt(sum(x * x for x in perturbed))
    assert abs(norm - 1.0) < 1e-4, f"Expected unit norm ~1.0, got {norm}"
    print(f"  ✓ L2 unit-norm constraint satisfied (Norm = {norm:.6f})")

    # Verify noise variance scaling with epsilon
    p_high_priv = apply_mahalanobis_dp_noise_sync(base_vector, epsilon=0.1)
    p_low_priv = apply_mahalanobis_dp_noise_sync(base_vector, epsilon=10.0)

    dist_high = math.sqrt(sum((a - b) ** 2 for a, b in zip(base_vector, p_high_priv)))
    dist_low = math.sqrt(sum((a - b) ** 2 for a, b in zip(base_vector, p_low_priv)))

    assert dist_high > dist_low, "Smaller epsilon must produce higher noise perturbation"
    print(f"  ✓ Privacy scaling verified: eps=0.1 (dist={dist_high:.4f}) > eps=10.0 (dist={dist_low:.4f})")


# -----------------------------------------------------------------------------
# Test 2: In-Memory OCC Ledger Simulation
# -----------------------------------------------------------------------------
class InMemoryAccount:
    def __init__(self, balance: Decimal):
        self.balance = balance
        self.lock_version = 0

    def conditional_update(self, expected_version: int, delta: Decimal) -> bool:
        """Simulates `UPDATE accounts SET balance = balance + delta, lock_version = lock_version + 1 WHERE lock_version = expected_version`"""
        if self.lock_version != expected_version:
            return False  # Collision!
        if self.balance + delta < Decimal("0.000000"):
            return False  # Insufficient funds
        self.balance += delta
        self.lock_version += 1
        return True


async def simulate_concurrent_occ_transfers():
    print("\n--- 2. Testing In-Memory Optimistic Concurrency Control (OCC Stress) ---")
    business = InMemoryAccount(Decimal("100.000000"))
    num_consumers = 10
    consumers = [InMemoryAccount(Decimal("0.000000")) for _ in range(num_consumers)]

    num_txs = 100
    royalty = Decimal("0.100000")
    total_retries = 0

    async def transfer(tx_index: int):
        nonlocal total_retries
        dest = consumers[tx_index % num_consumers]
        base_backoff_ms = 4.0
        max_backoff_ms = 80.0

        for attempt in range(40):
            # Read snapshots
            b_ver = business.lock_version
            c_ver = dest.lock_version

            # Small random processing delay simulating network/db roundtrip
            await asyncio.sleep(random.uniform(0.0001, 0.0008))

            # Attempt atomic update
            if not business.conditional_update(b_ver, -royalty):
                total_retries += 1
                backoff_limit = min(max_backoff_ms, base_backoff_ms * (1.8 ** attempt))
                jitter_sleep = random.uniform(0.001, backoff_limit / 1000.0)
                await asyncio.sleep(jitter_sleep)
                continue

            if not dest.conditional_update(c_ver, royalty):
                # Rollback business
                business.conditional_update(business.lock_version, royalty)
                total_retries += 1
                backoff_limit = min(max_backoff_ms, base_backoff_ms * (1.8 ** attempt))
                jitter_sleep = random.uniform(0.001, backoff_limit / 1000.0)
                await asyncio.sleep(jitter_sleep)
                continue

            return True

        raise RuntimeError(f"Transaction {tx_index} failed to commit within retry limit")


    tasks = [transfer(i) for i in range(num_txs)]
    await asyncio.gather(*tasks)

    # Invariant assertions
    expected_business_bal = Decimal("100.000000") - (Decimal(num_txs) * royalty)
    assert business.balance == expected_business_bal, f"Expected {expected_business_bal}, got {business.balance}"
    print(f"  ✓ Business balance preserved: 100.000000 - 10.000000 = {business.balance}")

    consumers_sum = sum(c.balance for c in consumers)
    assert consumers_sum == Decimal("10.000000"), f"Expected 10.000000, got {consumers_sum}"
    print(f"  ✓ Consumer wallets sum verified: {consumers_sum}")
    print(f"  ✓ Zero-sum conservation invariant satisfied across {num_txs} concurrent transfers")
    print(f"  ✓ Total OCC write collisions absorbed with backoff: {total_retries} retries")


async def main():
    test_dp_math()
    await simulate_concurrent_occ_transfers()
    print("\n✓ ALL IN-MEMORY ALGORITHMIC & OCC INVARIANTS PASSED!\n")


if __name__ == "__main__":
    asyncio.run(main())
