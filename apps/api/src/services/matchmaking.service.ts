import { Rank } from '@checkmate/shared-types';

export interface QueueEntry {
  uid: string;
  socketId: string;
  mode: 'friendly' | 'competitive' | 'paid' | 'play_online';
  timeControl: 'blitz' | 'rapid' | 'bullet' | 'classic';
  stakeAmountCrowns: number;
  elo: number;
  rank: Rank;
  joinedAt: Date;
  status: 'waiting' | 'matched' | 'timeout';
}

const queue = new Map<string, QueueEntry>();

export const addToQueue = (entry: QueueEntry): void => {
  queue.set(entry.uid, entry);
};

export const removeFromQueue = (uid: string): QueueEntry | undefined => {
  const entry = queue.get(uid);
  if (entry) {
    queue.delete(uid);
  }
  return entry;
};

export const getQueueDepth = (
  mode: string,
  timeControl: string,
  stakeAmountCrowns: number
): number => {
  let count = 0;
  for (const entry of Array.from(queue.values())) {
    if (
      entry.mode === mode &&
      entry.timeControl === timeControl &&
      entry.stakeAmountCrowns === stakeAmountCrowns
    ) {
      count++;
    }
  }
  return count;
};

export const scanForMatch = (entry: QueueEntry): QueueEntry | null => {
  let bestMatch: QueueEntry | null = null;

  for (const candidate of Array.from(queue.values())) {
    if (
      candidate.uid !== entry.uid &&
      candidate.status === 'waiting' &&
      candidate.mode === entry.mode &&
      candidate.timeControl === entry.timeControl &&
      candidate.stakeAmountCrowns === entry.stakeAmountCrowns
    ) {
      // ELO within +/- 200 (or +/- 300 for play_online)
      const eloRange = entry.mode === 'play_online' ? 300 : 200;
      if (Math.abs(candidate.elo - entry.elo) <= eloRange) {
        if (!bestMatch || candidate.joinedAt < bestMatch.joinedAt) {
          bestMatch = candidate;
        }
      }
    }
  }

  return bestMatch;
};

export const getAllEntries = (): QueueEntry[] => {
  return Array.from(queue.values());
};

export const getEntry = (uid: string): QueueEntry | undefined => {
  return queue.get(uid);
};

export const matchmakingService = {
  addToQueue,
  removeFromQueue,
  getQueueDepth,
  scanForMatch,
  getAllEntries,
  getEntry,
};
