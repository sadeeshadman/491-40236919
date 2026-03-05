import { render, screen } from '@testing-library/react';
import ServicePage, { generateStaticParams } from '@/app/[slug]/page';

const notFoundMock = jest.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});

jest.mock('next/navigation', () => ({
  notFound: () => notFoundMock(),
}));

describe('ServicePage route', () => {
  test('returns static params for all services', () => {
    const params = generateStaticParams();

    expect(params).toEqual(
      expect.arrayContaining([
        { slug: 'home-inspection' },
        { slug: 'property-management' },
        { slug: 'construction-services' },
        { slug: 'engineering-consultants' },
      ]),
    );
  });

  test('renders service page for a valid slug', async () => {
    const element = await ServicePage({
      params: Promise.resolve({ slug: 'construction-services' }),
      searchParams: Promise.resolve({}),
    });
    render(element);

    expect(screen.getByRole('heading', { name: 'Construction Services' })).toBeInTheDocument();
    expect(screen.getByText('Coring')).toBeInTheDocument();
  });

  test('calls notFound for invalid slug', async () => {
    await expect(
      ServicePage({
        params: Promise.resolve({ slug: 'not-a-service' }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });

  test('expands requested subservice from query params', async () => {
    const element = await ServicePage({
      params: Promise.resolve({ slug: 'construction-services' }),
      searchParams: Promise.resolve({ subservice: 'coring' }),
    });
    render(element);

    expect(
      screen.getByText(
        'Precision concrete coring for mechanical, electrical, and plumbing pathways with controlled site practices.',
      ),
    ).toBeInTheDocument();
  });
});
