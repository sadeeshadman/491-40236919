import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ServiceDetail } from '../services/ServiceDetail';
import { services } from '../../lib/services';
import { apiFetch } from '../../lib/api';

jest.mock('../../lib/api', () => ({
  apiFetch: jest.fn(),
}));

const mockedApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

describe('ServiceDetail', () => {
  afterEach(() => {
    mockedApiFetch.mockReset();
    jest.restoreAllMocks();
  });

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

  test('shows owner forms list with Eviction Notice link', () => {
    const propertyManagementService = services.find(
      (service) => service.slug === 'property-management',
    );

    if (!propertyManagementService) {
      throw new Error('Expected property-management service to exist');
    }

    render(<ServiceDetail service={propertyManagementService} />);

    fireEvent.click(screen.getByRole('button', { name: /Forms for Owners/ }));

    const formLink = screen.getByRole('link', { name: /Eviction Notice/i });

    expect(formLink).toBeInTheDocument();
    expect(formLink).toHaveAttribute(
      'href',
      '/forms/property-management/owners/N12-Notice%20of%20Eviction.pdf',
    );
  });

  test('shows report generator action inside home inspection report-generator subservice', () => {
    render(<ServiceDetail service={services[0]} />);

    fireEvent.click(screen.getByRole('button', { name: /Inspection Report Generator/ }));

    expect(screen.getByRole('button', { name: 'Open Report Generator' })).toBeInTheDocument();
  });

  test('validates address before opening report generator', () => {
    render(<ServiceDetail service={services[0]} />);

    fireEvent.click(screen.getByRole('button', { name: /Inspection Report Generator/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Open Report Generator' }));

    expect(screen.getByText('Property address is required to start a report.')).toBeInTheDocument();
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });

  test('starts inspection and navigates to report workspace', async () => {
    mockedApiFetch.mockResolvedValue({ inspection: { _id: 'inspection-123' } });

    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

    render(<ServiceDetail service={services[0]} />);

    fireEvent.click(screen.getByRole('button', { name: /Inspection Report Generator/ }));
    fireEvent.change(screen.getByLabelText(/Property Address/i), {
      target: { value: '101 Example Ave, Ottawa' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Open Report Generator' }));

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith('/inspections/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyAddress: '101 Example Ave, Ottawa',
          propertyType: 'Detached',
        }),
      });
    });

    expect(openSpy).toHaveBeenCalledWith('/report-generator/inspection-123', '_self');
  });

  test('shows launch error if inspection start request fails', async () => {
    mockedApiFetch.mockRejectedValue(new Error('Start failed'));

    render(<ServiceDetail service={services[0]} />);

    fireEvent.click(screen.getByRole('button', { name: /Inspection Report Generator/ }));
    fireEvent.change(screen.getByLabelText(/Property Address/i), {
      target: { value: '88 Main St' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Open Report Generator' }));

    await waitFor(() => {
      expect(screen.getByText('Start failed')).toBeInTheDocument();
    });
  });
});
