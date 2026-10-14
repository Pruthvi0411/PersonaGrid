import type { Metadata } from 'next'
import BusinessWorkspace from '@/components/ui/business-workspace'

export const metadata: Metadata = {
	title: 'Business Command Center | PersonaGrid Enterprise',
	description:
		'Sovereign enterprise telemetry, cohort query lab, corporate escrow, and DPDP zero-PII compliance.',
}

export default async function BusinessPage({
	searchParams,
}: {
	searchParams?: Promise<{ tab?: string }>
}) {
	const resolvedParams = searchParams ? await searchParams : undefined
	let initialTab = 0
	if (resolvedParams?.tab && !isNaN(Number(resolvedParams.tab))) {
		const parsed = Number(resolvedParams.tab)
		if (parsed >= 0 && parsed <= 4) {
			initialTab = parsed
		}
	} else if (resolvedParams?.tab === 'query' || resolvedParams?.tab === 'lab') {
		initialTab = 1
	} else if (resolvedParams?.tab === 'insights' || resolvedParams?.tab === 'cohorts') {
		initialTab = 2
	} else if (resolvedParams?.tab === 'escrow' || resolvedParams?.tab === 'billing') {
		initialTab = 3
	} else if (resolvedParams?.tab === 'dpdp' || resolvedParams?.tab === 'compliance') {
		initialTab = 4
	}

	return <BusinessWorkspace initialTab={initialTab} />
}
