import { Job, Candidate } from '../types';
import { parseResumeWithAI } from './geminiService';

/**
 * NOTE: This is a conceptual mockup. Real web scraping or third-party API integration
 * would happen via a secure backend in a production environment.
 */

// --- Error Handling Utilities ---

export class ScrapeError extends Error {
  public type: 'NETWORK_ERROR' | 'PARSING_ERROR' | 'RATE_LIMIT' | 'UNKNOWN';
  
  constructor(message: string, type: 'NETWORK_ERROR' | 'PARSING_ERROR' | 'RATE_LIMIT' | 'UNKNOWN' = 'UNKNOWN') {
    super(message);
    this.name = 'ScrapeError';
    this.type = type;
  }
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryOperation<T>(
  operation: () => Promise<T>, 
  maxRetries: number = 3, 
  baseDelay: number = 800
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      const isParsingError = error instanceof ScrapeError && error.type === 'PARSING_ERROR';

      if (isParsingError) {
        console.error(`[DataService] Fatal Processing Error: ${error.message}`);
        throw error;
      }

      if (attempt === maxRetries) break;

      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`[DataService] Attempt ${attempt} failed. Retrying in ${delay}ms...`);
      await wait(delay);
    }
  }
  
  console.error(`[DataService] Operation failed after ${maxRetries} attempts.`);
  throw lastError;
}

const BASE_TITLES = [
  'General Labor', 'Warehouse Associate', 'Forklift Operator', 'Order Picker',
  'Assembly Line Worker', 'Machine Operator', 'CNC Machinist', 'Production Lead',
  'Shipping & Receiving Clerk', 'Quality Inspector', 'Medical Assembler',
  'Administrative Assistant', 'Customer Service Rep', 'Maintenance Technician',
  'Human Resources Coordinator', 'Recruiter', 'Account Manager', 'Data Entry Specialist'
];

const MN_LOCATIONS = [
  'Minneapolis, MN', 'St. Paul, MN', 'Bloomington, MN', 'Brooklyn Park, MN', 
  'Plymouth, MN', 'Maple Grove, MN', 'Woodbury, MN', 'Eagan, MN', 
  'Eden Prairie, MN', 'Coon Rapids, MN', 'Burnsville, MN', 'Blaine, MN',
  'Rochester, MN', 'Duluth, MN', 'St. Cloud, MN', 'Mankato, MN'
];

const COMPANIES = [
  'Global Logistics Corp', 'Apex Manufacturing', 'MedTech Solutions', 
  'NorthStar Distribution', 'Valley Food Processing', 'Twin City Die Castings',
  'Midwest Plastics Group', 'Logistics Pro International', 'HealthFirst Medical',
  'Summit Support Services', 'Target Distribution Center', 'Modern Manufacturing',
  'Industrial Dynamics', 'Greenway Solutions', 'Precision Parts Inc.'
];

// Helper to generate a random job
const generateRandomJob = (id: string, isNew: boolean = false): Job => {
  const title = BASE_TITLES[Math.floor(Math.random() * BASE_TITLES.length)];
  const location = MN_LOCATIONS[Math.floor(Math.random() * MN_LOCATIONS.length)];
  const company = COMPANIES[Math.floor(Math.random() * COMPANIES.length)];
  const payMin = 17 + Math.floor(Math.random() * 18); // $17 - $35
  const payMax = payMin + 2 + Math.floor(Math.random() * 6);
  
  let postedDate = 'Just Now';
  if (!isNew) {
    const daysAgo = Math.floor(Math.random() * 14);
    postedDate = daysAgo === 0 ? 'Today' : `${daysAgo} days ago`;
  }
  
  const skillsList = [
    title.split(' ')[0], 
    'Safety Standards', 
    'Teamwork', 
    'Professional Reliability', 
    'Attention to Detail',
    'Workflow Communication',
    'Time Management'
  ];

  const skills = skillsList.sort(() => 0.5 - Math.random()).slice(0, 3 + Math.floor(Math.random() * 3));

  return {
    id,
    title,
    company,
    location,
    payRate: `$${payMin}.00 - $${payMax}.00 / hr`,
    postedDate,
    type: Math.random() > 0.8 ? 'Direct Hire' : (Math.random() > 0.5 ? 'Temp-to-Hire' : 'Full-Time'),
    description: `Professional opportunity for a ${title} in the ${location} area. Joining the team at ${company}, you will be responsible for standard operational procedures, maintaining safety records, and collaborating with cross-functional departments.`,
    requirements: [
      'High School Diploma or equivalent',
      'Reliable commute/transportation',
      'Commitment to workplace excellence',
      `Relevant ${title} experience preferred`
    ],
    skills,
    yearsExperience: Math.floor(Math.random() * 8),
    isNew
  };
};

const MOCK_JOBS_STATIC: Job[] = [
  {
    id: 'j101',
    title: 'General Labor / Warehouse',
    company: 'Logistics Pro International',
    location: 'Rogers, MN',
    payRate: '$18.00 - $20.00 / hr',
    postedDate: '2 days ago',
    type: 'Full-Time',
    description: 'Immediate openings for general labor in a high-volume warehouse environment. Primary duties involve material handling, inventory organization, and shipping preparation.',
    requirements: [
      'Ability to lift standard industrial loads',
      'Required safety gear compliance',
      'Reliability and punctuality',
      'Capacity for full-shift standing work'
    ],
    skills: ['Material Handling', 'Warehouse Operations', 'Safety Compliance'],
    yearsExperience: 0
  },
  {
    id: 'j102',
    title: 'Forklift Operator',
    company: 'NorthStar Distribution',
    location: 'Fridley, MN',
    payRate: '$22.50 / hr',
    postedDate: '3 days ago',
    type: 'Temp-to-Hire',
    description: 'Skilled forklift operation required for specialized storage facility. Managing delicate inventory and maintaining precise placement records.',
    requirements: [
      'Recent certified forklift experience',
      'Inventory tracking familiarity',
      'Valid identification and documentation'
    ],
    skills: ['Forklift Operation', 'Inventory Management', 'RF Scanning'],
    yearsExperience: 1
  }
];

const INITIAL_BATCH: Job[] = [];
for(let i = 0; i < 45; i++) {
  INITIAL_BATCH.push(generateRandomJob(`init-gen-${i}`, false));
}

const INITIAL_FULL_DATASET = [...MOCK_JOBS_STATIC, ...INITIAL_BATCH];

// --- Enhanced Candidate Data Pool ---

const FIRST_NAMES = [
  'Michael', 'Sarah', 'David', 'Jessica', 'Robert', 'Emily', 'James', 'Ashley', 
  'William', 'Jennifer', 'Christopher', 'Linda', 'Matthew', 'Amanda', 'Joshua', 
  'Elizabeth', 'Andrew', 'Melissa', 'Ryan', 'Karen', 'Marcus', 'Elena', 'Julian', 
  'Samira', 'Xavier', 'Yasmine', 'Liam', 'Olivia', 'Noah', 'Ava', 'Lucas', 'Mia'
];
const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Walker', 'Hall', 
  'Young', 'King', 'Wright', 'Baker', 'Nelson', 'Campbell', 'Mitchell', 'Carter'
];

const generateRandomCandidate = (id: string, job?: Job): Candidate => {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  
  // Scoring Tiers for variety
  const isTopMatch = id.includes('-top');
  const isMidMatch = id.includes('-mid');
  const isPartialMatch = id.includes('-part');
  
  const titlePool = [
    ...BASE_TITLES,
    'Retail Associate', 'Barista', 'Graphic Designer', 'Project Coordinator'
  ];
  
  let title = titlePool[Math.floor(Math.random() * titlePool.length)];
  let location = MN_LOCATIONS[Math.floor(Math.random() * MN_LOCATIONS.length)];
  let exp = Math.floor(Math.random() * 15);

  const skillPool = [
    'Inventory Control', 'SAP', 'RF Scanning', 'Safety Protocol', 'Team Leadership', 
    'Customer Support', 'Data Entry', 'Microsoft Office', 'Project Management', 
    'Forklift Certified', 'Heavy Lifting', 'OSHA Compliance', 'Shipping/Receiving',
    'Lean Six Sigma', 'Account Management', 'Quality Control'
  ];
  
  let skills: string[] = [];

  if (isTopMatch && job) {
    title = job.title;
    location = job.location;
    exp = job.yearsExperience + 3;
    skills = [...job.skills, ...skillPool.slice(0, 2)];
  } else if (isMidMatch && job) {
    title = job.title; // Same title but maybe different location or slightly fewer skills
    location = MN_LOCATIONS[Math.floor(Math.random() * MN_LOCATIONS.length)];
    exp = Math.max(0, job.yearsExperience - 1);
    skills = [job.skills[0], ...skillPool.slice(2, 5)];
  } else if (isPartialMatch && job) {
    title = "General Professional";
    location = job.location;
    exp = 2;
    skills = [skillPool[10], skillPool[11]]; // unrelated skills
  } else {
    skills = skillPool.sort(() => 0.5 - Math.random()).slice(0, 3);
  }

  return {
    id,
    name: `${firstName} ${lastName}`,
    title: `${title}`,
    location,
    skills,
    experienceYears: exp,
    profileUrl: '#',
    bio: `Professional with ${exp} years of background. Primary skills include ${skills[0] || 'general operations'}. Dedicated to operational excellence and teamwork.`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    phone: `612-${Math.floor(100+Math.random()*900)}-${Math.floor(1000+Math.random()*9000)}`,
    linkedIn: `linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`
  };
};

let _cachedAllJobs: Job[] = [...INITIAL_FULL_DATASET];

export const getJobs = async (): Promise<Job[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(_cachedAllJobs), 600);
  });
};

export const scrapeLiveJobs = async (): Promise<Job[]> => {
  return retryOperation(async () => {
    if (Math.random() < 0.05) {
      throw new ScrapeError('Connection to data stream lost.', 'NETWORK_ERROR');
    }

    try {
      const scrapedJobs: Job[] = [];
      const timestamp = Date.now();
      
      for (let i = 0; i < 50; i++) {
        scrapedJobs.push(generateRandomJob(`scraped-${timestamp}-${i}`, true));
      }

      const updatedList = [...scrapedJobs, ..._cachedAllJobs];
      _cachedAllJobs = updatedList;

      return updatedList;

    } catch (e) {
      if (e instanceof ScrapeError) throw e;
      throw new ScrapeError(`Failed to process job feed: ${(e as Error).message}`, 'PARSING_ERROR');
    }
  });
};

export const loadMoreJobs = async (): Promise<Job[]> => {
  const newBatch: Job[] = [];
  const timestamp = Date.now();
  for(let i = 0; i < 50; i++) {
    newBatch.push(generateRandomJob(`batch-${timestamp}-${i}`, false));
  }

  const updatedList = [..._cachedAllJobs, ...newBatch];
  _cachedAllJobs = updatedList;

  return new Promise((resolve) => {
    setTimeout(() => resolve(updatedList), 800);
  });
};

export const getJobById = async (id: string): Promise<Job | undefined> => {
  return new Promise((resolve) => {
    resolve(_cachedAllJobs.find(j => j.id === id));
  });
};

export const updateJobCache = (jobs: Job[]) => {
  _cachedAllJobs = jobs;
};

// --- History / Recently Viewed Logic ---

const HISTORY_KEY = 'talent_match_recent_jobs';

export const getRecentlyViewed = (): Job[] => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

export const addToRecentlyViewed = (job: Job) => {
  if (typeof localStorage === 'undefined') return;
  try {
    const current = getRecentlyViewed();
    const filtered = current.filter(j => j.id !== job.id);
    const updated = [job, ...filtered].slice(0, 5);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save history", e);
  }
};

export const removeFromRecentlyViewed = (jobId: string) => {
  if (typeof localStorage === 'undefined') return;
  try {
    const current = getRecentlyViewed();
    const updated = current.filter(j => j.id !== jobId);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to update history", e);
  }
};

export const clearRecentlyViewed = () => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    console.error("Failed to clear history", e);
  }
};

// --- User Session Logic ---

const USER_KEY = 'talent_match_active_session';

export const getCurrentUser = (): Candidate | null => {
  if (typeof localStorage === 'undefined') return null;
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};

export const clearCurrentUser = () => {
  localStorage.removeItem(USER_KEY);
};

export const uploadResume = async (file: File): Promise<Candidate> => {
  try {
    const parsedProfile = await parseResumeWithAI(file);
    localStorage.setItem(USER_KEY, JSON.stringify(parsedProfile));
    return parsedProfile;
  } catch (error) {
    console.error("Failed to parse resume", error);
    throw error;
  }
};

export const getCandidatesForJob = async (jobId: string): Promise<Candidate[]> => {
  const job = await getJobById(jobId);
  return new Promise((resolve) => {
    const candidates: Candidate[] = [];
    
    // 2 Top Matches (90-96)
    for(let i = 0; i < 2; i++) {
      candidates.push(generateRandomCandidate(`candidate-${jobId}-top-${i}`, job || undefined));
    }
    
    // 3 Mid Matches (70-89)
    for(let i = 0; i < 3; i++) {
      candidates.push(generateRandomCandidate(`candidate-${jobId}-mid-${i}`, job || undefined));
    }

    // 3 Partial Matches (55-69)
    for(let i = 0; i < 3; i++) {
      candidates.push(generateRandomCandidate(`candidate-${jobId}-part-${i}`, job || undefined));
    }
    
    // Fill with random
    const count = 6;
    for(let i = 0; i < count; i++) {
      candidates.push(generateRandomCandidate(`candidate-${jobId}-rand-${i}`));
    }
    
    const shuffled = candidates.sort(() => 0.5 - Math.random());
    setTimeout(() => resolve(shuffled), 800);
  });
};