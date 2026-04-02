export type AssetType =
  | 'education'
  | 'health'
  | 'shelter'
  | 'telecom'
  | 'energy'
  | 'wash'
  | 'food_security'
  | 'logistics';

export type EducationLevel = 'ecce' | 'primary' | 'secondary';
export type ConstructionType = 'wood' | 'concrete' | 'metal' | 'mixed';
export type DamageCondition = 'intact' | 'minor' | 'major' | 'destroyed';
export type Functionality = 'usable' | 'partially_usable' | 'not_usable';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface DamageAssessment {
  condition: DamageCondition;
  percentage: number;
  notes: string;
}

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
}

export interface Photo {
  id: string;
  type: 'roof' | 'wall' | 'overview' | 'other';
  uri: string;
  timestamp: number;
  caption?: string;
}

export interface FieldCheck {
  id: string;
  deviceId: string;
  timestamp: number;
  synced: boolean;
  syncedAt?: number;

  // Asset
  assetType: AssetType;
  assetId: string;
  assetName: string;
  educationLevel?: EducationLevel;
  constructionType: ConstructionType;

  // Location
  province: string;
  council: string;
  gpsCoordinates: GpsCoordinates;

  // Damage
  roofDamage: DamageAssessment;
  wallDamage: DamageAssessment;

  // Overall assessment
  functionality: Functionality;
  immediateNeeds: string[];
  priority: Priority;

  // Assessor
  assessorName: string;
  assessorId: string;
  teamLead?: string;

  // Context
  weatherConditions: string;
  accessIssues: string;
  additionalNotes: string;

  photos: Photo[];

  /**
   * If this check was created from a DRMIS assignment, store the assignment ID
   * so the sync service can mark it completed on the server after upload.
   */
  assignmentId?: number;
}

export type PartialFieldCheck = Partial<FieldCheck>;

export interface AppSettings {
  assessorName: string;
  assessorId: string;
  teamLead: string;
  drmisApiUrl: string;
  drmisApiToken: string;
}

// ─── Auth & User ─────────────────────────────────────────────────────────────

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isStaff: boolean;
  /** Area councils this user is admin for (empty = staff / all access) */
  areaCouncils: string[];
  /** Display province(s) */
  provinces: string[];
}

export interface StoredAuth {
  token: string;
  /** SHA-256 hex of password — used for offline re-authentication */
  passwordHash: string;
  username: string;
  profile: UserProfile;
  /** Unix ms timestamp of when the token was obtained */
  tokenObtainedAt: number;
}

// ─── Assignments (DRMIS-driven field check tasks) ─────────────────────────────

export type AssignmentStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';
export type AssignmentPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Assignment {
  /** DRMIS FieldCheckAssignment PK */
  id: number;
  tabularItemId: number;
  datasetName: string;
  /** RAP sector family e.g. "education" */
  sectorFamily: string;
  councilName: string;
  provinceName: string;
  priority: AssignmentPriority;
  /** Admin guidance shown to field assessor */
  adminNotes: string;
  status: AssignmentStatus;
  /** RAP-estimated value (for context) */
  estimatedValue: number | null;
  /** Cyclone intensity at this council */
  intensity: number | null;
  eventName: string;
  eventSlug: string;
  assignedAt: string;
  /** If already completed, the local FieldCheck id */
  localCheckId?: string;
}
