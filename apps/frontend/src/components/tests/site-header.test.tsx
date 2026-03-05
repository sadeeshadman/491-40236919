import { fireEvent, render, screen } from '@testing-library/react';
import { SiteHeader } from '../layout/SiteHeader';

describe('SiteHeader', () => {
  test('opens services dropdown on click and shows service columns', () => {
    render(<SiteHeader />);

    const servicesButton = screen.getByRole('button', { name: 'Services' });
    fireEvent.click(servicesButton);

    expect(screen.getByRole('link', { name: 'Home Inspection' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Property Management' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Construction Services' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Engineering Consultants' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Coring' })).toHaveAttribute(
      'href',
      '/construction-services?subservice=coring',
    );
    expect(screen.queryByText('No subservices listed.')).not.toBeInTheDocument();
  });

  test('closes services dropdown when clicked again', () => {
    render(<SiteHeader />);

    const servicesButton = screen.getByRole('button', { name: 'Services' });
    fireEvent.click(servicesButton);
    expect(screen.getByRole('link', { name: 'Home Inspection' })).toBeInTheDocument();

    fireEvent.click(servicesButton);
    expect(screen.queryByRole('link', { name: 'Home Inspection' })).not.toBeInTheDocument();
  });
});
