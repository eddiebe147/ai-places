/**
 * User-related types for X-Place
 */

/** Subscription tier for users */
export type SubscriptionTier = 'basic' | 'premium';

/** User session stored in Redis */
export interface UserSession {
  userId: string;
  xUserId: string;
  xUsername: string;
  xDisplayName: string | null;
  xProfileImageUrl: string | null;
  factionId: string | null;
  isVerified: boolean;
  isSpectatorOnly: boolean;
  cooldownSeconds: number;
  createdAt: string;
  /** V2: Subscription tier (basic = Twitter only, premium = email verified) */
  subscriptionTier: SubscriptionTier;
  /** V2: Whether email is verified */
  emailVerified: boolean;
}

/** User profile from database */
export interface UserProfile {
  id: string;
  xUserId: string;
  xUsername: string;
  xDisplayName: string | null;
  xProfileImageUrl: string | null;
  xAccountCreatedAt: string | null;
  isVerified: boolean;
  factionId: string | null;
  pixelsPlaced: number;
  isSpectatorOnly: boolean;
  isBanned: boolean;
  cooldownSeconds: number;
  createdAt: string;
  updatedAt: string;
}

/** Faction (hashtag team) */
export interface Faction {
  id: string;
  hashtag: string;
  displayName: string;
  description: string | null;
  colorPrimary: number;
  memberCount: number;
  totalPixelsPlaced: number;
  territoryCount: number;
  createdAt: string;
}

/** Leaderboard entry */
export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  rank: number;
}

/** Cooldown status */
export interface CooldownStatus {
  canPlace: boolean;
  remainingMs: number;
  cooldownSeconds: number;
}
