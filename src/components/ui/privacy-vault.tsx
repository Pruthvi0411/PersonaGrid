'use client'

import React, { useState, useEffect, useTransition } from 'react'
import {
	Shield,
	Lock,
	CheckCircle,
	AlertTriangle,
	EyeOff,
	Cpu,
	Sliders,
	Activity,
	Terminal,
	FileKey2,
	RefreshCw,
} from 'lucide-react'
import { useLiveDashboard } from '@/components/providers/live-data-provider'

export interface RedactedAttribute {
	field: string
	redactedValue: string
	encryptionType: string
	status: 'locked' | 'anonymized'
}

export interface PipelineStage {
	step: number
	name: string
	description: string
	algorithm: string
	status: 'active' | 'synced'
}

const REDACTED_IDENTITY: RedactedAttribute[] = [
	{
		field: 'Legal Identity',
		redactedValue: 'P****** N****',
		encryptionType: 'ECDSA Blinded Key',
		status: 'locked',
	},
	{
		field: 'Primary Email',
		redactedValue: 'p******@*******.com',
		encryptionType: 'Zero-Knowledge Commitment',
		status: 'locked',
	},
	{
		field: 'Phone / Telemetry',
		redactedValue: '+91 •••• •••• 92',
		encryptionType: 'Shamir Secret Sharing (3/5)',
		status: 'locked',
	},
	{
		field: 'Physical Geolocation',
		redactedValue: 'Bengaluru Urban // Zone 4',
		encryptionType: 'Differential Geo-Blur (15km radius)',
		status: 'anonymized',
	},
	{
		field: 'Hardware Fingerprint',
		redactedValue: 'SHA256: 0x8a9f...32b1',
		encryptionType: 'Homomorphic Noise Mask',
		status: 'locked',
	},
	{
		field: 'Raw Network IP',
		redactedValue: '103.***.***.14',
		encryptionType: 'Multi-Hop WireGuard Relay',
		status: 'anonymized',
	},
]

const PIPELINE_STAGES: PipelineStage[] = [
	{
		step: 1,
		name: 'Raw Persona Signal',
		description: 'Ephemeral local storage; never persisted unencrypted.',
		algorithm: 'AES-256-GCM (Client-Side Encrypted)',
		status: 'active',
	},
	{
		step: 2,
		name: 'Mahalanobis Noise Injection',
		description: 'Covariance-scaled perturbation preserving cohort shape.',
		algorithm: 'Σ^(-1/2) · N(0, I) Multi-variate Differential Noise',
		status: 'active',
	},
	{
		step: 3,
		name: 'Differential Cohort Grouping',
		description: 'Guarantees k-anonymity across brand matchmaking pool.',
		algorithm: 'k-Anonymity (k ≥ 500 cohort grouping)',
		status: 'synced',
	},
	{
		step: 4,
		name: 'Synthetic Lease Tensor',
		description: 'Published 384-dim vector leasable by external brands.',
		algorithm: 'FastEmbed BAAI/bge-small-en-v1.5 Normalized Vector',
		status: 'synced',
	},
]

export default function PrivacyVault() {
	const { dispatch } = useLiveDashboard()
	const [mahalanobisNoise, setMahalanobisNoise] = useState(true)
	const [epsilon, setEpsilon] = useState(0.45)
	const [isAirGapped, setIsAirGapped] = useState(true)
	const [isPending, startTransition] = useTransition()
	const [statusMessage, setStatusMessage] = useState<string | null>(null)

	// Fetch current security status from backend
	useEffect(() => {
		let isMounted = true
		async function fetchPrivacyStatus() {
			try {
				const res = await fetch('/api/v1/privacy/status', { cache: 'no-store' })
				if (res.ok) {
					const data = await res.json()
					if (isMounted) {
						if (data.mahalanobis_enabled !== undefined) {
							setMahalanobisNoise(data.mahalanobis_enabled)
						}
						if (data.epsilon !== undefined) {
							setEpsilon(data.epsilon)
						}
						if (data.is_air_gapped !== undefined) {
							setIsAirGapped(data.is_air_gapped)
						}
					}
				}
			} catch (err) {
				console.warn('[PrivacyVault] Using default security configuration:', err)
			}
		}
		fetchPrivacyStatus()
		return () => {
			isMounted = false
		}
	}, [])

	const handleNoiseToggle = () => {
		const nextState = !mahalanobisNoise
		setMahalanobisNoise(nextState)
		dispatch({
			type: 'RAW_UPDATE',
			payload: {
				privacy: {
					is_air_gapped: isAirGapped,
					days_uptime: [1, 1, 1, 1, 1, 1, nextState ? 1 : 0],
				},
			},
		})
		setStatusMessage(
			nextState
				? 'Mahalanobis noise applied: Covariance-scaled differential protection ACTIVE'
				: 'Noise injection minimized: Standard differential baseline'
		)

		startTransition(async () => {
			try {
				const res = await fetch('/api/v1/privacy/noise', {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						mahalanobis_enabled: nextState,
						epsilon: epsilon,
					}),
				})
				if (res.ok) {
					const data = await res.json()
					setStatusMessage(
						`Noise settings saved. Vector perturbation ε=${data.epsilon || epsilon} synced.`
					)
					setTimeout(() => setStatusMessage(null), 3500)
				}
			} catch (err) {
				console.error('[PrivacyVault] Noise PUT failed:', err)
			}
		})
	}

	const handleEpsilonChange = (newEpsilon: number) => {
		setEpsilon(newEpsilon)
	}

	const handleEpsilonCommit = () => {
		setStatusMessage(`Updating Differential Privacy budget to ε = ${epsilon}...`)
		startTransition(async () => {
			try {
				await fetch('/api/v1/privacy/noise', {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						mahalanobis_enabled: mahalanobisNoise,
						epsilon: epsilon,
					}),
				})
				setStatusMessage(`Differential Privacy budget updated to ε = ${epsilon}`)
				setTimeout(() => setStatusMessage(null), 3000)
			} catch (err) {
				console.error('[PrivacyVault] Failed to update epsilon:', err)
			}
		})
	}

	return (
		<div className="flex w-full flex-col gap-6" data-slot="privacy-vault">
			{/* Top Security Banner */}
			<div className="relative overflow-hidden rounded-xl border border-border/80 bg-card p-6 shadow-sm">
				<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
					<div className="flex items-center gap-3">
						<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
							<Shield className="h-5 w-5" />
						</span>
						<div>
							<div className="flex items-center gap-2">
								<h2 className="text-base font-semibold tracking-wide uppercase text-foreground">
									Zero-Knowledge Privacy Vault
								</h2>
								<span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-400 border border-emerald-500/20">
									<span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
									AIR-GAP ACTIVE
								</span>
							</div>
							<p className="mt-0.5 text-xs text-muted-foreground">
								Mathematical air-gap eliminates raw PII leaks during brand cohort matching.
							</p>
						</div>
					</div>

					<div className="flex items-center gap-3 font-mono text-xs">
						<div className="flex flex-col items-end">
							<span className="text-[10px] text-muted-foreground">Privacy Guarantee</span>
							<span className="font-semibold text-emerald-400">ε = {epsilon} (DP Certified)</span>
						</div>
					</div>
				</div>

				{statusMessage && (
					<div className="mt-4 flex items-center gap-2 rounded-lg border border-border/70 bg-foreground/[0.02] px-3 py-2 text-xs font-mono text-muted-foreground">
						<Activity className="h-3.5 w-3.5 text-blue-400 animate-spin" />
						<span>{statusMessage}</span>
					</div>
				)}
			</div>

			{/* Middle Grid: Locked Identity Vault + Differential Noise Control */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
				{/* Identity Vault (Locked PII Table) */}
				<div className="flex flex-col rounded-xl border border-border/80 bg-card p-6 shadow-sm lg:col-span-7">
					<div className="flex items-center justify-between border-b border-border/60 pb-4">
						<div className="flex items-center gap-2">
							<Lock className="h-4 w-4 text-amber-400" />
							<h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">
								Locked Identity Vault
							</h3>
						</div>
						<span className="font-mono text-[11px] text-muted-foreground">
							Zero Data Transmission
						</span>
					</div>

					<p className="mt-3 text-xs text-muted-foreground">
						The following identity fields are blinded at the cryptographic boundary. Third-party brand
						queries only receive anonymized cohort overlaps.
					</p>

					<div className="mt-4 divide-y divide-border/40 overflow-hidden rounded-lg border border-border/60">
						{REDACTED_IDENTITY.map((item) => (
							<div
								key={item.field}
								className="flex items-center justify-between bg-foreground/[0.01] px-4 py-3 text-xs transition-colors hover:bg-foreground/[0.03]"
							>
								<div className="flex flex-col">
									<span className="font-medium text-foreground">{item.field}</span>
									<span className="font-mono text-[10px] text-muted-foreground">
										{item.encryptionType}
									</span>
								</div>

								<div className="flex items-center gap-2">
									<span className="rounded bg-foreground/[0.06] px-2 py-1 font-mono text-xs text-amber-300/90 tracking-wider">
										{item.redactedValue}
									</span>
									<Lock className="h-3 w-3 text-muted-foreground" />
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Differential Privacy & Mahalanobis Noise Engine */}
				<div className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-6 shadow-sm lg:col-span-5">
					<div>
						<div className="flex items-center justify-between border-b border-border/60 pb-4">
							<div className="flex items-center gap-2">
								<Sliders className="h-4 w-4 text-blue-400" />
								<h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">
									Noise Scrambler
								</h3>
							</div>
							<span className="rounded bg-blue-500/10 px-2 py-0.5 font-mono text-[10px] font-medium text-blue-400">
								Mahalanobis Noise
							</span>
						</div>

						<div className="mt-4 space-y-4">
							{/* Mahalanobis Toggle Switch */}
							<div className="flex items-center justify-between rounded-lg border border-border/70 bg-foreground/[0.02] p-4">
								<div className="flex flex-col pr-3">
									<span className="text-xs font-semibold text-foreground">
										Differential Privacy Noise
									</span>
									<span className="text-[11px] text-muted-foreground leading-snug">
										Covariance-scaled Mahalanobis noise prevents inverse vector reconstruction.
									</span>
								</div>
								<button
									onClick={handleNoiseToggle}
									disabled={isPending}
									role="switch"
									aria-checked={mahalanobisNoise}
									className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
										mahalanobisNoise ? 'bg-blue-600' : 'bg-foreground/20'
									}`}
								>
									<span
										className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
											mahalanobisNoise ? 'translate-x-5' : 'translate-x-0'
										}`}
									/>
								</button>
							</div>

							{/* Epsilon Slider */}
							<div className="rounded-lg border border-border/70 bg-foreground/[0.02] p-4">
								<div className="flex items-center justify-between text-xs">
									<span className="font-semibold text-foreground">Privacy Budget (ε)</span>
									<span className="font-mono text-blue-400">ε = {epsilon.toFixed(2)}</span>
								</div>
								<p className="mt-1 text-[11px] text-muted-foreground">
									Lower ε introduces higher cryptographic noise; higher ε increases royalty match rate.
								</p>

								<input
									type="range"
									min="0.1"
									max="1.5"
									step="0.05"
									value={epsilon}
									onChange={(e) => handleEpsilonChange(parseFloat(e.target.value))}
									onMouseUp={handleEpsilonCommit}
									onTouchEnd={handleEpsilonCommit}
									className="mt-3 w-full accent-blue-500 cursor-pointer"
								/>

								<div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
									<span>0.1 (Max Stealth)</span>
									<span>0.45 (Optimal)</span>
									<span>1.5 (High Yield)</span>
								</div>
							</div>
						</div>
					</div>

					{/* Cryptographic Attestation Footer */}
					<div className="mt-6 border-t border-border/50 pt-4 text-[11px] font-mono text-muted-foreground space-y-1.5">
						<div className="flex items-center justify-between">
							<span>Noise Function:</span>
							<span className="text-foreground">Mahalanobis Σ^(-1/2)</span>
						</div>
						<div className="flex items-center justify-between">
							<span>Zero-Knowledge Proof:</span>
							<span className="text-emerald-400">Groth16 Verifiable</span>
						</div>
					</div>
				</div>
			</div>

			{/* Bottom Pipeline Visualization: Mathematical Air-Gap */}
			<div className="flex flex-col rounded-xl border border-border/80 bg-card p-6 shadow-sm">
				<div className="flex items-center justify-between border-b border-border/60 pb-4">
					<div className="flex items-center gap-2">
						<Cpu className="h-4 w-4 text-blue-400" />
						<h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">
							Mathematical Air-Gap Pipeline
						</h3>
					</div>
					<span className="font-mono text-[11px] text-muted-foreground">
						4-Stage Cryptographic Isolation
					</span>
				</div>

				<div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{PIPELINE_STAGES.map((stage, idx) => (
						<div
							key={stage.step}
							className="relative flex flex-col justify-between rounded-lg border border-border/60 bg-foreground/[0.02] p-4 transition-colors hover:border-border"
						>
							<div>
								<div className="flex items-center justify-between">
									<span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 font-mono text-xs font-bold text-blue-400 border border-blue-500/20">
										{stage.step}
									</span>
									<span className="flex items-center gap-1 font-mono text-[10px] text-emerald-400">
										<CheckCircle className="h-3 w-3" /> OK
									</span>
								</div>

								<h4 className="mt-3 text-xs font-semibold text-foreground">{stage.name}</h4>
								<p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
									{stage.description}
								</p>
							</div>

							<div className="mt-4 border-t border-border/40 pt-2 font-mono text-[10px] text-blue-400/80">
								{stage.algorithm}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
