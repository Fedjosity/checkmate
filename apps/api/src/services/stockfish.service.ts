import { spawn, ChildProcess } from 'child_process';
import { logger } from '../utils/logger';

interface StockfishInstance {
  process: ChildProcess;
  gameId: string;
  depth: number;
  resolve: ((move: string) => void) | null;
}

const instances = new Map<string, StockfishInstance>();

// Depth by difficulty level
const DIFFICULTY_DEPTH: Record<string, number> = {
  novice: 1,
  casual: 5,
  intermediate: 10,
  advanced: 15,
  grandmaster: 20,
};

// Artificial delay ranges (ms) by difficulty to feel human
const DIFFICULTY_DELAY: Record<string, [number, number]> = {
  novice: [800, 1200],
  casual: [600, 900],
  intermediate: [400, 700],
  advanced: [200, 500],
  grandmaster: [100, 300],
};

function getRandomDelay(difficulty: string): number {
  const [min, max] = DIFFICULTY_DELAY[difficulty] ?? [400, 700];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function createInstance(gameId: string, difficulty: string): Promise<void> {
  const depth = DIFFICULTY_DEPTH[difficulty] ?? 5;

  // Use the stockfish npm package JS/WASM build
  // TODO: Switch to native stockfish binary for production (faster, lower memory)
  let stockfishPath: string;
  try {
    stockfishPath = process.env.STOCKFISH_PATH || require.resolve('stockfish/bin/stockfish-18-single.js');
  } catch {
    try {
      stockfishPath = require.resolve('stockfish/bin/stockfish-18-asm.js');
    } catch {
      stockfishPath = './node_modules/stockfish/bin/stockfish-18-single.js';
    }
  }

  const proc = spawn('node', [stockfishPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const instance: StockfishInstance = {
    process: proc,
    gameId,
    depth,
    resolve: null,
  };

  instances.set(gameId, instance);

  // Wait for UCI initialization
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Stockfish init timeout')), 10000);
    let outputBuffer = '';

    const onData = (data: Buffer) => {
      outputBuffer += data.toString();
      if (outputBuffer.includes('uciok')) {
        clearTimeout(timeout);
        proc.stdout?.removeListener('data', onData);
        resolve();
      }
    };

    proc.stdout?.on('data', onData);
    proc.stdin?.write('uci\n');
  });

  // Send isready and wait for readyok
  await new Promise<void>((resolve) => {
    const onData = (data: Buffer) => {
      if (data.toString().includes('readyok')) {
        proc.stdout?.removeListener('data', onData);
        resolve();
      }
    };
    proc.stdout?.on('data', onData);
    proc.stdin?.write('isready\n');
  });

  logger.info(`Stockfish instance created for ${gameId}`, { difficulty, depth });
}

export async function getBestMove(gameId: string, fen: string): Promise<string> {
  const instance = instances.get(gameId);
  if (!instance) {
    throw new Error(`No bot instance for game ${gameId}`);
  }

  const difficulty = Object.keys(DIFFICULTY_DEPTH).find(
    (k) => DIFFICULTY_DEPTH[k] === instance.depth
  ) ?? 'casual';

  const move = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Stockfish move timeout')), 30000);
    let outputBuffer = '';

    const onData = (data: Buffer) => {
      outputBuffer += data.toString();
      const lines = outputBuffer.split('\n');
      for (const line of lines) {
        if (line.startsWith('bestmove')) {
          clearTimeout(timeout);
          instance.process.stdout?.removeListener('data', onData);
          const parts = line.split(' ');
          resolve(parts[1]); // e.g. 'e2e4'
          return;
        }
      }
    };

    instance.process.stdout?.on('data', onData);
    instance.process.stdin?.write(`position fen ${fen}\n`);
    instance.process.stdin?.write(`go depth ${instance.depth}\n`);
  });

  // Add artificial delay to feel more human
  const delay = getRandomDelay(difficulty);
  await new Promise<void>((r) => setTimeout(r, delay));

  return move;
}

export function destroyInstance(gameId: string): void {
  const instance = instances.get(gameId);
  if (!instance) return;

  try {
    instance.process.stdin?.write('quit\n');
    instance.process.kill();
  } catch {
    // Process may already be dead
  }

  instances.delete(gameId);
  logger.info(`Stockfish instance destroyed for ${gameId}`);
}

export function hasInstance(gameId: string): boolean {
  return instances.has(gameId);
}

export function destroyAll(): void {
  for (const gameId of Array.from(instances.keys())) {
    destroyInstance(gameId);
  }
}

export const stockfishService = {
  createInstance,
  getBestMove,
  destroyInstance,
  destroyAll,
  hasInstance,
};
