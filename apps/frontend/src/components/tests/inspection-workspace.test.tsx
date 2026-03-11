import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { InspectionWorkspace } from '../report-generator/InspectionWorkspace';
import { apiFetch } from '../../lib/api';

jest.mock('browser-image-compression', () => jest.fn());

jest.mock('../../lib/api', () => ({
  apiFetch: jest.fn(),
}));

const mockedApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const baseInspection = {
  _id: 'inspection-1',
  propertyAddress: '123 Test Street',
  propertyType: 'Detached' as const,
  status: 'Draft' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  sections: [
    {
      title: 'General',
      isApplicable: true,
      limitations: '',
      findings: [],
    },
  ],
};

describe('InspectionWorkspace', () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
  });

  test('shows load error when inspection fetch fails', async () => {
    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path.startsWith('/inspections/')) {
        throw new Error('Failed to load inspection.');
      }

      return { comments: [] } as never;
    });

    render(<InspectionWorkspace inspectionId="bad-id" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load inspection.')).toBeInTheDocument();
    });
  });

  test('supports manual save, finalize, and revert flow', async () => {
    const finalizedInspection = {
      ...baseInspection,
      status: 'Finalized' as const,
      updatedAt: new Date().toISOString(),
    };

    const revertedInspection = {
      ...baseInspection,
      status: 'Draft' as const,
      updatedAt: new Date().toISOString(),
    };

    mockedApiFetch.mockImplementation(async (path: string, init?: RequestInit) => {
      if (path === '/inspections/inspection-1') {
        if (init?.method === 'PATCH') {
          return { inspection: baseInspection } as never;
        }

        return { inspection: baseInspection } as never;
      }

      if (path === '/comments') {
        return { comments: [] } as never;
      }

      if (path === '/inspections/inspection-1/finalize') {
        return { inspection: finalizedInspection } as never;
      }

      if (path === '/inspections/inspection-1/revert') {
        return { inspection: revertedInspection } as never;
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    render(<InspectionWorkspace inspectionId="inspection-1" />);

    await screen.findByText('Active Section');

    fireEvent.click(screen.getByRole('button', { name: 'Save Progress' }));

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith('/inspections/inspection-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyAddress: '123 Test Street',
          propertyType: 'Detached',
          status: 'Draft',
          sections: baseInspection.sections,
        }),
      });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Finalize Inspection' }));
    expect(screen.getByRole('heading', { name: 'Finalize Inspection' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Proceed' }));

    await waitFor(() => {
      expect(screen.getByText('Inspection finalized. Editing is now locked.')).toBeInTheDocument();
    });

    expect(screen.getAllByRole('link', { name: 'Download Final PDF' }).length).toBeGreaterThan(0);

    const revertButton = screen.getByRole('button', {
      name: 'Revert to Draft (10-minute safety window)',
    });
    fireEvent.click(revertButton);

    await waitFor(() => {
      expect(screen.getByText('Inspection reverted to draft. Editing is enabled again.')).toBeInTheDocument();
    });
  });

  test('adds a finding using canned comment quick-fill', async () => {
    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === '/inspections/inspection-1') {
        return { inspection: baseInspection } as never;
      }

      if (path === '/comments') {
        return {
          comments: [
            {
              _id: 'c1',
              category: 'Electrical',
              title: 'Missing GFCI',
              condition: 'No GFCI present',
              implication: 'Shock risk',
              recommendation: 'Install GFCI',
            },
          ],
        } as never;
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    render(<InspectionWorkspace inspectionId="inspection-1" />);

    await screen.findByText('Active Section');

    fireEvent.click(screen.getByRole('button', { name: 'Add Finding' }));

    fireEvent.change(screen.getByLabelText('Quick-fill from canned comments'), {
      target: { value: 'gfc' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Missing GFCI Electrical' }));

    fireEvent.change(screen.getByLabelText('Component'), {
      target: { value: 'Bathroom outlet' },
    });

    const submitButton = screen
      .getAllByRole('button', { name: 'Add Finding' })
      .find((button) => button.getAttribute('type') === 'submit');

    if (!submitButton) {
      throw new Error('Expected Add Finding submit button to exist');
    }

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Bathroom outlet')).toBeInTheDocument();
    });

    expect(screen.getByText('Condition: No GFCI present')).toBeInTheDocument();
    expect(screen.getByText('Implication: Shock risk')).toBeInTheDocument();
    expect(screen.getByText('Recommendation: Install GFCI')).toBeInTheDocument();
  });
});
