'use client'

import {
	Fragment,
	useContext,
	type ReactNode,
} from 'react'
import DraggableWidgetGrid, { type WidgetItem } from '@/components/ui/draggable-widget-grid'
import {
	LiveDataContext,
	LiveDataProvider,
	useLiveDashboard,
} from '@/components/providers/live-data-provider'
import {
	DEFAULT_DASHBOARD_STATE,
	type DashboardState,
} from '@/types/dashboard'

/* ------------------------------------------------------------------ *
 * PersonaGrid Dashboard Demo
 * ------------------------------------------------------------------ */

type Kind =
	| 'matches'
	| 'privacy'
	| 'earnings'
	| 'missed'
	| 'activity'
	| 'strength'
	| 'interests'
	| 'brands'

export interface Widget extends WidgetItem {
	kind: Kind
}

export const WIDGETS: Widget[] = [
	{ id: 'matches', kind: 'matches', size: 'wide', label: 'Profile Matches Today' },
	{ id: 'privacy', kind: 'privacy', size: 'sm', label: 'Privacy Shield' },
	{ id: 'earnings', kind: 'earnings', size: 'sm', label: 'Total Earnings' },
	{ id: 'missed', kind: 'missed', size: 'sm', label: 'Missed Matches' },
	{ id: 'activity', kind: 'activity', size: 'wide', label: 'Recent Queries' },
	{ id: 'strength', kind: 'strength', size: 'sm', label: 'Profile Strength' },
	{ id: 'interests', kind: 'interests', size: 'wide', label: 'Top Matched Interests' },
	{ id: 'brands', kind: 'brands', size: 'wide', label: 'Matches by Category' },
]

export const PALETTE = [
	'[--background:#ffffff] [--color-background:#ffffff] [--foreground:#09090b] [--color-foreground:#09090b] [--card:#ffffff] [--color-card:#ffffff] [--card-foreground:#09090b] [--color-card-foreground:#09090b] [--muted-foreground:#71717a] [--color-muted-foreground:#71717a] [--border:#e4e4e7] [--color-border:#e4e4e7] [--ring:#18181b] [--color-ring:#18181b]',
	'dark:[--background:#0a0a0b] dark:[--color-background:#0a0a0b] dark:[--foreground:#fafafa] dark:[--color-foreground:#fafafa] dark:[--card:#141417] dark:[--color-card:#141417] dark:[--card-foreground:#fafafa] dark:[--color-card-foreground:#fafafa] dark:[--muted-foreground:#a1a1aa] dark:[--color-muted-foreground:#a1a1aa] dark:[--border:#27272a] dark:[--color-border:#27272a] dark:[--ring:#d4d4d8] dark:[--color-ring:#d4d4d8]',
].join(' ')

export const FONT_URL = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap'
export const FONT = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"

export const fmt = (v: number) => v.toLocaleString('en-US')

export type Tone = 'ok' | 'warn' | 'err' | 'idle'

export const DOT: Record<Tone, string> = {
	ok: 'bg-emerald-500',
	warn: 'bg-amber-500',
	err: 'bg-rose-500',
	idle: 'bg-muted-foreground/60',
}

export const TEXT: Record<Tone, string> = {
	ok: 'text-emerald-600 dark:text-emerald-400',
	warn: 'text-amber-600 dark:text-amber-300',
	err: 'text-rose-600 dark:text-rose-400',
	idle: 'text-muted-foreground',
}

export const ACCENT = 'bg-blue-500 dark:bg-blue-400'

export const HEAT = [
	'bg-foreground/[0.06]',
	'bg-blue-500/20',
	'bg-blue-500/35',
	'bg-blue-500/55',
	'bg-blue-500/85 dark:bg-blue-400/85',
]

export function Shell({ title, meta, children }: { title: string; meta?: ReactNode; children: ReactNode }) {
	return (
		<section className="@container flex h-full flex-col gap-4 p-4 sm:p-[22px]">
			<header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-[14px] leading-none">
				<h3 className="truncate text-[12px] tracking-[0.1em] text-muted-foreground uppercase">{title}</h3>
				{meta && <span className="shrink-0 text-muted-foreground">{meta}</span>}
			</header>
			<div className="flex min-h-0 flex-1 flex-col">{children}</div>
		</section>
	)
}

export function Big({ children, unit, unitWide = false }: { children: ReactNode; unit?: string; unitWide?: boolean }) {
	return (
		<p className="text-[28px] leading-none font-normal tracking-tight text-foreground tabular-nums @[240px]:text-[30px]">
			{children}
			{unit && (
				<span className={`text-[13px] tracking-normal text-muted-foreground ${unitWide ? 'sr-only @[200px]:not-sr-only' : ''}`}>
					{'\u00a0'}{unit}
				</span>
			)}
		</p>
	)
}

export function Delta({ value, against, suffix, good = 'up' }: { value: number; against: string; suffix?: string; good?: 'up' | 'down' }) {
	const up = value >= 0
	const tone: Tone = up === (good === 'up') ? 'ok' : 'err'
	return (
		<span className={`text-[14px] tabular-nums ${TEXT[tone]}`}>
			<span aria-hidden="true">{up ? '↑' : '↓'} </span>
			{Math.abs(value)}%
			{suffix && <span aria-hidden="true" className="text-muted-foreground"> {suffix}</span>}
			<span className="sr-only"> {against}</span>
		</span>
	)
}

export function Dot({ tone, pulse = false }: { tone: Tone; pulse?: boolean }) {
	return (
		<span aria-hidden="true" className="relative inline-flex size-2 shrink-0">
			{pulse && <span className={`absolute inset-0 animate-ping rounded-full opacity-50 motion-reduce:hidden ${DOT[tone]}`} />}
			<span className={`relative size-2 rounded-full ${DOT[tone]}`} />
		</span>
	)
}

export function Row({ children, value, className = '' }: { children: ReactNode; value: ReactNode; className?: string }) {
	return (
		<div className={`flex items-center gap-2 text-[13px] ${className}`}>
			<dt className="flex min-w-0 items-center gap-2 truncate text-foreground">{children}</dt>
			<dd className="ml-auto text-muted-foreground tabular-nums">{value}</dd>
		</div>
	)
}

const DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Today']
const NOW = 28
const HOURS = ['12AM', '6AM', '12PM', '6PM']

/* ------------------------------------------------------------------ *
 * 1. MatchesWidget
 * ------------------------------------------------------------------ */

export function MatchesWidget() {
	const { state } = useLiveDashboard()
	const { matches } = state
	const todayIndex = DAYS.length - 1
	const grid = matches.grid_heatmap
	const peak = Math.max(...grid.flat(), 1)

	return (
		<Shell
			title="Profile Matches"
			meta={<Delta value={matches.vs_yesterday} against="compared with yesterday" suffix="vs yesterday" />}
		>
			<Big>{fmt(matches.total_today)}</Big>
			<div className="mt-auto">
				<div role="img" className="grid grid-cols-1 items-center gap-x-3 gap-y-[3px] @[480px]:grid-cols-[auto_minmax(0,1fr)]">
					{grid.map((row, d) => (
						<Fragment key={DAYS[d] || d}>
							<span aria-hidden="true" className={`hidden text-[12px] leading-none @[480px]:block ${d === todayIndex ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
								{DAYS[d] || `D${d}`}
							</span>
							<span className="grid grid-cols-[repeat(32,minmax(0,1fr))] gap-[3px]">
								{row.map((v, s) => {
									const level = v === 0 ? 0 : Math.max(1, Math.min(4, Math.ceil((v / peak) * 4)))
									const isNow = d === todayIndex && s === NOW
									return (
										<span
											key={s}
											className={`aspect-square rounded-[2.5px] transition-colors duration-700 motion-reduce:transition-none ${
												isNow ? 'bg-blue-600 dark:bg-blue-300' : HEAT[level]
											}`}
										/>
									)
								})}
							</span>
						</Fragment>
					))}
					<span aria-hidden="true" className="hidden @[480px]:block" />
					<span aria-hidden="true" className="mt-2 hidden grid-cols-4 text-[12px] text-muted-foreground @[480px]:grid">
						{HOURS.map((h) => (<span key={h}>{h}</span>))}
					</span>
				</div>
			</div>
		</Shell>
	)
}

/* ------------------------------------------------------------------ *
 * 2. PrivacyWidget
 * ------------------------------------------------------------------ */

export function PrivacyWidget() {
	const { state } = useLiveDashboard()
	const { privacy } = state

	return (
		<Shell title="Privacy Shield" meta="30d">
			<Big unit="Air-Gap Active" unitWide>{privacy.is_air_gapped ? '100%' : '85%'}</Big>
			<p className={`mt-3 flex items-center gap-2 text-[13px] ${privacy.is_air_gapped ? 'text-foreground' : TEXT.warn}`}>
				<Dot tone={privacy.is_air_gapped ? 'ok' : 'warn'} pulse={privacy.is_air_gapped} />
				<span className="truncate">
					{privacy.is_air_gapped ? 'Identity Fully Protected' : 'Syncing Noise Filter'}
				</span>
			</p>
			<div className="mt-auto">
				<div role="img" className="flex h-5 gap-[2px] @[240px]:h-6">
					{privacy.days_uptime.map((status, i) => (
						<span
							key={i}
							className={`flex-1 rounded-[1.5px] ${status === 2 ? 'bg-amber-400/80' : 'bg-foreground/15'}`}
						/>
					))}
				</div>
			</div>
		</Shell>
	)
}

/* ------------------------------------------------------------------ *
 * 3. EarningsWidget
 * ------------------------------------------------------------------ */

export function EarningsWidget() {
	const { state, isConnected } = useLiveDashboard()
	const { earnings } = state
	const max = Math.max(...earnings.daily_history, 1)

	return (
		<Shell
			title="Total Earnings"
			meta={
				<span className="flex items-center gap-1.5 text-xs">
					<Dot tone={isConnected ? 'ok' : 'idle'} pulse={isConnected} />
					<span className={isConnected ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}>
						{isConnected ? 'Live' : 'Offline'}
					</span>
				</span>
			}
		>
			<Big unit="This Month">₹{earnings.total_month.toFixed(2)}</Big>
			<div role="img" className="mt-auto flex h-10 items-end gap-[3px]">
				{earnings.daily_history.map((d, i) => (
					<span
						key={i}
						className={`flex-1 rounded-full transition-[height] duration-700 motion-reduce:transition-none ${
							i === earnings.daily_history.length - 1 ? ACCENT : 'bg-foreground/15'
						}`}
						style={{ height: `${(d / max) * 100}%` }}
					/>
				))}
			</div>
		</Shell>
	)
}

/* ------------------------------------------------------------------ *
 * 4. MissedWidget
 * ------------------------------------------------------------------ */

export function MissedWidget() {
	const { state } = useLiveDashboard()
	const { missed } = state

	return (
		<Shell title="Missed Matches" meta="24h">
			<Big unit="Lost potential">{missed.total}</Big>
			<dl className="mt-auto space-y-2">
				{missed.reasons.map((c, i) => (
					<Row key={c.name} value={c.count}>
						<Dot tone={i === 0 ? 'err' : 'idle'} />
						{c.name}
					</Row>
				))}
			</dl>
		</Shell>
	)
}

/* ------------------------------------------------------------------ *
 * 5. ActivityWidget
 * ------------------------------------------------------------------ */

export function ActivityWidget() {
	const { state } = useLiveDashboard()
	const { activity } = state
	const maxFee = 10

	return (
		<Shell
			title="Recent Queries"
			meta={
				<span className="flex items-center gap-1.5">
					<Dot tone="ok" pulse /> live grid
				</span>
			}
		>
			<Big unit="Avg Match">₹{activity.avg_match_fee.toFixed(1)}</Big>
			<ol className="mt-auto space-y-2 text-[13px]">
				{activity.queries.slice(0, 4).map((r, i) => {
					const tone: Tone = r.status || (r.fee_earned > 7 ? 'ok' : r.fee_earned > 4 ? 'warn' : 'idle')
					return (
						<li
							key={r.id || i}
							className={`grid-cols-[6px_minmax(0,1fr)_60px] items-center gap-3 @[440px]:grid-cols-[6px_84px_minmax(0,1fr)_26%_60px] ${
								i === 0 ? 'text-foreground' : 'text-muted-foreground'
							} ${i >= 3 ? 'hidden @[520px]:grid' : i === 2 ? 'hidden @[360px]:grid' : 'grid'}`}
						>
							<Dot tone={tone} />
							<span className="truncate">{r.id}</span>
							<span aria-hidden="true" className="hidden truncate @[440px]:block">{r.brand_category}</span>
							<span aria-hidden="true" className="hidden h-[3px] rounded-full bg-foreground/10 @[440px]:block">
								<span
									className={`block h-full rounded-full ${i === 0 ? ACCENT : 'bg-foreground/25'}`}
									style={{ width: `${Math.min(100, (r.fee_earned / maxFee) * 100)}%` }}
								/>
							</span>
							<span className="text-right tabular-nums">₹{r.fee_earned.toFixed(2)}</span>
						</li>
					)
				})}
			</ol>
		</Shell>
	)
}

/* ------------------------------------------------------------------ *
 * 6. StrengthWidget
 * ------------------------------------------------------------------ */

export function StrengthWidget() {
	const { state } = useLiveDashboard()
	const { strength } = state

	return (
		<Shell title="Profile Strength">
			<div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
				<Big>{strength.score}%</Big>
				<span className={`text-[14px] tabular-nums ${TEXT.ok}`}>
					<span aria-hidden="true">↑ </span>{strength.vs_yesterday}%
				</span>
			</div>
			<dl className="mt-auto space-y-2">
				{strength.breakdown.map((e) => (
					<Row key={e.name} value={`${e.value}%`}>{e.name}</Row>
				))}
			</dl>
		</Shell>
	)
}

/* ------------------------------------------------------------------ *
 * 7. InterestsWidget
 * ------------------------------------------------------------------ */

export function InterestsWidget() {
	const { state } = useLiveDashboard()
	const { interests } = state
	const max = Math.max(...interests.top_tags.map((t) => t.matches), 1)

	return (
		<Shell title="Top Matched Tags" meta="24h">
			<Big>{fmt(interests.total_tags)}</Big>
			<table className="mt-auto w-full table-fixed text-left text-[13px]">
				<thead className="sr-only"><tr><th scope="col">tag</th><th scope="col">share</th><th scope="col">matches</th></tr></thead>
				<tbody>
					{interests.top_tags.map((r, i) => (
						<tr key={r.name} className={i >= 3 ? 'hidden @[520px]:table-row' : i === 2 ? 'hidden @[360px]:table-row' : ''}>
							<th scope="row" className={`w-[140px] truncate py-[6px] pr-3 font-normal ${i === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{r.name}</th>
							<td className="py-[6px]">
								<span aria-hidden="true" className="block h-[3px] rounded-full bg-foreground/10">
									<span
										className={`block h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none ${i === 0 ? ACCENT : 'bg-foreground/25'}`}
										style={{ width: `${(r.matches / max) * 100}%` }}
									/>
								</span>
							</td>
							<td className="w-[56px] py-[6px] text-right text-muted-foreground tabular-nums">{r.matches}</td>
						</tr>
					))}
				</tbody>
			</table>
		</Shell>
	)
}

/* ------------------------------------------------------------------ *
 * 8. BrandsWidget
 * ------------------------------------------------------------------ */

export function BrandsWidget() {
	const { state } = useLiveDashboard()
	const { brands } = state

	return (
		<Shell title="Matches by Category" meta="Last 24h">
			<Big unit="Total Brands">{brands.total_brands}</Big>
			<dl className="mt-auto grid grid-cols-2 gap-x-6 gap-y-2">
				{brands.categories.map((m) => (
					<Row key={m.name} value={`${Math.round(m.share * 100)}%`}>
						<span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${m.color || ACCENT}`} />
						<span className="truncate">{m.name}</span>
					</Row>
				))}
			</dl>
			<div role="img" className="mt-4 flex h-[3px] gap-[3px]">
				{brands.categories.map((m) => (
					<span
						key={m.name}
						className={`h-full rounded-full ${m.color || ACCENT}`}
						style={{ width: `${m.share * 100}%` }}
					/>
				))}
			</div>
		</Shell>
	)
}

/* ------------------------------------------------------------------ *
 * Widget Views Registry & Renderer
 * ------------------------------------------------------------------ */

export const VIEWS: Record<Kind, () => ReactNode> = {
	matches: MatchesWidget,
	privacy: PrivacyWidget,
	earnings: EarningsWidget,
	missed: MissedWidget,
	activity: ActivityWidget,
	strength: StrengthWidget,
	interests: InterestsWidget,
	brands: BrandsWidget,
}

export const renderWidget = (item: Widget) => {
	const View = VIEWS[item.kind]
	return <View />
}

/* ------------------------------------------------------------------ *
 * Main Demo Component
 * ------------------------------------------------------------------ */

export interface DemoProps {
	initialState?: DashboardState
}

export function DemoContent() {
	const { state } = useLiveDashboard()

	return (
		<main className={`flex min-h-screen w-full items-center justify-center bg-background px-4 py-12 text-foreground antialiased ${PALETTE}`} style={{ fontFamily: FONT }}>
			<div className="w-full max-w-[1180px]">
				<div className="mb-4 flex items-center justify-between text-[14px] text-muted-foreground">
					<p>
						<span className="[@media(pointer:coarse)]:hidden">Drag and rearrange widgets to customize your Studio.</span>
						<span className="hidden [@media(pointer:coarse)]:inline">Press and hold a widget, then drag to rearrange.</span>
					</p>
					<div className="hidden sm:flex items-center gap-2 text-xs font-mono">
						<span className="text-foreground font-semibold">{state.user.name}</span>
						<span className="text-muted-foreground">{state.user.clone_id}</span>
					</div>
				</div>
				<section aria-labelledby="studio-dashboard-title">
					<h2 id="studio-dashboard-title" className="sr-only">Persona Studio Dashboard</h2>
					<DraggableWidgetGrid items={WIDGETS} renderItem={(item) => renderWidget(item as Widget)} />
				</section>
			</div>
		</main>
	)
}

export default function Demo({ initialState = DEFAULT_DASHBOARD_STATE }: DemoProps) {
	return (
		<LiveDataProvider initialState={initialState}>
			<DemoContent />
		</LiveDataProvider>
	)
}
