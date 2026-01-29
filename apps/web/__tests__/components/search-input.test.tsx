import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SearchInput } from '@/components/ui/search-input';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('SearchInput', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders with default placeholder', () => {
    render(<SearchInput />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<SearchInput placeholder="Find something" />);
    expect(screen.getByPlaceholderText('Find something')).toBeInTheDocument();
  });

  it('has accessible label', () => {
    render(<SearchInput label="Search the site" />);
    expect(screen.getByLabelText('Search the site')).toBeInTheDocument();
  });

  it('updates value on input', () => {
    render(<SearchInput />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'test query' } });
    expect(input).toHaveValue('test query');
  });

  it('navigates on form submit', () => {
    render(<SearchInput />);
    const input = screen.getByRole('searchbox');
    const form = input.closest('form');

    fireEvent.change(input, { target: { value: 'microsoft' } });
    fireEvent.submit(form!);

    expect(mockPush).toHaveBeenCalledWith('/search?q=microsoft');
  });

  it('trims whitespace from query', () => {
    render(<SearchInput />);
    const input = screen.getByRole('searchbox');
    const form = input.closest('form');

    fireEvent.change(input, { target: { value: '  boeing  ' } });
    fireEvent.submit(form!);

    expect(mockPush).toHaveBeenCalledWith('/search?q=boeing');
  });

  it('does not navigate with empty query', () => {
    render(<SearchInput />);
    const input = screen.getByRole('searchbox');
    const form = input.closest('form');

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(form!);

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('has submit button with accessible label', () => {
    render(<SearchInput />);
    expect(screen.getByLabelText('Submit search')).toBeInTheDocument();
  });
});
