import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for could not be found.',
};

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-4 text-8xl font-bold text-wa-green">404</div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Page not found
        </h1>
        <p className="mb-6 max-w-md text-gray-600">
          Sorry, we couldn't find the page you're looking for. It may have been moved,
          deleted, or never existed.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-lg bg-wa-green px-6 py-3 font-medium text-white transition-colors hover:bg-wa-green/90 focus:outline-none focus:ring-2 focus:ring-wa-green focus:ring-offset-2"
          >
            Go home
          </Link>
          <Link
            href="/search"
            className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Search
          </Link>
        </div>
      </div>

      {/* Helpful links */}
      <div className="mt-12 text-center">
        <p className="mb-4 text-sm text-gray-500">Looking for something specific?</p>
        <nav className="flex flex-wrap justify-center gap-4 text-sm">
          <Link href="/lists/top-donors" className="text-wa-green hover:underline">
            Top Donors
          </Link>
          <Link href="/lists/top-recipients" className="text-wa-green hover:underline">
            Top Recipients
          </Link>
          <Link href="/lists/top-contractors" className="text-wa-green hover:underline">
            Top Contractors
          </Link>
          <Link href="/activity" className="text-wa-green hover:underline">
            Recent Activity
          </Link>
        </nav>
      </div>
    </div>
  );
}
