import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ContactSection } from '../home/ContactSection';
import { apiFetch } from '../../lib/api';

jest.mock('../../lib/api', () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

describe('ContactSection', () => {
  test('submits contact form and shows success message', async () => {
    mockApiFetch.mockResolvedValueOnce({ quote: { id: '1' } } as never);

    render(<ContactSection />);

    fireEvent.change(screen.getByPlaceholderText('Your name'), {
      target: { value: 'Alex Carter' },
    });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'alex@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Tell us how we can help'), {
      target: { value: 'Need an inspection for a new property.' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Submit Request' }));

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledTimes(1);
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      '/quotes',
      expect.objectContaining({
        method: 'POST',
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText('Thank you. We received your request and will contact you shortly.'),
      ).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText('Your name')).toHaveValue('');
    expect(screen.getByPlaceholderText('you@example.com')).toHaveValue('');
    expect(screen.getByPlaceholderText('Tell us how we can help')).toHaveValue('');
  });

  test('shows API error message on failed submit', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Server unavailable'));

    render(<ContactSection />);

    fireEvent.change(screen.getByPlaceholderText('Your name'), {
      target: { value: 'Jordan Lee' },
    });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'jordan@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Tell us how we can help'), {
      target: { value: 'Please contact me for consulting.' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Submit Request' }));

    await waitFor(() => {
      expect(screen.getByText('Server unavailable')).toBeInTheDocument();
    });
  });
});
