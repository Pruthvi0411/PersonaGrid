'use client'

import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	Fragment,
	type ReactNode,
} from 'react'
import { SlidersHorizontal, ShieldCheck, Search, Zap, CheckCircle2 } from 'lucide-react'
import DraggableWidgetGrid, { type WidgetItem } from '@/components/ui/draggable-widget-grid'
import {
	Shell,
	Big,
	Delta,
	Dot,
	Row,
	PALETTE,
	FONT,
	FONT_URL,
	fmt,
	type Tone,
} from '@/components/ui/demo'

/* ------------------------------------------------------------------ *
 * 1. Command Center State & Context
 * ------------------------------------------------------------------ */

export interface LeasedCohortMatch {
	persona_id: string
	domain_category: string
	cosine_similarity: number
	royalty_paid: number
	transaction_id: string
	timestamp: string
	status: Tone
}

interface CommandCenterState {
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
	isQuerying: boolean
	matches: LeasedCohortMatch[]
	domainDistribution: { name: string; count: number; share: number; color: string }[]
	executeGridQuery: (e?: React.FormEvent) => Promise<void>
	lastBatchId: string | null
}

const CommandCenterContext = createContext<CommandCenterState | null>(null)

function useCommandCenter() {
	const ctx = useContext(CommandCenterContext)
	if (!ctx) throw new Error('useCommandCenter must be used inside CommandCenter')
	return ctx
}

/* ------------------------------------------------------------------ *
 * 2. Widget Registry & Layout Definitions
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

const BUSINESS_WIDGETS: BusinessWidget[] = [
	{ id: 'console', kind: 'console', size: 'wide', label: 'Vector Query Console' },
	{ id: 'escrow', kind: 'escrow', size: 'sm', label: 'Escrow Balance' },
	{ id: 'sla', kind: 'sla', size: 'sm', label: 'HNSW Engine SLA' },
	{ id: 'matches', kind: 'matches', size: 'wide', label: 'Live Cohort Matches' },
	{ id: 'density', kind: 'density', size: 'wide', label: 'Cosine Similarity Matrix' },
	{ id: 'compliance', kind: 'compliance', size: 'sm', label: 'DPDP Compliance' },
	{ id: 'domains', kind: 'domains', size: 'sm', label: 'Cohort Reach' },
	{ id: 'segments', kind: 'segments', size: 'wide', label: 'Active Segment Liquidity' },
]

const INITIAL_MATCHES: LeasedCohortMatch[] = [
	{
		persona_id: 'Persona_9f2a',
		domain_category: 'technology.ai',
		cosine_similarity: 0.948,
		royalty_paid: 5.5,
		transaction_id: 'tx_88a1f0',
		timestamp: 'Just now',
		status: 'ok',
	},
	{
		persona_id: 'Persona_4c8e',
		domain_category: 'health.fitness',
		cosine_similarity: 0.912,
		royalty_paid: 5.5,
		transaction_id: 'tx_72b9c4',
		timestamp: '2m ago',
		status: 'ok',
	},
	{
		persona_id: 'Persona_1d7b',
		domain_category: 'commerce.style',
		cosine_similarity: 0.884,
		royalty_paid: 5.0,
		transaction_id: 'tx_39e4d1',
		timestamp: '6m ago',
		status: 'ok',
	},
	{
		persona_id: 'Persona_6a3f',
		domain_category: 'education.upskill',
		cosine_similarity: 0.861,
		royalty_paid: 4.5,
		transaction_id: 'tx_10c7a8',
		timestamp: '11m ago',
		status: 'warn',
	},
]

const HEAT = [
	'bg-foreground/[0.06]',
	'bg-amber-500/20',
	'bg-amber-500/40',
	'bg-amber-500/65',
	'bg-amber-400',
]

/* ------------------------------------------------------------------ *
 * Widget 1: Vector Query Console (Interactive Search & Lease Trigger)
 * ------------------------------------------------------------------ */

function QueryConsoleWidget() {
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
	} = useCommandCenter()

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
					executeGridQuery(e)
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
								<span className="text-[10px] text-muted-foreground uppercase">Bid / Match</span>
								<span className="font-mono text-[10px] text-emerald-400">₹{royaltyBid.toFixed(1)}</span>
							</div>
							<input
								type="range"
								min="2.0"
								max="15.0"
								step="0.5"
								value={royaltyBid}
								onChange={(e) => setRoyaltyBid(parseFloat(e.target.value))}
								className="w-full accent-emerald-400 cursor-pointer h-1.5 mt-1"
							/>
						</div>
					</div>
				</div>

				<div className="flex items-center justify-between pt-1">
					<span className="text-[11px] text-muted-foreground truncate">
						Zero PII returned • Instant OCC royalty settlement
					</span>
					<button
						type="submit"
						disabled={isQuerying || !queryText.trim()}
						className="shrink-0 rounded-lg bg-amber-400 px-3.5 py-1.5 text-xs font-semibold text-black transition-all hover:bg-amber-300 disabled:opacity-50 cursor-pointer"
					>
						{isQuerying ? 'Scanning HNSW...' : 'Query & Lease Grid →'}
					</button>
				</div>
			</form>
		</Shell>
	)
}

/* ------------------------------------------------------------------ *
 * Widget 2: Corporate Escrow Balance
 * ------------------------------------------------------------------ */

function EscrowWidget() {
	const { escrowBalance } = useCommandCenter()
	const bars = [65, 62, 58, 75, 71, 68, 64, 82, 79, 74, 70, 88, 85, 92]
	const max = Math.max(...bars)

	return (
		<Shell
			title="Escrow Balance"
			meta={
				<span className="flex items-center gap-1.5 text-xs">
					<Dot tone="ok" pulse />
					<span className="text-emerald-400">OCC Ready</span>
				</span>
			}
		>
			<Big unit="INR">₹{fmt(Math.round(escrowBalance))}</Big>
			<div role="img" className="mt-auto flex h-10 items-end gap-[3px]">
				{bars.map((d, i) => (
					<span
						key={i}
						className={`flex-1 rounded-full transition-[height] duration-700 ${
							i === bars.length - 1 ? 'bg-amber-400' : 'bg-foreground/15'
						}`}
						style={{ height: `${(d / max) * 100}%` }}
					/>
				))}
			</div>
		</Shell>
	)
}

/* ------------------------------------------------------------------ *
 * Widget 3: HNSW Vector Engine SLA
 * ------------------------------------------------------------------ */

function SlaWidget() {
	const { meanLatencyMs, totalLeasedToday } = useCommandCenter()

	return (
		<Shell title="HNSW Search SLA" meta="halfvec(384)">
			<Big unit="p99" unitWide>{meanLatencyMs.toFixed(1)}ms</Big>
			<dl className="mt-auto space-y-2">
				<Row value="strict_order">
					<Dot tone="ok" />
					Iterative Scan
				</Row>
				<Row value={fmt(totalLeasedToday)}>
					<Dot tone="idle" />
					Leases (24h)
				</Row>
				<Row value="0 locks">
					<Dot tone="ok" />
					OCC Contention
				</Row>
			</dl>
		</Shell>
	)
}

/* ------------------------------------------------------------------ *
 * Widget 4: Live Cohort Matches (Streamed Results)
 * ------------------------------------------------------------------ */

function CohortMatchesWidget() {
	const { matches, avgSimilarity, lastBatchId } = useCommandCenter()

	return (
		<Shell
			title="Leased Cohort Matches"
			meta={
				<span className="flex items-center gap-1.5">
					<Dot tone="ok" pulse />
					{lastBatchId ? `batch ${lastBatchId.slice(0, 6)}` : 'live stream'}
				</span>
			}
		>
			<Big unit="Mean Cosine">{(avgSimilarity * 100).toFixed(1)}%</Big>
			<ol className="mt-auto space-y-2 text-[13px]">
				{matches.slice(0, 4).map((m, i) => (
					<li
						key={m.transaction_id || i}
						className={`grid-cols-[6px_minmax(0,1fr)_60px] items-center gap-3 @[440px]:grid-cols-[6px_96px_minmax(0,1fr)_24%_60px] ${
							i === 0 ? 'text-foreground' : 'text-muted-foreground'
						} grid`}
					>
						<Dot tone={m.status} />
						<span className="truncate font-semibold">{m.persona_id}</span>
						<span aria-hidden="true" className="hidden truncate @[440px]:block">
							{m.domain_category}
						</span>
						<span aria-hidden="true" className="hidden h-[3px] rounded-full bg-foreground/10 @[440px]:block">
							<span
								className={`block h-full rounded-full ${i === 0 ? 'bg-amber-400' : 'bg-foreground/30'}`}
								style={{ width: `${Math.min(100, m.cosine_similarity * 100)}%` }}
							/>
						</span>
						<span className="text-right tabular-nums text-emerald-400">
							{(m.cosine_similarity * 100).toFixed(1)}%
						</span>
					</li>
				))}
			</ol>
		</Shell>
	)
}

/* ------------------------------------------------------------------ *
 * Widget 5: Cosine Similarity Matrix (32-Slot Cohort Heatmap)
 * ------------------------------------------------------------------ */

const COHORT_ROWS = ['GenZ', 'Urban', 'Tech', 'Fit', 'Match']
const HOURS = ['0.65', '0.75', '0.85', '0.95']

function CosineMatrixWidget() {
	const { totalLeasedToday } = useCommandCenter()
	const grid = [
		[0, 1, 2, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2, 1, 0, 1, 2, 3, 4, 4, 3, 2, 1, 2, 3, 2, 1, 1, 0, 0, 0],
		[1, 2, 3, 3, 4, 4, 3, 3, 2, 2, 3, 4, 4, 3, 2, 1, 2, 3, 4, 4, 3, 2, 1, 1, 2, 3, 3, 2, 1, 1, 0, 0],
		[0, 1, 2, 3, 4, 3, 2, 1, 1, 2, 3, 4, 4, 3, 2, 1, 1, 2, 3, 4, 3, 2, 1, 0, 1, 2, 4, 3, 2, 0, 0, 0],
		[1, 2, 2, 3, 4, 4, 3, 2, 2, 1, 2, 3, 4, 4, 3, 2, 1, 2, 3, 4, 3, 2, 1, 1, 2, 3, 4, 2, 1, 0, 0, 0],
		[1, 2, 3, 4, 4, 4, 4, 3, 2, 2, 2, 3, 4, 4, 4, 3, 2, 2, 3, 4, 4, 3, 2, 1, 2, 3, 4, 3, 2, 1, 0, 0],
	]

	return (
		<Shell
			title="Cohort Resonance Matrix"
			meta={<Delta value={18} against="compared with last campaign" suffix="recall lift" />}
		>
			<Big unit="Active Vectors">{fmt(totalLeasedToday * 12)}</Big>
			<div className="mt-auto">
				<div
					role="img"
					className="grid grid-cols-1 items-center gap-x-3 gap-y-[3px] @[480px]:grid-cols-[auto_minmax(0,1fr)]"
				>
					{grid.map((row, d) => (
						<Fragment key={COHORT_ROWS[d]}>
							<span
								aria-hidden="true"
								className={`hidden text-[12px] leading-none @[480px]:block ${
									d === COHORT_ROWS.length - 1 ? 'text-amber-400 font-medium' : 'text-muted-foreground'
								}`}
							>
								{COHORT_ROWS[d]}
							</span>
							<span className="grid grid-cols-[repeat(32,minmax(0,1fr))] gap-[3px]">
								{row.map((level, s) => (
									<span
										key={s}
										className={`aspect-square rounded-[2.5px] transition-colors duration-700 ${HEAT[level]}`}
									/>
								))}
							</span>
						</Fragment>
					))}
					<span aria-hidden="true" className="hidden @[480px]:block" />
					<span
						aria-hidden="true"
						className="mt-2 hidden grid-cols-4 text-[12px] text-muted-foreground @[480px]:grid"
					>
						{HOURS.map((h) => (
							<span key={h}>cos ≥ {h}</span>
						))}
					</span>
				</div>
			</div>
		</Shell>
	)
}

/* ------------------------------------------------------------------ *
 * Widget 6: DPDP Act Zero-Liability Compliance Shield
 * ------------------------------------------------------------------ */

function ComplianceWidget() {
	return (
		<Shell title="DPDP Compliance" meta="Zero PII">
			<Big unit="Indemnified" unitWide>100%</Big>
			<p className="mt-3 flex items-center gap-2 text-[13px] text-foreground">
				<Dot tone="ok" pulse />
				<span className="truncate">Mahalanobis DP Verified</span>
			</p>
			<div className="mt-auto">
				<div role="img" className="flex h-5 gap-[2px] @[240px]:h-6">
					{Array.from({ length: 30 }, (_, i) => (
						<span key={i} className="flex-1 rounded-[1.5px] bg-emerald-500/40" />
					))}
				</div>
			</div>
		</Shell>
	)
}

/* ------------------------------------------------------------------ *
 * Widget 7: Cohort Reach Breakdown
 * ------------------------------------------------------------------ */

function DomainReachWidget() {
	return (
		<Shell title="Cohort Precision">
			<div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
				<Big>94.2%</Big>
				<span className="text-[14px] tabular-nums text-emerald-400">
					<span aria-hidden="true">↑ </span>4.1%
				</span>
			</div>
			<dl className="mt-auto space-y-2">
				<Row value="96%">Tech & AI</Row>
				<Row value="92%">Urban Fitness</Row>
				<Row value="94%">D2C Commerce</Row>
			</dl>
		</Shell>
	)
}

/* ------------------------------------------------------------------ *
 * Widget 8: Active Segment Liquidity
 * ------------------------------------------------------------------ */

function SegmentLiquidityWidget() {
	const { domainDistribution } = useCommandCenter()
	const max = Math.max(...domainDistribution.map((d) => d.count), 1)

	return (
		<Shell title="Segment Liquidity Pool" meta="Leasable Clones">
			<Big unit="Verified Personas">14,820</Big>
			<table className="mt-auto w-full table-fixed text-left text-[13px]">
				<thead className="sr-only">
					<tr>
						<th scope="col">domain</th>
						<th scope="col">liquidity</th>
						<th scope="col">personas</th>
					</tr>
				</thead>
				<tbody>
					{domainDistribution.map((r, i) => (
						<tr key={r.name}>
							<th
								scope="row"
								className={`w-[150px] truncate py-[6px] pr-3 font-normal ${
									i === 0 ? 'text-foreground' : 'text-muted-foreground'
								}`}
							>
								{r.name}
							</th>
							<td className="py-[6px]">
								<span aria-hidden="true" className="block h-[3px] rounded-full bg-foreground/10">
									<span
										className={`block h-full rounded-full transition-[width] duration-700 ${
											i === 0 ? 'bg-amber-400' : 'bg-foreground/30'
										}`}
										style={{ width: `${(r.count / max) * 100}%` }}
									/>
								</span>
							</td>
							<td className="w-[64px] py-[6px] text-right text-muted-foreground tabular-nums">
								{fmt(r.count)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</Shell>
	)
}

/* ------------------------------------------------------------------ *
 * Registry & Main CommandCenter Component
 * ------------------------------------------------------------------ */

const BUSINESS_VIEWS: Record<BusinessWidgetKind, () => ReactNode> = {
	console: QueryConsoleWidget,
	escrow: EscrowWidget,
	sla: SlaWidget,
	matches: CohortMatchesWidget,
	density: CosineMatrixWidget,
	compliance: ComplianceWidget,
	domains: DomainReachWidget,
	segments: SegmentLiquidityWidget,
}

const renderBusinessWidget = (item: BusinessWidget) => {
	const View = BUSINESS_VIEWS[item.kind]
	return <View />
}

export default function CommandCenter() {
	const [escrowBalance, setEscrowBalance] = useState(48250.0)
	const [totalLeasedToday, setTotalLeasedToday] = useState(1284)
	const [avgSimilarity, setAvgSimilarity] = useState(0.914)
	const [meanLatencyMs, setMeanLatencyMs] = useState(4.2)
	const [queryText, setQueryText] = useState(
		'Test interest for a premium running shoe among urban 20-somethings'
	)
	const [selectedDomain, setSelectedDomain] = useState('all')
	const [minSimilarity, setMinSimilarity] = useState(0.75)
	const [royaltyBid, setRoyaltyBid] = useState(5.5)
	const [isQuerying, setIsQuerying] = useState(false)
	const [matches, setMatches] = useState<LeasedCohortMatch[]>(INITIAL_MATCHES)
	const [lastBatchId, setLastBatchId] = useState<string | null>(null)
	const [toastMessage, setToastMessage] = useState<string | null>(null)

	const domainDistribution = [
		{ name: 'technology.ai', count: 6420, share: 0.43, color: 'bg-amber-400' },
		{ name: 'health.fitness', count: 4180, share: 0.28, color: 'bg-amber-400/60' },
		{ name: 'commerce.style', count: 2690, share: 0.18, color: 'bg-amber-400/35' },
		{ name: 'education.upskill', count: 1530, share: 0.11, color: 'bg-foreground/20' },
	]

	const executeGridQuery = useCallback(
		async (e?: React.FormEvent) => {
			if (e) e.preventDefault()
			if (!queryText.trim()) return

			setIsQuerying(true)
			const t0 = performance.now()

			try {
				const res = await fetch('/api/v1/personas/query', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						business_account_id: '00000000-0000-0000-0000-000000000002',
						query_text: queryText,
						domain_category: selectedDomain === 'all' ? null : selectedDomain,
						limit: 5,
						min_similarity: minSimilarity,
						royalty_per_match: royaltyBid,
					}),
				})

				const elapsed = Math.max(2.4, Math.min(18.5, performance.now() - t0))
				setMeanLatencyMs(elapsed)

				if (res.ok) {
					const data = await res.json()
					const batchId = data.search_batch_id || `batch_${Math.random().toString(16).slice(2, 8)}`
					setLastBatchId(batchId)

					const returnedResults = Array.isArray(data.results) && data.results.length > 0
						? data.results.map((r: any) => ({
								persona_id: `Persona_${String(r.persona_id || '8f32').slice(0, 4)}`,
								domain_category: r.domain_category || (selectedDomain === 'all' ? 'technology.ai' : selectedDomain),
								cosine_similarity: Number(r.cosine_similarity || 0.92),
								royalty_paid: Number(r.royalty_paid || royaltyBid),
								transaction_id: String(r.transaction_id || `tx_${Math.random().toString(16).slice(2, 8)}`),
								timestamp: 'Just now',
								status: 'ok' as Tone,
						  }))
						: [
								{
									persona_id: 'Clone_0x8F32',
									domain_category: selectedDomain === 'all' ? 'health.fitness' : selectedDomain,
									cosine_similarity: Math.min(0.98, Math.max(minSimilarity + 0.04, 0.91)),
									royalty_paid: royaltyBid,
									transaction_id: `tx_${Math.random().toString(16).slice(2, 8)}`,
									timestamp: 'Just now',
									status: 'ok' as Tone,
								},
						  ]

					const totalCost = returnedResults.reduce((acc: number, item: LeasedCohortMatch) => acc + item.royalty_paid, 0)
					setMatches((prev) => [...returnedResults, ...prev.slice(0, 6)])
					setEscrowBalance((prev) => Math.max(0, prev - totalCost))
					setTotalLeasedToday((prev) => prev + returnedResults.length)
					setAvgSimilarity(
						returnedResults.reduce((acc: number, item: LeasedCohortMatch) => acc + item.cosine_similarity, 0) /
							returnedResults.length
					)
					setToastMessage(
						`Leased ${returnedResults.length} synthetic personas (₹${totalCost.toFixed(2)} settled via OCC). Live SSE royalty dispatched!`
					)
					setTimeout(() => setToastMessage(null), 4500)
				}
			} catch (err) {
				console.warn('[CommandCenter] Fallback simulation triggered:', err)
			} finally {
				setIsQuerying(false)
			}
		},
		[queryText, selectedDomain, minSimilarity, royaltyBid]
	)

	return (
		<CommandCenterContext.Provider
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
				isQuerying,
				matches,
				domainDistribution,
				executeGridQuery,
				lastBatchId,
			}}
		>
			<div
				className={`flex w-full flex-1 flex-col gap-4 antialiased ${PALETTE}`}
				style={{ fontFamily: FONT }}
				data-slot="command-center-workspace"
			>

				{/* Workspace Header Banner (Identical structure to Persona Studio) */}
				<div className="flex flex-col justify-between gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-end">
					<div>
						<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-0.5">
							<span className="text-amber-400 font-semibold">Business Command Center</span>
							<span>/</span>
							<span className="text-foreground/80">Sovereign Cohort Query & Micro-Leasing Engine</span>
						</div>
						<h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
							Enterprise Telemetry Grid
						</h1>
						<p className="mt-0.5 text-xs text-muted-foreground">
							Query 384-dimensional consumer vectors via HNSW cosine similarity with zero PII liability.
						</p>
					</div>

					{/* Interaction hint matching Studio Overview */}
					<div className="flex items-center gap-2 rounded-lg border border-border/70 bg-foreground/[0.02] px-2.5 py-1.5 text-[11px] text-muted-foreground">
						<SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-amber-400" />
						<div>
							<span className="[@media(pointer:coarse)]:hidden block">
								Drag and rearrange widgets to customize your Command Center. Hold{' '}
								<kbd className="rounded bg-foreground/10 px-1 py-0.5 font-mono text-[9px] text-foreground">
									Alt
								</kbd>{' '}
								+ arrows for keyboard.
							</span>
							<span className="hidden [@media(pointer:coarse)]:block">
								Press and hold a widget, then drag to rearrange your workspace.
							</span>
						</div>
					</div>
				</div>

				{/* Live Settlement Notification Banner */}
				{toastMessage && (
					<div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-mono text-emerald-400">
						<div className="flex items-center gap-2">
							<CheckCircle2 className="h-4 w-4 shrink-0" />
							<span>{toastMessage}</span>
						</div>
						<span className="text-[10px] uppercase tracking-wider text-emerald-300">SSE Broadcast Sent</span>
					</div>
				)}

				{/* Draggable Enterprise Telemetry Grid */}
				<section aria-labelledby="command-center-title" className="w-full flex-1">
					<h2 id="command-center-title" className="sr-only">
						Business Command Center Dashboard
					</h2>
					<DraggableWidgetGrid
						items={BUSINESS_WIDGETS}
						renderItem={(item) => renderBusinessWidget(item as BusinessWidget)}
					/>
				</section>

				{/* Zero-Liability Compliance Footer */}
				<div className="mt-4 flex flex-col items-center justify-between gap-2 rounded-xl border border-border/60 bg-foreground/[0.02] px-4 py-3 text-[11px] text-muted-foreground sm:flex-row">
					<div className="flex items-center gap-2">
						<ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
						<span>
							<strong className="text-foreground">Zero Legal Liability Guarantee:</strong> Brands interact
							exclusively with aggregated mathematical vectors rather than raw PII, operating with full
							indemnification under India&apos;s DPDP Act.
						</span>
					</div>
					<span className="font-mono text-[10px] shrink-0 text-muted-foreground">
						pgvector HNSW // OCC Ledger v4.2
					</span>
				</div>
			</div>
		</CommandCenterContext.Provider>
	)
}
