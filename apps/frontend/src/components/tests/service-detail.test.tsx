import { fireEvent, render, screen, within } from '@testing-library/react';
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
    expect(screen.getAllByRole('button', { name: 'Request a Quote' }).length).toBe(1);
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

  test('renders owner and tenant service groups for property management', () => {
    const propertyManagementService = services.find(
      (service) => service.slug === 'property-management',
    );

    if (!propertyManagementService) {
      throw new Error('Expected property-management service to exist');
    }

    render(<ServiceDetail service={propertyManagementService} />);

    expect(screen.getByRole('heading', { name: 'Services for Owners' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Services for Tenants' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Owner' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tenant' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Property Management/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Become a Tenant/ })).toBeInTheDocument();
  });

  test('scrolls to tenant section when tenant audience is selected', () => {
    const propertyManagementService = services.find(
      (service) => service.slug === 'property-management',
    );

    if (!propertyManagementService) {
      throw new Error('Expected property-management service to exist');
    }

    const scrollIntoViewMock = jest.fn();

    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: scrollIntoViewMock,
    });

    render(<ServiceDetail service={propertyManagementService} />);

    fireEvent.click(screen.getByRole('button', { name: 'Tenant' }));

    expect(scrollIntoViewMock).toHaveBeenCalled();
  });

  test('opens quote modal with service prefilled from page-level action', () => {
    render(<ServiceDetail service={services[0]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Request a Quote' }));

    expect(screen.getByRole('dialog', { name: 'Request a Quote' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Type of Service/i)).toHaveValue('Home Inspection');
    expect(screen.getByLabelText(/Specification/i)).toHaveValue('');
  });

  test('opens quote modal with subservice prefilled from subservice action', () => {
    render(<ServiceDetail service={services[0]} />);

    fireEvent.click(screen.getByRole('button', { name: /Pre-Purchase Inspection/ }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Request a Quote' })[0]);

    expect(screen.getByRole('dialog', { name: 'Request a Quote' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Type of Service/i)).toHaveValue('Home Inspection');
    expect(screen.getByLabelText(/Specification/i)).toHaveValue('Pre-Purchase Inspection');
  });

  test('does not show subservice quote buttons for forms subservices', () => {
    const propertyManagementService = services.find(
      (service) => service.slug === 'property-management',
    );

    if (!propertyManagementService) {
      throw new Error('Expected property-management service to exist');
    }

    render(<ServiceDetail service={propertyManagementService} />);

    const ownerFormsTrigger = screen.getByRole('button', { name: /Forms for Owners/ });
    const tenantFormsTrigger = screen.getByRole('button', { name: /Forms for Tenants/ });

    fireEvent.click(ownerFormsTrigger);
    fireEvent.click(tenantFormsTrigger);

    const ownerFormsCard = ownerFormsTrigger.closest('article');
    const tenantFormsCard = tenantFormsTrigger.closest('article');

    if (!ownerFormsCard || !tenantFormsCard) {
      throw new Error('Expected forms cards to exist');
    }

    expect(
      within(ownerFormsCard).queryByRole('button', { name: 'Request a Quote' }),
    ).not.toBeInTheDocument();
    expect(
      within(tenantFormsCard).queryByRole('button', { name: 'Request a Quote' }),
    ).not.toBeInTheDocument();
  });
});
