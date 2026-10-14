'use client'

import React from 'react'
import { SlidersHorizontal, ShieldCheck } from 'lucide-react'
import PersonaBuilderGrid from '@/components/ui/persona-builder-grid'

export default function PersonaBuilder() {
	return (
		<div className="flex w-full flex-1 flex-col gap-4" data-slot="persona-builder-workspace">
			{/* Workspace Intro & Controls Banner */}
			<div className="flex flex-col justify-between gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-end">
				<div>
					<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-0.5">
						<span>Persona Studio</span>
						<span>/</span>
						<span className="text-foreground/80">Adaptive Ingestion Workspace</span>
					</div>
					<h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
						My Persona Workspace
					</h1>
					<p className="mt-0.5 text-xs text-muted-foreground">
						Adaptive flashcard calibration, daily NLP life sync, and real-time vector telemetry.
					</p>
				</div>

				{/* Interaction hint matching Studio Overview */}
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

			{/* The Interactive Draggable Persona Builder Grid */}
			<PersonaBuilderGrid />

			{/* Zero-PII Compliance & Differential Privacy Footer */}
			<div className="mt-4 flex flex-col items-center justify-between gap-2 rounded-xl border border-border/60 bg-foreground/[0.02] px-4 py-3 text-[11px] text-muted-foreground sm:flex-row">
				<div className="flex items-center gap-2">
					<ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
					<span>
						<strong className="text-foreground">Zero PII Transmission Guarantee:</strong> All adaptive
						flashcard answers and free-text vent inputs undergo Mahalanobis differential privacy perturbation
						before generating 384-dimensional pgvector embeddings.
					</span>
				</div>
				<span className="font-mono text-[10px] shrink-0 text-muted-foreground">
					FastEmbed v1.5 // ONNX Runtime
				</span>
			</div>
		</div>
	)
}

export { PersonaBuilderGrid }
