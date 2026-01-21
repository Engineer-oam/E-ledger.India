
import { CountryConfig, Sector, UserRole, User, Batch, ERPType } from './types';

// Default roles for sectors to apply to all countries
const DEFAULT_EXCISE_ROLES = [
  { role: UserRole.MANUFACTURER, label: 'Licensed Producer', description: 'Production and manufacturing node' },
  { role: UserRole.DISTRIBUTOR, label: 'Bonded Warehouse', description: 'Bulk storage and logistics hub' },
  { role: UserRole.RETAILER, label: 'Authorized Vendor', description: 'Point of sale to consumers' },
  { role: UserRole.REGULATOR, label: 'Excise Auditor', description: 'Government oversight and tax enforcement' }
];

const DEFAULT_PHARMA_ROLES = [
  { role: UserRole.MANUFACTURER, label: 'Pharma Factory', description: 'GMP drug manufacturing unit' },
  { role: UserRole.DISTRIBUTOR, label: 'Wholesale Distributor', description: 'GDP compliant logistics node' },
  { role: UserRole.RETAILER, label: 'Certified Pharmacy', description: 'Final drug dispensing point' },
  { role: UserRole.REGULATOR, label: 'Health Inspector', description: 'Regulatory safety and compliance' }
];

const DEFAULT_FMCG_ROLES = [
  { role: UserRole.MANUFACTURER, label: 'FMCG Plant', description: 'High-volume consumer goods production' },
  { role: UserRole.DISTRIBUTOR, label: 'Distribution Center', description: 'Primary logistics and sortation' },
  { role: UserRole.RETAILER, label: 'Retail Chain / Store', description: 'Consumer marketplace' },
  { role: UserRole.REGULATOR, label: 'Standards Authority', description: 'Consumer protection and standards' }
];

const createCountry = (code: string, name: string): CountryConfig => ({
  code,
  name,
  sectors: {
    [Sector.EXCISE]: { roles: DEFAULT_EXCISE_ROLES },
    [Sector.PHARMA]: { roles: DEFAULT_PHARMA_ROLES },
    [Sector.FMCG]: { roles: DEFAULT_FMCG_ROLES }
  }
});

export const REGISTRY_CONFIG: CountryConfig[] = [
  // --- AFRICA ---
  createCountry('DZ', 'Algeria'), createCountry('AO', 'Angola'), createCountry('BJ', 'Benin'),
  createCountry('BW', 'Botswana'), createCountry('BF', 'Burkina Faso'), createCountry('BI', 'Burundi'),
  createCountry('CV', 'Cabo Verde'), createCountry('CM', 'Cameroon'), createCountry('CF', 'Central African Republic'),
  createCountry('TD', 'Chad'), createCountry('KM', 'Comoros'), createCountry('CD', 'Congo (DRC)'),
  createCountry('CG', 'Congo (Republic)'), createCountry('CI', 'Côte d\'Ivoire'), createCountry('DJ', 'Djibouti'),
  createCountry('EG', 'Egypt'), createCountry('GQ', 'Equatorial Guinea'), createCountry('ER', 'Eritrea'),
  createCountry('SZ', 'Eswatini'), createCountry('ET', 'Ethiopia'), createCountry('GA', 'Gabon'),
  createCountry('GM', 'Gambia'), createCountry('GH', 'Ghana'), createCountry('GN', 'Guinea'),
  createCountry('GW', 'Guinea-Bissau'), createCountry('KE', 'Kenya'), createCountry('LS', 'Lesotho'),
  createCountry('LR', 'Liberia'), createCountry('LY', 'Libya'), createCountry('MG', 'Madagascar'),
  createCountry('MW', 'Malawi'), createCountry('ML', 'Mali'), createCountry('MR', 'Mauritania'),
  createCountry('MU', 'Mauritius'), createCountry('MA', 'Morocco'), createCountry('MZ', 'Mozambique'),
  createCountry('NA', 'Namibia'), createCountry('NE', 'Niger'), createCountry('NG', 'Nigeria'),
  createCountry('RW', 'Rwanda'), createCountry('ST', 'Sao Tome and Principe'), createCountry('SN', 'Senegal'),
  createCountry('SC', 'Seychelles'), createCountry('SL', 'Sierra Leone'), createCountry('SO', 'Somalia'),
  createCountry('ZA', 'South Africa'), createCountry('SS', 'South Sudan'), createCountry('SD', 'Sudan'),
  createCountry('TZ', 'Tanzania'), createCountry('TG', 'Togo'), createCountry('TN', 'Tunisia'),
  createCountry('UG', 'Uganda'), createCountry('ZM', 'Zambia'), createCountry('ZW', 'Zimbabwe'),

  // --- AMERICAS ---
  createCountry('AG', 'Antigua and Barbuda'), createCountry('AR', 'Argentina'), createCountry('BS', 'Bahamas'),
  createCountry('BB', 'Barbados'), createCountry('BZ', 'Belize'), createCountry('BO', 'Bolivia'),
  createCountry('BR', 'Brazil'), createCountry('CA', 'Canada'), createCountry('CL', 'Chile'),
  createCountry('CO', 'Colombia'), createCountry('CR', 'Costa Rica'), createCountry('CU', 'Cuba'),
  createCountry('DM', 'Dominica'), createCountry('DO', 'Dominican Republic'), createCountry('EC', 'Ecuador'),
  createCountry('SV', 'El Salvador'), createCountry('GD', 'Grenada'), createCountry('GT', 'Guatemala'),
  createCountry('GY', 'Guyana'), createCountry('HT', 'Haiti'), createCountry('HN', 'Honduras'),
  createCountry('JM', 'Jamaica'), createCountry('MX', 'Mexico'), createCountry('NI', 'Nicaragua'),
  createCountry('PA', 'Panama'), createCountry('PY', 'Paraguay'), createCountry('PE', 'Peru'),
  createCountry('KN', 'Saint Kitts and Nevis'), createCountry('LC', 'Saint Lucia'), createCountry('VC', 'Saint Vincent'),
  createCountry('SR', 'Suriname'), createCountry('TT', 'Trinidad and Tobago'), createCountry('US', 'United States'),
  createCountry('UY', 'Uruguay'), createCountry('VE', 'Venezuela'),

  // --- ASIA ---
  createCountry('AF', 'Afghanistan'), createCountry('AM', 'Armenia'), createCountry('AZ', 'Azerbaijan'),
  createCountry('BH', 'Bahrain'), createCountry('BD', 'Bangladesh'), createCountry('BT', 'Bhutan'),
  createCountry('BN', 'Brunei'), createCountry('KH', 'Cambodia'), createCountry('CN', 'China'),
  createCountry('CY', 'Cyprus'), createCountry('GE', 'Georgia'), createCountry('IN', 'India'),
  createCountry('ID', 'Indonesia'), createCountry('IR', 'Iran'), createCountry('IQ', 'Iraq'),
  createCountry('IL', 'Israel'), createCountry('JP', 'Japan'), createCountry('JO', 'Jordan'),
  createCountry('KZ', 'Kazakhstan'), createCountry('KW', 'Kuwait'), createCountry('KG', 'Kyrgyzstan'),
  createCountry('LA', 'Laos'), createCountry('LB', 'Lebanon'), createCountry('MY', 'Malaysia'),
  createCountry('MV', 'Maldives'), createCountry('MN', 'Mongolia'), createCountry('MM', 'Myanmar'),
  createCountry('NP', 'Nepal'), createCountry('KP', 'North Korea'), createCountry('OM', 'Oman'),
  createCountry('PK', 'Pakistan'), createCountry('PS', 'Palestine'), createCountry('PH', 'Philippines'),
  createCountry('QA', 'Qatar'), createCountry('SA', 'Saudi Arabia'), createCountry('SG', 'Singapore'),
  createCountry('KR', 'South Korea'), createCountry('LK', 'Sri Lanka'), createCountry('SY', 'Syria'),
  createCountry('TW', 'Taiwan'), createCountry('TJ', 'Tajikistan'), createCountry('TH', 'Thailand'),
  createCountry('TL', 'Timor-Leste'), createCountry('TR', 'Turkey'), createCountry('TM', 'Turkmenistan'),
  createCountry('AE', 'United Arab Emirates'), createCountry('UZ', 'Uzbekistan'), createCountry('VN', 'Vietnam'),
  createCountry('YE', 'Yemen'),

  // --- EUROPE ---
  createCountry('AL', 'Albania'), createCountry('AD', 'Andorra'), createCountry('AT', 'Austria'),
  createCountry('BY', 'Belarus'), createCountry('BE', 'Belgium'), createCountry('BA', 'Bosnia and Herzegovina'),
  createCountry('BG', 'Bulgaria'), createCountry('HR', 'Croatia'), createCountry('CZ', 'Czech Republic'),
  createCountry('DK', 'Denmark'), createCountry('EE', 'Estonia'), createCountry('FI', 'Finland'),
  createCountry('FR', 'France'), createCountry('DE', 'Germany'), createCountry('GR', 'Greece'),
  createCountry('HU', 'Hungary'), createCountry('IS', 'Iceland'), createCountry('IE', 'Ireland'),
  createCountry('IT', 'Italy'), createCountry('LV', 'Latvia'), createCountry('LI', 'Liechtenstein'),
  createCountry('LT', 'Lithuania'), createCountry('LU', 'Luxembourg'), createCountry('MT', 'Malta'),
  createCountry('MD', 'Moldova'), createCountry('MC', 'Monaco'), createCountry('ME', 'Montenegro'),
  createCountry('NL', 'Netherlands'), createCountry('MK', 'North Macedonia'), createCountry('NO', 'Norway'),
  createCountry('PL', 'Poland'), createCountry('PT', 'Portugal'), createCountry('RO', 'Romania'),
  createCountry('RU', 'Russia'), createCountry('SM', 'San Marino'), createCountry('RS', 'Serbia'),
  createCountry('SK', 'Slovakia'), createCountry('SI', 'Slovenia'), createCountry('ES', 'Spain'),
  createCountry('SE', 'Sweden'), createCountry('CH', 'Switzerland'), createCountry('UA', 'Ukraine'),
  createCountry('GB', 'United Kingdom'), createCountry('VA', 'Vatican City'),

  // --- OCEANIA ---
  createCountry('AU', 'Australia'), createCountry('FJ', 'Fiji'), createCountry('KI', 'Kiribati'),
  createCountry('MH', 'Marshall Islands'), createCountry('FM', 'Micronesia'), createCountry('NR', 'Nauru'),
  createCountry('NZ', 'New Zealand'), createCountry('PW', 'Palau'), createCountry('PG', 'Papua New Guinea'),
  createCountry('WS', 'Samoa'), createCountry('SB', 'Solomon Islands'), createCountry('TO', 'Tonga'),
  createCountry('TV', 'Tuvalu'), createCountry('VU', 'Vanuatu'),
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
    erpType: ERPType.MANUAL,
    erpStatus: 'CONNECTED'
  }
];

export const INITIAL_BATCHES: Batch[] = [];
