import { render, screen, waitFor } from '@testing-library/react';
import { MyReportsDashboard } from '../report-generator/MyReportsDashboard';
import { apiFetch } from '../../lib/api';

jest.mock('../../lib/api', () => ({
  apiFetch: jest.fn(),
}));

const mockedApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

describe('MyReportsDashboard', () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
  });

  test('shows sign-in prompt for non-inspector sessions', async () => {
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: jest.fn().mockResolvedValue({
        json: async () => ({ user: { role: 'customer' } }),
      }),
    });

    render(<MyReportsDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText('Sign in with an inspector account to view saved reports.'),
      ).toBeInTheDocument();
    });

    expect(mockedApiFetch).not.toHaveBeenCalled();
  });

  test('shows missing user id error when inspector session lacks id', async () => {
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: jest.fn().mockResolvedValue({
        json: async () => ({ user: { role: 'employee' } }),
      }),
    });

    render(<MyReportsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Missing user id on session. Please sign in again.')).toBeInTheDocument();
    });
  });

  test('renders reports list and counters for authenticated inspector', async () => {
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: jest.fn().mockResolvedValue({
        json: async () => ({ user: { role: 'admin', id: 'u-1' } }),
      }),
    });

    mockedApiFetch.mockResolvedValue({
      inspections: [
        {
          _id: 'r1',
          propertyAddress: '10 Main St',
          propertyType: 'Detached',
          status: 'Draft',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          sections: [],
        },
        {
          _id: 'r2',
          propertyAddress: '20 Main St',
          propertyType: 'Condo',
          status: 'Finalized',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          sections: [],
        },
      ],
    } as never);

    render(<MyReportsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('10 Main St')).toBeInTheDocument();
      expect(screen.getByText('20 Main St')).toBeInTheDocument();
    });

    expect(mockedApiFetch).toHaveBeenCalledWith('/inspections?authorId=u-1');
    expect(screen.getAllByRole('link', { name: 'Open Report' }).length).toBe(2);
    expect(screen.getAllByRole('link', { name: 'Download PDF' }).length).toBe(2);
  });

  test('shows backend error when reports load fails', async () => {
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: jest.fn().mockResolvedValue({
        json: async () => ({ user: { role: 'employee', id: 'u-1' } }),
      }),
    });

    mockedApiFetch.mockRejectedValue(new Error('Failed to load reports.'));

    render(<MyReportsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load reports.')).toBeInTheDocument();
    });
  });
});
