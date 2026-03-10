import type { ComponentProps } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QuoteRequestModal } from '../modals/QuoteRequestModal';
import { apiFetch } from '../../lib/api';

jest.mock('../../lib/api', () => ({
  apiFetch: jest.fn(),
}));

const mockedApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

describe('QuoteRequestModal', () => {
  afterEach(() => {
    mockedApiFetch.mockReset();
  });

  function renderModal(overrides?: Partial<ComponentProps<typeof QuoteRequestModal>>) {
    return render(
      <QuoteRequestModal
        isOpen
        onClose={jest.fn()}
        serviceName="Home Inspection"
        specification="Pre-Purchase Inspection"
        sourcePage="/home-inspection"
        {...overrides}
      />,
    );
  }

  test('prefills service and specification dropdowns', () => {
    renderModal();

    expect(screen.getByLabelText(/Type of Service/i)).toHaveValue('Home Inspection');
    expect(screen.getByLabelText(/Specification/i)).toHaveValue('Pre-Purchase Inspection');
  });

  test('requires phone number when preferred contact is phone', () => {
    renderModal();

    fireEvent.change(screen.getByLabelText(/Preferred Contact/i), { target: { value: 'phone' } });

    expect(screen.getByLabelText(/Phone Number/i)).toBeRequired();
  });

  test('does not submit when phone is preferred but empty', async () => {
    renderModal();

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Preferred Contact/i), { target: { value: 'phone' } });
    fireEvent.change(screen.getByLabelText(/Details of Your Request/i), {
      target: { value: 'Need an inspection quote.' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Submit Quote Request' }));

    await waitFor(() => {
      expect(mockedApiFetch).not.toHaveBeenCalled();
    });
  });

  test('submits quote payload successfully', async () => {
    mockedApiFetch.mockResolvedValue({ email: { sent: true } });
    renderModal();

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Details of Your Request/i), {
      target: { value: 'Need an inspection quote.' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Submit Quote Request' }));

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith('/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          phone: '',
          typeOfService: 'Home Inspection',
          specification: 'Pre-Purchase Inspection',
          requestDetails: 'Need an inspection quote.',
          preferredContactMethod: 'email',
          propertyLocation: '',
          sourcePage: '/home-inspection',
        }),
      });
    });
  });

  test('does not show forms subservices in specification dropdown', () => {
    renderModal({ serviceName: 'Property Management', specification: null });

    expect(screen.queryByRole('option', { name: 'Forms for Owners' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Forms for Tenants' })).not.toBeInTheDocument();
  });
});
