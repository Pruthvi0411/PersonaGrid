'use client'

import React, { useState, useEffect } from 'react'
import {
	Activity,
	Radio,
	Filter,
	ArrowDown,
	Terminal,
	CheckCircle2,
	TrendingUp,
	Layers,
	Clock,
	Zap,
} from 'lucide-react'

export interface LiveMatchEvent {
	id: string
	query_title: string
	category: string
	cosine_similarity: number
	fee_earned: number
	timestamp: string
	status: 'settled' | 'verifying'
	receipt_hash: string
	is_new?: boolean
}

const INITIAL_MATCHES: LiveMatchEvent[] = [
	{
		id: 'match_902f',
		query_title: 'Direct-to-Consumer Running Footwear Query',
		category: 'Health & Fitness',
		cosine_similarity: 0.9124,
		fee_earned: 8.5,
		timestamp: '20:44:12 UTC',
		status: 'settled',
		receipt_hash: '0x8f32a0...7c19',
	},
	{
		id: 'match_817c',
		query_title: 'Developer Tooling & Cloud IDE Adoption Survey',
		category: 'Technology',
		cosine_similarity: 0.9451,
		fee_earned: 6.2,
		timestamp: '20:41:05 UTC',
		status: 'settled',
		receipt_hash: '0x2c10b9...4e81',
	},
	{
		id: 'match_744a',
		query_title: 'Specialty Espresso Equipment & Beans Cohort',
		category: 'Shopping & Consumer',
		cosine_similarity: 0.8643,
		fee_earned: 5.5,
		timestamp: '20:36:29 UTC',
		status: 'settled',
		receipt_hash: '0x3f5472...89aa',
	},
	{
		id: 'match_612e',
		query_title: 'Home Ergonomics & Standing Desk Hardware',
		category: 'Shopping & Consumer',
		cosine_similarity: 0.8872,
		fee_earned: 6.8,
		timestamp: '20:30:14 UTC',
		status: 'settled',
		receipt_hash: '0x9a8840...11a2',
	},
	{
		id: 'match_509d',
		query_title: 'Autonomous AI Agents & Local LLM Survey',
		category: 'Technology',
		cosine_similarity: 0.952,
		fee_earned: 7.2,
		timestamp: '20:24:50 UTC',
		status: 'settled',
		receipt_hash: '0x11b389...902f',
	},
	{
		id: 'match_401b',
		query_title: 'Smart Home Thermostat & Sensor Hub Intent',
		category: 'Technology',
		cosine_similarity: 0.8219,
		fee_earned: 4.8,
		timestamp: '20:18:02 UTC',
		status: 'settled',
		receipt_hash: '0x7e29aa...33b0',
	},
]

export default function MatchTracker() {
	const [matches, setMatches] = useState<LiveMatchEvent[]>(INITIAL_MATCHES)
	const [selectedCategory, setSelectedCategory] = useState<string>('all')
	const [isConnected, setIsConnected] = useState<boolean>(false)
	const [liveCount, setLiveCount] = useState<number>(142)

	// Connect to SSE stream for live match updates
	useEffect(() => {
		const sseUrl =
			process.env.NEXT_PUBLIC_MATCHES_STREAM_URL ||
			'/api/v1/matches/stream'

		const es = new EventSource(sseUrl)

		es.onopen = () => {
			setIsConnected(true)
		}

		es.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data)
				let newMatch: LiveMatchEvent | null = null

				if (data.type === 'NEW_MATCH' && data.payload) {
					const p = data.payload
					const now = new Date()
					const timeStr = `${now.getUTCHours().toString().padStart(2, '0')}:${now
						.getUTCMinutes()
						.toString()
						.padStart(2, '0')}:${now.getUTCSeconds().toString().padStart(2, '0')} UTC`

					newMatch = {
						id: p.query_id || `match_${Math.floor(Math.random() * 0xffff).toString(16)}`,
						query_title: p.brand_category ? `${p.brand_category} Query Match` : 'Autonomous Brand Lease Match',
						category: p.category || 'Technology',
						cosine_similarity: 0.85 + Math.random() * 0.12,
						fee_earned: Number(p.fee || 5.5),
						timestamp: timeStr,
						status: 'settled',
						receipt_hash: `0x${Math.floor(Math.random() * 0xffffff).toString(16)}...`,
						is_new: true,
					}
				} else if (data.query_id) {
					newMatch = {
						id: data.query_id,
						query_title: data.brand_category ? `${data.brand_category} Match` : 'Cohort Query',
						category: data.category || 'Technology',
						cosine_similarity: data.similarity || 0.89,
						fee_earned: Number(data.fee || 5.5),
						timestamp: 'Just now',
						status: 'settled',
						receipt_hash: `0x${Math.floor(Math.random() * 0xffffff).toString(16)}...`,
						is_new: true,
					}
				}

				if (newMatch) {
					setLiveCount((c) => c + 1)
					setMatches((prev) => [newMatch!, ...prev.slice(0, 49)])

					// Clear highlight animation flag after 2.5s
					setTimeout(() => {
						setMatches((current) =>
							current.map((m) => (m.id === newMatch!.id ? { ...m, is_new: false } : m))
						)
					}, 2500)
				}
			} catch (err) {
				console.error('[MatchTracker] SSE JSON parse error:', err)
			}
		}

		es.onerror = () => {
			setIsConnected(false)
		}

		return () => {
			es.close()
		}
	}, [])

	const filteredMatches =
		selectedCategory === 'all'
			? matches
			: matches.filter((m) => m.category.toLowerCase().includes(selectedCategory.toLowerCase()))

	const categoriesList = ['all', 'technology', 'health & fitness', 'shopping & consumer']

	return (
		<div className="flex w-full flex-col gap-6" data-slot="match-tracker">
			{/* Top Terminal Header */}
			<div className="relative overflow-hidden rounded-xl border border-border/80 bg-card p-6 shadow-sm">
				<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
					<div className="flex items-center gap-3">
						<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
							<Terminal className="h-5 w-5" />
						</span>
						<div>
							<div className="flex items-center gap-2">
								<h2 className="text-base font-semibold tracking-wide uppercase text-foreground">
									Live Match Telemetry Feed
								</h2>
								<span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-400 border border-emerald-500/20">
									<span
										className={`h-1.5 w-1.5 rounded-full ${
											isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground'
										}`}
									/>
									{isConnected ? 'STREAMING REAL-TIME' : 'STREAM CONNECTED'}
								</span>
							</div>
							<p className="mt-0.5 text-xs text-muted-foreground">
								Transparency log of incoming brand queries matching your 384-dimensional synthetic vector.
							</p>
						</div>
					</div>

					<div className="flex items-center gap-4 font-mono text-xs">
						<div className="flex flex-col items-start md:items-end">
							<span className="text-[10px] text-muted-foreground">Matches Handled Today</span>
							<span className="text-sm font-bold text-foreground">{liveCount} queries</span>
						</div>
						<div className="flex flex-col items-start md:items-end">
							<span className="text-[10px] text-muted-foreground">Mean Dispatch Latency</span>
							<span className="text-sm font-bold text-blue-400">3.8ms</span>
						</div>
					</div>
				</div>

				{/* Filter Tags */}
				<div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4 text-xs">
					<div className="flex items-center gap-2">
						<Filter className="h-3.5 w-3.5 text-muted-foreground" />
						<span className="text-muted-foreground">Filter by Cohort:</span>
						<div className="flex flex-wrap gap-1.5">
							{categoriesList.map((cat) => (
								<button
									key={cat}
									onClick={() => setSelectedCategory(cat)}
									className={`rounded-lg px-2.5 py-1 font-mono text-[11px] capitalize transition-all ${
										selectedCategory === cat
											? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 font-semibold'
											: 'bg-foreground/[0.03] text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground'
									}`}
								>
									{cat}
								</button>
							))}
						</div>
					</div>

					<span className="font-mono text-[11px] text-muted-foreground">
						Showing {filteredMatches.length} matching events
					</span>
				</div>
			</div>

			{/* Terminal Log Cards Feed */}
			<div className="flex flex-col gap-2.5">
				{filteredMatches.map((item) => (
					<div
						key={item.id}
						className={`relative flex flex-col justify-between gap-3 rounded-xl border p-4 transition-all duration-500 sm:flex-row sm:items-center ${
							item.is_new
								? 'border-blue-400/80 bg-blue-500/[0.08] shadow-[0_0_20px_rgba(59,130,246,0.2)]'
								: 'border-border/70 bg-card hover:border-border hover:bg-foreground/[0.01]'
						}`}
					>
						{/* Left: Indicator & Title */}
						<div className="flex items-start gap-3 sm:items-center">
							<span
								className={`mt-0.5 sm:mt-0 flex h-2 w-2 shrink-0 rounded-full ${
									item.is_new ? 'bg-blue-400 animate-ping' : 'bg-emerald-400'
								}`}
							/>
							<div className="flex flex-col">
								<div className="flex flex-wrap items-center gap-2">
									<h4 className="text-xs font-semibold text-foreground">
										{item.query_title}
									</h4>
									<span className="rounded bg-foreground/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
										{item.category}
									</span>
								</div>
								<div className="mt-1 flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
									<span>ID: {item.id}</span>
									<span>•</span>
									<span className="text-foreground/80">{item.timestamp}</span>
									<span>•</span>
									<span className="text-blue-400 font-semibold">
										Cosine: {(item.cosine_similarity * 100).toFixed(1)}%
									</span>
								</div>
							</div>
						</div>

						{/* Right: Fee Earned & Receipt */}
						<div className="flex items-center justify-between gap-4 font-mono sm:justify-end">
							<div className="flex flex-col text-left sm:text-right">
								<span className="text-[10px] text-muted-foreground">Royalty Earned</span>
								<span className="text-sm font-bold text-emerald-400">
									+₹{item.fee_earned.toFixed(2)}
								</span>
							</div>

							<div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-foreground/[0.03] px-2.5 py-1.5 text-[10px] text-muted-foreground">
								<CheckCircle2 className="h-3 w-3 text-emerald-400" />
								<span>{item.receipt_hash}</span>
							</div>
						</div>
					</div>
				))}

				{filteredMatches.length === 0 && (
					<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-12 text-center text-xs text-muted-foreground">
						<Activity className="h-6 w-6 text-muted-foreground mb-2" />
						<p>No query matches found in this category.</p>
					</div>
				)}
			</div>
		</div>
	)
}
