export const propertyTypeValues = ['Detached', 'Condo', 'Townhouse'] as const;
export type PropertyType = (typeof propertyTypeValues)[number];

export const inspectionStatusValues = ['Draft', 'Finalized'] as const;
export type InspectionStatus = (typeof inspectionStatusValues)[number];

export const urgencyValues = ['Safety', 'Major', 'Maintenance'] as const;

export const draftExpiryDays = 7;

const condoSectionTitles = ['General', 'Interior', 'Electrical', 'Plumbing', 'HVAC'] as const;

const fullSectionTitles = [
  'General',
  'Roofing',
  'Exterior',
  'Structure',
  'Interior',
  'Electrical',
  'Plumbing',
  'HVAC',
  'Insulation & Ventilation',
  'Attic',
  'Basement',
  'Garage',
  'Appliances',
  'Grounds',
  'Safety',
] as const;

export function getInitialSections(propertyType: PropertyType) {
  const titles = propertyType === 'Condo' ? condoSectionTitles : fullSectionTitles;

  return titles.map((title) => ({
    title,
    isApplicable: true,
    limitations: '',
    findings: [],
  }));
}
