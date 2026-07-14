"use client";

import { useEffect, useState, useMemo } from "react";
import { Chessboard } from "react-chessboard";
import { useGameStore } from "@/stores/game.store";
import { PlayerCard } from "./PlayerCard";
import { GameControls } from "./GameControls";
import { GameResultModal } from "./GameResultModal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface LiveGameScreenProps {
  gameId: string;
  gameData: any; // GameInfo from API
  guestId?: string;
}

export function LiveGameScreen({ gameId, gameData, guestId }: LiveGameScreenProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  const uid = user?.uid || guestId;
  const playerColor = uid === gameData.whiteUid ? 'white' : uid === gameData.blackUid ? 'black' : null;

  const {
    fen,
    whiteTimeRemainingMs,
    blackTimeRemainingMs,
    status,
    result,
    resultReason,
    payout,
    eloChanges,
    error,
    joinGame,
    leaveGame,
    makeMove,
    resign,
    offerDraw,
  } = useGameStore();

  const [boardWidth, setBoardWidth] = useState(600);

  useEffect(() => {
    if (!uid) {
      toast.error("You are not authenticated to view this game.");
      router.push('/play');
      return;
    }

    joinGame(gameId, uid);

    const handleResize = () => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const minDim = Math.min(vh - 250, vw - 40, 800); // Leave room for cards
      setBoardWidth(minDim);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      leaveGame();
      window.removeEventListener('resize', handleResize);
    };
  }, [gameId, uid, joinGame, leaveGame, router]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      router.push('/play');
    }
  }, [error, router]);

  const onDrop = (sourceSquare: string, targetSquare: string, piece: string) => {
    if (status !== 'active') return false;
    
    // Quick local validation using chess.js would go here, 
    // but the store also validates it before sending.
    const move = sourceSquare + targetSquare + (piece[1] === 'P' && (targetSquare[1] === '1' || targetSquare[1] === '8') ? 'q' : '');
    
    if (uid) {
      makeMove(move, uid);
    }
    return true; // react-chessboard will optimistically update if we return true
  };

  if (!uid || !playerColor) return <div className="text-white text-center mt-20">Authenticating...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8 bg-background relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[1000px] max-h-[1000px] bg-gold/5 rounded-full blur-[100px] pointer-events-none" />

      {status === 'connecting' && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="animate-spin w-12 h-12 border-4 border-gold border-t-transparent rounded-full mb-4" />
          <h2 className="text-white font-headline text-xl">Connecting to match...</h2>
        </div>
      )}

      {status === 'waiting' && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <h2 className="text-white font-headline text-xl mb-4">Waiting for opponent to connect...</h2>
        </div>
      )}

      <div className="w-full flex flex-col items-center max-w-[800px] z-10">
        
        {/* Opponent Card */}
        <div className="w-full mb-6">
          <PlayerCard 
            uid={playerColor === 'white' ? gameData.blackUid : gameData.whiteUid}
            name={gameData.isBot ? `Stockfish (${gameData.botDifficulty})` : "Opponent"}
            isBot={gameData.isBot}
            color={playerColor === 'white' ? 'black' : 'white'}
            timeRemainingMs={playerColor === 'white' ? blackTimeRemainingMs : whiteTimeRemainingMs}
            isActive={
              (playerColor === 'white' && fen.split(' ')[1] === 'b') || 
              (playerColor === 'black' && fen.split(' ')[1] === 'w')
            }
          />
        </div>

        {/* Board */}
        <div 
          className="relative rounded-lg overflow-hidden shadow-2xl luxury-glow"
          style={{ width: boardWidth, height: boardWidth }}
        >
          <div className="absolute inset-0 border-4 border-gold/30 rounded-lg z-10 pointer-events-none" />
          <Chessboard 
            position={fen}
            onPieceDrop={onDrop}
            boardOrientation={playerColor as 'white' | 'black'}
            customDarkSquareStyle={{ backgroundColor: "#0D1017" }}
            customLightSquareStyle={{ backgroundColor: "rgba(201, 168, 76, 0.85)" }}
            customBoardStyle={{
              borderRadius: '8px',
              boxShadow: '0 0 40px rgba(201, 168, 76, 0.1)',
            }}
            animationDuration={200}
          />
        </div>

        {/* My Card */}
        <div className="w-full mt-6">
          <PlayerCard 
            uid={uid}
            name={user ? user.displayName || "Anonymous" : "Guest"}
            color={playerColor}
            timeRemainingMs={playerColor === 'white' ? whiteTimeRemainingMs : blackTimeRemainingMs}
            isActive={
              (playerColor === 'white' && fen.split(' ')[1] === 'w') || 
              (playerColor === 'black' && fen.split(' ')[1] === 'b')
            }
          />
        </div>

        {/* Controls */}
        <div className="w-full mt-4">
          <GameControls 
            status={status}
            onResign={() => uid && resign(uid)}
            onOfferDraw={() => uid && offerDraw(uid)}
          />
        </div>

      </div>

      <GameResultModal 
        isOpen={status === 'completed'}
        result={result}
        reason={resultReason}
        playerColor={playerColor}
        payout={payout}
        eloChanges={eloChanges}
        onClose={() => router.push('/play')}
      />
    </div>
  );
}
