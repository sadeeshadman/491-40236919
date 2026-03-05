import { fireEvent, render, screen } from '@testing-library/react';
import { ServiceDetail } from '../services/ServiceDetail';
import { services } from '../../lib/services';

describe('ServiceDetail', () => {
  test('expands and collapses subservice details', () => {
    render(<ServiceDetail service={services[0]} />);

    const subserviceButton = screen.getByRole('button', { name: /Pre-Purchase Inspection/ });

    fireEvent.click(subserviceButton);

    expect(
      screen.getByText(
        'A full condition review before closing, focused on structural, electrical, plumbing, roofing, and safety-related findings.',
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Pre-Purchase Inspection/ }));

    expect(
      screen.queryByText(
        'A full condition review before closing, focused on structural, electrical, plumbing, roofing, and safety-related findings.',
      ),
    ).not.toBeInTheDocument();
  });

  test('renders no-subservices message for engineering consultants', () => {
    const engineeringService = services.find(
      (service) => service.slug === 'engineering-consultants',
    );

    if (!engineeringService) {
      throw new Error('Expected engineering-consultants service to exist');
    }

    render(<ServiceDetail service={engineeringService} />);

    expect(
      screen.getByText(
        'This service is delivered as a comprehensive consulting offering with tailored scope based on project requirements.',
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Request a Quote' }).length).toBe(1);
  });

  test('starts with a matching subservice expanded when provided', () => {
    render(
      <ServiceDetail service={services[0]} initialExpandedSubserviceId="pre-purchase-inspection" />,
    );

    expect(
      screen.getByText(
        'A full condition review before closing, focused on structural, electrical, plumbing, roofing, and safety-related findings.',
      ),
    ).toBeInTheDocument();
  });

  test('scrolls to the initially expanded subservice', () => {
    const scrollIntoViewMock = jest.fn();

    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: scrollIntoViewMock,
    });

    render(
      <ServiceDetail service={services[0]} initialExpandedSubserviceId="pre-purchase-inspection" />,
    );

    expect(scrollIntoViewMock).toHaveBeenCalled();
  });
});
