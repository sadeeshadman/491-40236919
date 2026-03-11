export type Subservice = {
  id: string;
  name: string;
  description: string;
  audience?: 'owner' | 'tenant';
  forms?: FormResource[];
};

export type FormResource = {
  id: string;
  name: string;
  href: string;
};

export type Service = {
  slug: string;
  name: string;
  shortDescription: string;
  overview: string;
  subservices: Subservice[];
};

const quoteDisabledSubserviceIds = new Set(['owner-forms', 'tenant-forms']);

export function canRequestQuoteForSubservice(subservice: Pick<Subservice, 'id'>) {
  return !quoteDisabledSubserviceIds.has(subservice.id);
}

export const services: Service[] = [
  {
    slug: 'home-inspection',
    name: 'Home Inspection',
    shortDescription:
      'Comprehensive property inspections that identify risks early and help you make confident home decisions.',
    overview:
      'Our Home Inspection service gives homeowners and buyers a clear picture of property condition, safety concerns, and maintenance priorities. We provide detailed findings with practical recommendations so you can plan improvements and investments with confidence.',
    subservices: [
      {
        id: 'pre-purchase-inspection',
        name: 'Pre-Purchase Inspection',
        description:
          'A full condition review before closing, focused on structural, electrical, plumbing, roofing, and safety-related findings.',
      },
      {
        id: 'pre-listing-inspection',
        name: 'Pre-Listing Inspection',
        description:
          'A seller-focused assessment to identify issues before listing, helping reduce surprises during negotiation.',
      },
      {
        id: 'new-construction-inspection',
        name: 'New Construction Inspection',
        description:
          'Independent quality checks for newly built homes before handover, including workmanship and system verification.',
      },
      {
        id: 'annual-maintenance-inspection',
        name: 'Annual Maintenance Inspection',
        description:
          'Routine yearly inspection to catch wear-and-tear early and create a preventive maintenance plan.',
      },
      {
        id: 'commercial-inspection',
        name: 'Commercial Property Inspection',
        description:
          'Targeted review of commercial properties to identify potential risks and suggest corrective actions.',
      },
    ],
  },
  {
    slug: 'property-management',
    name: 'Property Management',
    shortDescription:
      'Reliable management support for maintenance coordination, tenant communication, and long-term asset care.',
    overview:
      'Our Property Management service in Ottawa, Ontario helps property owners protect value, reduce day-to-day workload, and keep operations running smoothly year-round. We coordinate tenant communication, inspections, documentation, and maintenance with responsive support tailored to local rental expectations in Ottawa, Ontario. Whether you are an owner growing your portfolio or a tenant looking for reliable support, our team provides practical guidance and structured processes that make property management clear, consistent, and accountable.',
    subservices: [
      {
        id: 'owner-property-management',
        name: 'Property Management',
        description:
          'End-to-end management support for owners, including communication, planning, and ongoing operational oversight.',
        audience: 'owner',
      },
      {
        id: 'tenant-placement',
        name: 'Tenant Placement',
        description:
          'Targeted placement support to help owners find reliable tenants and reduce vacancy time.',
        audience: 'owner',
      },
      {
        id: 'tenant-screening',
        name: 'Tenant Screening',
        description:
          'Background, reference, and application review processes designed to improve tenant quality and reduce risk.',
        audience: 'owner',
      },
      {
        id: 'move-in-move-out-inspection',
        name: 'Move In/Move Out Inspection',
        description:
          'Documented condition inspections at tenancy transitions to protect owners and create clear records.',
        audience: 'owner',
      },
      {
        id: 'maintenance',
        name: 'Maintenance',
        description:
          'Coordinated preventive and corrective maintenance to keep properties safe, functional, and tenant-ready.',
        audience: 'owner',
      },
      {
        id: 'owner-forms',
        name: 'Forms for Owners',
        description:
          'Owner-focused forms and documentation support for inspections, onboarding, and routine property workflows.',
        audience: 'owner',
        forms: [
          {
            id: 'owner-eviction-notice-n12',
            name: 'Eviction Notice',
            href: '/forms/property-management/owners/N12-Notice%20of%20Eviction.pdf',
          },
        ],
      },
      {
        id: 'become-a-tenant',
        name: 'Become a Tenant',
        description:
          'Guidance for prospective tenants on rental opportunities, application steps, and move-in readiness.',
        audience: 'tenant',
      },
      {
        id: 'required-documents',
        name: 'Required Documents',
        description:
          'Clear checklist of required documents to help tenants complete applications quickly and accurately.',
        audience: 'tenant',
      },
      {
        id: 'tenant-forms',
        name: 'Forms for Tenants',
        description:
          'Tenant-facing forms for applications, requests, and communication throughout the tenancy lifecycle.',
        audience: 'tenant',
      },
    ],
  },
  {
    slug: 'construction-services',
    name: 'Construction Services',
    shortDescription:
      'Structured project delivery for renovations and upgrades with clear timelines, quality checks, and execution.',
    overview:
      'Our Construction Services team supports residential and light commercial projects with disciplined execution and field oversight. From testing and prep work to finishing support, we deliver practical solutions that match project goals and budgets.',
    subservices: [
      {
        id: 'coring',
        name: 'Coring',
        description:
          'Precision concrete coring for mechanical, electrical, and plumbing pathways with controlled site practices.',
      },
      {
        id: 'concrete-testing',
        name: 'Concrete Testing',
        description:
          'Field and lab-based concrete quality testing to verify compliance with project standards.',
      },
      {
        id: 'security',
        name: 'Security',
        description:
          'Site-focused security support to help protect materials, equipment, and project continuity.',
      },
      {
        id: 'painting',
        name: 'Painting',
        description:
          'Interior and exterior painting services with surface prep, quality finishing, and durable coatings.',
      },
      {
        id: 'handyman',
        name: 'Handyman',
        description:
          'General repair and small-scope improvement services for timely project and property support.',
      },
      {
        id: 'snow-removal',
        name: 'Snow Removal',
        description:
          'Seasonal snow and ice clearing services to keep access routes safe and operations uninterrupted.',
      },
    ],
  },
  {
    slug: 'engineering-consultants',
    name: 'Engineering Consultants',
    shortDescription:
      'Technical consulting for structural and systems planning to keep your project safe, efficient, and compliant.',
    overview:
      'Our Engineering Consultants provide technical analysis and practical planning support for renovation and development decisions. We help clients align scope, safety, and compliance requirements before and during project execution.',
    subservices: [],
  },
];

export function getServiceBySlug(slug: string) {
  return services.find((service) => service.slug === slug);
}
