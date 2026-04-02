import { AssetType, ConstructionType, DamageCondition, Functionality, Priority } from './types';

export const PROVINCES = [
  'Torba',
  'Sanma',
  'Penama',
  'Malampa',
  'Shefa',
  'Tafea',
] as const;

export type Province = (typeof PROVINCES)[number];

export const PROVINCE_COUNCILS: Record<string, string[]> = {
  Torba: [
    'Torres',
    'Ureparapara',
    'Motalava',
    'East Vanualava',
    'West Vanualava',
    'Mota',
    'East Gaua',
    'West Gaua',
    'Merelava',
  ],
  Sanma: [
    'Luganville',
    'North West Santo',
    'Big Bay Coast',
    'Big Bay Inland',
    'West Santo',
    'South Santo 1',
    'South Santo 2',
    'East Santo',
    'South East Santo',
    'Canal Fanafo',
    'East Malo',
    'West Malo',
  ],
  Penama: [
    'West Ambae',
    'North Ambae',
    'East Ambae',
    'South Ambae',
    'North Maewo',
    'South Maewo',
    'North Pentecost',
    'Central Pentecost 1',
    'Central Pentecost 2',
    'South Pentecost',
  ],
  Malampa: [
    'North West Malekula',
    'North East Malekula',
    'Central Malekula',
    'South West Malekula',
    'South East Malekula',
    'South Malekula',
    'North Ambrym',
    'West Ambrym',
    'South East Ambrym',
    'Paama',
  ],
  Shefa: [
    'Port Vila',
    'Vermali',
    'Vermaul',
    'Varisu',
    'South Epi',
    'North Tongoa',
    'Tongariki',
    'Makimae',
    'Nguna',
    'Emau',
    'Malorua',
    'North Efate',
    'Mele',
    'Tanvasoko',
    'Ifira',
    'Pango',
    'Erakor',
    'Eratap',
    'Eton',
  ],
  Tafea: [
    'North Erromango',
    'South Erromango',
    'Aniwa',
    'North Tanna',
    'West Tanna',
    'Middle Bush Tanna',
    'South West Tanna',
    'Whitesands',
    'South Tanna',
    'Futuna',
    'Aneityum',
  ],
};

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  education: 'Education',
  health: 'Health',
  shelter: 'Shelter',
  telecom: 'Telecom',
  energy: 'Energy',
  wash: 'WASH',
  food_security: 'Food Security',
  logistics: 'Logistics',
};

export const CONSTRUCTION_TYPE_LABELS: Record<ConstructionType, string> = {
  wood: 'Wood',
  concrete: 'Concrete',
  metal: 'Metal',
  mixed: 'Mixed',
};

export const ROOF_DAMAGE_OPTIONS: {
  condition: DamageCondition;
  percentage: number;
  label: string;
  description: string;
}[] = [
  { condition: 'intact', percentage: 0, label: 'Intact', description: 'No visible damage' },
  { condition: 'minor', percentage: 20, label: 'Minor', description: 'Some sheets loose' },
  { condition: 'major', percentage: 60, label: 'Major', description: 'Large sections missing' },
  { condition: 'destroyed', percentage: 100, label: 'Destroyed', description: 'Complete loss' },
];

export const WALL_DAMAGE_OPTIONS: {
  condition: DamageCondition;
  percentage: number;
  label: string;
  description: string;
}[] = [
  { condition: 'intact', percentage: 0, label: 'Intact', description: 'Minor cracks only' },
  { condition: 'minor', percentage: 15, label: 'Minor', description: 'Some holes' },
  { condition: 'major', percentage: 50, label: 'Major', description: 'Partial collapse' },
  { condition: 'destroyed', percentage: 100, label: 'Destroyed', description: 'Complete failure' },
];

export const FUNCTIONALITY_OPTIONS: { value: Functionality; label: string; color: string }[] = [
  { value: 'usable', label: 'Usable', color: '#16a34a' },
  { value: 'partially_usable', label: 'Partially Usable', color: '#d97706' },
  { value: 'not_usable', label: 'Not Usable', color: '#dc2626' },
];

export const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#6b7280' },
  { value: 'medium', label: 'Medium', color: '#3b82f6' },
  { value: 'high', label: 'High', color: '#d97706' },
  { value: 'critical', label: 'Critical', color: '#dc2626' },
];

export const IMMEDIATE_NEEDS_OPTIONS = [
  'Emergency roof repairs',
  'Emergency structural repairs',
  'Temporary shelter',
  'Medical supplies',
  'Food and water',
  'Power restoration',
  'Communications restoration',
  'Debris removal',
  'Security fencing',
  'Sanitation facilities',
];

export const DAMAGE_CONDITION_COLOR: Record<DamageCondition, string> = {
  intact: '#16a34a',
  minor: '#d97706',
  major: '#ea580c',
  destroyed: '#dc2626',
};

export const PRIORITY_COLOR: Record<Priority, string> = {
  low: '#6b7280',
  medium: '#3b82f6',
  high: '#d97706',
  critical: '#dc2626',
};

export const FUNCTIONALITY_COLOR: Record<Functionality, string> = {
  usable: '#16a34a',
  partially_usable: '#d97706',
  not_usable: '#dc2626',
};
