import Link from 'next/link';
import { Nav } from './nav';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-wa-green">WA</span>
          <span className="text-xl font-semibold text-gray-900">Transparency</span>
        </Link>
        <Nav />
      </div>
    </header>
  );
}
