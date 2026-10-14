"""
PersonaGrid - Vector Generation & pgvector Similarity Search Service
Architecture Philosophy: "Antigravity"
 - Hardware-proximal ONNX Runtime via FastEmbed (zero PyTorch / Transformers bloat).
 - Asynchronous non-blocking event loop offloading for CPU-bound matrix transformations.
 - Differential Privacy via Mahalanobis Mechanism for correlated persona preference manifolds.
 - pgvector halfvec(384) cosine similarity querying with iterative index scanning.
"""

from __future__ import annotations

import asyncio
import math
import random
from dataclasses import dataclass
from typing import Any, Sequence
from uuid import UUID

import asyncpg

try:
    from fastembed import TextEmbedding
except ImportError:
    # Fallback / Type stub if running in isolated environment without fastembed installed
    TextEmbedding = None  # type: ignore


# BAAI/bge-small-en-v1.5 produces dense 384-dimensional unit-normalized embeddings.
# It delivers state-of-the-art MTEB retrieval performance at 1/10th the parameter count
# and RAM usage of standard 768/1536-dim models.
MODEL_NAME = "BAAI/bge-small-en-v1.5"
VECTOR_DIMENSION = 384


@dataclass(slots=True, frozen=True)
class PersonaMatch:
    persona_id: UUID
    account_id: UUID
    domain_category: str
    cosine_similarity: float
    total_leases: int


class PersonaVectorService:
    """
    Manages embedding generation, privacy noise injection, and pgvector HNSW querying.
    Strictly follows async concurrency discipline:
      - CPU-bound operations (FastEmbed ONNX forward pass, Mahalanobis noise generation)
        are executed synchronously in worker threads via `asyncio.to_thread`.
      - I/O-bound operations (PostgreSQL / asyncpg socket reads/writes) are strictly async.
    """

    def __init__(self, model_name: str = MODEL_NAME) -> None:
        self.model_name = model_name
        self._model: TextEmbedding | None = None
        self._init_lock = asyncio.Lock()

    def _get_model(self) -> TextEmbedding:
        """
        Lazy-loads the FastEmbed model instance in the background.
        Avoids startup lag and keeps memory initialization deterministic.
        """
        if self._model is None:
            if TextEmbedding is None:
                raise RuntimeError(
                    "fastembed library is required. Install via `pip install fastembed`."
                )
            # FastEmbed utilizes onnxruntime with multi-threaded CPU SIMD execution
            self._model = TextEmbedding(model_name=self.model_name)
        return self._model

    # -------------------------------------------------------------------------
    # 1. CPU-BOUND: FastEmbed Vector Generation
    # -------------------------------------------------------------------------

    def _embed_text_sync(self, text: str) -> list[float]:
        """
        Synchronous CPU-bound FastEmbed inference.
        MUST be called via `asyncio.to_thread` to prevent stalling uvloop.
        """
        model = self._get_model()
        # model.embed returns a generator yielding numpy arrays
        embeddings_generator = model.embed([text])
        raw_embedding = next(embeddings_generator)
        # Convert to standard Python float list for serialization and asyncpg compatibility
        return [float(x) for x in raw_embedding]

    async def generate_embedding(self, text: str) -> list[float]:
        """
        Non-blocking wrapper dispatching ONNX runtime forward-pass to a threadpool.
        """
        return await asyncio.to_thread(self._embed_text_sync, text)

    # -------------------------------------------------------------------------
    # 2. CPU-BOUND: Mahalanobis Mechanism for Differential Privacy
    # -------------------------------------------------------------------------

    def _apply_mahalanobis_dp_noise_sync(
        self,
        vector: Sequence[float],
        epsilon: float = 1.0,
        delta: float = 1e-5,
        covariance_diagonal: Sequence[float] | None = None,
    ) -> list[float]:
        """
        Synchronous CPU-bound Differential Privacy transformation.

        Mathematical Rationale:
        Standard isotropic Gaussian DP noise (N(0, sigma^2 * I)) treats all dimensions
        equally. In synthetic persona embeddings, features exhibit strong empirical
        covariance (anisotropic preference manifolds). Adding isotropic noise either:
          (a) Destroys semantic signals along low-variance components, or
          (b) Leaks identity privacy along high-variance principal components.

        The Mahalanobis Mechanism calibrates additive Gaussian noise to the Mahalanobis
        metric tensor M = Sigma^-1, where Sigma is the empirical covariance matrix:
            Noise Z ~ N(0, sigma^2 * Sigma)
            Mahalanobis Distance D_M(u, v) = sqrt((u - v)^T * Sigma^-1 * (u - v))

        With global sensitivity Delta_M <= 1 in the Mahalanobis metric:
            sigma = (Delta_M * sqrt(2 * ln(1.25 / delta))) / epsilon

        For high-performance execution without heavy linear algebra dependencies,
        we compute the calibrated noise along the principal diagonal / covariance scale.
        """
        if epsilon <= 0.0:
            raise ValueError(f"Privacy parameter epsilon must be positive, got {epsilon}")

        # Compute calibrated noise standard deviation
        # Gaussian mechanism parameter for (epsilon, delta)-differential privacy
        sigma = (math.sqrt(2.0 * math.log(1.25 / delta))) / epsilon

        # Default to normalized unit variance if empirical covariance is not supplied
        cov_diag = covariance_diagonal or [1.0] * len(vector)
        if len(cov_diag) != len(vector):
            raise ValueError("Covariance diagonal dimension must match vector dimension")

        noisy_vector: list[float] = []
        # Box-Muller transform for hardware-native standard normal variates
        for x, var in zip(vector, cov_diag):
            # Sample Z ~ N(0, sigma^2 * var)
            # using random.gauss (Box-Muller in C runtime)
            noise = random.gauss(0.0, sigma * math.sqrt(var))
            noisy_vector.append(x + noise)

        # L2 Re-normalization to maintain unit sphere properties for cosine distance
        norm = math.sqrt(sum(v * v for v in noisy_vector))
        if norm > 1e-12:
            return [v / norm for v in noisy_vector]
        return noisy_vector

    async def apply_differential_privacy(
        self,
        vector: Sequence[float],
        epsilon: float = 1.0,
        delta: float = 1e-5,
        covariance_diagonal: Sequence[float] | None = None,
    ) -> list[float]:
        """
        Asynchronous wrapper offloading Mahalanobis noise generation to threadpool.
        """
        return await asyncio.to_thread(
            self._apply_mahalanobis_dp_noise_sync,
            vector,
            epsilon,
            delta,
            covariance_diagonal,
        )

    # -------------------------------------------------------------------------
    # 3. I/O-BOUND: pgvector halfvec(384) Asynchronous Search
    # -------------------------------------------------------------------------

    async def search_similar_personas(
        self,
        pool: asyncpg.Pool,
        query_vector: Sequence[float],
        domain_category: str | None = None,
        limit: int = 10,
        min_similarity: float = 0.65,
    ) -> list[PersonaMatch]:
        """
        Executes a high-speed cosine similarity search against pgvector's halfvec(384) HNSW index.

        Performance Architecture:
        1. Employs `halfvec` casting ($1::halfvec) to execute SIMD-accelerated 16-bit
           floating point dot products.
        2. Configures `SET LOCAL hnsw.iterative_scan = 'strict_order'` in the transaction.
           This solves the HNSW over-filtering problem when combined with WHERE clauses
           (e.g., domain_category or is_active filter), ensuring the engine continues
           traversing the HNSW graph until `limit` valid candidates are discovered.
        3. Cosine distance operator in pgvector is `<=>`.
           Cosine similarity is computed as `1.0 - (embedding <=> $1::halfvec)`.
        """
        # Format vector as string literal recognized by pgvector: "[0.123,0.456,...]"
        vector_str = f"[{','.join(f'{x:.6f}' for x in query_vector)}]"

        async with pool.acquire() as conn:
            async with conn.transaction():
                # Enforce iterative index scan within this transaction scope
                await conn.execute("SET LOCAL hnsw.iterative_scan = 'strict_order';")

                if domain_category:
                    query = """
                        SELECT 
                            id,
                            account_id,
                            domain_category,
                            1.0 - (embedding <=> $1::halfvec) AS similarity,
                            total_leases
                        FROM synthetic_personas
                        WHERE is_active = TRUE
                          AND domain_category = $2
                          AND (1.0 - (embedding <=> $1::halfvec)) >= $3
                        ORDER BY embedding <=> $1::halfvec ASC
                        LIMIT $4;
                    """
                    records = await conn.fetch(
                        query, vector_str, domain_category, min_similarity, limit
                    )
                else:
                    query = """
                        SELECT 
                            id,
                            account_id,
                            domain_category,
                            1.0 - (embedding <=> $1::halfvec) AS similarity,
                            total_leases
                        FROM synthetic_personas
                        WHERE is_active = TRUE
                          AND (1.0 - (embedding <=> $1::halfvec)) >= $2
                        ORDER BY embedding <=> $1::halfvec ASC
                        LIMIT $3;
                    """
                    records = await conn.fetch(query, vector_str, min_similarity, limit)

        return [
            PersonaMatch(
                persona_id=r["id"],
                account_id=r["account_id"],
                domain_category=r["domain_category"],
                cosine_similarity=float(r["similarity"]),
                total_leases=r["total_leases"],
            )
            for r in records
        ]

    async def register_persona(
        self,
        pool: asyncpg.Pool,
        account_id: UUID,
        domain_category: str,
        raw_preferences: str,
        apply_dp: bool = True,
        epsilon: float = 1.0,
    ) -> UUID:
        """
        Full ingestion pipeline:
        1. FastEmbed ONNX forward pass (CPU threadpool).
        2. Optional Mahalanobis DP noise injection (CPU threadpool).
        3. Insertion into PostgreSQL synthetic_personas with halfvec scalar quantization.
        """
        # Step 1: Generate dense vector embedding
        dense_vector = await self.generate_embedding(raw_preferences)

        # Step 2: Apply differential privacy if enabled
        if apply_dp:
            processed_vector = await self.apply_differential_privacy(
                dense_vector, epsilon=epsilon
            )
            accumulated_eps = epsilon
        else:
            processed_vector = dense_vector
            accumulated_eps = 0.0

        vector_str = f"[{','.join(f'{x:.6f}' for x in processed_vector)}]"

        # Step 3: Insert into database via asyncpg
        query = """
            INSERT INTO synthetic_personas (
                account_id,
                domain_category,
                embedding,
                accumulated_epsilon,
                is_active
            ) VALUES (
                $1,
                $2,
                $3::halfvec,
                $4,
                TRUE
            )
            RETURNING id;
        """
        async with pool.acquire() as conn:
            persona_id = await conn.fetchval(
                query, account_id, domain_category, vector_str, accumulated_eps
            )
            return persona_id
