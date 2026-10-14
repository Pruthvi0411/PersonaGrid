-- ============================================================================
-- PersonaGrid: Foundational Database Architecture (PostgreSQL 16+)
-- Architecture Philosophy: "Antigravity" - Hardware-proximal, zero bloat,
-- immutable audit trails, and scalar-quantized vector indexing.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Extensions & Runtime Configuration
-- ----------------------------------------------------------------------------

-- Enable pgvector for high-performance vector similarity search
CREATE EXTENSION IF NOT EXISTS "vector";

-- Enable pgcrypto for hardware-accelerated random UUID v4 generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- NOTE ON ITERATIVE INDEX SCANNING:
-- In pgvector 0.8.0+, iterative index scanning solves the classic "over-filtering"
-- problem where HNSW post-filtering returns fewer items than the LIMIT when WHERE
-- clauses discard top candidates.
-- 'strict_order' guarantees strict distance order while iteratively pulling
-- candidates from the HNSW graph until the target limit is satisfied.
-- Execute this at the database or session level:
ALTER SYSTEM SET hnsw.iterative_scan = 'strict_order';
-- For immediate session application:
SET hnsw.iterative_scan = 'strict_order';

-- ----------------------------------------------------------------------------
-- 2. Vector Engine: Synthetic Personas Table & HNSW Index
-- ----------------------------------------------------------------------------

-- synthetic_personas stores consumer preference vectors in scalar-quantized format.
-- Using halfvec(384) (16-bit half-precision floating point):
--   - Reduces vector RAM footprint by 50% (768 bytes vs 1536 bytes per persona).
--   - Maximizes L2/L3 CPU cache residency during HNSW graph traversal.
--   - Minimizes memory bandwidth saturation during high-QPS business query scans.
CREATE TABLE IF NOT EXISTS synthetic_personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Anonymous hash link to consumer wallet/account (never stores raw PII)
    account_id UUID NOT NULL,
    -- Hierarchical category or domain tag for query pre-filtering (e.g., 'tech.devops', 'finance.defi')
    domain_category VARCHAR(64) NOT NULL,
    -- Scalar-quantized 384-dimensional embedding (BAAI/bge-small-en-v1.5)
    embedding halfvec(384) NOT NULL,
    -- Differential privacy tracking: total epsilon budget accumulated
    accumulated_epsilon FLOAT NOT NULL DEFAULT 0.0,
    -- Query counters for leasing royalty metrics
    total_leases INT NOT NULL DEFAULT 0,
    -- Persona state: active, suspended, burned
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- Partial index for active persona routing
CREATE INDEX IF NOT EXISTS idx_personas_active_category 
ON synthetic_personas (domain_category) 
WHERE is_active = TRUE;

-- HNSW Vector Index:
--  - distance metric: Cosine distance using halfvec_cosine_ops
--  - m = 16: max bi-directional links per node (balances index size & recall)
--  - ef_construction = 128: search depth during index building (higher recall)
-- Note: When building on halfvec, halfvec_cosine_ops provides native hardware SIMD
-- execution on AVX-512 / ARM NEON without floating-point conversion overhead.
CREATE INDEX IF NOT EXISTS idx_personas_embedding_hnsw 
ON synthetic_personas 
USING hnsw (embedding halfvec_cosine_ops) 
WITH (m = 16, ef_construction = 128);


-- ----------------------------------------------------------------------------
-- 3. Double-Entry Micro-Leasing Ledger
-- ----------------------------------------------------------------------------

-- ACCOUNTS TABLE
-- Represents wallets and system pools (consumers, market researchers, clearing).
-- Enforces Optimistic Concurrency Control (OCC) via `lock_version` to handle
-- thousands of concurrent micro-royalties without row-level lock serialization.
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Account role: 'consumer_wallet', 'business_escrow', 'platform_reserve'
    account_type VARCHAR(32) NOT NULL,
    -- High-precision balance in micro-units (e.g. 1.000000 Credit = $1.00)
    -- NUMERIC(20, 6) avoids IEEE 754 floating-point rounding errors entirely
    balance NUMERIC(20, 6) NOT NULL DEFAULT 0.000000,
    -- Optimistic locking monotonically increasing counter
    lock_version BIGINT NOT NULL DEFAULT 0,
    currency VARCHAR(12) NOT NULL DEFAULT 'CREDIT',
    is_frozen BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    
    CONSTRAINT chk_positive_consumer_balance 
        CHECK (account_type = 'platform_reserve' OR balance >= 0.000000)
);

CREATE INDEX IF NOT EXISTS idx_accounts_type 
ON accounts(account_type);


-- TRANSACTIONS TABLE
-- Groups journal entries into an atomic unit with mandatory idempotency.
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Unique token passed by the client or leasing engine to prevent duplicate billing
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    reference_type VARCHAR(64) NOT NULL, -- e.g., 'micro_lease_royalty', 'deposit', 'escrow_hold'
    reference_id VARCHAR(128),            -- e.g., persona query search batch id
    status VARCHAR(32) NOT NULL DEFAULT 'COMMITTED', -- 'PENDING', 'COMMITTED', 'REVERTED'
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_transactions_created_at 
ON transactions(created_at DESC);


-- JOURNAL_ENTRIES TABLE
-- Pure append-only ledger entries. Mutating or deleting rows is strictly prohibited
-- by the database engine via the fn_immutable_journal_entries trigger.
CREATE TABLE IF NOT EXISTS journal_entries (
    id BIGSERIAL PRIMARY KEY,
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    -- Double-entry rule: DEBIT increases assets/expenses, decreases liabilities/equity.
    -- CREDIT decreases assets/expenses, increases liabilities/equity.
    entry_type VARCHAR(6) NOT NULL CHECK (entry_type IN ('DEBIT', 'CREDIT')),
    amount NUMERIC(20, 6) NOT NULL CHECK (amount > 0.000000),
    sequence_num INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- Fast lookup for audit trails and account statement generation
CREATE INDEX IF NOT EXISTS idx_journal_entries_account_created 
ON journal_entries(account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_journal_entries_tx 
ON journal_entries(transaction_id);


-- ----------------------------------------------------------------------------
-- 4. PL/pgSQL Invariant & Integrity Enforcement Triggers
-- ----------------------------------------------------------------------------

-- TRIGGER 1: Immutable Journal Entries
-- Hard rejection of any UPDATE or DELETE statement targeting journal_entries.
-- Enforces compliance with GAAP / SOX and ensures cryptographic reproducibility.
CREATE OR REPLACE FUNCTION fn_immutable_journal_entries()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Antigravity Invariant Violation: journal_entries is an append-only ledger. % operations are strictly forbidden.', TG_OP
        USING ERRCODE = 'integrity_constraint_violation',
              HINT = 'Post compensating journal entries via a new transaction instead of mutating historical records.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_journal_mutation ON journal_entries;
CREATE TRIGGER trg_prevent_journal_mutation
BEFORE UPDATE OR DELETE ON journal_entries
FOR EACH ROW
EXECUTE FUNCTION fn_immutable_journal_entries();


-- TRIGGER 2: Zero-Sum Invariant (Debits == Credits per transaction_id)
-- Double-entry bookkeeping requires that the sum of debits strictly equals the sum
-- of credits for every transaction.
-- This is executed as a DEFERRED CONSTRAINT TRIGGER so all journal rows for a transaction
-- can be inserted during a multi-row statement or transaction block, with the check
-- deferred to transaction COMMIT time.
CREATE OR REPLACE FUNCTION fn_verify_transaction_zero_sum()
RETURNS TRIGGER AS $$
DECLARE
    v_total_debits  NUMERIC(20, 6);
    v_total_credits NUMERIC(20, 6);
BEGIN
    -- Aggregate total debits and credits for the affected transaction
    SELECT 
        COALESCE(SUM(CASE WHEN entry_type = 'DEBIT' THEN amount ELSE 0 END), 0.000000),
        COALESCE(SUM(CASE WHEN entry_type = 'CREDIT' THEN amount ELSE 0 END), 0.000000)
    INTO v_total_debits, v_total_credits
    FROM journal_entries
    WHERE transaction_id = NEW.transaction_id;

    -- Zero-sum invariant check
    IF v_total_debits <> v_total_credits THEN
        RAISE EXCEPTION 'Zero-Sum Ledger Invariant Failure on Transaction %: Total Debits (%) != Total Credits (%)',
            NEW.transaction_id, v_total_debits, v_total_credits
            USING ERRCODE = 'check_violation',
                  HINT = 'Ensure every debit has an offsetting credit entry of equal monetary value.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Constraint triggers must be row-level in PostgreSQL to support DEFERRABLE
DROP TRIGGER IF EXISTS trg_journal_zero_sum ON journal_entries;
CREATE CONSTRAINT TRIGGER trg_journal_zero_sum
AFTER INSERT ON journal_entries
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION fn_verify_transaction_zero_sum();


-- ----------------------------------------------------------------------------
-- 5. Seed System Accounts (Platform Escrow & System Clearing)
-- ----------------------------------------------------------------------------

INSERT INTO accounts (id, account_type, balance, lock_version, currency)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'platform_reserve', 10000000.000000, 0, 'CREDIT'),
    ('00000000-0000-0000-0000-000000000002', 'business_escrow', 5000000.000000, 0, 'CREDIT')
ON CONFLICT (id) DO NOTHING;
