import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MoneyAmount } from '@/components/data-display/money-amount';

describe('MoneyAmount', () => {
  it('formats small amounts correctly', () => {
    render(<MoneyAmount amount={100} />);
    expect(screen.getByText('$100')).toBeInTheDocument();
  });

  it('formats large amounts with commas', () => {
    render(<MoneyAmount amount={1234567} />);
    expect(screen.getByText('$1,234,567')).toBeInTheDocument();
  });

  it('handles zero amount', () => {
    render(<MoneyAmount amount={0} />);
    expect(screen.getByText('$0')).toBeInTheDocument();
  });

  it('handles negative amounts', () => {
    render(<MoneyAmount amount={-500} />);
    expect(screen.getByText('-$500')).toBeInTheDocument();
  });

  it('shows short format for millions', () => {
    render(<MoneyAmount amount={1500000} short />);
    expect(screen.getByText('$1.5M')).toBeInTheDocument();
  });

  it('shows short format for thousands', () => {
    render(<MoneyAmount amount={25000} short />);
    expect(screen.getByText('$25.0K')).toBeInTheDocument();
  });

  it('shows short format for billions', () => {
    render(<MoneyAmount amount={2500000000} short />);
    expect(screen.getByText('$2.5B')).toBeInTheDocument();
  });

  it('has title attribute with full amount', () => {
    render(<MoneyAmount amount={1500000} short />);
    const element = screen.getByText('$1.5M');
    expect(element).toHaveAttribute('title', '$1,500,000');
  });
});
