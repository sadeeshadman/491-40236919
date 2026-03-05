import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Home page', () => {
  test('renders header navigation and all core sections', () => {
    render(<Home />);

    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Services' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'About Us' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact Us' })).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: 'Complete Property Support from a Single Team' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Who We Are and Why Homeowners Trust Constein Group' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Talk to Constein Group About Your Home Project' }),
    ).toBeInTheDocument();
  });
});
