import Redis from 'ioredis';
import { env } from '../config/env.config';
import { logger } from '../utils/logger';

export interface LiveGameState {
  id: string;
  whiteUid: string;
  blackUid: string;
  fen: string;
  pgn: string;
  moves: string[];
  mode: string;
  isBot: boolean;
  botDifficulty?: string;
  timeControlId: string;
  timeControlCategory: string;
  baseTimeMs: number;
  incrementMs: number;
  isUnlimited: boolean;
  stakeAmountCrowns: number;
  whiteTimeRemainingMs: number;
  blackTimeRemainingMs: number;
  lastMoveTimestamp: number;
  status: 'waiting' | 'active' | 'completed';
  whiteConnected: boolean;
  blackConnected: boolean;
  drawOfferBy?: 'white' | 'black' | null;
  disconnectTimeoutAt?: number | null;
  createdAt: number;
}

// In-memory fallback for local dev when Redis server is offline
const memoryStore = new Map<string, { value: string; expiresAt?: number }>();

class RedisService {
  private client: Redis | null = null;
  private isConnected = false;

  constructor() {
    this.init();
  }

  private init() {
    const url = env.REDIS_URL || 'redis://127.0.0.1:6379';
    try {
      this.client = new Redis(url, {
        maxRetriesPerRequest: 2,
        retryStrategy(times) {
          if (times > 3) {
            return null; // Stop retrying, fallback to memory
          }
          return Math.min(times * 100, 1000);
        },
        lazyConnect: true,
      });

      this.client.connect().then(() => {
        this.isConnected = true;
        logger.info('✅ Connected to Redis successfully');
      }).catch((err) => {
        this.isConnected = false;
        logger.warn(`⚠️ Redis not available at ${url}. Falling back to in-memory store for local development. (${err.message})`);
      });

      this.client.on('error', (err) => {
        if (this.isConnected) {
          logger.error('Redis Client Error', err);
        }
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.isConnected = true;
      });
    } catch (e: any) {
      this.isConnected = false;
      logger.warn('Failed to initialize Redis client, using in-memory store fallback.');
    }
  }

  private cleanMemoryStore() {
    const now = Date.now();
    memoryStore.forEach((item, key) => {
      if (item.expiresAt && item.expiresAt <= now) {
        memoryStore.delete(key);
      }
    });
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch (err) {
        // Fallback to memory
      }
    }

    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    memoryStore.set(key, { value, expiresAt });
  }

  async get(key: string): Promise<string | null> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch (err) {
        // Fallback to memory
      }
    }

    this.cleanMemoryStore();
    const item = memoryStore.get(key);
    if (!item) return null;
    if (item.expiresAt && item.expiresAt <= Date.now()) {
      memoryStore.delete(key);
      return null;
    }
    return item.value;
  }

  async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
        return;
      } catch (err) {
        // Fallback
      }
    }
    memoryStore.delete(key);
  }

  // --- Live Game Helpers ---
  private gameKey(gameId: string): string {
    return `game:live:${gameId}`;
  }

  async saveGameState(gameId: string, state: LiveGameState, ttlSeconds: number = 86400): Promise<void> {
    const serialized = JSON.stringify(state);
    await this.set(this.gameKey(gameId), serialized, ttlSeconds);
  }

  async getGameState(gameId: string): Promise<LiveGameState | null> {
    const data = await this.get(this.gameKey(gameId));
    if (!data) return null;
    try {
      return JSON.parse(data) as LiveGameState;
    } catch {
      return null;
    }
  }

  async deleteGameState(gameId: string): Promise<void> {
    await this.del(this.gameKey(gameId));
  }
}

export const redisService = new RedisService();
