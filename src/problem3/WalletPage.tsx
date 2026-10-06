import React, { useMemo } from 'react';

// ISSUE: WalletBalance had no blockchain field, but the original code
//       reads balance.blockchain. That does not compile in TypeScript.
// FIX:  add blockchain: string.
interface WalletBalance {
  currency: string;
  blockchain: string;
  amount: number;
}

// ISSUE: FormattedWalletBalance duplicated WalletBalance's fields.
//       Repeating fields means two places to update.
// FIX:  extend WalletBalance and add only what is new. usdValue is added here
//       because it is derived data.
interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
  usdValue: number;
}

// ISSUE: interface Props extends BoxProps {} is an empty interface.
// FIX:  a type alias says the same thing with no empty body.
type Props = BoxProps;

// ISSUE: getPriority was declared inside the component, so it was recreated on every render.
// FIX:  move it to module scope so it is created once.
// ISSUE: `blockchain: any` turns off type checking, and the
//       switch hard-codes magic numbers (-99, 100, 50...) inline.
// FIX:  type the argument as string, keep priorities in one named table, and
//       give -99 a name. A Map also avoids accidental matches on inherited object keys such as constructor.
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

// ISSUE: `balance.amount.toFixed()` with no argument rounds to a whole
//       number, so 0.75 ETH was displayed as 1.
// FIX:  an Intl.NumberFormat with explicit decimals. It is created once here,
//       not once per balance.
const amountFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 8,
});

// ISSUE: (props: Props) plus const { children, ...rest } = props
//       typed the props twice, and children was destructured but never used.
// FIX:  destructure in the parameter list. children is only pulled out so it
//       is not spread onto the <div> by ...rest.
const WalletPage: React.FC<Props> = ({ children, ...rest }) => {
  // ISSUE: the original used classes.row but never declared classes,
  //       which throws a ReferenceError.
  // FIX:  declare it. useStyles is assumed to be the makeStyles hook from the
  //       original codebase.
  const classes = useStyles();
  const balances = useWalletBalances();
  const prices = usePrices();

  const sortedBalances = useMemo(
    () =>
      balances
        // ISSUE 1: the filter used lhsPriority, which is never defined. This throws a ReferenceError.
        // ISSUE 2: the condition was inverted. It returned true when
        //       amount <= 0, so only EMPTY balances were shown.
        // ISSUE 3: nested ifs with return true / return false.
        // FIX:  one expression: known blockchain AND amount greater than 0.
        .filter((b) => getPriority(b.blockchain) > UNKNOWN_PRIORITY && b.amount > 0)
        // ISSUE: the comparator returned undefined when priorities were equal. Comparators must return a
        //       number, so tied items ended up in inconsistent order.
        // FIX:  subtract priorities and fall back to the currency name.
        .sort(
          (l, r) =>
            getPriority(r.blockchain) - getPriority(l.blockchain) ||
            l.currency.localeCompare(r.currency),
        ),
    // ISSUE: prices was listed as a dependency but is never read inside
    //       this callback, so every price update re-filtered and re-sorted the list.
    // FIX:  depend on balances only.
    [balances],
  );

  // ISSUE: formattedBalances was computed and never used. rows
  //       mapped over sortedBalances and read balance.formatted, which does
  //       not exist there, it was undefined at runtime.
  // ISSUE: this work also ran again on every render.
  // FIX:  build the formatted list once in useMemo, render from it, and compute
  //       usdValue here too so the JSX stays simple.
  // ISSUE: prices[currency] can be undefined, and undefined * amount is NaN in the UI.
  // FIX:  default a missing price to 0.
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
          // ISSUE: key={index} makes React match rows by position. When
          //       the list reorders or items are inserted or removed, it
          //       reuses the wrong rows and does extra DOM work.
          // FIX:  use a stable unique identity for the row.
          key={`${b.blockchain}:${b.currency}`}
          amount={b.amount}
          usdValue={b.usdValue}
          formattedAmount={b.formatted}
        />
      ))}
    </div>
  );
};

export default WalletPage;
