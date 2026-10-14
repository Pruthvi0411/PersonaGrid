# PersonaGrid - Foundational Architecture

> **Privacy-First Synthetic Identity Leasing Marketplace**  
> Built strictly adhering to the **"Antigravity" Architectural Philosophy**: minimal dependencies, hardware-proximal efficiency, asynchronous non-blocking I/O, and zero framework bloat.

---

## 🏛️ System Architecture Overview

```
                                  +------------------------------------+
                                  |   Next.js 15 App Router Frontend   |
                                  |   (RSC Data Fetch + Tailwind v4)   |
                                  +-----------------+------------------+
                                                    |
                                      SSE Stream    | REST API
                                 (Unidirectional)   | (Reverse Proxy)
                                                    v
                                  +------------------------------------+
                                  |      FastAPI Backend Engine        |
                                  |      (uvloop + ORJSONResponse)     |
                                  +--------+------------------+--------+
                                           |                  |
                       CPU Threadpool      |                  | I/O Connection Pool
                   (asyncio.to_thread)     |                  | (asyncpg, zero-ORM)
                                           v                  v
                   +-----------------------+     +------------+-------------------------+
                   | FastEmbed (ONNX)      |     | PostgreSQL 16+ Database              |
                   | BAAI/bge-small-en-v1.5|     | - pgvector halfvec(384) + HNSW Index |
                   | + Mahalanobis DP      |     | - Double-Entry Micro-Leasing Ledger  |
                   +-----------------------+     | - PL/pgSQL Invariant Triggers        |
                                                 +--------------------------------------+
```

---

## 📦 Deliverables Inventory

| File | Domain | Performance & Architectural Rationale |
| :--- | :--- | :--- |
| [`schema.sql`](file:///d:/Projects/New%20PersonaGrid/schema.sql) | **Database** | Raw SQL migration with `pgvector` `halfvec(384)` HNSW index (`halfvec_cosine_ops`), `hnsw.iterative_scan = strict_order`, and PL/pgSQL triggers enforcing immutable journal records and zero-sum transactions (`Debits == Credits`). |
| [`vector_service.py`](file:///d:/Projects/New%20PersonaGrid/vector_service.py) | **Vector Engine** | FastEmbed ONNX runtime inference with zero PyTorch bloat. Math-calibrated Mahalanobis Differential Privacy noise generator. Non-blocking `asyncpg` HNSW cosine similarity search. |
| [`ledger_service.py`](file:///d:/Projects/New%20PersonaGrid/ledger_service.py) | **Financial Core** | Double-entry micro-leasing ledger engine powered by Optimistic Concurrency Control (OCC) using monotonic `lock_version` with exponential backoff and randomized jitter to eliminate row-lock contention. |
| [`main.py`](file:///d:/Projects/New%20PersonaGrid/main.py) | **API & Streaming** | FastAPI gateway using `uvloop` and `ORJSONResponse`. Direct `asyncpg` connection pool. Server-Sent Events (SSE) streaming endpoint with in-memory async publish/subscribe broker. |
| [`next.config.ts`](file:///d:/Projects/New%20PersonaGrid/next.config.ts) | **Frontend Config** | Next.js 15 App Router configuration with strict Content Security Policy, token leakage prevention headers, and backend reverse proxy. |
| [`tailwind.config.ts`](file:///d:/Projects/New%20PersonaGrid/tailwind.config.ts) | **Styling Engine** | Tailwind CSS v4 design token mapping with dark mode and semantic palette. |
| [`use-wallet.ts`](file:///d:/Projects/New%20PersonaGrid/use-wallet.ts) | **Real-Time Client** | Zero-WebSocket-overhead Server-Sent Events React hook (`useWalletStream`) with arbitrary-precision decimal string addition and auto-reconnection with full jitter. |
| [`src/lib/utils.ts`](file:///d:/Projects/New%20PersonaGrid/src/lib/utils.ts) | **Compound UI Pattern** | Zero-runtime styling via CSS attribute selectors (`[data-slot="..."]`) and `class-variance-authority` (CVA). |
| [`src/app/globals.css`](file:///d:/Projects/New%20PersonaGrid/src/app/globals.css) | **CSS Tokens** | Tailwind v4 design tokens and `[data-slot]` native styling rules. |

---

## 🚀 Quickstart & Verification

### 1. Database (PostgreSQL 16+ with pgvector)
Run a local PostgreSQL 16 container with `pgvector` installed:
```bash
docker run -d \
  --name personagrid-pg \
  -e POSTGRES_DB=personagrid \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  pgvector/pgvector:pg16
```

Initialize the schema:
```bash
psql -h localhost -U postgres -d personagrid -f schema.sql
```

### 2. Backend (FastAPI + uvloop)
Install lightweight dependencies:
```bash
pip install -r requirements.txt
```

Launch the gateway:
```bash
python main.py
```
*API Swagger Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)*

### 3. Frontend (Next.js 15)
Install dependencies and run:
```bash
npm install
npm run dev
```
*Frontend Application: [http://localhost:3000](http://localhost:3000)*
