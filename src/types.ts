export interface UserProfile {
  userId: number;
  displayName: string;
  timeZone: string;
  quietHoursStart?: number;
  quietHoursEnd?: number;
  morningSummaryTime?: string;
  morningSummaryEnabled?: boolean;
  alertCooldownMinutes: number;
}

export interface WatchlistEntry {
  userId: number;
  ticker: string;
  name: string;
  alertTypes: string[];
  priceThresholdDirection?: "above" | "below";
  priceThresholdValue?: number;
  percentThreshold?: number;
  percentTimeWindow?: number;
  lastAlertTimestamp?: number;
  lastAlertedPrice?: number;
}

export interface AlertEvent {
  userId: number;
  ticker: string;
  alertType: string;
  oldPrice: number;
  newPrice: number;
  percentChange: number;
  timestamp: number;
  delivered: boolean;
}

export interface SystemMetrics {
  totalUsers: number;
  activeWatchlists: number;
  alertsByTicker: Record<string, number>;
  alertsByType: Record<string, number>;
  recentAlerts: AlertEvent[];
}

export interface CoinGeckoCoin {
  id: string;
  symbol: string;
  name: string;
}

export interface CoinGeckoPrice {
  [coinId: string]: {
    usd: number;
    usd_24h_change?: number;
  };
}

export interface CoinGeckoMarketChart {
  prices: [number, number][];
}

export const DEFAULT_USER_PROFILE: Omit<UserProfile, "userId" | "displayName"> = {
  timeZone: "UTC",
  alertCooldownMinutes: 30,
  morningSummaryEnabled: false,
  morningSummaryTime: "08:00",
  quietHoursStart: 22,
  quietHoursEnd: 7,
};
