export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  college: string;
  year: number;
  branch: string;
  skills: string[];
  interests: string[];
  preferredMode: 'online' | 'offline' | 'hybrid' | 'any';
  city: string;
  teamSizePreference: 'solo' | 'team' | 'any';
  ignoreSkills?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventEligibility {
  minYear?: number;
  maxYear?: number;
  allowedBranches?: string[];
  allowedColleges?: string[];
  rawEligibilityText: string;
  isRestricted: boolean;
}

export interface EventRecord {
  eventId: string;
  title: string;
  organizer: string;
  description: string;
  sourceUrl: string;
  registrationUrl: string;
  eligibility: EventEligibility;
  startDate: string | null;
  deadline: string | null;
  mode: 'online' | 'offline' | 'hybrid';
  location: string | null;
  isFree?: boolean;
  fee?: string | null;
  teamSize: { min: number; max: number };
  prizes: string | null;
  tags: string[];
  extractedAt: string;
  confidence: number;
}

export interface FitScore {
  total: number;
  breakdown: {
    eligibility: number;
    skills: number;
    mode: number;
    timing: number;
    preferences: number;
  };
  explanation: string;
  isEligible: boolean;
  ineligibilityReason?: string;
}

export interface ScoredEvent extends EventRecord {
  fitScore: FitScore;
  isSaved: boolean;
}

export type ApplicationStatus =
  | 'not_started'
  | 'preparing'
  | 'needs_user_input'
  | 'ready_for_review'
  | 'preparation_failed'
  | 'user_submitted'
  | 'confirmed';

export interface ApplicationRecord {
  applicationId: string;
  eventId: string;
  userId: string;
  status: ApplicationStatus;
  preparedFields: Record<string, string>;
  missingFields: string[];
  lastUpdatedAt: string;
  userConfirmedSubmission: boolean;
  agentNotes?: string;
}
