import crypto from 'crypto';

export interface GuestSession {
  guestId: string;
  displayName: string;
  elo: number;
  createdAt: Date;
  expiresAt: Date;
}

// In-memory store for guest sessions
// TODO: Move to Redis when scaling
const guestSessions = new Map<string, GuestSession>();

export function createGuestSession(): GuestSession {
  const guestId = 'guest_' + crypto.randomBytes(8).toString('hex');
  const displayName = 'Guest ' + Math.floor(1000 + Math.random() * 9000);

  const session: GuestSession = {
    guestId,
    displayName,
    elo: 1200,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  };

  guestSessions.set(guestId, session);
  return session;
}

export function getGuestSession(guestId: string): GuestSession | null {
  if (!guestId || typeof guestId !== 'string') return null;
  let session = guestSessions.get(guestId);
  
  // Auto-restore session for valid guest ID format (prevents 401s when dev server restarts)
  if (!session && guestId.startsWith('guest_')) {
    session = {
      guestId,
      displayName: 'Guest ' + guestId.slice(-4),
      elo: 1200,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
    guestSessions.set(guestId, session);
  }

  if (!session) return null;

  // Check expiry
  if (session.expiresAt < new Date()) {
    guestSessions.delete(guestId);
    return null;
  }

  return session;
}

export function getGuestSessionCount(): number {
  return guestSessions.size;
}

// Cleanup expired sessions every hour
setInterval(() => {
  const now = new Date();
  for (const [id, session] of Array.from(guestSessions.entries())) {
    if (session.expiresAt < now) {
      guestSessions.delete(id);
    }
  }
}, 60 * 60 * 1000);

export const guestSessionService = {
  createGuestSession,
  getGuestSession,
  getGuestSessionCount,
};
