import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import PersonaStudio from '@/components/ui/persona-studio'
import { DEFAULT_DASHBOARD_STATE, type DashboardState } from '@/types/dashboard'

export const metadata: Metadata = {
	title: 'Persona Studio | PersonaGrid Workspace',
	description:
		'Synthetic identity leasing workspace. Real-time telemetry, earnings, and cohort match controls.',
}

async function getInitialDashboardData(): Promise<DashboardState> {
	const backendUrl = process.env.INTERNAL_BACKEND_URL || 'http://127.0.0.1:8000'
	try {
		const res = await fetch(`${backendUrl}/api/v1/studio/snapshot`, {
			cache: 'no-store',
			headers: {
				Accept: 'application/json',
			},
		})

		if (res.ok) {
			const data = await res.json()
			return {
				...DEFAULT_DASHBOARD_STATE,
				...data,
				user: { ...DEFAULT_DASHBOARD_STATE.user, ...(data.user || {}) },
				matches: { ...DEFAULT_DASHBOARD_STATE.matches, ...(data.matches || {}) },
				privacy: { ...DEFAULT_DASHBOARD_STATE.privacy, ...(data.privacy || {}) },
				earnings: { ...DEFAULT_DASHBOARD_STATE.earnings, ...(data.earnings || {}) },
				missed: { ...DEFAULT_DASHBOARD_STATE.missed, ...(data.missed || {}) },
				activity: { ...DEFAULT_DASHBOARD_STATE.activity, ...(data.activity || {}) },
				strength: { ...DEFAULT_DASHBOARD_STATE.strength, ...(data.strength || {}) },
				interests: { ...DEFAULT_DASHBOARD_STATE.interests, ...(data.interests || {}) },
				brands: { ...DEFAULT_DASHBOARD_STATE.brands, ...(data.brands || {}) },
			}
		}
	} catch (err) {
		console.warn('[StudioPage] Fallback to default state during initial SSR:', err)
	}

	return DEFAULT_DASHBOARD_STATE
}

export default async function StudioPage({
	searchParams,
}: {
	searchParams?: Promise<{ tab?: string; role?: string }>
}) {
	const resolvedParams = searchParams ? await searchParams : undefined

	// Strictly decouple: redirect enterprise intent to the dedicated /business portal
	if (
		resolvedParams?.tab === 'command' ||
		resolvedParams?.tab === '5' ||
		resolvedParams?.role === 'business'
	) {
		redirect('/business')
	}

	const initialData = await getInitialDashboardData()
	let initialTab = 0
	if (resolvedParams?.tab && !isNaN(Number(resolvedParams.tab))) {
		const parsed = Number(resolvedParams.tab)
		if (parsed >= 0 && parsed <= 4) {
			initialTab = parsed
		}
	}
	return <PersonaStudio initialState={initialData} initialTab={initialTab} />
}
