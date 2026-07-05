"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTransactions } from "@/lib/api/wallet";
import { TransactionRow } from "./TransactionRow";
import { Skeleton } from "../ui/Skeleton";
import { Button } from "../ui/Button";
import ReceiptIcon from "@mui/icons-material/Receipt";

export function TransactionsList() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["wallet", "transactions", page, limit],
    queryFn: () => getTransactions(page, limit),
    keepPreviousData: true,
  } as any); // using any for keepPreviousData compat with v5 if needed

  if (isLoading && !data) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-10 text-red-500">
        Failed to load transactions.
      </div>
    );
  }

  const transactions = (data as any)?.data?.transactions ?? [];
  const total = (data as any)?.data?.total ?? 0;
  const hasMore = page * limit < total;

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-bright flex items-center justify-center text-muted mb-4 border border-border">
          <ReceiptIcon fontSize="large" />
        </div>
        <h3 className="text-lg font-bold text-white tracking-widest uppercase">
          No Transactions Yet
        </h3>
        <p className="text-sm text-muted mt-2 max-w-sm">
          Your purchase and withdrawal history will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-3">
        {transactions.map((tx: any) => (
          <TransactionRow key={tx.id} tx={tx} />
        ))}
      </div>

      <div className="flex justify-between items-center pt-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          ← Previous
        </Button>
        <span className="text-xs text-muted font-stats-mono">
          Page {page}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasMore}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
