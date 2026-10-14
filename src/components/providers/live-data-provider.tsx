'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_DASHBOARD_STATE,
  type DashboardDelta,
  type DashboardState,
  type RecentQuery,
} from '@/types/dashboard';

export type DashboardAction =
  | DashboardDelta
  | { type: 'RAW_UPDATE'; payload: Partial<DashboardState> };

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SNAPSHOT':
      return {
        ...state,
        ...action.payload,
        user: { ...state.user, ...(action.payload.user || {}) },
        matches: { ...state.matches, ...(action.payload.matches || {}) },
        privacy: { ...state.privacy, ...(action.payload.privacy || {}) },
        earnings: { ...state.earnings, ...(action.payload.earnings || {}) },
        missed: { ...state.missed, ...(action.payload.missed || {}) },
        activity: { ...state.activity, ...(action.payload.activity || {}) },
        strength: { ...state.strength, ...(action.payload.strength || {}) },
        interests: { ...state.interests, ...(action.payload.interests || {}) },
        brands: { ...state.brands, ...(action.payload.brands || {}) },
      };

    case 'NEW_MATCH': {
      const fee = Number(action.payload.fee ?? 5.5);
      const brand = action.payload.brand_category ?? 'Brand Lease';
      const queryId =
        action.payload.query_id ??
        `Query_${Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0')}`;
      const status = action.payload.status ?? 'ok';

      const newQuery: RecentQuery = {
        id: queryId,
        brand_category: brand,
        fee_earned: fee,
        status,
      };

      const updatedQueries = [newQuery, ...state.activity.queries.slice(0, 7)];
      const avgFee =
        updatedQueries.reduce((sum, q) => sum + q.fee_earned, 0) /
        (updatedQueries.length || 1);

      const updatedDailyHistory = [...state.earnings.daily_history];
      if (updatedDailyHistory.length > 0) {
        updatedDailyHistory[updatedDailyHistory.length - 1] += Math.round(fee);
      }

      let updatedTags = state.interests.top_tags;
      if (action.payload.tag) {
        updatedTags = updatedTags.map((t) =>
          t.name.toLowerCase() === action.payload.tag?.toLowerCase()
            ? { ...t, matches: t.matches + 1 }
            : t
        );
      }

      return {
        ...state,
        matches: {
          ...state.matches,
          total_today: state.matches.total_today + 1,
        },
        earnings: {
          ...state.earnings,
          total_month: Math.round((state.earnings.total_month + fee) * 100) / 100,
          daily_history: updatedDailyHistory,
        },
        activity: {
          queries: updatedQueries,
          avg_match_fee: Math.round(avgFee * 10) / 10,
        },
        interests: {
          ...state.interests,
          top_tags: updatedTags,
          total_tags: state.interests.total_tags + 1,
        },
      };
    }

    case 'UPDATE_METRICS':
      return {
        ...state,
        ...action.payload,
      };

    case 'RAW_UPDATE':
      return {
        ...state,
        ...action.payload,
      };

    case 'HEARTBEAT':
      return state;

    default:
      return state;
  }
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export interface LiveDataContextValue {
  state: DashboardState;
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  readyState: number;
  dispatch: React.Dispatch<DashboardAction>;
}

export const LiveDataContext = createContext<LiveDataContextValue>({
  state: DEFAULT_DASHBOARD_STATE,
  connectionStatus: 'connecting',
  isConnected: false,
  readyState: 0,
  dispatch: () => {},
});

export function LiveDataProvider({
  initialState = DEFAULT_DASHBOARD_STATE,
  children,
}: {
  initialState?: DashboardState;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [readyState, setReadyState] = useState<number>(0);

  useEffect(() => {
    const streamUrl =
      process.env.NEXT_PUBLIC_STUDIO_STREAM_URL ||
      '/api/v1/studio/stream';

    const es = new EventSource(streamUrl);

    es.onopen = () => {
      setConnectionStatus('connected');
      setReadyState(es.readyState);
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type) {
          dispatch(data);
        } else if (data.matches || data.earnings || data.activity) {
          dispatch({ type: 'SNAPSHOT', payload: data });
        } else if (data.earningsThisMonth !== undefined) {
          dispatch({
            type: 'UPDATE_METRICS',
            payload: {
              earnings: {
                total_month: data.earningsThisMonth,
                daily_history: state.earnings.daily_history,
              },
              matches: {
                ...state.matches,
                total_today: data.matchesToday ?? state.matches.total_today,
              },
              strength: {
                ...state.strength,
                score: data.profileStrength ?? state.strength.score,
              },
            },
          });
        }
      } catch (err) {
        console.error('[LiveDataProvider] Parse error on SSE event:', err);
      }
    };

    es.onerror = () => {
      setConnectionStatus('disconnected');
      setReadyState(es.readyState);
    };

    return () => {
      es.close();
    };
  }, []);

  return (
    <LiveDataContext.Provider
      value={{
        state,
        connectionStatus,
        isConnected: connectionStatus === 'connected',
        readyState,
        dispatch,
      }}
    >
      {children}
    </LiveDataContext.Provider>
  );
}

export function useLiveDashboard() {
  return useContext(LiveDataContext);
}
