"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket/client";

export function LiveStatsBar() {
  const [stats, setStats] = useState({
    activePlayers: 1342, // Dummy base values
    gamesToday: 5402,
    totalPaidOut: 45023,
  });

  // If we had a socket event for global stats, we'd listen here
  useEffect(() => {
    // const socket = getSocket();
    // socket.on('stats:update', setStats);
    // return () => socket.off('stats:update', setStats);
  }, []);

  return (
    <div className="flex items-center gap-6 py-4 px-6 bg-surface-light/30 border border-border/50 rounded-2xl backdrop-blur-md w-full">
      <div className="flex items-center gap-3">
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </div>
        <div className="flex flex-col">
          <span className="text-on-surface-variant text-xs font-medium uppercase tracking-wider">Players Online</span>
          <span className="text-white font-stats-mono font-bold">{stats.activePlayers.toLocaleString()}</span>
        </div>
      </div>
      
      <div className="h-8 w-px bg-border/50" />
      
      <div className="flex flex-col">
        <span className="text-on-surface-variant text-xs font-medium uppercase tracking-wider">Games Today</span>
        <span className="text-white font-stats-mono font-bold">{stats.gamesToday.toLocaleString()}</span>
      </div>

      <div className="h-8 w-px bg-border/50" />
      
      <div className="flex flex-col">
        <span className="text-on-surface-variant text-xs font-medium uppercase tracking-wider">Total Paid Out</span>
        <span className="text-gold font-stats-mono font-bold">${stats.totalPaidOut.toLocaleString()}</span>
      </div>
    </div>
  );
}
