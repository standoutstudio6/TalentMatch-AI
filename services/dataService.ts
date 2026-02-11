import { Job, Candidate } from '../types';
import { parseResumeWithAI } from './geminiService';

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
  'Eden Prairie, MN', 'Coon Rapids, MN', 'Burnsville, MN', 'Blaine, MN'
];

const COMPANIES = [
  'Global Logistics Corp', 'Apex Manufacturing', 'MedTech Solutions', 
  'NorthStar Distribution', 'Valley Food Processing', 'Twin City Die Castings',
  'Midwest Plastics Group', 'Logistics Pro International', 'HealthFirst Medical'
];

const generateRandomJob = (id: string, isNew: boolean = false): Job => {
  const title = BASE_TITLES[Math.floor(Math.random() * BASE_TITLES.length)];
  const location = MN_LOCATIONS[Math.floor(Math.random() * MN_LOCATIONS.length)];
  const company = COMPANIES[Math.floor(Math.random() * COMPANIES.length)];
  const payMin = 18 + Math.floor(Math.random() * 15);
  const payMax = payMin + 5;
  
  return {
    id,
    title,
    company,
    location,
    payRate: `$${payMin}.00 - $${payMax}.00 / hr`,
    postedDate: isNew ? 'Just Now' : `${Math.floor(Math.random() * 7) + 1} days ago`,
    type: Math.random() > 0.5 ? 'Full-Time' : 'Contract',
    description: `Exciting opportunity for a ${title} in the ${location} area. Joining the team at ${company}, you will contribute to standard operations and safety standards.`,
    requirements: ['High School Diploma', 'Reliable transportation', 'Previous experience preferred'],
    skills: [title.split(' ')[0], 'Safety', 'Teamwork'],
    yearsExperience: Math.floor(Math.random() * 5),
    isNew
  };
};

const INITIAL_JOBS: Job[] = Array.from({ length: 20 }, (_, i) => generateRandomJob(`job-${i}`));
let _cachedAllJobs: Job[] = [...INITIAL_JOBS];

export const getJobs = async (): Promise<Job[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(_cachedAllJobs), 400));
};

export const loadMoreJobs = async (): Promise<Job[]> => {
  const newBatch = Array.from({ length: 10 }, (_, i) => generateRandomJob(`more-${Date.now()}-${i}`, true));
  _cachedAllJobs = [..._cachedAllJobs, ...newBatch];
  return new Promise((resolve) => setTimeout(() => resolve(_cachedAllJobs), 600));
};

export const getJobById = async (id: string): Promise<Job | undefined> => {
  return _cachedAllJobs.find(j => j.id === id);
};

export const updateJobCache = (jobs: Job[]) => {
  _cachedAllJobs = jobs;
};

// --- Mock Candidate Generation ---

const generateRandomCandidate = (id: string, job?: Job): Candidate => {
  const names = ['Alex Johnson', 'Jordan Smith', 'Taylor Reed', 'Morgan Lee', 'Casey Rivera'];
  const name = names[Math.floor(Math.random() * names.length)];
  return {
    id,
    name,
    title: job?.title || 'Professional Candidate',
    location: job?.location || 'Minneapolis, MN',
    skills: job?.skills || ['Communication', 'Reliability'],
    experienceYears: (job?.yearsExperience || 0) + Math.floor(Math.random() * 3),
    profileUrl: '#',
    bio: `Highly motivated professional with a background in ${job?.title || 'operations'}.`,
    email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
    phone: `612-555-01${Math.floor(Math.random() * 99)}`,
    linkedIn: `linkedin.com/in/${name.toLowerCase().replace(' ', '-')}`
  };
};

export const getCandidatesForJob = async (jobId: string): Promise<Candidate[]> => {
  const job = await getJobById(jobId);
  return new Promise((resolve) => {
    const candidates = Array.from({ length: 8 }, (_, i) => generateRandomCandidate(`cand-${jobId}-${i}`, job));
    setTimeout(() => resolve(candidates), 500);
  });
};

// --- History Logic ---

const HISTORY_KEY = 'talent_match_recent_jobs';

export const getRecentlyViewed = (): Job[] => {
  const stored = localStorage.getItem(HISTORY_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const addToRecentlyViewed = (job: Job) => {
  const current = getRecentlyViewed();
  const filtered = current.filter(j => j.id !== job.id);
  const updated = [job, ...filtered].slice(0, 6);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
};

export const removeFromRecentlyViewed = (jobId: string) => {
  const current = getRecentlyViewed();
  const updated = current.filter(j => j.id !== jobId);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
};

export const clearRecentlyViewed = () => {
  localStorage.removeItem(HISTORY_KEY);
};

// --- User Session ---

const USER_KEY = 'talent_match_user';

export const getCurrentUser = (): Candidate | null => {
  const stored = localStorage.getItem(USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const clearCurrentUser = () => {
  localStorage.removeItem(USER_KEY);
};

export const uploadResume = async (file: File): Promise<Candidate> => {
  const mockUser = await parseResumeWithAI(file);
  localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
  return mockUser;
};