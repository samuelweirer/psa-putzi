/**
 * Loading Skeleton Component
 *
 * Provides skeleton loading states for better perceived performance
 * while data is being fetched from the backend.
 */

interface LoadingSkeletonProps {
  variant?: 'text' | 'card' | 'table' | 'avatar' | 'button';
  count?: number;
  className?: string;
}

export function LoadingSkeleton({
  variant = 'text',
  count = 1,
  className = ''
}: LoadingSkeletonProps) {
  const baseClass = 'animate-pulse bg-gray-200 rounded';

  const variants = {
    text: 'h-4 w-full',
    card: 'h-48 w-full',
    table: 'h-12 w-full',
    avatar: 'h-10 w-10 rounded-full',
    button: 'h-10 w-24',
  };

  const skeletonClass = `${baseClass} ${variants[variant]} ${className}`;

  if (count === 1) {
    return <div className={skeletonClass} />;
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={skeletonClass} />
      ))}
    </div>
  );
}

/**
 * Table Loading Skeleton
 * Displays a skeleton for table rows while data is loading
 */
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="animate-pulse bg-gray-200 rounded h-8 flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Card Loading Skeleton
 * Displays a skeleton for card-based layouts
 */
export function CardSkeleton() {
  return (
    <div className="bg-white shadow rounded-lg p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
      </div>
      <div className="mt-6 flex space-x-3">
        <div className="h-10 bg-gray-200 rounded w-24" />
        <div className="h-10 bg-gray-200 rounded w-24" />
      </div>
    </div>
  );
}

/**
 * Form Loading Skeleton
 * Displays a skeleton for form inputs while loading
 */
export function FormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index}>
          <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
          <div className="h-10 bg-gray-200 rounded w-full" />
        </div>
      ))}
      <div className="flex space-x-3">
        <div className="h-10 bg-gray-200 rounded w-24" />
        <div className="h-10 bg-gray-200 rounded w-32" />
      </div>
    </div>
  );
}
