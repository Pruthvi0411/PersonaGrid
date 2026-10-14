export interface RecentQuery {
  id: string; // e.g., 'Query_7a2f'
  brand_category: string;
  fee_earned: number;
  status: 'ok' | 'warn' | 'err';
}

export interface TagStats {
  name: string; // e.g., 'Running Shoes', 'AI Software', 'Home Gym'
  matches: number;
}

export interface CategoryStats {
  name: string;
  share: number; // 0.0 to 1.0
  color: string;
}

export interface DashboardState {
  user: { name: string; clone_id: string };
  matches: { total_today: number; vs_yesterday: number; grid_heatmap: number[][] };
  privacy: { is_air_gapped: boolean; days_uptime: number[] };
  earnings: { total_month: number; daily_history: number[] };
  missed: { total: number; reasons: { name: string; count: number }[] };
  activity: { queries: RecentQuery[]; avg_match_fee: number };
  strength: { score: number; vs_yesterday: number; breakdown: { name: string; value: number }[] };
  interests: { top_tags: TagStats[]; total_tags: number };
  brands: { total_brands: number; categories: CategoryStats[] };
}

export type DashboardDelta =
  | { type: 'SNAPSHOT'; payload: Partial<DashboardState> }
  | {
      type: 'NEW_MATCH';
      payload: {
        fee?: number;
        brand_category?: string;
        query_id?: string;
        status?: 'ok' | 'warn' | 'err';
        tag?: string;
      };
    }
  | { type: 'UPDATE_METRICS'; payload: Partial<DashboardState> }
  | { type: 'HEARTBEAT'; payload?: { timestamp?: number } };

export const DEFAULT_DASHBOARD_STATE: DashboardState = {
  user: {
    name: 'Pruthvi N',
    clone_id: '0x8F32..9C',
  },
  matches: {
    total_today: 142,
    vs_yesterday: 12,
    grid_heatmap: [
      [0, 1, 1, 2, 2, 3, 4, 3, 2, 2, 1, 0, 0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 0, 1, 2, 3, 2, 1, 0, 0, 0, 0],
      [1, 1, 2, 3, 3, 4, 4, 3, 3, 2, 1, 1, 0, 2, 3, 4, 4, 4, 3, 2, 1, 1, 0, 1, 2, 3, 3, 1, 0, 0, 0, 0],
      [0, 1, 2, 2, 3, 4, 3, 2, 1, 1, 0, 0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 0, 1, 2, 3, 4, 2, 1, 0, 0, 0, 0],
      [1, 2, 2, 3, 4, 4, 3, 2, 2, 1, 0, 1, 2, 3, 4, 4, 3, 2, 1, 1, 0, 1, 2, 3, 4, 3, 2, 1, 0, 0, 0, 0],
      [1, 2, 3, 3, 4, 4, 4, 3, 2, 2, 1, 1, 2, 3, 4, 4, 4, 3, 2, 1, 1, 1, 2, 3, 4, 4, 3, 2, 1, 0, 0, 0],
    ],
  },
  privacy: {
    is_air_gapped: true,
    days_uptime: [
      1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1,
    ],
  },
  earnings: {
    total_month: 2485.50,
    daily_history: [12, 14, 11, 15, 18, 16, 20, 19, 22, 24, 21, 26, 28, 30],
  },
  missed: {
    total: 24,
    reasons: [
      { name: 'Profile Incomplete', count: 11 },
      { name: 'Fee Set Too High', count: 7 },
      { name: 'Outside Region', count: 6 },
    ],
  },
  activity: {
    queries: [
      { id: 'Query_7a2f', brand_category: 'Nike', fee_earned: 8.50, status: 'ok' },
      { id: 'Query_9b1c', brand_category: 'Tech Startup', fee_earned: 6.20, status: 'ok' },
      { id: 'Query_3d4e', brand_category: 'Sony', fee_earned: 4.80, status: 'warn' },
      { id: 'Query_1f8a', brand_category: 'EdTech App', fee_earned: 3.10, status: 'ok' },
    ],
    avg_match_fee: 5.65,
  },
  strength: {
    score: 91,
    vs_yesterday: 3,
    breakdown: [
      { name: 'Tech Habits', value: 94 },
      { name: 'Shopping', value: 89 },
      { name: 'Fitness', value: 91 },
    ],
  },
  interests: {
    top_tags: [
      { name: 'Running Shoes', matches: 412 },
      { name: 'AI Software', matches: 268 },
      { name: 'Home Gym', matches: 197 },
      { name: 'Online Courses', matches: 143 },
    ],
    total_tags: 1020,
  },
  brands: {
    total_brands: 42,
    categories: [
      { name: 'Technology', share: 0.52, color: 'bg-blue-500 dark:bg-blue-400' },
      { name: 'Health & Fitness', share: 0.27, color: 'bg-blue-500/55 dark:bg-blue-400/55' },
      { name: 'Fashion', share: 0.13, color: 'bg-blue-500/30 dark:bg-blue-400/30' },
      { name: 'Education', share: 0.08, color: 'bg-foreground/20' },
    ],
  },
};
