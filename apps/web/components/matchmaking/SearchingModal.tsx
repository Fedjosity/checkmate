import React from 'react';
import { MatchmakingState, MatchData } from '../../hooks/useMatchmaking';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { RankBadge } from '../ui/RankBadge';

interface SearchingModalProps {
  state: MatchmakingState;
  matchData: MatchData | null;
  onCancel: () => void;
  onClose: () => void;
}

export function SearchingModal({ state, matchData, onCancel, onClose }: SearchingModalProps) {
  if (state === 'idle') return null;

  return (
    <Modal isOpen={true} onClose={state === 'searching' ? onCancel : onClose}>
      <div className="p-8 flex flex-col items-center justify-center text-center space-y-6">
        {state === 'searching' && (
          <>
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-gold/20 border-t-gold animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl text-gold">♕</span>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-display text-white mb-2">Searching for Opponent</h2>
              <p className="text-muted">Analyzing ELO and matchmaking pool...</p>
            </div>
            <Button variant="ghost" onClick={onCancel}>
              Cancel Search
            </Button>
          </>
        )}

        {state === 'match_found' && matchData && (
          <div className="animate-in zoom-in duration-300">
            <h2 className="text-3xl font-display text-gold mb-6 luxury-glow">Match Found!</h2>
            
            <div className="flex items-center justify-center gap-8 mb-8">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-surface border border-white/10 flex items-center justify-center mb-2">
                  <span className="text-2xl text-white">{matchData.youAre === 'white' ? '♔' : '♚'}</span>
                </div>
                <span className="font-bold text-white">You</span>
                <span className="text-sm text-muted capitalize">{matchData.youAre}</span>
              </div>
              
              <div className="text-2xl font-display text-muted">VS</div>
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-surface border border-white/10 flex items-center justify-center mb-2">
                  <span className="text-2xl text-white">{matchData.youAre === 'white' ? '♚' : '♔'}</span>
                </div>
                <span className="font-bold text-white">{matchData.opponentName || 'Opponent'}</span>
                <span className="text-sm text-muted">{matchData.opponentElo} ELO</span>
              </div>
            </div>

            {matchData.opponentRank && (
              <div className="flex justify-center mb-6">
                <RankBadge rank={matchData.opponentRank} size="sm" showLabel={true} />
              </div>
            )}

            <p className="text-gold animate-pulse">Entering game...</p>
          </div>
        )}

        {state === 'timeout' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 text-3xl mb-4">
              !
            </div>
            <h2 className="text-2xl font-display text-white mb-2">Search Timeout</h2>
            <p className="text-muted mb-6">We couldn't find a suitable match. Your Crowns have been returned.</p>
            <Button variant="primary" onClick={onClose}>
              Close
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
