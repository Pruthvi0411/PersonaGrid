'use client'

import React, { useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
	LogOut,
	SlidersHorizontal,
	LayoutDashboard,
	Sparkles,
	ShieldCheck,
	Wallet,
	Activity,
} from 'lucide-react'
import { LimelightNav } from '@/components/ui/limelight-nav'
import DraggableWidgetGrid from '@/components/ui/draggable-widget-grid'
import PersonaBuilder from '@/components/ui/persona-builder'
import PrivacyVault from '@/components/ui/privacy-vault'
import WalletLedger from '@/components/ui/wallet-ledger'
import MatchTracker from '@/components/ui/match-tracker'
import CommandCenter from '@/components/ui/command-center'
import {
	WIDGETS,
	renderWidget,
	PALETTE,
	FONT,
	FONT_URL,
	type Widget,
} from '@/components/ui/demo'
import {
	useLiveDashboard,
} from '@/components/providers/live-data-provider'

/* ------------------------------------------------------------------ *
 * Overview Grid View Component (Tab 0)
 * ------------------------------------------------------------------ */

export function OverviewGrid() {
	return (
		<div className="flex w-full flex-1 flex-col gap-4" data-slot="overview-grid">
			{/* Workspace Intro & Controls Banner */}
			<div className="flex flex-col justify-between gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-end">
				<div>
					<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-0.5">
						<span>Persona Studio</span>
						<span>/</span>
						<span className="text-foreground/80">Telemetry & Earnings Grid</span>
					</div>
					<h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
						Synthetic Lease Workspace
					</h1>
					<p className="mt-0.5 text-xs text-muted-foreground">
						Real-time anonymized cohort leasing queries and telemetry matching.
					</p>
				</div>

				{/* Interaction hint */}
				<div className="flex items-center gap-2 rounded-lg border border-border/70 bg-foreground/[0.02] px-2.5 py-1.5 text-[11px] text-muted-foreground">
					<SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-foreground/80" />
					<div>
						<span className="[@media(pointer:coarse)]:hidden block">
							Drag and rearrange widgets to customize your Studio. Hold{' '}
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

			{/* Draggable Telemetry Grid */}
			<section aria-labelledby="studio-dashboard-title" className="w-full flex-1">
				<h2 id="studio-dashboard-title" className="sr-only">
					Persona Studio Dashboard
				</h2>
				<DraggableWidgetGrid items={WIDGETS} renderItem={(item) => renderWidget(item as Widget)} />
			</section>
		</div>
	)
}

/* ------------------------------------------------------------------ *
 * Workspace Navigation Items definition (Consumer Studio - 5 Tabs)
 * ------------------------------------------------------------------ */

const WORKSPACE_NAV_ITEMS = [
	{ id: 'overview', icon: <LayoutDashboard />, label: 'Overview' },
	{ id: 'persona', icon: <Sparkles />, label: 'My Persona' },
	{ id: 'privacy', icon: <ShieldCheck />, label: 'Privacy Vault' },
	{ id: 'earnings', icon: <Wallet />, label: 'Earnings' },
	{ id: 'activity', icon: <Activity />, label: 'Match Activity' },
]

export interface WorkspaceContainerProps {
	initialTab?: number
}

/* ------------------------------------------------------------------ *
 * Main Workspace Container (Parent Router)
 * ------------------------------------------------------------------ */

export default function WorkspaceContainer({ initialTab = 0 }: WorkspaceContainerProps) {
	const [activeTab, setActiveTab] = useState<number>(initialTab)
	const { state } = useLiveDashboard()

	// Sync activeTab with URL search params on client navigation / mount
	React.useEffect(() => {
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search)
			const tabParam = params.get('tab')
			if (tabParam && !isNaN(Number(tabParam))) {
				const num = Number(tabParam)
				if (num >= 0 && num <= 4) {
					setActiveTab(num)
				}
			}
		}
	}, [])

	// Tab Render Map (Strictly 5 Consumer Tabs)
	const renderContent = () => {
		switch (activeTab) {
			case 0:
				return <OverviewGrid />
			case 1:
				return <PersonaBuilder />
			case 2:
				return <PrivacyVault />
			case 3:
				return <WalletLedger />
			case 4:
				return <MatchTracker />
			default:
				return <OverviewGrid />
		}
	}

	return (
		<div
			className={`min-h-screen w-full bg-background text-foreground antialiased selection:bg-[#E1E0CC] selection:text-black ${PALETTE}`}
			style={{ fontFamily: FONT }}
			data-slot="workspace-container"
		>
			{/* Top Global Studio Navigation Bar */}
			<header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-xl">
				<div className="relative mx-auto flex h-16 max-w-[1240px] items-center justify-between px-4 sm:px-6">
					{/* Brand & Studio Title */}
					<div className="flex items-center gap-3">
						<Link
							href="/"
							className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
						>
							<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/10 text-foreground font-bold border border-foreground/20 text-sm">
								P
							</span>
							<div className="flex flex-col">
								<span className="text-sm font-bold tracking-wider uppercase text-foreground">
									PersonaGrid
								</span>
								<span className="text-[10px] tracking-widest text-muted-foreground uppercase -mt-0.5">
									Studio Core
								</span>
							</div>
						</Link>
					</div>

					{/* Center: Limelight Navigation (Controls activeTab) */}
					<div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 items-center justify-center">
						<LimelightNav
							className="bg-secondary/40 dark:bg-card/50 dark:border-accent/50 rounded-xl h-11 px-1 shadow-sm"
							iconContainerClassName="p-3"
							items={WORKSPACE_NAV_ITEMS}
							activeIndex={activeTab}
							onTabChange={setActiveTab}
						/>
					</div>

					{/* Right: Portal Switcher & User Menu */}
					<div className="flex items-center gap-2 sm:gap-3">
						{/* Sleek Role/Portal Switcher to Enterprise Business Center */}
						<Link
							href="/business"
							className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-mono font-medium text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/60 transition-all shadow-[0_0_12px_rgba(245,158,11,0.15)]"
						>
							<span>Switch to Business Center</span>
							<span className="text-amber-300">→</span>
						</Link>

						<Link
							href="/business"
							title="Switch to Business Center"
							className="flex sm:hidden h-8 items-center px-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-[11px] font-mono text-amber-400 transition-colors hover:bg-amber-500/20"
						>
							<span>Biz</span>
							<span className="ml-1 text-amber-300">→</span>
						</Link>

						<div className="hidden flex-col text-right sm:flex">
							<span className="text-xs font-medium text-foreground">{state.user.name}</span>
							<span className="text-[10px] text-muted-foreground font-mono">
								ID: {state.user.clone_id}
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
						items={WORKSPACE_NAV_ITEMS}
						activeIndex={activeTab}
						onTabChange={setActiveTab}
					/>
				</div>
			</header>

			{/* Main Workspace Body */}
			<main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[1240px] flex-col px-4 py-8 sm:px-6">
				{renderContent()}
			</main>
		</div>
	)
}

export { PersonaBuilder, PrivacyVault, WalletLedger, MatchTracker, CommandCenter }
