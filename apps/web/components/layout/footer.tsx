import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="container py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="mb-4 font-semibold text-gray-900">WA Transparency</h3>
            <p className="text-sm text-gray-600">
              Making political influence in Washington State more visible and
              understandable.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-gray-900">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/search" className="text-gray-600 hover:text-wa-green">
                  Search
                </Link>
              </li>
              <li>
                <Link href="/lists/top-donors" className="text-gray-600 hover:text-wa-green">
                  Top Donors
                </Link>
              </li>
              <li>
                <Link href="/lists/top-recipients" className="text-gray-600 hover:text-wa-green">
                  Top Recipients
                </Link>
              </li>
              <li>
                <Link href="/activity" className="text-gray-600 hover:text-wa-green">
                  Recent Activity
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-gray-900">Data Sources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://www.pdc.wa.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-wa-green"
                >
                  WA PDC
                </a>
              </li>
              <li>
                <a
                  href="https://www.usaspending.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-wa-green"
                >
                  USASpending.gov
                </a>
              </li>
              <li>
                <a
                  href="https://leg.wa.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-wa-green"
                >
                  WA Legislature
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-gray-900">About</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-gray-600 hover:text-wa-green">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/about#methodology" className="text-gray-600 hover:text-wa-green">
                  Methodology
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-wa-green"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
          <p>
            Data sourced from public records. Last updated:{' '}
            {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </footer>
  );
}
