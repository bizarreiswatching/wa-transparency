import { formatMoney, formatMoneyShort } from '@/lib/utils/format';

interface MoneyAmountProps {
  amount: number;
  short?: boolean;
  className?: string;
}

export function MoneyAmount({ amount, short = false, className }: MoneyAmountProps) {
  const formatted = short ? formatMoneyShort(amount) : formatMoney(amount);

  return (
    <span className={className} title={formatMoney(amount)}>
      {formatted}
    </span>
  );
}
