import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with custom text', () => {
    const testText = 'Loading events...';
    render(<LoadingSpinner text={testText} />);
    
    expect(screen.getByText(testText)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'my-custom-class';
    const { container } = render(<LoadingSpinner className={customClass} />);
    
    const spinnerContainer = container.firstChild as HTMLElement;
    expect(spinnerContainer).toHaveClass(customClass);
  });

  it('renders different sizes correctly', () => {
    const { rerender, container } = render(<LoadingSpinner size="sm" />);
    let spinner = container.querySelector('svg') as SVGElement;
    expect(spinner).toHaveClass('h-4', 'w-4');

    rerender(<LoadingSpinner size="lg" />);
    spinner = container.querySelector('svg') as SVGElement;
    expect(spinner).toHaveClass('h-8', 'w-8');

    rerender(<LoadingSpinner size="xl" />);
    spinner = container.querySelector('svg') as SVGElement;
    expect(spinner).toHaveClass('h-12', 'w-12');
  });

  it('has proper accessibility attributes', () => {
    render(<LoadingSpinner text="Loading..." />);
    
    const text = screen.getByText('Loading...');
    expect(text).toBeInTheDocument();
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-live', 'polite');
  });
}); 