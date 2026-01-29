import { clsx } from 'clsx';

interface LoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function Loading({ className, size = 'md' }: LoadingProps) {
  return (
    <div className={clsx('flex items-center justify-center p-8', className)}>
      <div
        className={clsx(
          'animate-spin rounded-full border-2 border-gray-200 border-t-wa-green',
          sizeStyles[size]
        )}
      />
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loading size="lg" />
    </div>
  );
}
