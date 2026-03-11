import { render, screen } from '@testing-library/react';
import ReportsDashboardPage from '../../app/report-generator/page';
import ReportGeneratorPage from '../../app/report-generator/[id]/page';

jest.mock('../layout/SiteHeader', () => ({
  SiteHeader: () => <header data-testid="site-header" />,
}));

jest.mock('../report-generator/MyReportsDashboard', () => ({
  MyReportsDashboard: () => <div data-testid="my-reports-dashboard" />,
}));

jest.mock('../report-generator/InspectionWorkspace', () => ({
  InspectionWorkspace: ({ inspectionId }: { inspectionId: string }) => (
    <div data-testid="inspection-workspace">workspace-{inspectionId}</div>
  ),
}));

describe('report-generator pages', () => {
  test('renders My Reports dashboard page shell', () => {
    render(<ReportsDashboardPage />);

    expect(screen.getByTestId('site-header')).toBeInTheDocument();
    expect(screen.getByText('My Reports')).toBeInTheDocument();
    expect(screen.getByTestId('my-reports-dashboard')).toBeInTheDocument();
  });

  test('renders inspection workspace page with id from params', async () => {
    const element = await ReportGeneratorPage({
      params: Promise.resolve({ id: 'inspection-42' }),
    });

    render(element);

    expect(screen.getByTestId('site-header')).toBeInTheDocument();
    expect(screen.getByText('Inspection Workspace')).toBeInTheDocument();
    expect(screen.getByText('Inspection ID: inspection-42')).toBeInTheDocument();
    expect(screen.getByTestId('inspection-workspace')).toHaveTextContent('workspace-inspection-42');
  });
});
