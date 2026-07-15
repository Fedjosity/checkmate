"use client";

import { useMemo } from "react";
import { useGameStore } from "@/stores/game.store";

type PieceSymbol = 'p' | 'n' | 'b' | 'r' | 'q';

interface CapturedPiecesProps {
  color: 'white' | 'black'; // The player who captured these pieces
}

// Starting counts for each piece type
const START_COUNTS: Record<PieceSymbol, number> = {
  q: 1,
  r: 2,
  b: 2,
  n: 2,
  p: 8,
};

// Piece values for calculating material advantage
const PIECE_VALUES: Record<PieceSymbol, number> = {
  q: 9,
  r: 5,
  b: 3,
  n: 3,
  p: 1,
};

// SVGs for pieces
const PIECE_SVGS: Record<'white' | 'black', Record<PieceSymbol, React.ReactNode>> = {
  white: {
    p: <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    n: <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm"><path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" fill="none" stroke="#000" strokeWidth="1.5" strokeLinejoin="round"/><path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10" fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
    b: <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm"><g fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.54 9,36 9,36 z" /><path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 27.5,27.5 17.5,27.5 15,30 C 15,30 14.5,30.5 15,32 z" /><path d="M 25 8 A 2.5 2.5 0 1 1  20,8 A 2.5 2.5 0 1 1  25 8 z" /><path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" /></g></svg>,
    r: <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm"><g fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z "/><path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z "/><path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" /><path d="M 34,14 L 31,17 L 14,17 L 11,14" /><path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" /><path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5" /><path d="M 11,14 L 34,14" /></g></svg>,
    q: <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm"><g fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M 8 12 A 2 2 0 1 1  4,12 A 2 2 0 1 1  8 12 z" /><path d="M 24.5 7.5 A 2 2 0 1 1  20.5,7.5 A 2 2 0 1 1  24.5 7.5 z" /><path d="M 41 12 A 2 2 0 1 1  37,12 A 2 2 0 1 1  41 12 z" /><path d="M 16 8.5 A 2 2 0 1 1  12,8.5 A 2 2 0 1 1  16 8.5 z" /><path d="M 33 8.5 A 2 2 0 1 1  29,8.5 A 2 2 0 1 1  33 8.5 z" /><path d="M 9 26 C 17.5,24.5 30,24.5 36,26 L 38,14 L 31,25 L 24.5,10 L 20.5,10 L 14,25 L 7,14 L 9,26 z" /><path d="M 9 26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 36,37.5 34.5,36 C 34.5,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z" /><path d="M 11 38.5 A 35 35 1 0 0 34 38.5" /><path d="M 11 29 A 35 35 1 0 1 34 29" /><path d="M 12.5 31.5 L 32.5 31.5" /><path d="M 11.5 34.5 A 35 35 1 0 0 33.5 34.5" /><path d="M 10.5 37.5 A 35 35 1 0 0 34.5 37.5" /></g></svg>,
  },
  black: {
    p: <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#000" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    n: <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm"><path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/><path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10" fill="#000" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
    b: <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm"><g fill="#000" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.54 9,36 9,36 z" /><path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 27.5,27.5 17.5,27.5 15,30 C 15,30 14.5,30.5 15,32 z" /><path d="M 25 8 A 2.5 2.5 0 1 1  20,8 A 2.5 2.5 0 1 1  25 8 z" /><path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" /></g></svg>,
    r: <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm"><g fill="#000" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z "/><path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z "/><path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" /><path d="M 34,14 L 31,17 L 14,17 L 11,14" /><path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" /><path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5" /><path d="M 11,14 L 34,14" /></g></svg>,
    q: <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm"><g fill="#000" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M 8 12 A 2 2 0 1 1  4,12 A 2 2 0 1 1  8 12 z" /><path d="M 24.5 7.5 A 2 2 0 1 1  20.5,7.5 A 2 2 0 1 1  24.5 7.5 z" /><path d="M 41 12 A 2 2 0 1 1  37,12 A 2 2 0 1 1  41 12 z" /><path d="M 16 8.5 A 2 2 0 1 1  12,8.5 A 2 2 0 1 1  16 8.5 z" /><path d="M 33 8.5 A 2 2 0 1 1  29,8.5 A 2 2 0 1 1  33 8.5 z" /><path d="M 9 26 C 17.5,24.5 30,24.5 36,26 L 38,14 L 31,25 L 24.5,10 L 20.5,10 L 14,25 L 7,14 L 9,26 z" /><path d="M 9 26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 36,37.5 34.5,36 C 34.5,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z" /><path d="M 11 38.5 A 35 35 1 0 0 34 38.5" /><path d="M 11 29 A 35 35 1 0 1 34 29" /><path d="M 12.5 31.5 L 32.5 31.5" /><path d="M 11.5 34.5 A 35 35 1 0 0 33.5 34.5" /><path d="M 10.5 37.5 A 35 35 1 0 0 34.5 37.5" /></g></svg>,
  }
};

export function CapturedPieces({ color }: CapturedPiecesProps) {
  const fen = useGameStore((s) => s.fen);

  const { captured, materialAdvantage } = useMemo(() => {
    // If game hasn't started or is in invalid state
    if (!fen || fen === 'start') {
      return { captured: [], materialAdvantage: 0 };
    }

    const boardPart = fen.split(' ')[0];
    
    // Count pieces currently on board
    const currentCounts = {
      white: { p: 0, n: 0, b: 0, r: 0, q: 0 } as Record<PieceSymbol, number>,
      black: { p: 0, n: 0, b: 0, r: 0, q: 0 } as Record<PieceSymbol, number>,
    };

    for (const char of boardPart) {
      if (char >= 'a' && char <= 'z' && START_COUNTS[char as PieceSymbol] !== undefined) {
        currentCounts.black[char as PieceSymbol]++;
      } else if (char >= 'A' && char <= 'Z' && START_COUNTS[char.toLowerCase() as PieceSymbol] !== undefined) {
        currentCounts.white[char.toLowerCase() as PieceSymbol]++;
      }
    }

    // Determine captured pieces
    // If color = 'white', we want to see black pieces that white captured
    const targetColor = color === 'white' ? 'black' : 'white';
    const pieces: { piece: PieceSymbol, value: number }[] = [];

    const pTypes: PieceSymbol[] = ['q', 'r', 'b', 'n', 'p'];
    for (const type of pTypes) {
      const missing = Math.max(0, START_COUNTS[type] - currentCounts[targetColor][type]);
      for (let i = 0; i < missing; i++) {
        pieces.push({ piece: type, value: PIECE_VALUES[type] });
      }
    }

    // Calculate material advantage
    let wScore = 0;
    let bScore = 0;
    for (const type of pTypes) {
      wScore += currentCounts.white[type] * PIECE_VALUES[type];
      bScore += currentCounts.black[type] * PIECE_VALUES[type];
    }
    
    const advantage = color === 'white' ? wScore - bScore : bScore - wScore;

    return { 
      captured: pieces,
      materialAdvantage: advantage > 0 ? advantage : 0 
    };
  }, [fen, color]);

  if (captured.length === 0) return null;

  return (
    <div className="flex items-center gap-0.5">
      {captured.map((c, i) => (
        <div key={i} className="w-4 h-4 opacity-80" title={c.piece}>
          {PIECE_SVGS[color === 'white' ? 'black' : 'white'][c.piece]}
        </div>
      ))}
      {materialAdvantage > 0 && (
        <span className="text-[10px] font-bold text-on-surface-variant ml-1">
          +{materialAdvantage}
        </span>
      )}
    </div>
  );
}
