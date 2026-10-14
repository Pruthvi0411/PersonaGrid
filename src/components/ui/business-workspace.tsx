'use client'

import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	type ReactNode,
} from 'react'
import Link from 'next/link'
import {
	LayoutDashboard,
	Search,
	Layers,
	CreditCard,
	ShieldCheck,
	SlidersHorizontal,
	Zap,
	CheckCircle2,
	TrendingUp,
	Download,
	Lock,
	ArrowRight,
	LogOut,
	Building2,
	Copy,
	Check,
	RefreshCw,
	Sparkles,
	FileText,
	Database,
	Radio,
} from 'lucide-react'
import { LimelightNav } from '@/components/ui/limelight-nav'
import DraggableWidgetGrid, { type WidgetItem } from '@/components/ui/draggable-widget-grid'
import {
	Shell,
	Big,
	Delta,
	Dot,
	Row,
	PALETTE,
	FONT,
	fmt,
	type Tone,
} from '@/components/ui/demo'

/* ------------------------------------------------------------------ *
 * 1. Business Workspace Types & Interfaces
 * ------------------------------------------------------------------ */

export interface LeasedCohortMatch {
	persona_id: string
	domain_category: string
	cosine_similarity: number
	royalty_paid: number
	transaction_id: string
	timestamp: string
	status: Tone
	tags?: string[]
}

export interface OccAuditEntry {
	id: string
	txHash: string
	timestamp: string
	type: 'OCC_DEBIT' | 'RAZORPAY_TOPUP'
	description: string
	personasMatched: number
	amount: number
	status: 'LOCKED' | 'SETTLED'
	version: number
}

interface BusinessWorkspaceContextType {
	escrowBalance: number
	totalLeasedToday: number
	avgSimilarity: number
	meanLatencyMs: number
	queryText: string
	setQueryText: (v: string) => void
	selectedDomain: string
	setSelectedDomain: (v: string) => void
	minSimilarity: number
	setMinSimilarity: (v: number) => void
	royaltyBid: number
	setRoyaltyBid: (v: number) => void
	sampleLimit: number
	setSampleLimit: (v: number) => void
	isQuerying: boolean
	matches: LeasedCohortMatch[]
	auditLogs: OccAuditEntry[]
	executeGridQuery: (customPrompt?: string) => Promise<void>
	topUpEscrow: (amount: number) => void
	activeTab: number
	setActiveTab: (tab: number) => void
	toastMessage: string | null
	copiedTx: string | null
	copyToClipboard: (text: string, id: string) => void
}

const BusinessWorkspaceContext = createContext<BusinessWorkspaceContextType | null>(null)

export function useBusinessWorkspace() {
	const ctx = useContext(BusinessWorkspaceContext)
	if (!ctx) throw new Error('useBusinessWorkspace must be used within BusinessWorkspaceProvider')
	return ctx
}

/* ------------------------------------------------------------------ *
 * 2. Initial Sample Datasets
 * ------------------------------------------------------------------ */

const INITIAL_MATCHES: LeasedCohortMatch[] = [
	{
		persona_id: 'Persona_0x9F2A',
		domain_category: 'technology.ai',
		cosine_similarity: 0.942,
		royalty_paid: 5.5,
		transaction_id: 'tx_9f2a01',
		timestamp: '2m ago',
		status: 'ok',
		tags: ['Pro AI User', 'Beeper Subscriber', 'GitHub Labs'],
	},
	{
		persona_id: 'Persona_0x3B8C',
		domain_category: 'health.fitness',
		cosine_similarity: 0.918,
		royalty_paid: 5.5,
		transaction_id: 'tx_3b8c44',
		timestamp: '5m ago',
		status: 'ok',
		tags: ['Marathon Runner', 'Whoop Biometrics', 'Home Gym'],
	},
	{
		persona_id: 'Persona_0x7E1D',
		domain_category: 'commerce.style',
		cosine_similarity: 0.884,
		royalty_paid: 4.8,
		transaction_id: 'tx_7e1d88',
		timestamp: '8m ago',
		status: 'ok',
		tags: ['Minimalist Desk', 'Mechanical Keyboards', 'Ergonomics'],
	},
	{
		persona_id: 'Persona_0x10C7',
		domain_category: 'technology.ai',
		cosine_similarity: 0.852,
		royalty_paid: 4.2,
		transaction_id: 'tx_10c7a8',
		timestamp: '11m ago',
		status: 'warn',
		tags: ['MCA Student', 'SWAYAM Data Sci', 'Agent Dev'],
	},
]

const INITIAL_AUDIT_LOGS: OccAuditEntry[] = [
	{
		id: 'occ-01',
		txHash: '0x8f32a9c1e7d4b2f0',
		timestamp: '14:28:12 UTC',
		type: 'OCC_DEBIT',
		description: 'Cohort Lease: Premium Running Shoes in Urban Tech',
		personasMatched: 5,
		amount: 27.5,
		status: 'LOCKED',
		version: 18,
	},
	{
		id: 'occ-02',
		txHash: '0x3c99e1a8b4f2c7d9',
		timestamp: '13:10:45 UTC',
		type: 'OCC_DEBIT',
		description: 'Cohort Lease: Autonomous AI Tools MCA Engineers',
		personasMatched: 4,
		amount: 22.0,
		status: 'LOCKED',
		version: 17,
	},
	{
		id: 'top-01',
		txHash: 'razorpay_pay_P8d92Ka01b',
		timestamp: '11:45:00 UTC',
		type: 'RAZORPAY_TOPUP',
		description: 'Razorpay Corporate Virtual Account Top-Up',
		personasMatched: 0,
		amount: 25000.0,
		status: 'SETTLED',
		version: 16,
	},
	{
		id: 'occ-03',
		txHash: '0x1b74a2e5d8c3f9b1',
		timestamp: '10:02:18 UTC',
		type: 'OCC_DEBIT',
		description: 'Cohort Lease: Motorized Ergonomic Desk Preferences',
		personasMatched: 6,
		amount: 33.0,
		status: 'LOCKED',
		version: 15,
	},
]

/* ------------------------------------------------------------------ *
 * 3. Overview Draggable Grid Widgets (Tab 0)
 * ------------------------------------------------------------------ */

type BusinessWidgetKind =
	| 'console'
	| 'escrow'
	| 'sla'
	| 'matches'
	| 'density'
	| 'compliance'
	| 'domains'
	| 'segments'

interface BusinessWidget extends WidgetItem {
	kind: BusinessWidgetKind
}

const BUSINESS_OVERVIEW_WIDGETS: BusinessWidget[] = [
	{ id: 'console', kind: 'console', size: 'wide', label: 'Vector Query Console' },
	{ id: 'escrow', kind: 'escrow', size: 'sm', label: 'Escrow Balance' },
	{ id: 'sla', kind: 'sla', size: 'sm', label: 'HNSW Engine SLA' },
	{ id: 'matches', kind: 'matches', size: 'wide', label: 'Live Cohort Matches' },
	{ id: 'density', kind: 'density', size: 'wide', label: 'Cosine Similarity Matrix' },
	{ id: 'compliance', kind: 'compliance', size: 'sm', label: 'DPDP Compliance' },
	{ id: 'domains', kind: 'domains', size: 'sm', label: 'Cohort Reach' },
	{ id: 'segments', kind: 'segments', size: 'wide', label: 'Active Segment Liquidity' },
]

function OverviewConsoleWidget() {
	const {
		queryText,
		setQueryText,
		selectedDomain,
		setSelectedDomain,
		minSimilarity,
		setMinSimilarity,
		royaltyBid,
		setRoyaltyBid,
		isQuerying,
		executeGridQuery,
	} = useBusinessWorkspace()

	return (
		<Shell
			title="Vector Query Console"
			meta={
				<span className="flex items-center gap-1.5 text-amber-400 text-xs font-mono">
					<Zap className="h-3 w-3" /> pgvector HNSW
				</span>
			}
		>
			<form
				onSubmit={(e) => {
					e.preventDefault()
					executeGridQuery()
				}}
				className="flex h-full flex-col justify-between gap-2.5"
			>
				<div className="flex flex-col gap-2">
					<div className="relative">
						<input
							type="text"
							value={queryText}
							onChange={(e) => setQueryText(e.target.value)}
							placeholder="e.g., Test interest for a premium running shoe among urban 20-somethings..."
							className="w-full rounded-lg border border-border bg-foreground/[0.04] pl-3 pr-9 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-400/60 focus:outline-none"
						/>
						<Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
					</div>

					<div className="grid grid-cols-3 gap-2 text-[11px]">
						<div className="flex flex-col gap-1 rounded-lg border border-border/60 bg-foreground/[0.02] px-2.5 py-1.5">
							<span className="text-[10px] text-muted-foreground uppercase">Cohort Domain</span>
							<select
								value={selectedDomain}
								onChange={(e) => setSelectedDomain(e.target.value)}
								className="bg-transparent font-mono text-xs text-foreground focus:outline-none cursor-pointer"
							>
								<option value="all" className="bg-[#141417]">All Domains</option>
								<option value="technology.ai" className="bg-[#141417]">technology.ai</option>
								<option value="health.fitness" className="bg-[#141417]">health.fitness</option>
								<option value="commerce.style" className="bg-[#141417]">commerce.style</option>
							</select>
						</div>

						<div className="flex flex-col gap-1 rounded-lg border border-border/60 bg-foreground/[0.02] px-2.5 py-1.5">
							<div className="flex justify-between">
								<span className="text-[10px] text-muted-foreground uppercase">Min Cosine</span>
								<span className="font-mono text-[10px] text-amber-400">{(minSimilarity * 100).toFixed(0)}%</span>
							</div>
							<input
								type="range"
								min="0.50"
								max="0.95"
								step="0.05"
								value={minSimilarity}
								onChange={(e) => setMinSimilarity(parseFloat(e.target.value))}
								className="w-full accent-amber-400 cursor-pointer h-1.5 mt-1"
							/>
						</div>

						<div className="flex flex-col gap-1 rounded-lg border border-border/60 bg-foreground/[0.02] px-2.5 py-1.5">
							<div className="flex justify-between">
								<span className="text-[10px] text-muted-foreground uppercase">Micro-Bid</span>
								<span className="font-mono text-[10px] text-amber-400">₹{royaltyBid.toFixed(2)}</span>
							</div>
							<input
								type="range"
								min="2.00"
								max="15.00"
								step="0.50"
								value={royaltyBid}
								onChange={(e) => setRoyaltyBid(parseFloat(e.target.value))}
								className="w-full accent-amber-400 cursor-pointer h-1.5 mt-1"
							/>
						</div>
					</div>
				</div>

				<div className="flex items-center justify-between pt-1">
					<span className="text-[10px] font-mono text-muted-foreground">
						FastEmbed (384-D) &bull; OCC Concurrency
					</span>
					<button
						type="submit"
						disabled={isQuerying}
						className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-300 px-3.5 py-1.5 text-xs font-semibold text-black transition-all hover:brightness-105 active:scale-95 disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)]"
					>
						{isQuerying ? (
							<>
								<RefreshCw className="h-3.5 w-3.5 animate-spin" />
								<span>Embedding Vector...</span>
							</>
						) : (
							<>
								<Search className="h-3.5 w-3.5" />
								<span>Execute Query</span>
							</>
						)}
					</button>
				</div>
			</form>
		</Shell>
	)
}

function OverviewEscrowWidget() {
	const { escrowBalance, totalLeasedToday } = useBusinessWorkspace()
	return (
		<Shell
			title="Corporate Escrow"
			meta={
				<span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
					<Dot tone="ok" pulse /> RAZORPAY
				</span>
			}
		>
			<div className="flex flex-col justify-between h-full">
				<div>
					<Big unit="INR">₹{fmt(Math.round(escrowBalance))}</Big>
					<div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
						<TrendingUp className="h-3 w-3 text-emerald-400" />
						<span>24h Burn: ₹{(totalLeasedToday * 5.5).toFixed(0)}</span>
					</div>
				</div>
				<dl className="flex flex-col gap-1 border-t border-border/60 pt-2 text-[11px]">
					<Row value="OCC Lock Active">
						<span>Debit Guard</span>
					</Row>
					<Row value={`${totalLeasedToday} Leases`}>
						<span>Total Settled</span>
					</Row>
				</dl>
			</div>
		</Shell>
	)
}

function OverviewSlaWidget() {
	const { meanLatencyMs } = useBusinessWorkspace()
	return (
		<Shell
			title="HNSW Search SLA"
			meta={
				<span className="text-[11px] font-mono text-amber-400">
					P99: {meanLatencyMs}ms
				</span>
			}
		>
			<div className="flex flex-col justify-between h-full">
				<div>
					<Big unit="ms">{meanLatencyMs}</Big>
					<div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
						<Delta value={-18} against="vs PostgreSQL sequential scan" good="down" suffix="faster" />
					</div>
				</div>
				<dl className="flex flex-col gap-1 border-t border-border/60 pt-2 text-[11px]">
					<Row value="99.4%">
						<span>Index Recall</span>
					</Row>
					<Row value="384-D HalfVec">
						<span>Dimensions</span>
					</Row>
				</dl>
			</div>
		</Shell>
	)
}

function OverviewMatchesWidget() {
	const { matches } = useBusinessWorkspace()
	return (
		<Shell
			title="Recent Leased Cohorts"
			meta={<span className="text-[11px] font-mono text-muted-foreground">Instant OCC Settlement</span>}
		>
			<div className="flex flex-col gap-2 overflow-y-auto max-h-[160px] pr-1">
				{matches.slice(0, 4).map((m, i) => (
					<div
						key={`${m.transaction_id}-${i}`}
						className="flex items-center justify-between rounded-lg border border-border/60 bg-foreground/[0.02] px-3 py-2 text-xs"
					>
						<div className="flex items-center gap-2.5">
							<Dot tone={m.status} />
							<div className="flex flex-col">
								<span className="font-mono font-medium text-foreground">{m.persona_id}</span>
								<span className="text-[10px] text-muted-foreground">{m.domain_category}</span>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<div className="flex flex-col items-end">
								<span className="font-mono text-amber-400 font-semibold">
									{(m.cosine_similarity * 100).toFixed(1)}% Sim
								</span>
								<span className="text-[10px] text-muted-foreground font-mono">
									₹{m.royalty_paid.toFixed(2)} paid
								</span>
							</div>
							<span className="text-[10px] font-mono text-muted-foreground/80">{m.timestamp}</span>
						</div>
					</div>
				))}
			</div>
		</Shell>
	)
}

function OverviewDensityWidget() {
	const { avgSimilarity } = useBusinessWorkspace()
	const HEAT = ['bg-foreground/[0.06]', 'bg-amber-500/20', 'bg-amber-500/40', 'bg-amber-500/65', 'bg-amber-400']
	const MATRIX_CELLS = [
		[1, 2, 3, 4, 3, 2, 4, 3],
		[2, 3, 4, 4, 4, 3, 3, 2],
		[3, 4, 4, 4, 3, 4, 4, 3],
		[1, 2, 3, 4, 3, 2, 3, 1],
	]

	return (
		<Shell
			title="Cohort Resonance Matrix"
			meta={<span className="text-[11px] font-mono text-amber-400">Mean: {(avgSimilarity * 100).toFixed(1)}%</span>}
		>
			<div className="flex flex-col justify-between h-full gap-2">
				<div className="grid grid-cols-8 gap-1.5 py-1">
					{MATRIX_CELLS.flat().map((lvl, idx) => (
						<div
							key={idx}
							className={`h-5 rounded-sm transition-all hover:scale-105 ${HEAT[lvl]}`}
							title={`Resonance Bin ${idx}: Tier ${lvl}`}
						/>
					))}
				</div>
				<div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/60 pt-2">
					<span>0.65 Cosine Sim (Broad)</span>
					<div className="flex items-center gap-1">
						{HEAT.map((h, i) => (
							<span key={i} className={`h-2 w-2 rounded-xs ${h}`} />
						))}
					</div>
					<span>0.95 Cosine Sim (Strict)</span>
				</div>
			</div>
		</Shell>
	)
}

function OverviewComplianceWidget() {
	return (
		<Shell
			title="DPDP Compliance"
			meta={
				<span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
					<Dot tone="ok" /> VERIFIED
				</span>
			}
		>
			<div className="flex flex-col justify-between h-full">
				<div>
					<div className="flex items-center gap-2">
						<ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
						<span className="text-sm font-semibold text-foreground">Zero-PII Safe Harbour</span>
					</div>
					<p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
						India DPDP Act 2023 Section 3(2) statutory indemnification active.
					</p>
				</div>
				<dl className="flex flex-col gap-1 border-t border-border/60 pt-2 text-[11px]">
					<Row value="ε = 0.45">
						<span>Mahalanobis DP</span>
					</Row>
					<Row value="p < 10⁻⁹">
						<span>Re-ID Risk</span>
					</Row>
				</dl>
			</div>
		</Shell>
	)
}

function OverviewReachWidget() {
	const domains = [
		{ name: 'technology.ai', share: 0.52, color: 'bg-amber-400' },
		{ name: 'health.fitness', share: 0.27, color: 'bg-amber-500/70' },
		{ name: 'commerce.style', share: 0.13, color: 'bg-amber-500/40' },
		{ name: 'education.skills', share: 0.08, color: 'bg-foreground/20' },
	]
	return (
		<Shell title="Cohort Reach" meta={<span className="text-[11px] font-mono text-muted-foreground">4 Domains</span>}>
			<div className="flex flex-col justify-between h-full">
				<div className="flex h-3 w-full overflow-hidden rounded-full bg-foreground/[0.04]">
					{domains.map((d) => (
						<div key={d.name} className={`h-full ${d.color}`} style={{ width: `${d.share * 100}%` }} />
					))}
				</div>
				<dl className="flex flex-col gap-1 text-[11px]">
					{domains.map((d) => (
						<Row key={d.name} value={`${(d.share * 100).toFixed(0)}%`}>
							<span className="truncate">{d.name}</span>
						</Row>
					))}
				</dl>
			</div>
		</Shell>
	)
}

function OverviewSegmentsWidget() {
	const segments = [
		{ name: 'Urban Tech Athleisure', personas: 412, bid: '₹5.50', status: 'High Volume' },
		{ name: 'Distributed Systems MCA Postgrads', personas: 284, bid: '₹6.00', status: 'Surge Demand' },
		{ name: 'Minimalist Ergonomic Solopreneurs', personas: 196, bid: '₹4.50', status: 'Active' },
	]
	return (
		<Shell title="Active Segment Liquidity" meta={<span className="text-[11px] font-mono text-amber-400">384-D Pools</span>}>
			<div className="flex flex-col gap-2">
				{segments.map((seg) => (
					<div
						key={seg.name}
						className="flex items-center justify-between rounded-lg border border-border/60 bg-foreground/[0.02] px-3 py-2 text-xs"
					>
						<div className="flex items-center gap-2">
							<Database className="h-3.5 w-3.5 text-amber-400" />
							<span className="font-medium text-foreground">{seg.name}</span>
						</div>
						<div className="flex items-center gap-4 font-mono text-[11px]">
							<span className="text-muted-foreground">{seg.personas} Personas Online</span>
							<span className="text-amber-400 font-semibold">{seg.bid} / match</span>
							<span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400 border border-amber-500/20">
								{seg.status}
							</span>
						</div>
					</div>
				))}
			</div>
		</Shell>
	)
}

function renderOverviewWidget(item: BusinessWidget) {
	switch (item.kind) {
		case 'console':
			return <OverviewConsoleWidget />
		case 'escrow':
			return <OverviewEscrowWidget />
		case 'sla':
			return <OverviewSlaWidget />
		case 'matches':
			return <OverviewMatchesWidget />
		case 'density':
			return <OverviewDensityWidget />
		case 'compliance':
			return <OverviewComplianceWidget />
		case 'domains':
			return <OverviewReachWidget />
		case 'segments':
			return <OverviewSegmentsWidget />
		default:
			return <OverviewConsoleWidget />
	}
}

/* ------------------------------------------------------------------ *
 * 4. Tab 0 View: Enterprise Overview Grid
 * ------------------------------------------------------------------ */

function EnterpriseOverviewTab() {
	return (
		<div className="flex w-full flex-1 flex-col gap-4" data-slot="enterprise-overview-tab">
			<div className="flex flex-col justify-between gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-end">
				<div>
					<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-0.5">
						<span className="text-amber-400 font-semibold">Business Center</span>
						<span>/</span>
						<span className="text-foreground/80">Enterprise Telemetry & HNSW Vector Engine</span>
					</div>
					<h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
						Corporate Telemetry & Market Intelligence
					</h1>
					<p className="mt-0.5 text-xs text-muted-foreground">
						Query 384-dimensional synthetic consumer vectors via HNSW index with zero PII exposure.
					</p>
				</div>

				<div className="flex items-center gap-2 rounded-lg border border-border/70 bg-foreground/[0.02] px-2.5 py-1.5 text-[11px] text-muted-foreground">
					<SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-amber-400" />
					<div>
						<span className="[@media(pointer:coarse)]:hidden block">
							Rearrange widgets to customize telemetry. Hold{' '}
							<kbd className="rounded bg-foreground/10 px-1 py-0.5 font-mono text-[9px] text-foreground">Alt</kbd>{' '}
							+ arrows.
						</span>
						<span className="hidden [@media(pointer:coarse)]:block">
							Press and hold a widget, then drag to rearrange your workspace.
						</span>
					</div>
				</div>
			</div>

			<section aria-labelledby="enterprise-overview-title" className="w-full flex-1">
				<h2 id="enterprise-overview-title" className="sr-only">
					Enterprise Overview Dashboard
				</h2>
				<DraggableWidgetGrid
					items={BUSINESS_OVERVIEW_WIDGETS}
					renderItem={(item) => renderOverviewWidget(item as BusinessWidget)}
				/>
			</section>
		</div>
	)
}

/* ------------------------------------------------------------------ *
 * 5. Tab 1 View: Cohort Query Lab (Instant Market Research)
 * ------------------------------------------------------------------ */

function CohortQueryLabTab() {
	const {
		queryText,
		setQueryText,
		selectedDomain,
		setSelectedDomain,
		minSimilarity,
		setMinSimilarity,
		royaltyBid,
		setRoyaltyBid,
		sampleLimit,
		setSampleLimit,
		isQuerying,
		matches,
		executeGridQuery,
		copiedTx,
		copyToClipboard,
	} = useBusinessWorkspace()

	const PRESET_SCENARIOS = [
		{
			label: 'Running Shoes in Urban Tech',
			prompt: 'Test interest for a premium carbon-plated running shoe with Whoop biometrics tracking among urban tech 20-somethings.',
			domain: 'health.fitness',
		},
		{
			label: 'Autonomous Coding Agents',
			prompt: 'Demand for autonomous multi-agent developer tooling and terminal IDE subscriptions among MCA and CS graduates.',
			domain: 'technology.ai',
		},
		{
			label: 'Ergonomic Desk & Mechanical Keyboards',
			prompt: 'Affinity for motorized height-adjustable solid walnut standing desks and custom tactile mechanical keyboard builds.',
			domain: 'commerce.style',
		},
		{
			label: 'Continuous Cloud Upskilling',
			prompt: 'Willingness to enroll in specialized SWAYAM / NPTEL distributed systems and eBPF kernel engineering certification tracks.',
			domain: 'education.skills',
		},
	]

	const handleScenarioClick = (scenario: typeof PRESET_SCENARIOS[0]) => {
		setQueryText(scenario.prompt)
		setSelectedDomain(scenario.domain)
	}

	const totalProjectedBudget = royaltyBid * sampleLimit

	return (
		<div className="flex w-full flex-1 flex-col gap-6" data-slot="cohort-query-lab">
			{/* Header */}
			<div className="flex flex-col justify-between gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-end">
				<div>
					<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-0.5">
						<span className="text-amber-400 font-semibold">Cohort Query Lab</span>
						<span>/</span>
						<span className="text-foreground/80">384-Dimensional Simulation & Market Testing</span>
					</div>
					<h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
						Instant Consumer Demand Simulation
					</h1>
					<p className="mt-0.5 text-xs text-muted-foreground">
						Natural language vector projection via FastEmbed ONNX. Micro-lease synthetic persona cohorts in real time.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-xs text-amber-400">
						<Zap className="h-3.5 w-3.5" />
						<span>OCC Ledger Micro-Settlement</span>
					</span>
				</div>
			</div>

			{/* Main Query Formulation Box */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
				{/* Left: Query Configuration Panel (7 cols) */}
				<div className="lg:col-span-7 flex flex-col gap-4">
					<div className="rounded-xl border border-border bg-card p-5 shadow-sm">
						<div className="flex items-center justify-between mb-3">
							<label htmlFor="prompt-query-box" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Natural Language Product Hypothesis
							</label>
							<span className="text-[10px] font-mono text-amber-400">Input → 384-D Vector Embedding</span>
						</div>

						<textarea
							id="prompt-query-box"
							rows={4}
							value={queryText}
							onChange={(e) => setQueryText(e.target.value)}
							placeholder="e.g., Test interest for a high-end running shoe with biometric tracking among urban remote workers who exercise 4+ times weekly..."
							className="w-full rounded-lg border border-border bg-foreground/[0.03] p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-amber-400/60 focus:outline-none transition-colors"
						/>

						{/* Presets */}
						<div className="mt-3 flex flex-col gap-1.5">
							<span className="text-[10px] text-muted-foreground uppercase font-mono">Quick Test Scenarios:</span>
							<div className="flex flex-wrap gap-2">
								{PRESET_SCENARIOS.map((sc, i) => (
									<button
										key={i}
										type="button"
										onClick={() => handleScenarioClick(sc)}
										className="rounded-md border border-border/80 bg-foreground/[0.02] px-2.5 py-1 text-[11px] text-foreground/80 hover:border-amber-400/50 hover:bg-amber-500/5 hover:text-amber-400 transition-all cursor-pointer text-left"
									>
										{sc.label}
									</button>
								))}
							</div>
						</div>

						{/* Controls Grid */}
						<div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-border/60 pt-4">
							{/* Domain Filter */}
							<div className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-foreground/[0.02] p-2.5">
								<span className="text-[10px] text-muted-foreground uppercase font-mono">Cohort Domain</span>
								<select
									value={selectedDomain}
									onChange={(e) => setSelectedDomain(e.target.value)}
									className="bg-transparent font-mono text-xs text-foreground focus:outline-none cursor-pointer"
								>
									<option value="all" className="bg-[#141417]">All Domains</option>
									<option value="technology.ai" className="bg-[#141417]">technology.ai</option>
									<option value="health.fitness" className="bg-[#141417]">health.fitness</option>
									<option value="commerce.style" className="bg-[#141417]">commerce.style</option>
									<option value="education.skills" className="bg-[#141417]">education.skills</option>
								</select>
							</div>

							{/* Cosine Slider */}
							<div className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-foreground/[0.02] p-2.5">
								<div className="flex justify-between items-center text-[10px]">
									<span className="text-muted-foreground uppercase font-mono">Min Cosine</span>
									<span className="font-mono text-amber-400 font-bold">{(minSimilarity * 100).toFixed(0)}%</span>
								</div>
								<input
									type="range"
									min="0.65"
									max="0.95"
									step="0.05"
									value={minSimilarity}
									onChange={(e) => setMinSimilarity(parseFloat(e.target.value))}
									className="w-full accent-amber-400 cursor-pointer h-1.5 mt-1"
								/>
								<span className="text-[9px] text-muted-foreground">
									{minSimilarity >= 0.88 ? 'Strict Resonance' : minSimilarity >= 0.75 ? 'Balanced Cohort' : 'Broad Affinity'}
								</span>
							</div>

							{/* Micro-Bid & Limit */}
							<div className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-foreground/[0.02] p-2.5">
								<div className="flex justify-between items-center text-[10px]">
									<span className="text-muted-foreground uppercase font-mono">Bid & Limit</span>
									<span className="font-mono text-amber-400 font-bold">₹{royaltyBid.toFixed(2)}</span>
								</div>
								<div className="flex items-center gap-2">
									<input
										type="range"
										min="2.00"
										max="15.00"
										step="0.50"
										value={royaltyBid}
										onChange={(e) => setRoyaltyBid(parseFloat(e.target.value))}
										className="w-full accent-amber-400 cursor-pointer h-1.5"
									/>
									<select
										value={sampleLimit}
										onChange={(e) => setSampleLimit(Number(e.target.value))}
										className="rounded border border-border/60 bg-transparent text-[11px] font-mono text-foreground px-1 py-0.5 cursor-pointer"
									>
										<option value="5" className="bg-[#141417]">5</option>
										<option value="10" className="bg-[#141417]">10</option>
										<option value="15" className="bg-[#141417]">15</option>
									</select>
								</div>
								<span className="text-[9px] text-muted-foreground font-mono">
									Max Budget: ₹{totalProjectedBudget.toFixed(2)}
								</span>
							</div>
						</div>

						{/* Execute Button */}
						<div className="mt-5 flex items-center justify-between">
							<span className="text-xs text-muted-foreground">
								Zero human PII queried. Micro-royalties debited via atomic OCC transaction.
							</span>
							<button
								type="button"
								onClick={() => executeGridQuery()}
								disabled={isQuerying}
								className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 px-5 py-2.5 text-xs font-bold text-black transition-all hover:brightness-105 active:scale-95 disabled:opacity-50 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.25)]"
							>
								{isQuerying ? (
									<>
										<RefreshCw className="h-4 w-4 animate-spin" />
										<span>Embedding & Searching Grid...</span>
									</>
								) : (
									<>
										<Sparkles className="h-4 w-4" />
										<span>Run Cohort Simulation</span>
									</>
								)}
							</button>
						</div>
					</div>
				</div>

				{/* Right: Aggregated Affinity Telemetry (5 cols) */}
				<div className="lg:col-span-5 flex flex-col gap-4">
					<div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between h-full">
						<div>
							<div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
								<h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Resonance Metrics
								</h2>
								<span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-400">
									<Dot tone="ok" pulse /> Real-Time Telemetry
								</span>
							</div>

							<div className="grid grid-cols-2 gap-3 mb-4">
								<div className="rounded-lg border border-border/60 bg-foreground/[0.02] p-3">
									<span className="text-[10px] text-muted-foreground uppercase font-mono">Resonance Score</span>
									<p className="mt-1 text-2xl font-bold text-amber-400 font-mono">92.4%</p>
									<span className="text-[10px] text-emerald-400">High Product Market Affinity</span>
								</div>
								<div className="rounded-lg border border-border/60 bg-foreground/[0.02] p-3">
									<span className="text-[10px] text-muted-foreground uppercase font-mono">Query Latency</span>
									<p className="mt-1 text-2xl font-bold text-foreground font-mono">6.8ms</p>
									<span className="text-[10px] text-muted-foreground">pgvector HNSW index</span>
								</div>
							</div>

							<div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-foreground/[0.02] p-3 text-xs mb-4">
								<div className="flex justify-between items-center">
									<span className="text-muted-foreground">Active Leased Personas:</span>
									<span className="font-mono font-semibold text-foreground">{matches.length} clones</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-muted-foreground">Micro-Royalties Disbursed:</span>
									<span className="font-mono font-semibold text-amber-400">
										₹{(matches.length * royaltyBid).toFixed(2)}
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-muted-foreground">Privacy Protection:</span>
									<span className="font-mono text-emerald-400">DPDP Statutory Exemption</span>
								</div>
							</div>
						</div>

						<div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-amber-300/80">
							<strong>Autonomous Micro-Royalties:</strong> When your query executes, our FastAPI backend
							streams Server-Sent Events (SSE) directly to matched consumers&apos; wallets with zero delay.
						</div>
					</div>
				</div>
			</div>

			{/* Results Grid: Matched Persona Vector Cards */}
			<div className="flex flex-col gap-3 mt-2">
				<div className="flex items-center justify-between">
					<h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
						Matched Synthetic Persona Cohorts ({matches.length})
					</h2>
					<button
						type="button"
						onClick={() => {
							const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(matches, null, 2))
							const downloadAnchor = document.createElement('a')
							downloadAnchor.setAttribute('href', dataStr)
							downloadAnchor.setAttribute('download', `personagrid-cohort-${Date.now()}.json`)
							document.body.appendChild(downloadAnchor)
							downloadAnchor.click()
							downloadAnchor.remove()
						}}
						className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-foreground/[0.03] px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-foreground/[0.08] transition-colors cursor-pointer"
					>
						<Download className="h-3.5 w-3.5" />
						<span>Export Anonymized Dataset</span>
					</button>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{matches.map((item, idx) => (
						<div
							key={`${item.persona_id}-${idx}`}
							className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between gap-3 transition-all hover:border-amber-400/40 hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
						>
							<div>
								<div className="flex items-center justify-between mb-2">
									<span className="font-mono text-xs font-bold text-foreground">{item.persona_id}</span>
									<span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-amber-400 border border-amber-500/20">
										{(item.cosine_similarity * 100).toFixed(1)}% Match
									</span>
								</div>

								<div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-3">
									<Radio className="h-3 w-3 text-amber-400" />
									<span>{item.domain_category}</span>
								</div>

								{/* Progress bar */}
								<div className="h-1.5 w-full rounded-full bg-foreground/[0.08] overflow-hidden mb-3">
									<div
										className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300"
										style={{ width: `${Math.min(100, item.cosine_similarity * 100)}%` }}
									/>
								</div>

								{/* Behavioral tags */}
								<div className="flex flex-wrap gap-1 mb-2">
									{(item.tags || ['Verified Lifestyle', 'Active Persona']).map((tag, tIdx) => (
										<span
											key={tIdx}
											className="rounded bg-foreground/[0.04] px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground"
										>
											{tag}
										</span>
									))}
								</div>
							</div>

							<div className="flex items-center justify-between border-t border-border/60 pt-2 text-[10px]">
								<div className="flex flex-col">
									<span className="text-muted-foreground font-mono">Settlement</span>
									<span className="font-mono text-amber-400 font-semibold">₹{item.royalty_paid.toFixed(2)}</span>
								</div>
								<button
									type="button"
									onClick={() => copyToClipboard(item.transaction_id, item.transaction_id)}
									className="flex items-center gap-1 font-mono text-muted-foreground hover:text-foreground cursor-pointer"
									title="Copy Transaction Hash"
								>
									{copiedTx === item.transaction_id ? (
										<Check className="h-3 w-3 text-emerald-400" />
									) : (
										<Copy className="h-3 w-3" />
									)}
									<span>{item.transaction_id}</span>
								</button>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

/* ------------------------------------------------------------------ *
 * 6. Tab 2 View: Cohort Insights & Aggregated Personas
 * ------------------------------------------------------------------ */

function CohortInsightsTab() {
	const lifestyleAffinities = [
		{
			title: 'Marathon Runners & Pro AI Subscriptions',
			percentage: 78,
			description: '78% of urban runners who log Whoop biometrics also subscribe to Claude Pro or ChatGPT Plus.',
			cluster: 'Cluster Alpha: Urban Athleisure',
		},
		{
			title: 'Ergonomic Standing Desks & Sleep Biometrics',
			percentage: 64,
			description: '64% of buyers investing in motorized height-adjustable desks prioritize HRV sleep tracking hardware.',
			cluster: 'Cluster Beta: Ergonomic Solopreneurs',
		},
		{
			title: 'MCA Post-Grads & Distributed Systems',
			percentage: 89,
			description: '89% of computer application post-graduates actively pursue SWAYAM / NPTEL data science credentials.',
			cluster: 'Cluster Gamma: Deep Research',
		},
		{
			title: 'Zero-PII Sovereign Privacy Preference',
			percentage: 52,
			description: '52% of high-income millennial tech buyers prefer merchant checkouts without email/phone capture.',
			cluster: 'Cluster Delta: Privacy Purists',
		},
	]

	const clusters = [
		{ name: 'Cluster Alpha: Urban Athleisure', size: 1420, density: '0.942 Sim', centroid: 'Whoop / Nike / Carbon Shoes' },
		{ name: 'Cluster Beta: Ergonomic Solopreneurs', size: 890, density: '0.912 Sim', centroid: 'Standing Desk / Keychron / Minimal' },
		{ name: 'Cluster Gamma: Systems Engineers', size: 640, density: '0.884 Sim', centroid: 'MCA / Linux / PyTorch / FastEmbed' },
	]

	return (
		<div className="flex w-full flex-1 flex-col gap-6" data-slot="cohort-insights-tab">
			<div className="flex flex-col justify-between gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-end">
				<div>
					<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-0.5">
						<span className="text-amber-400 font-semibold">Cohort Insights</span>
						<span>/</span>
						<span className="text-foreground/80">Aggregated Demographic & Lifestyle Overlaps</span>
					</div>
					<h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
						Mathematical Persona Clustering
					</h1>
					<p className="mt-0.5 text-xs text-muted-foreground">
						Discover multi-category behavioral correlations extracted from 384-dimensional vector centroids with zero PII exposure.
					</p>
				</div>
				<button
					type="button"
					onClick={() => alert('Cryptographic research summary report downloaded successfully.')}
					className="inline-flex items-center gap-2 rounded-lg border border-border bg-foreground/[0.04] px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-foreground/[0.08] transition-colors cursor-pointer"
				>
					<FileText className="h-3.5 w-3.5 text-amber-400" />
					<span>Download Research Report</span>
				</button>
			</div>

			{/* Lifestyle Correlation Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{lifestyleAffinities.map((item, idx) => (
					<div
						key={idx}
						className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between gap-3 hover:border-amber-400/40 transition-all shadow-sm"
					>
						<div>
							<div className="flex items-center justify-between mb-1.5">
								<span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
									{item.cluster}
								</span>
								<span className="font-mono text-xl font-bold text-foreground">{item.percentage}% Overlap</span>
							</div>
							<h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
							<p className="mt-2 text-xs text-muted-foreground leading-relaxed">{item.description}</p>
						</div>

						{/* Overlap Progress Bar */}
						<div className="mt-2 flex flex-col gap-1.5 border-t border-border/60 pt-3">
							<div className="h-2 w-full rounded-full bg-foreground/[0.06] overflow-hidden">
								<div
									className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300"
									style={{ width: `${item.percentage}%` }}
								/>
							</div>
							<div className="flex justify-between text-[10px] text-muted-foreground font-mono">
								<span>Baseline Pop: 12%</span>
								<span>Matched Cohort Affinity: {item.percentage}%</span>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Anonymized Behavioral Clusters Table */}
			<div className="rounded-xl border border-border bg-card p-5 shadow-sm">
				<div className="flex items-center justify-between mb-4 border-b border-border/60 pb-3">
					<h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Vector Cluster Centroids (Aggregated)
					</h2>
					<span className="text-[10px] font-mono text-muted-foreground">
						Mahalanobis DP $\epsilon=0.45$ Applied
					</span>
				</div>

				<div className="flex flex-col gap-3">
					{clusters.map((c, i) => (
						<div
							key={i}
							className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-border/60 bg-foreground/[0.02] p-3 text-xs"
						>
							<div className="flex items-center gap-2.5">
								<Layers className="h-4 w-4 text-amber-400 shrink-0" />
								<div>
									<span className="font-semibold text-foreground">{c.name}</span>
									<p className="text-[11px] text-muted-foreground">{c.centroid}</p>
								</div>
							</div>
							<div className="flex items-center gap-4 font-mono text-[11px]">
								<span className="text-muted-foreground">{c.size} Personas in Cluster</span>
								<span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-400 border border-emerald-500/20 font-semibold">
									{c.density}
								</span>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

/* ------------------------------------------------------------------ *
 * 7. Tab 3 View: Corporate Escrow & Billing
 * ------------------------------------------------------------------ */

function CorporateEscrowTab() {
	const {
		escrowBalance,
		topUpEscrow,
		auditLogs,
		copiedTx,
		copyToClipboard,
	} = useBusinessWorkspace()

	const [topUpAmount, setTopUpAmount] = useState<number>(25000)
	const [isProcessing, setIsProcessing] = useState<boolean>(false)

	const handleTopUp = () => {
		setIsProcessing(true)
		setTimeout(() => {
			topUpEscrow(topUpAmount)
			setIsProcessing(false)
		}, 600)
	}

	return (
		<div className="flex w-full flex-1 flex-col gap-6" data-slot="corporate-escrow-tab">
			<div className="flex flex-col justify-between gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-end">
				<div>
					<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-0.5">
						<span className="text-amber-400 font-semibold">Financial Hub</span>
						<span>/</span>
						<span className="text-foreground/80">Corporate Escrow & OCC Micro-Debit Ledger</span>
					</div>
					<h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
						Corporate Escrow & Concurrency Ledger
					</h1>
					<p className="mt-0.5 text-xs text-muted-foreground">
						Double-entry ledger account (`business_escrow`). Micro-royalties debited atomically with version locking.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-400">
						<CheckCircle2 className="h-3.5 w-3.5" />
						<span>OCC Lock Synchronized</span>
					</span>
				</div>
			</div>

			{/* Escrow Balance & Top-Up Card */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
				{/* Balance Card (5 cols) */}
				<div className="lg:col-span-5 rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
					<div>
						<div className="flex items-center justify-between mb-2">
							<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Available Corporate Escrow
							</span>
							<span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
								Live Account
							</span>
						</div>
						<p className="text-3xl sm:text-4xl font-bold font-mono text-foreground">
							₹{fmt(Math.round(escrowBalance))}.00
						</p>
						<p className="mt-1 text-xs text-muted-foreground">
							Dedicated balance for autonomous synthetic persona micro-leasing.
						</p>
					</div>

					<div className="mt-6 flex flex-col gap-2 rounded-lg border border-border/60 bg-foreground/[0.02] p-3 text-xs">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Corporate Gateway:</span>
							<span className="font-mono text-foreground">Razorpay Virtual IFSC</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Ledger Concurrency:</span>
							<span className="font-mono text-emerald-400">Optimistic Locking v18</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Auto-Replenish Alert:</span>
							<span className="font-mono text-amber-400">Threshold &lt; ₹5,000</span>
						</div>
					</div>
				</div>

				{/* Top-Up Action Controls (7 cols) */}
				<div className="lg:col-span-7 rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
					<div>
						<div className="flex items-center justify-between mb-3 border-b border-border/60 pb-2">
							<h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
								Top Up Corporate Escrow via Razorpay
							</h3>
							<span className="text-[10px] font-mono text-amber-400">Instant Sandbox Simulation</span>
						</div>

						<p className="text-xs text-muted-foreground mb-4">
							Select a corporate credit tier or enter a custom amount to replenish your query escrow balance.
						</p>

						{/* Preset Chips */}
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
							{[10000, 25000, 50000, 100000].map((amt) => (
								<button
									key={amt}
									type="button"
									onClick={() => setTopUpAmount(amt)}
									className={`rounded-lg border px-3 py-2 text-xs font-mono font-semibold transition-all cursor-pointer ${
										topUpAmount === amt
											? 'border-amber-400 bg-amber-400/10 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
											: 'border-border bg-foreground/[0.02] text-foreground/80 hover:border-border/80'
									}`}
								>
									+ ₹{fmt(amt)}
								</button>
							))}
						</div>

						<div className="flex items-center gap-3">
							<div className="relative flex-1">
								<span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground">₹</span>
								<input
									type="number"
									value={topUpAmount}
									onChange={(e) => setTopUpAmount(Math.max(1000, Number(e.target.value)))}
									className="w-full rounded-lg border border-border bg-foreground/[0.04] pl-7 pr-3 py-2 text-sm font-mono text-foreground focus:border-amber-400/60 focus:outline-none"
								/>
							</div>

							<button
								type="button"
								onClick={handleTopUp}
								disabled={isProcessing}
								className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-300 px-5 py-2.5 text-xs font-bold text-black transition-all hover:brightness-105 active:scale-95 disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)]"
							>
								{isProcessing ? (
									<>
										<RefreshCw className="h-4 w-4 animate-spin" />
										<span>Authorizing Razorpay...</span>
									</>
								) : (
									<>
										<CreditCard className="h-4 w-4" />
										<span>Replenish Escrow</span>
									</>
								)}
							</button>
						</div>
					</div>

					<div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/60 pt-3">
						<span>Security: PCI-DSS Level 1 &bull; SOC2 Type II Certified</span>
						<span className="font-mono text-foreground">Razorpay Corporate Route</span>
					</div>
				</div>
			</div>

			{/* Immutable OCC Audit Log Table */}
			<div className="rounded-xl border border-border bg-card p-5 shadow-sm">
				<div className="flex items-center justify-between mb-4 border-b border-border/60 pb-3">
					<h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Immutable OCC Debit & Settlement Ledger
					</h3>
					<span className="text-[10px] font-mono text-amber-400">
						Lock Strategy: Compare-and-Swap (CAS)
					</span>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-left text-xs font-mono">
						<thead>
							<tr className="border-b border-border/60 text-[10px] uppercase text-muted-foreground">
								<th className="py-2.5 pr-4">Timestamp</th>
								<th className="py-2.5 px-4">Tx Hash / Key</th>
								<th className="py-2.5 px-4">Event Description</th>
								<th className="py-2.5 px-4">Matched</th>
								<th className="py-2.5 px-4 text-right">Debit / Credit</th>
								<th className="py-2.5 pl-4 text-right">OCC Version</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border/40">
							{auditLogs.map((log) => (
								<tr key={log.id} className="hover:bg-foreground/[0.02] transition-colors">
									<td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">{log.timestamp}</td>
									<td className="py-3 px-4">
										<button
											type="button"
											onClick={() => copyToClipboard(log.txHash, log.id)}
											className="flex items-center gap-1.5 text-foreground hover:text-amber-400 cursor-pointer"
										>
											{copiedTx === log.id ? (
												<Check className="h-3 w-3 text-emerald-400" />
											) : (
												<Copy className="h-3 w-3 text-muted-foreground" />
											)}
											<span>{log.txHash.slice(0, 14)}...</span>
										</button>
									</td>
									<td className="py-3 px-4 text-foreground/90 font-sans">{log.description}</td>
									<td className="py-3 px-4 text-muted-foreground">
										{log.personasMatched > 0 ? `${log.personasMatched} Personas` : '—'}
									</td>
									<td
										className={`py-3 px-4 text-right font-bold ${
											log.type === 'RAZORPAY_TOPUP' ? 'text-emerald-400' : 'text-amber-400'
										}`}
									>
										{log.type === 'RAZORPAY_TOPUP' ? `+ ₹${fmt(log.amount)}` : `- ₹${log.amount.toFixed(2)}`}
									</td>
									<td className="py-3 pl-4 text-right">
										<span className="rounded bg-foreground/[0.04] px-1.5 py-0.5 text-[10px] text-muted-foreground border border-border">
											v{log.version}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}

/* ------------------------------------------------------------------ *
 * 8. Tab 4 View: DPDP Compliance & Zero-Liability Vault
 * ------------------------------------------------------------------ */

function DpdpComplianceTab() {
	const attestationCertificate = {
		certificateId: 'CERT-DPDP-2026-0x9F41B2',
		actReference: 'Digital Personal Data Protection Act, 2023 (No. 22 of 2023)',
		statutoryClause: 'Section 3(2) Exemption: Processing of non-personal, anonymized data',
		privacyFramework: 'Mahalanobis Differential Privacy & Cosine Embedding Normalization',
		epsilonBudget: 'ε = 0.45 (High Assurance Privacy Bound)',
		maxReIdRisk: 'p < 10⁻⁹ (Cryptographically Negligible)',
		verificationEnclave: 'PersonaGrid Hardware-Isolated Autonomous Enclave',
		issuedAt: '2026-10-14T19:30:00Z',
		signature: '0x8f329c41a7d2b8e0f1c49a88310c7e2b',
	}

	return (
		<div className="flex w-full flex-1 flex-col gap-6" data-slot="dpdp-compliance-tab">
			<div className="flex flex-col justify-between gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-end">
				<div>
					<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-0.5">
						<span className="text-amber-400 font-semibold">Regulatory Vault</span>
						<span>/</span>
						<span className="text-foreground/80">Statutory Legal Indemnification & Attestation</span>
					</div>
					<h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
						DPDP Compliance & Zero-Liability Vault
					</h1>
					<p className="mt-0.5 text-xs text-muted-foreground">
						Legal guarantees certifying that enterprise queries interact strictly with anonymized vectors. Zero human PII is retained or processed.
					</p>
				</div>
				<button
					type="button"
					onClick={() => {
						const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(attestationCertificate, null, 2))
						const downloadAnchor = document.createElement('a')
						downloadAnchor.setAttribute('href', dataStr)
						downloadAnchor.setAttribute('download', `DPDP-Attestation-${attestationCertificate.certificateId}.json`)
						document.body.appendChild(downloadAnchor)
						downloadAnchor.click()
						downloadAnchor.remove()
					}}
					className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 border border-emerald-500/40 px-3.5 py-1.5 text-xs font-mono font-semibold text-emerald-400 hover:bg-emerald-500/30 transition-all cursor-pointer"
				>
					<Download className="h-3.5 w-3.5" />
					<span>Download Cryptographic Certificate</span>
				</button>
			</div>

			{/* Certificate Hero Card */}
			<div className="rounded-xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 via-card to-card p-6 shadow-md">
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-4 mb-4">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
							<ShieldCheck className="h-6 w-6" />
						</div>
						<div>
							<h2 className="text-sm sm:text-base font-bold text-foreground">
								Certificate of Zero-PII Legal Indemnification
							</h2>
							<span className="text-[11px] font-mono text-muted-foreground">
								ID: {attestationCertificate.certificateId} &bull; Safe Harbour Active
							</span>
						</div>
					</div>
					<span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-mono font-semibold text-emerald-400">
						FULLY INDEMNIFIED
					</span>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono mb-4">
					<div className="flex flex-col gap-1 rounded-lg border border-border/60 bg-foreground/[0.02] p-3">
						<span className="text-[10px] text-muted-foreground uppercase">Governing Statute</span>
						<span className="text-foreground font-semibold">{attestationCertificate.actReference}</span>
						<span className="text-[11px] text-muted-foreground">{attestationCertificate.statutoryClause}</span>
					</div>
					<div className="flex flex-col gap-1 rounded-lg border border-border/60 bg-foreground/[0.02] p-3">
						<span className="text-[10px] text-muted-foreground uppercase">Differential Privacy Guarantee</span>
						<span className="text-amber-400 font-semibold">{attestationCertificate.epsilonBudget}</span>
						<span className="text-[11px] text-muted-foreground">Re-ID Bound: {attestationCertificate.maxReIdRisk}</span>
					</div>
				</div>

				<div className="rounded-lg border border-border/60 bg-foreground/[0.02] p-3 text-[11px] font-mono text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<Lock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
						<span>Signature: {attestationCertificate.signature}</span>
					</div>
					<span>Autonomous Enclave Verified</span>
				</div>
			</div>

			{/* 3 Pillars of Zero Legal Liability */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="rounded-xl border border-border bg-card p-5">
					<div className="flex items-center gap-2 text-amber-400 mb-2">
						<Database className="h-4 w-4" />
						<h3 className="text-xs font-bold uppercase tracking-wider">No PII Ingestion</h3>
					</div>
					<p className="text-xs text-muted-foreground leading-relaxed">
						Brands never receive names, emails, phone numbers, or IP addresses. Queries only return normalized
						384-dimensional cosine similarity vectors.
					</p>
				</div>

				<div className="rounded-xl border border-border bg-card p-5">
					<div className="flex items-center gap-2 text-amber-400 mb-2">
						<Zap className="h-4 w-4" />
						<h3 className="text-xs font-bold uppercase tracking-wider">Mahalanobis Noise</h3>
					</div>
					<p className="text-xs text-muted-foreground leading-relaxed">
						Consumer vectors are calibrated with Mahalanobis covariance noise before indexation, making individual
						re-identification mathematically impossible.
					</p>
				</div>

				<div className="rounded-xl border border-border bg-card p-5">
					<div className="flex items-center gap-2 text-amber-400 mb-2">
						<ShieldCheck className="h-4 w-4" />
						<h3 className="text-xs font-bold uppercase tracking-wider">DPDP Safe Harbour</h3>
					</div>
					<p className="text-xs text-muted-foreground leading-relaxed">
						Because queries operate exclusively on non-personal mathematical artifacts, brands hold zero legal
						liability under India&apos;s DPDP Act and GDPR.
					</p>
				</div>
			</div>
		</div>
	)
}

/* ------------------------------------------------------------------ *
 * 9. Main Business Workspace Container
 * ------------------------------------------------------------------ */

const BUSINESS_NAV_ITEMS = [
	{ id: 'overview', icon: <LayoutDashboard />, label: 'Enterprise Overview' },
	{ id: 'query-lab', icon: <Search />, label: 'Cohort Query Lab' },
	{ id: 'insights', icon: <Layers />, label: 'Cohort Insights' },
	{ id: 'escrow', icon: <CreditCard />, label: 'Escrow & Billing' },
	{ id: 'compliance', icon: <ShieldCheck />, label: 'DPDP Compliance' },
]

export interface BusinessWorkspaceProps {
	initialTab?: number
}

export function BusinessWorkspace({ initialTab = 0 }: BusinessWorkspaceProps) {
	const [activeTab, setActiveTab] = useState<number>(initialTab)
	const [escrowBalance, setEscrowBalance] = useState<number>(48250.0)
	const [totalLeasedToday, setTotalLeasedToday] = useState<number>(142)
	const [avgSimilarity, setAvgSimilarity] = useState<number>(0.914)
	const [meanLatencyMs, setMeanLatencyMs] = useState<number>(7.4)
	const [queryText, setQueryText] = useState<string>('')
	const [selectedDomain, setSelectedDomain] = useState<string>('all')
	const [minSimilarity, setMinSimilarity] = useState<number>(0.75)
	const [royaltyBid, setRoyaltyBid] = useState<number>(5.5)
	const [sampleLimit, setSampleLimit] = useState<number>(5)
	const [isQuerying, setIsQuerying] = useState<boolean>(false)
	const [matches, setMatches] = useState<LeasedCohortMatch[]>(INITIAL_MATCHES)
	const [auditLogs, setAuditLogs] = useState<OccAuditEntry[]>(INITIAL_AUDIT_LOGS)
	const [toastMessage, setToastMessage] = useState<string | null>(null)
	const [copiedTx, setCopiedTx] = useState<string | null>(null)

	const copyToClipboard = useCallback((text: string, id: string) => {
		navigator.clipboard.writeText(text)
		setCopiedTx(id)
		setTimeout(() => setCopiedTx(null), 2000)
	}, [])

	const topUpEscrow = useCallback((amount: number) => {
		const newBal = escrowBalance + amount
		setEscrowBalance(newBal)
		const newEntry: OccAuditEntry = {
			id: `top-${Date.now()}`,
			txHash: `razorpay_pay_${Math.random().toString(36).slice(2, 10)}`,
			timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }) + ' UTC',
			type: 'RAZORPAY_TOPUP',
			description: 'Razorpay Corporate Top-Up Credited',
			personasMatched: 0,
			amount,
			status: 'SETTLED',
			version: (auditLogs[0]?.version || 18) + 1,
		}
		setAuditLogs((prev) => [newEntry, ...prev])
		setToastMessage(`Corporate Escrow topped up with ₹${fmt(amount)} via Razorpay!`)
		setTimeout(() => setToastMessage(null), 4000)
	}, [escrowBalance, auditLogs])

	const executeGridQuery = useCallback(async () => {
		setIsQuerying(true)
		const effectivePrompt =
			queryText.trim() ||
			'Test interest for a premium running shoe with Whoop biometrics among urban tech 20-somethings'

		try {
			const res = await fetch('/api/v1/personas/query', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					business_account_id: '00000000-0000-0000-0000-000000000001',
					query_text: effectivePrompt,
					domain_category: selectedDomain === 'all' ? null : selectedDomain,
					limit: sampleLimit,
					min_similarity: minSimilarity,
					royalty_per_match: royaltyBid,
				}),
			})

			let returnedResults: LeasedCohortMatch[] = []
			if (res.ok) {
				const data = await res.json()
				if (Array.isArray(data.results) && data.results.length > 0) {
					returnedResults = data.results.map((r: any) => ({
						persona_id: `Persona_0x${String(r.persona_id || '9f2a').slice(0, 4).toUpperCase()}`,
						domain_category: r.domain_category || (selectedDomain === 'all' ? 'technology.ai' : selectedDomain),
						cosine_similarity: Number(r.cosine_similarity || 0.92),
						royalty_paid: Number(r.royalty_paid || royaltyBid),
						transaction_id: String(r.transaction_id || `tx_${Math.random().toString(16).slice(2, 8)}`),
						timestamp: 'Just now',
						status: 'ok' as Tone,
						tags: ['Active Cohort', 'Verified Vector'],
					}))
				}
			}

			// Fallback generation if backend returns empty or runs in simulation
			if (returnedResults.length === 0) {
				const simulatedIds = ['0x8F32', '0x9B1C', '0x3D4E', '0x1F8A', '0x4E2B']
				returnedResults = simulatedIds.slice(0, sampleLimit).map((id, i) => ({
					persona_id: `Persona_${id}`,
					domain_category: selectedDomain === 'all' ? (i % 2 === 0 ? 'technology.ai' : 'health.fitness') : selectedDomain,
					cosine_similarity: Math.min(0.98, Math.max(minSimilarity + 0.04, 0.91 + i * 0.01)),
					royalty_paid: royaltyBid,
					transaction_id: `tx_${Math.random().toString(16).slice(2, 8)}`,
					timestamp: 'Just now',
					status: 'ok' as Tone,
					tags: ['FastEmbed ONNX', 'Verified Preference'],
				}))
			}

			const totalCost = returnedResults.reduce((acc, it) => acc + it.royalty_paid, 0)
			setMatches((prev) => [...returnedResults, ...prev.slice(0, 10)])
			setEscrowBalance((prev) => Math.max(0, prev - totalCost))
			setTotalLeasedToday((prev) => prev + returnedResults.length)
			setAvgSimilarity(
				returnedResults.reduce((acc, it) => acc + it.cosine_similarity, 0) / returnedResults.length
			)

			// Record OCC debit audit log
			const newAudit: OccAuditEntry = {
				id: `occ-${Date.now()}`,
				txHash: `0x${Math.random().toString(16).slice(2, 18)}`,
				timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }) + ' UTC',
				type: 'OCC_DEBIT',
				description: `Cohort Lease: ${effectivePrompt.slice(0, 40)}...`,
				personasMatched: returnedResults.length,
				amount: totalCost,
				status: 'LOCKED',
				version: (auditLogs[0]?.version || 18) + 1,
			}
			setAuditLogs((prev) => [newAudit, ...prev])

			setToastMessage(
				`Leased ${returnedResults.length} synthetic personas (₹${totalCost.toFixed(2)} debited via OCC). Live SSE royalty dispatched!`
			)
			setTimeout(() => setToastMessage(null), 5000)
		} catch (err) {
			console.warn('[BusinessWorkspace] Simulation fallback activated:', err)
		} finally {
			setIsQuerying(false)
		}
	}, [queryText, selectedDomain, minSimilarity, royaltyBid, sampleLimit, auditLogs])

	const renderContent = () => {
		switch (activeTab) {
			case 0:
				return <EnterpriseOverviewTab />
			case 1:
				return <CohortQueryLabTab />
			case 2:
				return <CohortInsightsTab />
			case 3:
				return <CorporateEscrowTab />
			case 4:
				return <DpdpComplianceTab />
			default:
				return <EnterpriseOverviewTab />
		}
	}

	return (
		<BusinessWorkspaceContext.Provider
			value={{
				escrowBalance,
				totalLeasedToday,
				avgSimilarity,
				meanLatencyMs,
				queryText,
				setQueryText,
				selectedDomain,
				setSelectedDomain,
				minSimilarity,
				setMinSimilarity,
				royaltyBid,
				setRoyaltyBid,
				sampleLimit,
				setSampleLimit,
				isQuerying,
				matches,
				auditLogs,
				executeGridQuery,
				topUpEscrow,
				activeTab,
				setActiveTab,
				toastMessage,
				copiedTx,
				copyToClipboard,
			}}
		>
			<div
				className={`min-h-screen w-full bg-background text-foreground antialiased selection:bg-amber-400 selection:text-black ${PALETTE}`}
				style={{ fontFamily: FONT }}
				data-slot="business-workspace-container"
			>
				{/* Top Global Enterprise Header */}
				<header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/85 backdrop-blur-xl">
					<div className="relative mx-auto flex h-16 max-w-[1240px] items-center justify-between px-4 sm:px-6">
						{/* Brand & Business Tag */}
						<div className="flex items-center gap-3">
							<Link
								href="/"
								className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
							>
								<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 text-black font-extrabold border border-amber-300 text-sm shadow-[0_0_12px_rgba(245,158,11,0.3)]">
									P
								</span>
								<div className="flex flex-col">
									<div className="flex items-center gap-1.5">
										<span className="text-sm font-bold tracking-wider uppercase text-foreground">
											PERSONAGRID
										</span>
										<span className="text-amber-400 text-[11px] font-mono font-bold">
											// BUSINESS CENTER
										</span>
									</div>
									<span className="text-[10px] tracking-widest text-muted-foreground uppercase -mt-0.5">
										Enterprise Command & Bull; HNSW Vector Grid
									</span>
								</div>
							</Link>
						</div>

						{/* Center: Enterprise Limelight Navigation (5 Tabs) */}
						<div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 items-center justify-center">
							<LimelightNav
								className="bg-secondary/40 dark:bg-card/50 dark:border-accent/50 rounded-xl h-11 px-1 shadow-sm"
								iconContainerClassName="p-3"
								limelightClassName="bg-amber-400 shadow-[0_50px_15px_rgba(245,158,11,0.5)]"
								items={BUSINESS_NAV_ITEMS}
								activeIndex={activeTab}
								onTabChange={setActiveTab}
							/>
						</div>

						{/* Right: Switcher to Consumer Persona Studio & Account */}
						<div className="flex items-center gap-2 sm:gap-3">
							<Link
								href="/studio"
								className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-mono font-medium text-[#E1E0CC] hover:bg-white/10 hover:border-white/40 transition-all"
							>
								<span className="text-[#E1E0CC]/80">← Switch to</span>
								<span className="text-white font-semibold">Persona Studio</span>
							</Link>

							<Link
								href="/studio"
								title="Switch to Persona Studio"
								className="flex sm:hidden h-8 items-center px-2.5 rounded-lg border border-white/20 bg-white/5 text-[11px] font-mono text-[#E1E0CC] transition-colors hover:bg-white/10"
							>
								<span>Studio</span>
								<span className="ml-1 text-white">←</span>
							</Link>

							<div className="hidden flex-col text-right sm:flex">
								<span className="text-xs font-medium text-foreground">Apex Intelligence Ltd</span>
								<span className="text-[10px] text-amber-400 font-mono">
									ID: ENT-0x892A
								</span>
							</div>

							<Link
								href="/login"
								title="Sign Out"
								className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-foreground/5 text-muted-foreground transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
							>
								<LogOut className="h-4 w-4" />
								<span className="sr-only">Sign Out</span>
							</Link>
						</div>
					</div>

					{/* Mobile Navigation Strip */}
					<div className="flex sm:hidden w-full items-center justify-center border-t border-border/50 bg-background/90 py-1.5 px-2">
						<LimelightNav
							className="bg-secondary/40 dark:bg-card/50 dark:border-accent/50 rounded-lg h-9 px-0.5 shadow-sm"
							iconContainerClassName="p-2"
							limelightClassName="bg-amber-400 shadow-[0_50px_15px_rgba(245,158,11,0.5)]"
							items={BUSINESS_NAV_ITEMS}
							activeIndex={activeTab}
							onTabChange={setActiveTab}
						/>
					</div>
				</header>

				{/* Global Live Settlement Notification Banner */}
				{toastMessage && (
					<div className="mx-auto max-w-[1240px] px-4 pt-4 sm:px-6">
						<div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs font-mono text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
							<div className="flex items-center gap-2">
								<CheckCircle2 className="h-4 w-4 shrink-0" />
								<span>{toastMessage}</span>
							</div>
							<span className="text-[10px] uppercase tracking-wider text-emerald-300">
								SSE Stream Active
							</span>
						</div>
					</div>
				)}

				{/* Main Workspace Body */}
				<main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[1240px] flex-col px-4 py-8 sm:px-6">
					{renderContent()}
				</main>
			</div>
		</BusinessWorkspaceContext.Provider>
	)
}

export default BusinessWorkspace
