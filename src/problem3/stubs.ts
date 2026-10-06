import type { FC, HTMLAttributes } from 'react';

export type BoxProps = HTMLAttributes<HTMLDivElement>;

export interface RawBalance {
  currency: string;
  blockchain: string;
  amount: number;
}

export const useWalletBalances = (): RawBalance[] => [];
export const usePrices = (): Record<string, number> => ({});
export const useStyles = (): { row: string } => ({ row: 'row' });

export const WalletRow: FC<{
  className?: string;
  amount: number;
  usdValue: number;
  formattedAmount: string;
}> = () => null;
