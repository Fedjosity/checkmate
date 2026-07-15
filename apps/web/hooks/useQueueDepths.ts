import { useState, useEffect } from 'react';
import { getSocket } from '../lib/socket/client';
import { getQueueDepths, QueueDepthData } from '../lib/api/matchmaking';

export const useQueueDepths = () => {
  const [depths, setDepths] = useState<QueueDepthData[]>([]);

  useEffect(() => {
    let mounted = true;

    // Initial fetch
    getQueueDepths().then(data => {
      if (mounted) setDepths(data);
    }).catch(console.error);

    const socket = getSocket();

    const onUpdate = (data: { mode: string; timeControlId: string; stakeAmountCrowns: number; depth: number }) => {
      setDepths(prev => {
        const existing = prev.findIndex(d => 
          d.mode === data.mode && 
          d.timeControlId === data.timeControlId && 
          d.stakeAmountCrowns === data.stakeAmountCrowns
        );
        
        if (existing >= 0) {
          const next = [...prev];
          next[existing] = data;
          return next;
        } else {
          return [...prev, data];
        }
      });
    };

    socket.on('matchmaking:queue_update', onUpdate);

    return () => {
      mounted = false;
      socket.off('matchmaking:queue_update', onUpdate);
    };
  }, []);

  const getDepth = (mode: string, timeControlId: string, stakeAmountCrowns: number) => {
    const entry = depths.find(d => 
      d.mode === mode && 
      d.timeControlId === timeControlId && 
      d.stakeAmountCrowns === stakeAmountCrowns
    );
    return entry?.depth || 0;
  };

  return { depths, getDepth };
};
