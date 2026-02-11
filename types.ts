export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  payRate: string;
  postedDate: string;
  type: string; // Full-time, Contract, etc.
  description: string;
  requirements: string[];
  skills: string[];
  yearsExperience: number;
  isNew?: boolean;
}

export interface Candidate {
  id: string;
  name: string;
  title: string;
  location: string;
  skills: string[];
  experienceYears: number;
  profileUrl: string; // URL to resume or profile
  currentEmployer?: string;
  bio: string;
  email?: string;
  phone?: string;
  linkedIn?: string;
}

export interface ScoringBreakdown {
  hardSkills: number;     // 0-100
  experience: number;     // 0-100 (Volume + Recency)
  softSkills: number;     // 0-100 (Communication, Leadership, etc.)
  certifications: number; // 0-100 (Matches required certs)
  location: number;       // 0-100
}

export interface MatchResult {
  candidateId: string;
  score: number; // Final Weighted Score 0-100
  reasoning: string;
  breakdown: ScoringBreakdown;
  strengths?: string[]; // AI identified key strengths
  analysis?: {
    matchedSkills: string[];
    missingSkills: string[];
    interviewQuestions: string[];
  };
}

// JobMatchResult interface for candidate-to-job matching views
export interface JobMatchResult extends MatchResult {
  jobId: string;
}

export interface ScoringWeights {
  hardSkills: number;
  experience: number;
  softSkills: number;
  certifications: number;
  location: number;
}