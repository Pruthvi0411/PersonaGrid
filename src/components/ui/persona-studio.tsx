'use client'

import { LiveDataProvider } from '@/components/providers/live-data-provider'
import WorkspaceContainer from '@/components/ui/workspace-container'
import {
	DEFAULT_DASHBOARD_STATE,
	type DashboardState,
} from '@/types/dashboard'

export interface PersonaStudioProps {
	initialState?: DashboardState
	userRole?: 'creator' | 'business'
	initialTab?: number
}

export function PersonaStudio({
	initialState = DEFAULT_DASHBOARD_STATE,
	userRole = 'creator',
	initialTab,
}: PersonaStudioProps) {
	const resolvedTab = initialTab ?? 0
	return (
		<LiveDataProvider initialState={initialState}>
			<WorkspaceContainer initialTab={resolvedTab} />
		</LiveDataProvider>
	)
}

export default PersonaStudio
