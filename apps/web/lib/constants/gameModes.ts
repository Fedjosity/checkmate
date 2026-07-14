export interface GameMode {
  label: string;
  icon: string;
  accentColor: string;
  badge: string;
  badgeStyle: "neutral" | "gold" | "success" | "error";
  description: string;
  features: string[];
  ctaLabel: string;
  requiresBalance: boolean;
  stakeTiers?: number[];
}

export const GAME_MODES: Record<string, GameMode> = {
  play_online: {
    label: "Play Online",
    icon: "♟",
    accentColor: "#0EA5E9",
    badge: "FREE",
    badgeStyle: "neutral",
    description: "No entry fee · No stakes · No pressure",
    features: [
      "Play anonymous opponents",
      "Practice any time control",
      "No ELO impact — unrated",
    ],
    ctaLabel: "Play Now",
    requiresBalance: false,
  },
  competitive: {
    label: "Competitive",
    icon: "♜",
    accentColor: "#C9A84C",
    badge: "RANKED",
    badgeStyle: "gold",
    description: "No entry fee · ELO rated · Build your rank",
    features: [
      "Matched by ELO bracket",
      "Rating changes every game",
      "Climb the leaderboard",
    ],
    ctaLabel: "Play Ranked",
    requiresBalance: false,
  },
  bot: {
    label: "Play Bots",
    icon: "🤖",
    accentColor: "#A855F7",
    badge: "PRACTICE",
    badgeStyle: "neutral",
    description: "Play against Stockfish AI at various difficulties",
    features: [
      "5 difficulty levels",
      "Instant matchmaking",
      "No ELO impact",
    ],
    ctaLabel: "Play Bot",
    requiresBalance: false,
  },
  online_pro: {
    label: "Play Online Pro",
    icon: "♛",
    accentColor: "#C9A84C",
    badge: "MOST POPULAR",
    badgeStyle: "gold",
    description: "Entry fee · ELO rated · Real earnings",
    features: [
      "Matched within ±200 ELO",
      "Instant payout on win",
      "Full anti-cheat protection",
    ],
    ctaLabel: "Enter Match",
    requiresBalance: true,
    stakeTiers: [100, 300, 500, 1000], // crowns
  },
};
