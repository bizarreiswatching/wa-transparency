import { clsx } from 'clsx';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  caption?: string;
}

export function Table({ children, className, caption, ...props }: TableProps) {
  return (
    <div className="overflow-x-auto" role="region" aria-label={caption || 'Data table'} tabIndex={0}>
      <table
        className={clsx('min-w-full divide-y divide-gray-200', className)}
        {...props}
      >
        {caption && (
          <caption className="sr-only">{caption}</caption>
        )}
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={clsx('bg-gray-50', className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={clsx('divide-y divide-gray-100 bg-white', className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={clsx('hover:bg-gray-50', className)} {...props}>
      {children}
    </tr>
  );
}

export function TableCell({ children, className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={clsx('px-4 py-3 text-sm', className)} {...props}>
      {children}
    </td>
  );
}

export function TableHeader({ children, className, scope = 'col', ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope={scope}
      className={clsx('px-4 py-3 text-left text-sm font-semibold text-gray-900', className)}
      {...props}
    >
      {children}
    </th>
  );
}
