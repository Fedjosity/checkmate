"use client";

import { useEffect, useState } from "react";
import { getGame } from "@/lib/api/games";
import { LiveGameScreen } from "@/components/play/LiveGameScreen";
import { useAuth } from "@/hooks/useAuth";

export default function GamePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { user } = useAuth();
  
  const [gameData, setGameData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [guestId, setGuestId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        setIsLoading(true);
        let gId = undefined;
        
        if (!user) {
          const existingGuest = localStorage.getItem('checkmate_guest');
          if (existingGuest) {
            gId = JSON.parse(existingGuest).guestId;
            setGuestId(gId);
          }
        }

        const data = await getGame(id, gId);
        setGameData(data);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load game");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGame();
  }, [id, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin w-12 h-12 border-4 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !gameData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-white gap-4">
        <h1 className="font-headline text-3xl text-red-400">Error Loading Game</h1>
        <p className="text-on-surface-variant">{error || "Game not found"}</p>
        <a href="/play" className="text-gold hover:underline mt-4">Return to Play</a>
      </div>
    );
  }

  return <LiveGameScreen gameId={id} gameData={gameData} guestId={guestId} />;
}
