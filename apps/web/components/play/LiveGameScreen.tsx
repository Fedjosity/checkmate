"use client";

import { useEffect, useState, useMemo } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { useGameStore } from "@/stores/game.store";
import { PlayerCard } from "./PlayerCard";
import { GameControls } from "./GameControls";
import { MoveHistory } from "./MoveHistory";
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
    lastMove,
    joinGame,
    leaveGame,
    makeMove,
    resign,
    offerDraw,
  } = useGameStore();

  const [boardWidth, setBoardWidth] = useState(600);
  const [moveSquares, setMoveSquares] = useState<Record<string, any>>({});
  const [optionSquares, setOptionSquares] = useState<Record<string, any>>({});

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

  // Last move highlighting
  useEffect(() => {
    if (lastMove) {
      setMoveSquares({
        [lastMove.from]: { backgroundColor: "rgba(201, 168, 76, 0.4)" },
        [lastMove.to]: { backgroundColor: "rgba(201, 168, 76, 0.4)" },
      });
    } else {
      setMoveSquares({});
    }
  }, [lastMove]);

  const getMoveOptions = (square: string) => {
    try {
      const chess = new Chess(fen);
      const moves = chess.moves({
        square: square as any,
        verbose: true
      });
      if (moves.length === 0) {
        setOptionSquares({});
        return;
      }
      
      const newSquares: Record<string, any> = {};
      moves.map((move: any) => {
        newSquares[move.to] = {
          background:
            chess.get(move.to) && chess.get(move.to)?.color !== chess.get(square as any)?.color
              ? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)"
              : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
          borderRadius: "50%"
        };
      });
      newSquares[square] = {
        background: "rgba(255, 255, 255, 0.1)"
      };
      setOptionSquares(newSquares);
    } catch (e) {
      setOptionSquares({});
    }
  };

  const onPieceDragBegin = (piece: string, sourceSquare: string) => {
    // Only show dots if it's our piece
    if (status !== 'active') return;
    if ((playerColor === 'white' && piece[0] !== 'w') || (playerColor === 'black' && piece[0] !== 'b')) return;
    
    getMoveOptions(sourceSquare);
  };

  const onSquareClick = (square: string) => {
    if (status !== 'active') return;
    const chess = new Chess(fen);
    const piece = chess.get(square as any);
    
    if (piece && ((playerColor === 'white' && piece.color === 'w') || (playerColor === 'black' && piece.color === 'b'))) {
      getMoveOptions(square);
    } else {
      // If we clicked a dot, maybe we should move, but react-chessboard handles clicks on customSquareStyles 
      // differently if we don't track source square. For now, rely on drag and drop.
      setOptionSquares({});
    }
  };

  const onDrop = (sourceSquare: string, targetSquare: string, piece: string) => {
    setOptionSquares({});
    if (status !== 'active') return false;
    
    const move = sourceSquare + targetSquare + (piece[1] === 'P' && (targetSquare[1] === '1' || targetSquare[1] === '8') ? 'q' : '');
    
    if (uid) {
      makeMove(move, uid);
    }
    return true; // react-chessboard will optimistically update if we return true
  };

  if (!uid || !playerColor) return <div className="text-white text-center mt-20">Authenticating...</div>;



  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-8 min-h-screen p-4 md:p-8 bg-background relative overflow-hidden">
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

      <div className="w-full flex flex-col items-center max-w-[800px] z-10 shrink-0 lg:self-center">
        
        {/* Opponent Card */}
        <div className="w-full mb-4">
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
            onSquareClick={onSquareClick}
            onPieceDragBegin={onPieceDragBegin}
            onPieceDragEnd={() => setOptionSquares({})}
            boardOrientation={playerColor as 'white' | 'black'}
            customDarkSquareStyle={{ backgroundColor: "#0D1017" }}
            customLightSquareStyle={{ backgroundColor: "rgba(201, 168, 76, 0.85)" }}
            customBoardStyle={{
              borderRadius: '8px',
              boxShadow: '0 0 40px rgba(201, 168, 76, 0.1)',
            }}
            customSquareStyles={{
              ...moveSquares,
              ...optionSquares,
            }}
            showBoardNotation={true}
            animationDuration={200}
          />
        </div>

        {/* My Card */}
        <div className="w-full mt-4">
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
      </div>

      {/* Right Column: Move History & Controls */}
      <div className="w-full lg:w-[320px] flex flex-col gap-4 h-full max-h-[800px] z-10 self-stretch lg:self-center shrink-0">
        <div className="flex-1 min-h-[300px]">
          <MoveHistory />
        </div>
        <GameControls 
          status={status}
          onResign={() => uid && resign(uid)}
          onOfferDraw={() => uid && offerDraw(uid)}
        />
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
