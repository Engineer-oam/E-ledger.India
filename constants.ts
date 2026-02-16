

import { CountryConfig, Sector, UserRole, User, Batch, ERPType } from './types';

// Default roles for sectors to apply to all countries
const DEFAULT_EXCISE_ROLES = [
  { role: UserRole.MANUFACTURER, label: 'Distillery / Brewery', description: 'Production and manufacturing node' },
  { role: UserRole.DISTRIBUTOR, label: 'State Warehouse', description: 'Bulk storage and logistics hub' },
  { role: UserRole.RETAILER, label: 'Authorized Vendor', description: 'Point of sale to consumers' },
  { role: UserRole.REGULATOR, label: 'Excise Commissioner', description: 'Government oversight and tax enforcement' }
];

// Updated for Indian Pharma Structure
const DEFAULT_PHARMA_ROLES = [
  { role: UserRole.MANUFACTURER, label: 'Manufacturer / Marketer', description: 'Own Manufacturing, Loan Licensee, or Third Party (LL/P2P)' },
  { role: UserRole.DISTRIBUTOR, label: 'C&F / Stockist', description: 'Carrying & Forwarding Agent, Super Stockist, or Wholesaler' },
  { role: UserRole.RETAILER, label: 'Chemist / Pharmacy', description: 'Retail Drug Store, Hospital Pharmacy, or Jan Aushadhi Kendra' },
  { role: UserRole.REGULATOR, label: 'Regulator (CDSCO/FDA)', description: 'Central or State Drug Control Authority' }
];

const DEFAULT_FMCG_ROLES = [
  { role: UserRole.MANUFACTURER, label: 'FMCG Plant', description: 'High-volume consumer goods production' },
  { role: UserRole.DISTRIBUTOR, label: 'Distribution Center', description: 'Primary logistics and sortation' },
  { role: UserRole.RETAILER, label: 'Retail Chain / Store', description: 'Consumer marketplace' },
  { role: UserRole.REGULATOR, label: 'FSSAI Authority', description: 'Consumer protection and standards' }
];

export const PHARMA_SUB_CATEGORIES = [
  'Active Pharma Ingredients (API)',
  'Formulations (FDF)',
  'Loan Licensee (LL)',
  'Third Party Manufacturing (P2P)',
  'C&F Agent',
  'Super Stockist',
  'Wholesale Distributor',
  'PCD Franchise',
  'Retail Chemist',
  'Hospital Pharmacy',
  'Jan Aushadhi Kendra',
  'Online Pharmacy (E-Pharmacy)',
  'Cold Chain Logistics'
];

const createCountry = (code: string, name: string): CountryConfig => ({
  code,
  name,
  sectors: {
    [Sector.PHARMA]: { roles: DEFAULT_PHARMA_ROLES },
    // Keeping other sectors in config structure for type safety, but UI will restrict to Pharma
    [Sector.EXCISE]: { roles: DEFAULT_EXCISE_ROLES },
    [Sector.FMCG]: { roles: DEFAULT_FMCG_ROLES }
  }
});

export const REGISTRY_CONFIG: CountryConfig[] = [
  createCountry('IN', 'India'),
];

export const MOCK_USERS: User[] = [
  {
    id: 'user-mfg-01',
    name: 'Dr. Rajesh Gupta',
    role: UserRole.MANUFACTURER,
    gln: '0890001234567',
    orgName: 'Bharat Biotech & Life Sciences',
    country: 'IN',
    sector: Sector.PHARMA,
    positionLabel: 'Manufacturer / Marketer',
    erpType: ERPType.MANUAL,
    erpStatus: 'CONNECTED',
    subCategories: ['Formulations (FDF)', 'Loan Licensee (LL)']
  }
];

export const INITIAL_BATCHES: Batch[] = [];