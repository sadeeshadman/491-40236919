import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { ServiceDetail } from '@/components/services/ServiceDetail';
import { getServiceBySlug, services } from '@/lib/services';

type ServicePageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ subservice?: string }>;
};

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export default async function ServicePage({ params, searchParams }: ServicePageProps) {
  const { slug } = await params;
  const { subservice } = await searchParams;
  const service = getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  const initialExpandedSubserviceId =
    subservice && service.subservices.some((item) => item.id === subservice) ? subservice : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <SiteHeader />
      <ServiceDetail
        key={`${service.slug}:${initialExpandedSubserviceId ?? 'none'}`}
        service={service}
        initialExpandedSubserviceId={initialExpandedSubserviceId}
      />
    </div>
  );
}
