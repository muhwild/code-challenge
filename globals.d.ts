// Stand-ins for things that exist in the original codebase but not in this
// repo, so the Problem 3 files type-check on their own.
type BoxProps = import('react').HTMLAttributes<HTMLDivElement>;

declare function useWalletBalances(): { currency: string; blockchain: string; amount: number }[];
declare function usePrices(): Record<string, number>;
declare function useStyles(): { row: string };

declare const WalletRow: import('react').FC<{
  className?: string;
  amount: number;
  usdValue: number;
  formattedAmount: string;
}>;
