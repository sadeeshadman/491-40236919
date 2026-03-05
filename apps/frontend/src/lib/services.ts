export type Subservice = {
  id: string;
  name: string;
  description: string;
};

export type Service = {
  slug: string;
  name: string;
  shortDescription: string;
  overview: string;
  subservices: Subservice[];
};

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
        id: 'moisture-mold-screening',
        name: 'Moisture & Mold Screening',
        description:
          'Targeted review of moisture-prone areas to detect potential mold risks and suggest corrective actions.',
      },
    ],
  },
  {
    slug: 'property-management',
    name: 'Property Management',
    shortDescription:
      'Reliable management support for maintenance coordination, tenant communication, and long-term asset care.',
    overview:
      'Our Property Management service helps owners protect property value while reducing day-to-day operational stress. We manage communication, maintenance workflows, and service coordination with a focus on responsiveness and accountability.',
    subservices: [
      {
        id: 'tenant-placement',
        name: 'Tenant Placement',
        description:
          'Tenant screening and placement support designed to improve occupancy quality and reduce turnover risk.',
      },
      {
        id: 'rent-collection',
        name: 'Rent Collection',
        description:
          'Structured collection and reporting processes that keep payments organized and transparent for owners.',
      },
      {
        id: 'preventive-maintenance',
        name: 'Preventive Maintenance',
        description:
          'Scheduled maintenance planning to minimize emergency repairs and extend the life of key building systems.',
      },
      {
        id: 'move-inspections',
        name: 'Move-In/Move-Out Inspections',
        description:
          'Documented inspections at occupancy transitions to track condition and support clear accountability.',
      },
      {
        id: 'vendor-coordination',
        name: 'Vendor Coordination',
        description:
          'End-to-end coordination with trusted service vendors to ensure quality work and timely completion.',
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
