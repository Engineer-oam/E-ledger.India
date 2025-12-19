
import { CountryConfig, Sector, UserRole, User, Batch, ERPType } from './types';

export const REGISTRY_CONFIG: CountryConfig[] = [
  {
    code: 'IN',
    name: 'India',
    sectors: {
      [Sector.EXCISE]: {
        roles: [
          { role: UserRole.MANUFACTURER, label: 'Distillery / Brewery / Bottler', description: 'Primary manufacturing and production units' },
          { role: UserRole.DISTRIBUTOR, label: 'Bonded Warehouse / Depot', description: 'Stock storage and bulk wholesaling' },
          { role: UserRole.DISTRIBUTOR, label: 'Wholesale Hub (L-1)', description: 'Regional distribution level' },
          { role: UserRole.RETAILER, label: 'Retail Shop / Bar / Vendor', description: 'Point of Sale to end consumers' },
          { role: UserRole.REGULATOR, label: 'State Excise Inspector', description: 'Regulatory oversight and enforcement' }
        ]
      },
      [Sector.PHARMA]: {
        roles: [
          { role: UserRole.MANUFACTURER, label: 'Formulation / API Unit', description: 'Pharmaceutical manufacturing plants' },
          { role: UserRole.DISTRIBUTOR, label: 'C&F Agent', description: 'Carrying and Forwarding agent' },
          { role: UserRole.DISTRIBUTOR, label: 'Stockist / Wholesaler', description: 'Regional drug distribution' },
          { role: UserRole.RETAILER, label: 'Chemist / Pharmacy / Hospital', description: 'Final drug dispensing units' },
          { role: UserRole.REGULATOR, label: 'Drug Inspector (CDSCO)', description: 'Quality and compliance monitors' }
        ]
      },
      [Sector.FMCG]: {
        roles: [
          { role: UserRole.MANUFACTURER, label: 'Brand Owner / Manufacturer', description: 'Production of consumer packaged goods' },
          { role: UserRole.DISTRIBUTOR, label: 'C&F Agent / Warehouse', description: 'Primary logistics hub' },
          { role: UserRole.DISTRIBUTOR, label: 'Main Distributor', description: 'Town-level supply partner' },
          { role: UserRole.RETAILER, label: 'Retailer / Kirana Shop', description: 'Consumer touchpoint' }
        ]
      },
      [Sector.AGRICULTURE]: {
        roles: [
          { role: UserRole.MANUFACTURER, label: 'Farmer / Producer Group', description: 'Origin of agricultural produce' },
          { role: UserRole.DISTRIBUTOR, label: 'Aggregator / Mandi Agent', description: 'Collection and sorting hub' },
          { role: UserRole.DISTRIBUTOR, label: 'Processor / Packager', description: 'Value addition and packaging' },
          { role: UserRole.RETAILER, label: 'Exporter / Supermarket', description: 'Global or local market vendor' }
        ]
      }
    }
  },
  {
    code: 'US',
    name: 'United States',
    sectors: {
      [Sector.EXCISE]: {
        roles: [
          { role: UserRole.MANUFACTURER, label: 'Producer (DSP)', description: 'Distilled Spirits Plant' },
          { role: UserRole.DISTRIBUTOR, label: 'Importer / Wholesaler', description: 'Tier 2 distribution' },
          { role: UserRole.RETAILER, label: 'Licensed Retailer', description: 'Liquor stores and on-premise' },
          { role: UserRole.REGULATOR, label: 'TTB / State Board', description: 'Federal and State oversight' }
        ]
      },
      [Sector.PHARMA]: {
        roles: [
          { role: UserRole.MANUFACTURER, label: 'Manufacturer', description: 'DSCSA compliant manufacturer' },
          { role: UserRole.DISTRIBUTOR, label: 'Primary Distributor', description: 'Authorized drug distributor' },
          { role: UserRole.RETAILER, label: 'Dispenser (Pharmacy)', description: 'Hospitals and community pharmacies' },
          { role: UserRole.REGULATOR, label: 'FDA / DEA Auditor', description: 'Safety and quality enforcement' }
        ]
      },
      [Sector.FMCG]: {
        roles: [
          { role: UserRole.MANUFACTURER, label: 'Brand Manufacturer', description: 'CPG Producer' },
          { role: UserRole.DISTRIBUTOR, label: 'National Distributor', description: 'Mass market distribution' },
          { role: UserRole.RETAILER, label: 'Retail Chain / Store', description: 'Supermarkets and drugstores' }
        ]
      },
      [Sector.AGRICULTURE]: {
        roles: [
          { role: UserRole.MANUFACTURER, label: 'Commercial Farm', description: 'Large scale crop or livestock origin' },
          { role: UserRole.DISTRIBUTOR, label: 'Processor', description: 'Milling or processing facility' },
          { role: UserRole.DISTRIBUTOR, label: 'Food Importer', description: 'Global supply chain entry' },
          { role: UserRole.RETAILER, label: 'Retail Grocer', description: 'Consumer food sales' }
        ]
      }
    }
  },
  {
    code: 'NG',
    name: 'Nigeria',
    sectors: {
      [Sector.EXCISE]: {
        roles: [
          { role: UserRole.MANUFACTURER, label: 'Local Manufacturer', description: 'Alcohol and beverage production' },
          { role: UserRole.DISTRIBUTOR, label: 'Importer / Wholesale Agent', description: 'Bulk supply of imported spirits' },
          { role: UserRole.RETAILER, label: 'Licensed Vendor', description: 'Bars and retail outlets' },
          { role: UserRole.REGULATOR, label: 'Customs / NAFDAC', description: 'Import and safety regulation' }
        ]
      },
      [Sector.PHARMA]: {
        roles: [
          { role: UserRole.MANUFACTURER, label: 'Importer / Manufacturer', description: 'NAFDAC registered drug source' },
          { role: UserRole.DISTRIBUTOR, label: 'Wholesale Distributor', description: 'Bulk pharma trade' },
          { role: UserRole.RETAILER, label: 'Chemist / Pharmacy', description: 'Point of dispensing' }
        ]
      },
      [Sector.FMCG]: {
        roles: [
          { role: UserRole.MANUFACTURER, label: 'Producer', description: 'Consumer goods manufacturing' },
          { role: UserRole.DISTRIBUTOR, label: 'Distributor', description: 'Market-wide supply' },
          { role: UserRole.RETAILER, label: 'Open Market Seller', description: 'Traditional market vendors' }
        ]
      },
      [Sector.AGRICULTURE]: {
        roles: [
          { role: UserRole.MANUFACTURER, label: 'Farmer / Producer', description: 'Agricultural origin' },
          { role: UserRole.DISTRIBUTOR, label: 'Trader / Aggregator', description: 'Market middle-men' },
          { role: UserRole.RETAILER, label: 'Exporter', description: 'International trade partner' }
        ]
      }
    }
  },
  {
    code: 'KR',
    name: 'South Korea',
    sectors: {
      [Sector.EXCISE]: {
        roles: [
          { role: UserRole.MANUFACTURER, label: 'Soju / Liquor Producer', description: 'NTS regulated manufacture' },
          { role: UserRole.DISTRIBUTOR, label: 'Comprehensive Wholesaler', description: 'Licensed distribution tier' },
          { role: UserRole.RETAILER, label: 'Retailer / Restaurant', description: 'Final consumption point' },
          { role: UserRole.REGULATOR, label: 'National Tax Service', description: 'Tax and alcohol enforcement' }
        ]
      },
      [Sector.PHARMA]: {
        roles: [
          { role: UserRole.MANUFACTURER, label: 'Manufacturer', description: 'MFDS compliant production' },
          { role: UserRole.DISTRIBUTOR, label: 'Distributor', description: 'Logistics and supply chain' },
          { role: UserRole.RETAILER, label: 'Pharmacy / Hospital', description: 'Dispensing to patients' }
        ]
      },
      [Sector.FMCG]: {
        roles: [
          { role: UserRole.MANUFACTURER, label: 'Manufacturer', description: 'Brand owner' },
          { role: UserRole.DISTRIBUTOR, label: 'Distribution Hub', description: 'Regional supply' },
          { role: UserRole.RETAILER, label: 'Convenience Store (CVS)', description: 'Primary retail format' }
        ]
      },
      [Sector.AGRICULTURE]: {
        roles: [
          { role: UserRole.MANUFACTURER, label: 'Agricultural Cooperative', description: 'Farming union origin' },
          { role: UserRole.RETAILER, label: 'Exporter / Global Sales', description: 'International market entry' }
        ]
      }
    }
  }
];

export const MOCK_USERS: User[] = [
  {
    id: 'user-mfg-01',
    name: 'John Distiller',
    role: UserRole.MANUFACTURER,
    gln: '0490001234567',
    orgName: 'Royal Spirits Distillery',
    country: 'IN',
    sector: Sector.EXCISE,
    positionLabel: 'Distillery',
    // Added missing erpType and erpStatus to fix TypeScript error
    erpType: ERPType.MANUAL,
    erpStatus: 'CONNECTED'
  }
];

export const INITIAL_BATCHES: Batch[] = [];
