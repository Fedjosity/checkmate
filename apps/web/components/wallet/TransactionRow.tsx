import { Transaction } from '@checkmate/shared-types';
import { formatCrowns, crownsToUSD } from '@/lib/utils/exchangeRate';
import { Badge } from '../ui/Badge';
import AddCardIcon from '@mui/icons-material/AddCard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import ReplayIcon from '@mui/icons-material/Replay';
import { format } from 'date-fns';

interface TransactionRowProps {
  tx: Transaction;
}

export function TransactionRow({ tx }: TransactionRowProps) {
  const isCredit = tx.crownsAmount > 0;

  const getIcon = () => {
    switch (tx.type) {
      case 'crown_purchase':
        return <AddCardIcon fontSize="small" />;
      case 'withdrawal':
        return <AccountBalanceIcon fontSize="small" />;
      case 'match_win':
        return <EmojiEventsIcon fontSize="small" />;
      case 'match_entry':
        return <SportsEsportsIcon fontSize="small" />;
      case 'refund':
        return <ReplayIcon fontSize="small" />;
      default:
        return <span className="text-xl">♛</span>;
    }
  };

  const getStatusColor = () => {
    switch (tx.status) {
      case 'complete':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-surface-bright rounded-xl border border-border/50 hover:border-gold/30 transition-colors group">
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isCredit ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
          }`}
        >
          {getIcon()}
        </div>
        <div>
          <p className="text-sm font-bold text-white group-hover:text-gold transition-colors">
            {tx.description}
          </p>
          <p className="text-xs text-muted font-stats-mono mt-0.5">
            {format(new Date(tx.createdAt), 'MMM d, yyyy • h:mm a')}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-end">
        <span
          className={`text-sm font-bold font-stats-mono ${
            isCredit ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {isCredit ? '+' : ''}
          {formatCrowns(tx.crownsAmount)} ♛
        </span>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-muted font-stats-mono">
            {crownsToUSD(Math.abs(tx.crownsAmount))}
          </span>
          <Badge variant={getStatusColor() as any}>{tx.status}</Badge>
        </div>
      </div>
    </div>
  );
}
