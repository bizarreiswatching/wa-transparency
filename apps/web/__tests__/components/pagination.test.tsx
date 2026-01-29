import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Pagination, PaginationInfo } from '@/components/ui/pagination';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

describe('Pagination', () => {
  it('does not render when totalPages is 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} baseUrl="/test" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders navigation with correct aria label', () => {
    render(<Pagination currentPage={1} totalPages={5} baseUrl="/test" />);
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
  });

  it('disables previous button on first page', () => {
    render(<Pagination currentPage={1} totalPages={5} baseUrl="/test" />);
    const prevButton = screen.getByText('Previous').closest('span');
    expect(prevButton).toHaveAttribute('aria-disabled', 'true');
  });

  it('disables next button on last page', () => {
    render(<Pagination currentPage={5} totalPages={5} baseUrl="/test" />);
    const nextButton = screen.getByText('Next').closest('span');
    expect(nextButton).toHaveAttribute('aria-disabled', 'true');
  });

  it('shows current page indicator', () => {
    render(<Pagination currentPage={3} totalPages={5} baseUrl="/test" />);
    const currentPageLink = screen.getByText('3');
    expect(currentPageLink).toHaveAttribute('aria-current', 'page');
  });

  it('shows ellipsis for large page counts', () => {
    render(<Pagination currentPage={5} totalPages={20} baseUrl="/test" />);
    const ellipses = screen.getAllByText('...');
    expect(ellipses.length).toBeGreaterThan(0);
  });
});

describe('PaginationInfo', () => {
  it('shows correct range for first page', () => {
    render(
      <PaginationInfo currentPage={1} pageSize={10} totalItems={100} />
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('shows correct range for middle page', () => {
    render(
      <PaginationInfo currentPage={3} pageSize={10} totalItems={100} />
    );
    expect(screen.getByText('21')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('shows correct range for last page with partial results', () => {
    render(
      <PaginationInfo currentPage={4} pageSize={10} totalItems={35} />
    );
    expect(screen.getByText('31')).toBeInTheDocument();
    expect(screen.getByText('35')).toBeInTheDocument();
  });
});
