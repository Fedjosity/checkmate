import { z } from 'zod';

export const botGameSchema = z.object({
  difficulty: z.enum(['novice', 'casual', 'intermediate', 'advanced', 'grandmaster']),
  timeControl: z.enum(['bullet', 'blitz', 'rapid', 'classic']),
  playerColor: z.enum(['white', 'black', 'random']).optional().default('random'),
});

export const onlineGameSchema = z.object({
  timeControl: z.enum(['bullet', 'blitz', 'rapid', 'classic']),
});

export type BotGameInput = z.infer<typeof botGameSchema>;
export type OnlineGameInput = z.infer<typeof onlineGameSchema>;
