'use client';

import { useRouter } from 'next/navigation';
import { useState, useId } from 'react';
import { clsx } from 'clsx';

interface SearchInputProps {
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  label?: string;
  id?: string;
}

export function SearchInput({
  defaultValue = '',
  placeholder = 'Search organizations, people, bills...',
  className,
  label = 'Search',
  id: providedId,
}: SearchInputProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const generatedId = useId();
  const inputId = providedId || `search-${generatedId}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={clsx('relative', className)}
      role="search"
      aria-label="Site search"
    >
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <input
        type="search"
        id={inputId}
        name="q"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        aria-describedby={`${inputId}-hint`}
        className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 text-gray-900 placeholder-gray-500 focus:border-wa-green focus:outline-none focus:ring-2 focus:ring-wa-green/20"
      />
      <span id={`${inputId}-hint`} className="sr-only">
        Press Enter to search
      </span>
      <button
        type="submit"
        aria-label="Submit search"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-gray-500 hover:text-wa-green focus:outline-none focus:ring-2 focus:ring-wa-green focus:ring-offset-2"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>
    </form>
  );
}
