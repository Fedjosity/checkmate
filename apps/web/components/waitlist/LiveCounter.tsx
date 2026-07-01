"use client";

import { useQuery } from "@tanstack/react-query";
import { getWaitlistCount } from "@/lib/api/waitlist";

export const LiveCounter = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["waitlistCount"],
    queryFn: getWaitlistCount,
    refetchInterval: 30000,
  });

  if (isLoading || error || !data) {
    return (
      <div className="w-full h-12 bg-surface-container rounded-sm animate-pulse" />
    );
  }

  const { totalSignups, spotsRemaining, maxSpots } = data;
  const progressPercentage = Math.min((totalSignups / maxSpots) * 100, 100);

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex justify-between items-end mb-1">
        <span className="font-stats-mono text-text-primary text-[14px]">
          {spotsRemaining} SPOTS REMAINING
        </span>
        <span className="font-stats-mono text-text-muted text-[12px]">
          {totalSignups} CLAIMED
        </span>
      </div>
      <div className="w-full h-2 bg-surface border border-border rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-1000 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};
