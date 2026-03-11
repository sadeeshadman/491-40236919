export type InspectionPropertyType = 'Detached' | 'Condo' | 'Townhouse';
export type InspectionStatus = 'Draft' | 'Finalized';
export type FindingUrgency = 'Safety' | 'Major' | 'Maintenance';

export type InspectionFinding = {
  component: string;
  condition: string;
  implication: string;
  recommendation: string;
  urgency: FindingUrgency;
  imageUrls: string[];
};

export type InspectionSection = {
  title: string;
  isApplicable: boolean;
  limitations: string;
  findings: InspectionFinding[];
};

export type InspectionDocument = {
  _id: string;
  propertyAddress: string;
  propertyType: InspectionPropertyType;
  status: InspectionStatus;
  createdAt: string;
  expiresAt?: string | null;
  sections: InspectionSection[];
};
