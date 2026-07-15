import { z } from 'zod';
import { TIME_CONTROL_PRESETS, NO_TIMER_ID } from '@checkmate/shared-types';

const validTimeControlIds = TIME_CONTROL_PRESETS.map((tc) => tc.id);

export const botGameSchema = z.object({
  difficulty: z.enum(['novice', 'casual', 'intermediate', 'advanced', 'grandmaster']),
  timeControlId: z.string().refine(
    (val) => val === NO_TIMER_ID || validTimeControlIds.includes(val),
    { message: 'Invalid time control' }
  ),
  playerColor: z.enum(['white', 'black', 'random']).optional().default('random'),
});

export const onlineGameSchema = z.object({
  timeControlId: z.string().refine(
    (val) => validTimeControlIds.includes(val),
    { message: 'Invalid time control' }
  ),
});

export type BotGameInput = z.infer<typeof botGameSchema>;
export type OnlineGameInput = z.infer<typeof onlineGameSchema>;
