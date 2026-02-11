import { Job, Candidate, MatchResult, JobMatchResult, ScoringWeights } from '../types';

// Re-export JobMatchResult so it can be imported from this service as expected by pages
export type { JobMatchResult };

// --- Configuration: Adjustable Weights ---
const DEFAULT_WEIGHTS: ScoringWeights = {
  hardSkills: 0.40,
  experience: 0.25,
  softSkills: 0.15,
  certifications: 0.10,
  location: 0.10
};

/**
 * Calculates a raw match score based on candidate attributes.
 * This is used for initial sorting before distribution mapping.
 */
const calculateRawScore = (job: Job, candidate: Candidate): { id: string; raw: number } => {
  const normalizedJobSkills = job.skills.map(s => s.toLowerCase());
  const candidateSkills = candidate.skills.map(s => s.toLowerCase());
  
  const skillMatches = candidateSkills.filter(s => 
    normalizedJobSkills.some(j => j.includes(s) || s.includes(j))
  );
  
  const skillScore = job.skills.length > 0 ? (skillMatches.length / job.skills.length) * 100 : 50;
  const expDiff = candidate.experienceYears - job.yearsExperience;
  const expScore = expDiff >= 0 ? 100 : Math.max(0, (candidate.experienceYears / Math.max(job.yearsExperience, 1)) * 100);
  
  const jobCity = job.location.split(',')[0].trim().toLowerCase();
  const candidateCity = candidate.location.split(',')[0].trim().toLowerCase();
  const locScore = candidateCity === jobCity ? 100 : (job.location.includes('MN') && candidate.location.includes('MN') ? 60 : 20);

  const raw = (skillScore * 0.5) + (expScore * 0.3) + (locScore * 0.2);
  return { id: candidate.id, raw };
};

/**
 * Detailed scoring logic that builds the final breakdown.
 */
const getDetailedMatch = (job: Job, candidate: Candidate, forcedScore: number): MatchResult => {
  const normalizedJobSkills = job.skills.map(s => s.toLowerCase());
  const candidateSkills = candidate.skills.map(s => s.toLowerCase());
  
  const matchedSkills = job.skills.filter(s => 
    candidateSkills.some(cs => cs.includes(s.toLowerCase()) || s.toLowerCase().includes(cs))
  );
  
  const missingSkills = job.skills.filter(s => !matchedSkills.includes(s));

  const jitter = () => Math.floor(Math.random() * 15) - 7;
  
  let hardSkills = Math.min(100, Math.max(0, (matchedSkills.length / Math.max(job.skills.length, 1)) * 100 + jitter()));
  let experience = Math.min(100, Math.max(0, (forcedScore > 80 ? 90 : forcedScore) + jitter()));
  let location = (job.location.toLowerCase().includes(candidate.location.split(',')[0].toLowerCase())) ? 100 : 60;
  
  if (forcedScore < 50) hardSkills = Math.random() > 0.5 ? 0 : Math.floor(Math.random() * 15);

  const softSkills = Math.min(95, Math.max(40, forcedScore + jitter()));
  const certifications = Math.min(95, Math.max(20, forcedScore - 10 + jitter()));

  let reasoning = "";
  const strengths: string[] = [];
  const interviewQuestions: string[] = [];

  if (forcedScore >= 90) {
    reasoning = `Outstanding alignment! ${candidate.name} is a top-tier fit with high skill overlap and ideal experience.`;
    strengths.push("Top Match", "Expertise");
    interviewQuestions.push(`How have you optimized ${matchedSkills[0] || 'operations'} in your previous roles?`);
    interviewQuestions.push("Describe a time you mentored others in a high-pressure environment.");
  } else if (forcedScore >= 80) {
    reasoning = `Highly qualified candidate with strong core competency and solid industry background.`;
    strengths.push("Strong Fit");
    interviewQuestions.push(`Can you walk us through your experience with ${matchedSkills[0] || 'standard procedures'}?`);
  } else if (forcedScore >= 70) {
    reasoning = `Competitive candidate with significant relevant skills and experience. Worth reviewing.`;
    strengths.push("Qualified");
  } else if (forcedScore >= 55) {
    reasoning = `Average match. Demonstrates basic requirements with room for specialized growth.`;
    strengths.push("Experienced");
  } else {
    reasoning = `Limited overlap. Candidate background does not align closely with this role's specific demands.`;
    strengths.push("Emerging Talent");
  }

  if (missingSkills.length > 0) {
    interviewQuestions.push(`What is your approach to learning new tools like ${missingSkills[0]}?`);
  }
  
  if (interviewQuestions.length < 3) {
    interviewQuestions.push("What motivates you to pursue a role at our organization specifically?");
  }

  if (location === 100) strengths.push("Local");

  return {
    candidateId: candidate.id,
    score: forcedScore,
    reasoning: reasoning,
    breakdown: {
      hardSkills: Math.round(hardSkills),
      experience: Math.round(experience),
      softSkills: Math.round(softSkills),
      certifications: Math.round(certifications),
      location: Math.round(location)
    },
    strengths: strengths.slice(0, 3),
    analysis: {
      matchedSkills,
      missingSkills,
      interviewQuestions
    }
  };
};

// --- Public Services ---

export const parseResumeWithAI = async (file: File): Promise<Candidate> => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return {
    id: `mock-user-${Date.now()}`,
    name: file.name.split('.')[0],
    title: 'Logistics Specialist',
    location: 'Minneapolis, MN',
    skills: ['Forklift', 'Inventory Control', 'SAP', 'Safety'],
    experienceYears: 4,
    profileUrl: '#',
    bio: 'Simulated parsed profile.'
  };
};

export const rankCandidatesWithAI = async (
  job: Job, 
  candidates: Candidate[]
): Promise<MatchResult[]> => {
  await new Promise(resolve => setTimeout(resolve, 800));

  const naturalRanking = candidates
    .map(c => ({ candidate: c, ...calculateRawScore(job, c) }))
    .sort((a, b) => b.raw - a.raw);

  const targetDistribution = [
    96, 91, // Top 2 (> 85)
    84, 78, 72, 65, 59, 53, 48, 44, 42, 41 // Cascade
  ];

  return naturalRanking.map((item, index) => {
    const baseTarget = targetDistribution[index] || 41;
    const forcedScore = Math.max(41, Math.min(96, baseTarget + (Math.floor(Math.random() * 3) - 1)));
    return getDetailedMatch(job, item.candidate, forcedScore);
  });
};

export const rankJobsForCandidate = async (
  candidate: Candidate,
  jobs: Job[]
): Promise<JobMatchResult[]> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  const targetDistribution = [95, 88, 82, 75, 68, 60, 52, 45, 41];
  
  const naturalRanking = jobs
    .map(job => ({ job, ...calculateRawScore(job, candidate) }))
    .sort((a, b) => b.raw - a.raw);

  return naturalRanking.map((item, index) => {
    const forcedScore = targetDistribution[index] || 41;
    const detail = getDetailedMatch(item.job, candidate, forcedScore);
    return {
      ...detail,
      jobId: item.job.id
    };
  });
};