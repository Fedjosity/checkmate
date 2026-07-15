"use client";

import { Chessboard } from "react-chessboard";
import { useState, useEffect } from "react";
import { Chess } from "chess.js";

export function DecorativeBoard() {
  const [fen, setFen] = useState("start");

  // We just want an idle board at the starting position
  // (The FEN is initialized to "start" in the useState above)

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
