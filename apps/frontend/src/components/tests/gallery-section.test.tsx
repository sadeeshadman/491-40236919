import { act, fireEvent, render, screen } from '@testing-library/react';
import { GallerySection } from '@/components/home/GallerySection';

describe('GallerySection', () => {
  test('advances slides using next and previous controls', () => {
    render(<GallerySection />);

    expect(screen.getByRole('heading', { name: 'Home Inspection' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('heading', { name: 'Property Management' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByRole('heading', { name: 'Home Inspection' })).toBeInTheDocument();
  });

  test('jumps to a slide when dot indicator is clicked', () => {
    render(<GallerySection />);

    fireEvent.click(screen.getByRole('button', { name: 'Go to Construction Services' }));

    expect(screen.getByRole('heading', { name: 'Construction Services' })).toBeInTheDocument();
  });

  test('autoplays to next slide after interval', () => {
    jest.useFakeTimers();

    render(<GallerySection />);

    expect(screen.getByRole('heading', { name: 'Home Inspection' })).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(screen.getByRole('heading', { name: 'Property Management' })).toBeInTheDocument();

    jest.useRealTimers();
  });
});
