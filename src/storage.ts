import type { UserProfile, WatchlistEntry, AlertEvent, SystemMetrics } from "./types.js";
import { DEFAULT_USER_PROFILE } from "./types.js";

const userProfiles = new Map<number, UserProfile>();
const watchlists = new Map<number, WatchlistEntry[]>();
const alertEvents: AlertEvent[] = [];
const metrics: SystemMetrics = {
  totalUsers: 0,
  activeWatchlists: 0,
  alertsByTicker: {},
  alertsByType: {},
  recentAlerts: [],
};

export function getUserProfile(userId: number): UserProfile {
  let profile = userProfiles.get(userId);
  if (!profile) {
    profile = {
      userId,
      displayName: "User",
      ...DEFAULT_USER_PROFILE,
    };
    userProfiles.set(userId, profile);
    metrics.totalUsers = userProfiles.size;
  }
  return profile;
}

export function updateUserProfile(userId: number, updates: Partial<UserProfile>): UserProfile {
  const profile = getUserProfile(userId);
  Object.assign(profile, updates);
  userProfiles.set(userId, profile);
  return profile;
}

export function getWatchlist(userId: number): WatchlistEntry[] {
  return watchlists.get(userId) ?? [];
}

export function addToWatchlist(entry: WatchlistEntry): void {
  const list = watchlists.get(entry.userId) ?? [];
  const existing = list.findIndex((e) => e.ticker === entry.ticker);
  if (existing >= 0) {
    list[existing] = entry;
  } else {
    list.push(entry);
  }
  watchlists.set(entry.userId, list);
  metrics.activeWatchlists = [...watchlists.values()].filter((l) => l.length > 0).length;
}

export function removeFromWatchlist(userId: number, ticker: string): boolean {
  const list = watchlists.get(userId);
  if (!list) return false;
  const idx = list.findIndex((e) => e.ticker === ticker);
  if (idx < 0) return false;
  list.splice(idx, 1);
  if (list.length === 0) {
    watchlists.delete(userId);
  }
  metrics.activeWatchlists = [...watchlists.values()].filter((l) => l.length > 0).length;
  return true;
}

export function getWatchlistEntry(userId: number, ticker: string): WatchlistEntry | undefined {
  const list = watchlists.get(userId);
  return list?.find((e) => e.ticker === ticker);
}

export function updateWatchlistEntry(userId: number, ticker: string, updates: Partial<WatchlistEntry>): WatchlistEntry | undefined {
  const list = watchlists.get(userId);
  if (!list) return undefined;
  const entry = list.find((e) => e.ticker === ticker);
  if (!entry) return undefined;
  Object.assign(entry, updates);
  return entry;
}

export function recordAlertEvent(event: AlertEvent): void {
  alertEvents.push(event);
  metrics.alertsByTicker[event.ticker] = (metrics.alertsByTicker[event.ticker] ?? 0) + 1;
  metrics.alertsByType[event.alertType] = (metrics.alertsByType[event.alertType] ?? 0) + 1;
  metrics.recentAlerts = alertEvents.slice(-20);
}

export function getSystemMetrics(): SystemMetrics {
  return { ...metrics };
}

export function getAllUserIds(): number[] {
  return [...userProfiles.keys()];
}

export function getAllWatchlistEntries(): WatchlistEntry[] {
  const all: WatchlistEntry[] = [];
  for (const list of watchlists.values()) {
    all.push(...list);
  }
  return all;
}

export function resetStorage(): void {
  userProfiles.clear();
  watchlists.clear();
  alertEvents.length = 0;
  metrics.totalUsers = 0;
  metrics.activeWatchlists = 0;
  metrics.alertsByTicker = {};
  metrics.alertsByType = {};
  metrics.recentAlerts = [];
}
