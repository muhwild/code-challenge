import React, { useMemo } from 'react';
import type { BoxProps } from './stubs';
import { useStyles, useWalletBalances, usePrices, WalletRow } from './stubs';

interface WalletBalance {
  currency: string;
  blockchain: string; // was missing in the original, but the code reads it
  amount: number;
}

interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
  usdValue: number;
}

type Props = BoxProps;

// Static lookup lives outside the component: created once, not on every render.
// A Map avoids accidental hits on inherited keys such as constructor.
const PRIORITY = new Map<string, number>([
  ['Osmosis', 100],
  ['Ethereum', 50],
  ['Arbitrum', 30],
  ['Zilliqa', 20],
  ['Neo', 20],
]);
const UNKNOWN_PRIORITY = -99;
const getPriority = (blockchain: string): number =>
  PRIORITY.get(blockchain) ?? UNKNOWN_PRIORITY;

// toFixed() with no argument rounds to an integer, so 0.75 ETH showed as 1.
const amountFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 8,
});

const WalletPage: React.FC<Props> = ({ children, ...rest }) => {
  const classes = useStyles();
  const balances = useWalletBalances();
  const prices = usePrices();

  // Filter and sort depend only on balances, so price ticks don't re-sort.
  const sortedBalances = useMemo(
    () =>
      balances
        .filter((b) => getPriority(b.blockchain) > UNKNOWN_PRIORITY && b.amount > 0)
        .sort(
          (l, r) =>
            getPriority(r.blockchain) - getPriority(l.blockchain) ||
            l.currency.localeCompare(r.currency),
        ),
    [balances],
  );

  // Formatting and USD value are derived once per data change, not per render.
  const formattedBalances = useMemo<FormattedWalletBalance[]>(
    () =>
      sortedBalances.map((b) => ({
        ...b,
        formatted: amountFormatter.format(b.amount),
        usdValue: (prices[b.currency] ?? 0) * b.amount,
      })),
    [sortedBalances, prices],
  );

  return (
    <div {...rest}>
      {formattedBalances.map((b) => (
        <WalletRow
          className={classes.row}
          key={`${b.blockchain}:${b.currency}`} // stable identity instead of array index
          amount={b.amount}
          usdValue={b.usdValue}
          formattedAmount={b.formatted}
        />
      ))}
    </div>
  );
};

export default WalletPage;
