"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/stores/game.store";
import { Chess } from "chess.js";

export function MoveHistory() {
  const pgn = useGameStore((s) => s.pgn);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Parse moves from PGN
  const chess = new Chess();
  try {
    chess.loadPgn(pgn);
  } catch (e) {
    // Ignore invalid PGN
  }
  const history = chess.history();

  // Group moves into pairs (White, Black)
  const movePairs: { white: string; black?: string; index: number }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      index: i / 2 + 1,
      white: history[i],
      black: history[i + 1],
    });
  }

  // Auto-scroll to bottom when new moves arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [pgn]);

  return (
    <div className="bg-surface/50 rounded-xl border border-border/50 flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-border/50 flex items-center justify-between bg-surface-light">
        <h3 className="font-headline text-sm text-white">Move History</h3>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-sm scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
      >
        {movePairs.length === 0 ? (
          <div className="text-on-surface-variant text-center mt-4 opacity-50 text-xs">
            No moves yet
          </div>
        ) : (
          movePairs.map((pair, idx) => {
            const isLastWhite = idx === movePairs.length - 1 && !pair.black;
            const isLastBlack = idx === movePairs.length - 1 && pair.black;
            
            return (
              <div 
                key={pair.index} 
                className="flex items-center rounded px-2 py-1 hover:bg-white/5 transition-colors group"
              >
                <div className="w-8 text-on-surface-variant/50 text-xs select-none">
                  {pair.index}.
                </div>
                
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div className={`px-2 py-0.5 rounded cursor-default ${isLastWhite ? 'bg-gold/20 text-gold font-medium' : 'text-on-surface-variant group-hover:text-white transition-colors'}`}>
                    {pair.white}
                  </div>
                  {pair.black && (
                    <div className={`px-2 py-0.5 rounded cursor-default ${isLastBlack ? 'bg-gold/20 text-gold font-medium' : 'text-on-surface-variant group-hover:text-white transition-colors'}`}>
                      {pair.black}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
