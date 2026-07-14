"use client";

import { Chessboard } from "react-chessboard";
import { useState, useEffect } from "react";
import { Chess } from "chess.js";

export function DecorativeBoard() {
  const [fen, setFen] = useState("start");

  // Play a random opening sequence just for visual interest if we wanted
  // But a static starting position with cool styling is fine too
  useEffect(() => {
    const game = new Chess();
    const moves = ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O"];
    let i = 0;
    
    const interval = setInterval(() => {
      if (i < moves.length) {
        game.move(moves[i]);
        setFen(game.fen());
        i++;
      } else {
        clearInterval(interval);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-[600px] aspect-square rounded-xl overflow-hidden shadow-2xl luxury-glow">
      {/* Container to enforce exact sizing and clip edges nicely */}
      <div className="absolute inset-0 border-4 border-gold/30 rounded-xl z-10 pointer-events-none" />
      <Chessboard 
        position={fen} 
        arePiecesDraggable={false}
        customDarkSquareStyle={{ backgroundColor: "#0D1017" }}
        customLightSquareStyle={{ backgroundColor: "rgba(201, 168, 76, 0.85)" }}
        customBoardStyle={{
          borderRadius: '12px',
          boxShadow: '0 0 40px rgba(201, 168, 76, 0.1)',
        }}
      />
    </div>
  );
}
