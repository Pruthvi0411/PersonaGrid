'use client'

import React, { useState, createContext, useContext, useCallback, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import DraggableWidgetGrid, { type WidgetItem } from '@/components/ui/draggable-widget-grid'
import { useLiveDashboard } from '@/components/providers/live-data-provider'

/* ------------------------------------------------------------------ *
 * 1. Gamification Engine & Context
 * ------------------------------------------------------------------ */
type XPEvent = { id: number; amount: number; x: number; y: number }

export type TagTier = 'epic' | 'rare' | 'common'

export interface TelemetryTag {
	name: string
	tier: TagTier
}

interface GamificationState {
	xp: number
	level: number
	streak: number
	addXP: (amount: number, e: React.MouseEvent) => void
	activeTags: TelemetryTag[]
	vectorStrength: number
	addDiscoveredTags: (tags: string[], newStrength?: number, tier?: TagTier) => void
}

const DEFAULT_ACTIVE_TAGS: TelemetryTag[] = [
	{ name: 'Pro AI User', tier: 'epic' },
	{ name: 'Home Gym', tier: 'rare' },
	{ name: 'SWAYAM / NPTEL', tier: 'common' },
	{ name: 'Workspace Furniture', tier: 'common' },
]

const GamificationContext = createContext<GamificationState | null>(null)

/* ------------------------------------------------------------------ *
 * 2. Shared Grid Config & Shell
 * ------------------------------------------------------------------ */
type Kind = 'strength' | 'flashcards' | 'ventbox' | 'activetags'

interface Widget extends WidgetItem {
	kind: Kind
}

const WIDGETS: Widget[] = [
	{ id: 'strength', kind: 'strength', size: 'sm', label: 'Vector Tier' },
	{ id: 'flashcards', kind: 'flashcards', size: 'wide', label: 'Adaptive Flashcards' },
	{ id: 'ventbox', kind: 'ventbox', size: 'wide', label: 'Daily Life Sync' },
	{ id: 'activetags', kind: 'activetags', size: 'wide', label: 'Active Telemetry' },
]

const PALETTE =
	'dark:[--background:#0a0a0b] dark:[--foreground:#fafafa] dark:[--card:#141417] dark:[--border:#27272a] dark:[--ring:#d4d4d8] text-foreground bg-background'

function Shell({ title, meta, children }: { title: string; meta?: ReactNode; children: ReactNode }) {
	return (
		<section className="flex h-full flex-col gap-4 p-4 sm:p-[22px]">
			<header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-[14px] leading-none">
				<h3 className="truncate text-[12px] tracking-[0.1em] text-muted-foreground uppercase">{title}</h3>
				{meta && <span className="shrink-0 text-muted-foreground">{meta}</span>}
			</header>
			<div className="flex min-h-0 flex-1 flex-col">{children}</div>
		</section>
	)
}

/* ------------------------------------------------------------------ *
 * Widget 1: Persona Tier & XP Tracker
 * ------------------------------------------------------------------ */
function StrengthWidget() {
	const game = useContext(GamificationContext)
	if (!game) return null

	const currentTierXP = game.xp % 100
	const progressPercent = Math.min(Math.max(game.vectorStrength, (currentTierXP / 100) * 100), 100)

	return (
		<Shell title="Persona Tier" meta={<span className="text-emerald-500 text-xs">● Live Sync</span>}>
			<div className="flex flex-col items-center justify-center h-full">
				<div className="relative flex items-center justify-center size-32">
					<svg className="size-full transform -rotate-90" viewBox="0 0 36 36">
						<circle cx="18" cy="18" r="16" fill="none" className="stroke-foreground/10" strokeWidth="3" />
						<circle
							cx="18"
							cy="18"
							r="16"
							fill="none"
							className="stroke-emerald-500 transition-all duration-700 ease-out"
							strokeWidth="3"
							strokeDasharray={`${progressPercent}, 100`}
							strokeLinecap="round"
						/>
					</svg>
					<div className="absolute flex flex-col items-center">
						<span className="text-3xl font-semibold tracking-tighter">Lv.{game.level}</span>
						<span className="text-[10px] text-emerald-400 font-mono font-medium mt-0.5">
							{game.vectorStrength}% Density
						</span>
					</div>
				</div>
				<p className="mt-4 text-xs text-muted-foreground font-mono">
					{currentTierXP} / 100 XP • Level {game.level + 1} Target
				</p>
			</div>
		</Shell>
	)
}

/* ------------------------------------------------------------------ *
 * Widget 2: Dynamic Flashcards (Expanded 12 Unseen Pool Pattern)
 * ------------------------------------------------------------------ */
type Flashcard = { id: string; question: string; options: string[] }

const QUESTION_POOL: Flashcard[] = [
	{
		id: 'tech_1',
		question: 'How often do you upgrade your primary smartphone?',
		options: ['Every year', 'Every 2-3 years', 'Only when it breaks'],
	},
	{
		id: 'fin_1',
		question: 'What is your primary method for tracking personal finances?',
		options: ['Spreadsheets', 'Automated Apps', 'Mental math'],
	},
	{
		id: 'media_1',
		question: 'Which content format dominates your daily media consumption?',
		options: ['Long-form podcasts', 'Short-form video', 'Technical blogs'],
	},
	{
		id: 'smart_1',
		question: 'Which smart home ecosystem are you invested in?',
		options: ['Apple HomeKit', 'Google/Amazon', 'Home Assistant'],
	},
	{
		id: 'cloud_1',
		question: 'What is your primary development environment setup?',
		options: ['Local Docker / WSL', 'Cloud Dev Environments', 'Bare Metal Linux'],
	},
	{
		id: 'wearable_1',
		question: 'What wearable device do you use for daily biometric tracking?',
		options: ['Apple Watch / Garmin', 'Whoop / Oura Ring', 'No wearable device'],
	},
	{
		id: 'coffee_1',
		question: 'What is your daily caffeine ritual of choice?',
		options: ['Specialty Pour-over / Espresso', 'Instant / French Press', 'Green Tea / No Caffeine'],
	},
	{
		id: 'commute_1',
		question: 'How do you primarily commute for professional work?',
		options: ['100% Remote / No Commute', 'Electric Vehicle / Hybrid', 'Public Transit / Metro'],
	},
	{
		id: 'sub_1',
		question: 'Which subscription service provides you the highest daily ROI?',
		options: ['GitHub Copilot / ChatGPT Plus', 'YouTube Premium / Spotify', 'Fitness / Gym Membership'],
	},
	{
		id: 'invest_1',
		question: 'What asset class represents your highest portfolio allocation?',
		options: ['Index Funds / ETFs', 'Direct Equity / Stocks', 'Crypto / Web3 Assets'],
	},
	{
		id: 'ergonomics_1',
		question: 'What ergonomic setup component improved your posture most?',
		options: ['Standing Desk Motorized', 'Custom Mechanical Keyboard', 'Herman Miller / Ergonomic Chair'],
	},
	{
		id: 'reading_1',
		question: 'How do you ingest non-fiction knowledge and research papers?',
		options: ['Kindle / E-Reader', 'Physical Hardcovers', 'Audiobooks at 1.5x+'],
	},
]

function FlashcardWidget() {
	const game = useContext(GamificationContext)
	const [loading, setLoading] = useState(false)
	const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set())
	const [currentCard, setCurrentCard] = useState<Flashcard>(QUESTION_POOL[0])

	const handleAnswer = async (e: React.MouseEvent, selectedOption: string) => {
		setLoading(true)
		// Grant XP instantly on click with floating animation
		game?.addXP(15, e)

		// Trigger live FastAPI telemetry and await response
		try {
			const res = await fetch('/api/v1/persona/flashcard-answer', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ question: currentCard.question, answer: selectedOption }),
			})
			if (res.ok) {
				const data = await res.json()
				if (data.discovered_tag) {
					game?.addDiscoveredTags([data.discovered_tag], data.vector_strength, 'rare')
				} else if (data.vector_strength) {
					game?.addDiscoveredTags([], data.vector_strength)
				}
			}
		} catch (err) {
			console.error('[FlashcardWidget] Telemetry sync error:', err)
		}

		setTimeout(() => {
			const newAnswered = new Set(answeredIds).add(currentCard.id)
			setAnsweredIds(newAnswered)

			const available = QUESTION_POOL.filter((q) => !newAnswered.has(q.id))
			if (available.length > 0) {
				const nextIndex = Math.floor(Math.random() * available.length)
				setCurrentCard(available[nextIndex])
			}
			setLoading(false)
		}, 400)
	}

	if (answeredIds.size >= QUESTION_POOL.length) {
		return (
			<Shell title="Adaptive Calibration" meta={`🔥 ${game?.streak} Day Streak`}>
				<div className="flex flex-col items-center justify-center h-full text-center space-y-3 p-4">
					<div className="size-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 text-xl font-bold">
						✓
					</div>
					<p className="text-sm text-foreground font-medium">
						All 12 behavioral dimensions calibrated.
					</p>
					<p className="text-xs text-muted-foreground">
						Your clone vector density has reached peak fidelity for brand leasing.
					</p>
					<button
						onClick={() => {
							setAnsweredIds(new Set())
							setCurrentCard(QUESTION_POOL[0])
						}}
						className="mt-3 px-3 py-1.5 rounded-md border border-border bg-foreground/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 text-xs font-medium text-foreground transition-all cursor-pointer"
					>
						Reset / Continue Calibration
					</button>
				</div>
			</Shell>
		)
	}

	return (
		<Shell
			title="Adaptive Calibration"
			meta={
				<span className="text-orange-500 text-xs font-semibold">
					🔥 {game?.streak} Day Streak ({answeredIds.size}/{QUESTION_POOL.length})
				</span>
			}
		>
			<div className="flex flex-col h-full justify-between relative">
				<div className={`transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}>
					<p className="text-lg md:text-xl font-medium leading-snug mb-6">{currentCard.question}</p>
					<div className="space-y-2">
						{currentCard.options.map((opt, idx) => (
							<button
								key={idx}
								onClick={(e) => handleAnswer(e, opt)}
								className="w-full text-left px-4 py-3 rounded-lg border border-border bg-foreground/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-colors text-sm text-foreground/90 flex justify-between items-center group cursor-pointer"
							>
								<span>{opt}</span>
								<span className="text-xs text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
									+15 XP
								</span>
							</button>
						))}
					</div>
				</div>
			</div>
		</Shell>
	)
}

/* ------------------------------------------------------------------ *
 * Widget 3: Vent Box (Bounty System & NLP Sync)
 * ------------------------------------------------------------------ */
function VentBoxWidget() {
	const game = useContext(GamificationContext)
	const [text, setText] = useState('')
	const [status, setStatus] = useState<'idle' | 'analyzing' | 'saved'>('idle')

	const handleSubmit = async (e: React.MouseEvent) => {
		if (!text.trim()) return
		setStatus('analyzing')

		// Trigger live FastAPI vent extraction and await response
		try {
			const res = await fetch('/api/v1/persona/vent', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text }),
			})
			if (res.ok) {
				const data = await res.json()
				const discovered: string[] = data.discovered_tags || []
				if (discovered.length > 0) {
					game?.addDiscoveredTags(discovered, data.vector_strength, 'epic')
				} else if (data.vector_strength) {
					game?.addDiscoveredTags([], data.vector_strength)
				}
			}
		} catch (err) {
			console.error('[VentBoxWidget] Vent NLP sync error:', err)
		}

		setTimeout(() => {
			setStatus('saved')
			setText('')
			game?.addXP(50, e) // Big XP bounty for unstructured data
			setTimeout(() => setStatus('idle'), 2500)
		}, 800)
	}

	return (
		<Shell
			title="Daily Life Sync"
			meta={
				<span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-mono tracking-wide">
					BOUNTY: +50 XP
				</span>
			}
		>
			<div className="flex flex-col h-full">
				<p className="text-xs text-muted-foreground mb-3">
					Vent about your day or a product that frustrated you. Our NLP extracts the vectors.
				</p>
				<textarea
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder="E.g., I'm frustrated that my new home gym equipment takes up so much space, but my standing desk setup is incredible..."
					className="flex-1 w-full resize-none bg-foreground/5 border border-border rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-muted-foreground/50"
				/>
				<div className="flex justify-end mt-3">
					<button
						onClick={handleSubmit}
						disabled={status !== 'idle' || !text.trim()}
						className="px-4 py-2 bg-foreground text-background text-xs font-semibold rounded-md hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
					>
						{status === 'idle' ? 'Extract Vectors' : status === 'analyzing' ? 'Running NLP...' : 'Telemetry Saved ✓'}
					</button>
				</div>
			</div>
		</Shell>
	)
}

/* ------------------------------------------------------------------ *
 * Widget 4: Active Telemetry (Dynamic Rarity Tiers)
 * ------------------------------------------------------------------ */
function ActiveTagsWidget() {
	const game = useContext(GamificationContext)
	const tags = game?.activeTags || DEFAULT_ACTIVE_TAGS

	const getTierColor = (tier: TagTier) => {
		switch (tier) {
			case 'epic':
				return 'text-purple-400 bg-purple-500/10 border-purple-500/20'
			case 'rare':
				return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
			case 'common':
			default:
				return 'text-foreground/80 bg-foreground/5 border-border'
		}
	}

	return (
		<Shell title="Active Vector Telemetry" meta={`${tags.length} Clusters`}>
			<div className="flex flex-col h-full">
				<p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
					Attributes mapped to your 384-dim clone
				</p>
				<div className="flex flex-wrap gap-2 overflow-y-auto pr-2 pb-2">
					{tags.map((tag) => (
						<span
							key={tag.name}
							className={`px-3 py-1.5 border text-xs rounded-full shadow-sm flex items-center gap-1.5 ${getTierColor(
								tag.tier
							)}`}
						>
							<span>{tag.name}</span>
							<span className="text-[9px] uppercase tracking-wider opacity-60">
								{tag.tier}
							</span>
						</span>
					))}
					<span className="px-3 py-1.5 bg-foreground/5 border border-border/50 text-muted-foreground text-xs rounded-full border-dashed animate-pulse">
						+ NLP Telemetry Active
					</span>
				</div>
			</div>
		</Shell>
	)
}

/* ------------------------------------------------------------------ *
 * Board Assembly & Engine
 * ------------------------------------------------------------------ */
const VIEWS: Record<Kind, () => ReactNode> = {
	strength: StrengthWidget,
	flashcards: FlashcardWidget,
	ventbox: VentBoxWidget,
	activetags: ActiveTagsWidget,
}

const renderWidget = (item: Widget) => {
	const View = VIEWS[item.kind]
	return <View />
}

export default function PersonaBuilderGrid() {
	const { state: liveState, dispatch } = useLiveDashboard()
	const [xp, setXp] = useState(140)
	const [xpEvents, setXpEvents] = useState<XPEvent[]>([])
	const [activeTags, setActiveTags] = useState<TelemetryTag[]>(DEFAULT_ACTIVE_TAGS)
	const [vectorStrength, setVectorStrength] = useState<number>(liveState?.strength?.score || 88)

	const level = Math.floor(xp / 100) + 1
	const streak = 3

	const addXP = useCallback((amount: number, e: React.MouseEvent) => {
		setXp((prev) => prev + amount)
		const newEvent = { id: Date.now() + Math.random(), amount, x: e.clientX, y: e.clientY }
		setXpEvents((prev) => [...prev, newEvent])

		setTimeout(() => {
			setXpEvents((prev) => prev.filter((ev) => ev.id !== newEvent.id))
		}, 1500)
	}, [])

	const addDiscoveredTags = useCallback(
		(tags: string[], newStrength?: number, tier: TagTier = 'rare') => {
			if (tags && tags.length > 0) {
				setActiveTags((prev) => {
					const existing = new Set(prev.map((t) => t.name.toLowerCase()))
					const newItems: TelemetryTag[] = []
					for (const t of tags) {
						if (t && !existing.has(t.toLowerCase())) {
							newItems.push({ name: t, tier })
							existing.add(t.toLowerCase())
						}
					}
					return [...newItems, ...prev]
				})
			}

			if (newStrength !== undefined) {
				setVectorStrength(newStrength)
				dispatch({
					type: 'RAW_UPDATE',
					payload: {
						strength: {
							...liveState.strength,
							score: newStrength,
						},
					},
				})
			}
		},
		[dispatch, liveState.strength]
	)

	return (
		<GamificationContext.Provider
			value={{
				xp,
				level,
				streak,
				addXP,
				activeTags,
				vectorStrength,
				addDiscoveredTags,
			}}
		>
			<div className={`w-full max-w-[1180px] mx-auto antialiased relative ${PALETTE}`}>
				{/* The Draggable Dashboard */}
				<DraggableWidgetGrid items={WIDGETS} renderItem={(item) => renderWidget(item as Widget)} />

				{/* The Floating XP Animation Layer */}
				<AnimatePresence>
					{xpEvents.map((ev) => (
						<motion.div
							key={ev.id}
							initial={{ opacity: 1, y: 0, scale: 0.8 }}
							animate={{ opacity: 0, y: -60, scale: 1.2 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 1.2, ease: 'easeOut' }}
							className="fixed z-50 pointer-events-none text-emerald-400 font-mono font-bold text-lg drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]"
							style={{ left: ev.x, top: ev.y - 20 }}
						>
							+{ev.amount} XP
						</motion.div>
					))}
				</AnimatePresence>
			</div>
		</GamificationContext.Provider>
	)
}

export { PersonaBuilderGrid, GamificationContext }
