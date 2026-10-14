'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
	Sparkles,
	ShieldCheck,
	Cpu,
	Database,
	Zap,
	Lock,
	ArrowUpRight,
	CheckCircle2,
	Terminal,
	Building2,
	Layers,
	Send,
} from 'lucide-react'

/* ------------------------------------------------------------------ *
 * Section 1: How It Works (#how-it-works)
 * ------------------------------------------------------------------ */

const WORKFLOW_STEPS = [
	{
		step: '01',
		role: 'PERSONA CREATOR',
		title: 'Calibrate & Perturb Locally',
		description:
			'Users calibrate lifestyle habits via adaptive flashcards and NLP life-sync. Preferences are converted into 384-dimensional embeddings and scrambled with Mahalanobis differential privacy noise.',
		metric: 'Zero Raw PII Transmitted',
		accent: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
		icon: Sparkles,
	},
	{
		step: '02',
		role: 'CRYPTOGRAPHIC AIR-GAP',
		title: 'HNSW Cosine Vector Matching',
		description:
			'Enterprises query the grid in plain English. PostgreSQL pgvector scans scalar-quantized halfvec(384) tensors using strict-order iterative HNSW graph traversal in under 8 milliseconds.',
		metric: 'p99 Latency < 8.0ms',
		accent: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
		icon: Cpu,
	},
	{
		step: '03',
		role: 'INSTANT SETTLEMENT',
		title: 'Atomic Micro-Royalty Payouts',
		description:
			'Every cohort match executes a lock-free Optimistic Concurrency Control (OCC) double-entry transfer from corporate escrow directly to the creator’s wallet via live Server-Sent Events.',
		metric: '100% Zero-Sum Audited',
		accent: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
		icon: Zap,
	},
]

/* ------------------------------------------------------------------ *
 * Section 2: The Tech (#the-tech)
 * ------------------------------------------------------------------ */

const TECH_SPECS = [
	{
		label: 'VECTOR ENGINE // ONNX + PGVECTOR',
		title: 'Scalar-Quantized halfvec(384) HNSW',
		description:
			'Powered by BAAI/bge-small-en-v1.5 on CPU SIMD threadpools. 16-bit half-precision quantization cuts RAM footprint by 50% while maintaining 99.4% cosine recall accuracy.',
		code: `CREATE INDEX idx_personas_embedding_hnsw
ON synthetic_personas
USING hnsw (embedding halfvec_cosine_ops)
WITH (m = 16, ef_construction = 128);`,
		badge: 'hnsw.iterative_scan = strict_order',
		icon: Database,
	},
	{
		label: 'PRIVACY MATH // MAHALANOBIS DP',
		title: 'Covariance-Scaled Perturbation',
		description:
			'Unlike isotropic Gaussian noise that destroys semantic signal, Mahalanobis noise scales perturbation along the inverse square root of the cohort covariance matrix.',
		code: `sigma = sqrt(2 * ln(1.25 / delta)) / epsilon
noise = N(0, I) * (sigma * sqrt(cov_diag))
v_perturbed = (v + noise) / ||v + noise||_2`,
		badge: 'DP Certified (ε = 0.45)',
		icon: ShieldCheck,
	},
	{
		label: 'FINANCIAL CORE // OCC DOUBLE-ENTRY',
		title: 'Lock-Free Optimistic Ledger',
		description:
			'Eliminates SELECT FOR UPDATE row-lock contention during high-QPS brand campaigns. Enforces GAAP zero-sum invariants via deferred PostgreSQL constraint triggers.',
		code: `UPDATE accounts
SET balance = balance + $1,
    lock_version = lock_version + 1
WHERE id = $2 AND lock_version = $3;`,
		badge: 'Zero Lock Contention',
		icon: Lock,
	},
	{
		label: 'REGULATORY SHIELD // DPDP ACT 2023',
		title: 'Sovereign Zero-Liability Architecture',
		description:
			'Because brands only lease mathematical cohort overlaps and never touch names, emails, or device IDs, enterprise researchers operate with zero data-breach liability.',
		code: `Identity Boundary : BLINDED (ECDSA + Shamir)
Network Transport : Multi-Hop Relay
Output Artifact   : 384-Dim Unit Sphere Tensor`,
		badge: '100% DPDP Indemnified',
		icon: Layers,
	},
]

export function LandingSections() {
	const [inquiryRole, setInquiryRole] = useState<'enterprise' | 'creator'>('enterprise')
	const [email, setEmail] = useState('')
	const [org, setOrg] = useState('')
	const [message, setMessage] = useState('')
	const [submitted, setSubmitted] = useState(false)
	const [cohortSize, setCohortSize] = useState(500)

	const handleInquirySubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!email.trim()) return
		setSubmitted(true)
		setTimeout(() => {
			setEmail('')
			setOrg('')
			setMessage('')
		}, 400)
	}

	return (
		<div className="relative w-full bg-black text-[#E1E0CC] overflow-hidden">
			{/* Subtle Ambient Divider */}
			<div className="mx-auto max-w-[1400px] px-4 sm:px-8">
				<div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
			</div>

			{/* ================================================================
			    1. HOW IT WORKS (#how-it-works)
			   ================================================================ */}
			<section
				id="how-it-works"
				className="relative mx-auto max-w-[1400px] px-4 py-24 sm:px-8 lg:py-32 scroll-mt-16"
			>
				<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
					<div>
						<div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-[#E1E0CC]/70">
							<span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
							<span>Protocol Mechanics // 01</span>
						</div>
						<h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#E1E0CC] sm:text-5xl">
							How the Synthetic Grid Works
						</h2>
					</div>
					<p className="max-w-md text-xs sm:text-sm text-[#E1E0CC]/60 leading-relaxed">
						A two-sided cryptographic marketplace bridging consumer lifestyle telemetry with enterprise
						market research—without a single byte of personal identity ever crossing the wire.
					</p>
				</div>

				{/* 3-Step Pipeline Cards */}
				<div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
					{WORKFLOW_STEPS.map((item) => {
						const Icon = item.icon
						return (
							<div
								key={item.step}
								className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0A0A0C] p-7 transition-all duration-300 hover:border-white/25 hover:bg-[#0E0E12]"
							>
								<div>
									<div className="flex items-center justify-between">
										<span className="font-mono text-xs uppercase tracking-widest text-[#E1E0CC]/50">
											STEP {item.step} // {item.role}
										</span>
										<span
											className={`flex h-9 w-9 items-center justify-center rounded-xl border ${item.accent}`}
										>
											<Icon className="h-4 w-4" />
										</span>
									</div>

									<h3 className="mt-6 text-xl font-semibold tracking-tight text-[#E1E0CC]">
										{item.title}
									</h3>
									<p className="mt-3 text-xs sm:text-sm text-[#E1E0CC]/65 leading-relaxed">
										{item.description}
									</p>
								</div>

								<div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4 font-mono text-xs">
									<span className="text-[#E1E0CC]/50">Invariant:</span>
									<span className="text-[#E1E0CC] font-medium">{item.metric}</span>
								</div>
							</div>
						)
					})}
				</div>

				{/* Dual Portal Quick-Launch Strip */}
				<div className="mt-10 grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:grid-cols-2">
					<div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/60 p-5">
						<div>
							<span className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">
								For Individuals
							</span>
							<h4 className="mt-1 text-base font-semibold text-[#E1E0CC]">
								Launch Persona Creator Studio
							</h4>
							<p className="mt-0.5 text-xs text-[#E1E0CC]/60">
								Calibrate flashcards, sync daily habits, and stream micro-royalties.
							</p>
						</div>
						<Link
							href="/studio"
							className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-[#E1E0CC] px-4 py-2.5 text-xs font-semibold text-black transition-all hover:bg-white"
						>
							<span>Open Studio</span>
							<ArrowUpRight className="h-3.5 w-3.5" />
						</Link>
					</div>

					<div className="flex items-center justify-between gap-4 rounded-xl border border-amber-500/20 bg-black/60 p-5">
						<div>
							<span className="font-mono text-[10px] uppercase tracking-widest text-amber-400">
								For Enterprises
							</span>
							<h4 className="mt-1 text-base font-semibold text-[#E1E0CC]">
								Access Business Command Center
							</h4>
							<p className="mt-0.5 text-xs text-[#E1E0CC]/60">
								Query 384-dim cohorts in real time with zero DPDP Act liability.
							</p>
						</div>
						<Link
							href="/business"
							className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-semibold text-black transition-all hover:bg-amber-300"
						>
							<span>Business Center</span>
							<ArrowUpRight className="h-3.5 w-3.5" />
						</Link>
					</div>
				</div>
			</section>

			{/* ================================================================
			    2. THE TECH (#the-tech)
			   ================================================================ */}
			<section
				id="the-tech"
				className="relative mx-auto max-w-[1400px] border-t border-white/10 px-4 py-24 sm:px-8 lg:py-32 scroll-mt-16"
			>
				<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
					<div>
						<div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-[#E1E0CC]/70">
							<Terminal className="h-3 w-3 text-cyan-400" />
							<span>Antigravity Architecture // 02</span>
						</div>
						<h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#E1E0CC] sm:text-5xl">
							Hardware-Proximal Privacy Stack
						</h2>
					</div>
					<p className="max-w-md text-xs sm:text-sm text-[#E1E0CC]/60 leading-relaxed">
						Zero ORM bloat. Zero PyTorch GPU overhead. Built on uvloop, asyncpg binary protocols, ONNX
						SIMD runtime, and PostgreSQL 16 pgvector.
					</p>
				</div>

				<div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
					{TECH_SPECS.map((spec) => {
						const Icon = spec.icon
						return (
							<div
								key={spec.title}
								className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0A0A0C] p-7 transition-colors hover:border-white/20"
							>
								<div>
									<div className="flex items-center justify-between gap-2">
										<span className="font-mono text-[11px] uppercase tracking-widest text-[#E1E0CC]/50">
											{spec.label}
										</span>
										<span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 font-mono text-[10px] text-emerald-400">
											<Icon className="h-3 w-3" />
											{spec.badge}
										</span>
									</div>

									<h3 className="mt-4 text-xl font-semibold text-[#E1E0CC]">{spec.title}</h3>
									<p className="mt-2 text-xs sm:text-sm text-[#E1E0CC]/65 leading-relaxed">
										{spec.description}
									</p>
								</div>

								<pre className="mt-6 overflow-x-auto rounded-xl border border-white/10 bg-black/90 p-4 font-mono text-[11px] leading-relaxed text-[#E1E0CC]/85">
									<code>{spec.code}</code>
								</pre>
							</div>
						)
					})}
				</div>
			</section>

			{/* ================================================================
			    3. INQUIRIES (#inquiries)
			   ================================================================ */}
			<section
				id="inquiries"
				className="relative mx-auto max-w-[1400px] border-t border-white/10 px-4 py-24 sm:px-8 lg:py-32 scroll-mt-16"
			>
				<div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
					{/* Left Column: Enterprise Telemetry Estimator & Direct Info */}
					<div className="flex flex-col justify-between lg:col-span-6">
						<div>
							<div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-[#E1E0CC]/70">
								<Building2 className="h-3 w-3 text-amber-400" />
								<span>Enterprise & Partner Inquiries // 03</span>
							</div>
							<h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#E1E0CC] sm:text-4xl">
								Deploy Sovereign Cohort Queries
							</h2>
							<p className="mt-3 text-xs sm:text-sm text-[#E1E0CC]/65 leading-relaxed max-w-lg">
								Request dedicated API keys for high-QPS vector search, custom industry taxonomies, or
								cryptographic audit attestations for your legal and compliance teams.
							</p>

							{/* Interactive Cohort Cost Estimator */}
							<div className="mt-8 rounded-2xl border border-white/10 bg-[#0A0A0C] p-6">
								<div className="flex items-center justify-between text-xs">
									<span className="font-mono uppercase tracking-wider text-[#E1E0CC]/70">
										Target Cohort Sample Size
									</span>
									<span className="font-mono text-sm font-bold text-amber-400">
										{cohortSize.toLocaleString()} Personas
									</span>
								</div>
								<input
									type="range"
									min="100"
									max="5000"
									step="100"
									value={cohortSize}
									onChange={(e) => setCohortSize(Number(e.target.value))}
									className="mt-4 w-full accent-amber-400 cursor-pointer"
								/>
								<div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-4 font-mono text-xs">
									<div>
										<span className="text-[10px] text-[#E1E0CC]/50 block">Est. Settlement</span>
										<span className="text-sm font-semibold text-[#E1E0CC]">
											₹{(cohortSize * 5.5).toLocaleString('en-IN')}
										</span>
									</div>
									<div>
										<span className="text-[10px] text-[#E1E0CC]/50 block">Search SLA</span>
										<span className="text-sm font-semibold text-emerald-400">&lt; 8.0ms</span>
									</div>
									<div>
										<span className="text-[10px] text-[#E1E0CC]/50 block">PII Exposure</span>
										<span className="text-sm font-semibold text-cyan-400">0.00%</span>
									</div>
								</div>
							</div>
						</div>

						<div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 font-mono text-xs text-[#E1E0CC]/50">
							<span>GRID NODE: BLR-IN-01 (Bengaluru)</span>
							<span>PROTOCOL: AGY-V4.2-PROD</span>
						</div>
					</div>

					{/* Right Column: Inquiry Dispatch Form */}
					<div className="lg:col-span-6">
						<div className="rounded-2xl border border-white/10 bg-[#0A0A0C] p-7 sm:p-9">
							<div className="flex items-center justify-between border-b border-white/10 pb-4">
								<h3 className="text-base font-semibold text-[#E1E0CC]">
									Direct Grid Inquiry Dispatch
								</h3>
								<div className="flex gap-1.5 rounded-lg border border-white/10 bg-black p-1 text-[11px]">
									<button
										type="button"
										onClick={() => setInquiryRole('enterprise')}
										className={`rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
											inquiryRole === 'enterprise'
												? 'bg-amber-400 text-black font-semibold'
												: 'text-[#E1E0CC]/60 hover:text-white'
										}`}
									>
										Enterprise
									</button>
									<button
										type="button"
										onClick={() => setInquiryRole('creator')}
										className={`rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
											inquiryRole === 'creator'
												? 'bg-[#E1E0CC] text-black font-semibold'
												: 'text-[#E1E0CC]/60 hover:text-white'
										}`}
									>
										Creator
									</button>
								</div>
							</div>

							{submitted ? (
								<div className="flex flex-col items-center justify-center py-14 text-center">
									<div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
										<CheckCircle2 className="h-6 w-6" />
									</div>
									<h4 className="mt-4 text-lg font-semibold text-[#E1E0CC]">
										Inquiry Logged on Sovereign Grid
									</h4>
									<p className="mt-1 max-w-xs text-xs text-[#E1E0CC]/60">
										Your transmission has been encrypted and routed. You can also explore the live
										workspace immediately.
									</p>
									<div className="mt-6 flex gap-3">
										<button
											type="button"
											onClick={() => setSubmitted(false)}
											className="rounded-xl border border-white/15 px-4 py-2 text-xs font-medium text-[#E1E0CC] hover:bg-white/5 cursor-pointer"
										>
											Send Another
										</button>
										<Link
											href="/studio"
											className="rounded-xl bg-[#E1E0CC] px-4 py-2 text-xs font-semibold text-black hover:bg-white"
										>
											Enter Live Studio →
										</Link>
									</div>
								</div>
							) : (
								<form onSubmit={handleInquirySubmit} className="mt-6 space-y-4">
									<div>
										<label className="block text-xs font-medium text-[#E1E0CC]/80">
											{inquiryRole === 'enterprise'
												? 'Organization / Brand Name'
												: 'Pseudonym or Handle'}
										</label>
										<input
											type="text"
											required
											value={org}
											onChange={(e) => setOrg(e.target.value)}
											placeholder={
												inquiryRole === 'enterprise'
													? 'Apex Consumer Labs Pvt Ltd'
													: 'Clone_0x8F32'
											}
											className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/70 px-3.5 py-2.5 text-xs text-[#E1E0CC] placeholder:text-neutral-600 focus:border-white/40 focus:outline-none"
										/>
									</div>

									<div>
										<label className="block text-xs font-medium text-[#E1E0CC]/80">
											Work or Sovereign Email
										</label>
										<input
											type="email"
											required
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											placeholder={
												inquiryRole === 'enterprise'
													? 'research@apexlabs.in'
													: 'creator@personagrid.io'
											}
											className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/70 px-3.5 py-2.5 text-xs text-[#E1E0CC] placeholder:text-neutral-600 focus:border-white/40 focus:outline-none"
										/>
									</div>

									<div>
										<label className="block text-xs font-medium text-[#E1E0CC]/80">
											Cohort Requirements / Technical Inquiry
										</label>
										<textarea
											rows={4}
											required
											value={message}
											onChange={(e) => setMessage(e.target.value)}
											placeholder={
												inquiryRole === 'enterprise'
													? 'Describe your target consumer cohort, expected query volume, or DPDP compliance requirements...'
													: 'Questions about local ONNX vector calibration, Mahalanobis noise, or instant UPI/IMPS payouts...'
											}
											className="mt-1.5 w-full resize-none rounded-xl border border-white/15 bg-black/70 p-3.5 text-xs text-[#E1E0CC] placeholder:text-neutral-600 focus:border-white/40 focus:outline-none"
										/>
									</div>

									<button
										type="submit"
										className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#E1E0CC] px-5 py-3 text-xs font-semibold text-black transition-all hover:bg-white cursor-pointer"
									>
										<Send className="h-3.5 w-3.5" />
										<span>Transmit Encrypted Inquiry</span>
									</button>
								</form>
							)}
						</div>
					</div>
				</div>

				{/* Global Landing Footer */}
				<footer className="mt-24 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-[#E1E0CC]/45 sm:flex-row">
					<div className="flex items-center gap-2">
						<span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 font-bold text-[#E1E0CC]">
							P
						</span>
						<span className="font-semibold tracking-wider uppercase text-[#E1E0CC]/80">
							PersonaGrid
						</span>
						<span>— Zero-PII Synthetic Identity Marketplace</span>
					</div>
					<div className="flex items-center gap-6">
						<Link href="/studio" className="hover:text-[#E1E0CC] transition-colors">
							Persona Studio
						</Link>
						<Link href="/business" className="hover:text-[#E1E0CC] transition-colors">
							Business Center
						</Link>
						<span>© 2026 PersonaGrid Inc.</span>
					</div>
				</footer>
			</section>
		</div>
	)
}

export default LandingSections
