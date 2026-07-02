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
  friendly: {
    label: "Friendly Match",
    icon: "♟",
    accentColor: "#0EA5E9",
    badge: "FREE",
    badgeStyle: "neutral" as const,
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
    badgeStyle: "gold" as const,
    description: "No entry fee · ELO rated · Build your rank",
    features: [
      "Matched by ELO bracket",
      "Rating changes every game",
      "Climb the leaderboard",
    ],
    ctaLabel: "Play Ranked",
    requiresBalance: false,
  },
  paid: {
    label: "Paid Competitive",
    icon: "♛",
    accentColor: "#C9A84C",
    badge: "MOST POPULAR",
    badgeStyle: "gold" as const, // We'll make it "gold" for now since Badge component has gold variant
    description: "Entry fee · ELO rated · Real earnings",
    features: [
      "Matched within ±200 ELO",
      "Instant payout on win",
      "Full anti-cheat protection",
    ],
    ctaLabel: "Enter Match",
    requiresBalance: true,
    stakeTiers: [100, 300, 500, 1000], // cents
  },
  tournament: {
    label: "Tournament",
    icon: "🏆",
    accentColor: "#A855F7",
    badge: "SCHEDULED",
    badgeStyle: "neutral" as const, // Using neutral since we don't have a purple badge yet
    description: "Entry fee · Multi-player · Prize pool",
    features: [],
    ctaLabel: "View All Tournaments",
    requiresBalance: true,
  },
};
