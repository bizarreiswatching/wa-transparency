import { format, formatDistanceToNow } from 'date-fns';

interface DateDisplayProps {
  date: Date | string;
  relative?: boolean;
  className?: string;
}

export function DateDisplay({ date, relative = false, className }: DateDisplayProps) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (relative) {
    return (
      <time dateTime={dateObj.toISOString()} className={className} title={format(dateObj, 'PPP')}>
        {formatDistanceToNow(dateObj, { addSuffix: true })}
      </time>
    );
  }

  return (
    <time dateTime={dateObj.toISOString()} className={className}>
      {format(dateObj, 'MMM d, yyyy')}
    </time>
  );
}
