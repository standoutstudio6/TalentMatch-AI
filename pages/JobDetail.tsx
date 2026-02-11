import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { getJobById, getCandidatesForJob, addToRecentlyViewed, getCurrentUser } from '../services/dataService';
import { rankCandidatesWithAI } from '../services/geminiService';
import { Job, Candidate, MatchResult } from '../types';
import { 
  ArrowLeft, MapPin, DollarSign, Calendar, 
  CheckCircle, Bot, Loader2, ExternalLink,
  BrainCircuit, Sparkles, X, Mail, Phone, Linkedin,
  ChevronRight, Building2, User2, Briefcase, ListChecks, AlertCircle
} from 'lucide-react';

const JobDetail: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  
  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [currentUser, setCurrentUser] = useState<Candidate | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // Detail Panel State
  const [selectedMatch, setSelectedMatch] = useState<{ candidate: Candidate, match: MatchResult } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!jobId) return;
      
      const user = getCurrentUser();
      setCurrentUser(user);

      try {
        const jobData = await getJobById(jobId);
        setJob(jobData || null);

        if (jobData) {
          addToRecentlyViewed(jobData);
          const candidateData = await getCandidatesForJob(jobId);
          setCandidates(candidateData);
          
          setAnalyzing(true);
          const rankedResults = await rankCandidatesWithAI(jobData, candidateData);
          setMatches(rankedResults);
          setAnalyzing(false);
        }
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [jobId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!job) {
    return <Navigate to="/" replace />;
  }

  // Contact Info Masker
  const maskEmail = (email?: string) => {
    if (!email) return 'N/A';
    const [name, domain] = email.split('@');
    return `${name[0]}XXXXXX@${domain}`;
  };

  const maskPhone = (phone?: string) => {
    if (!phone) return 'N/A';
    return phone.replace(/\d/g, 'X');
  };

  const ScoreBar = ({ label, score, colorClass = "bg-blue-500", size = "small" }: { label: string, score: number, colorClass?: string, size?: "small" | "large" }) => (
    <div className={size === "large" ? "mb-6" : "mb-1"}>
      <div className={`flex justify-between ${size === "large" ? "text-xs font-black" : "text-[10px] font-bold"} uppercase text-gray-500 mb-1.5`}>
        <span>{label}</span>
        <span>{score}%</span>
      </div>
      <div className={`${size === "large" ? "h-3" : "h-1.5"} w-full bg-gray-100 rounded-full overflow-hidden`}>
        <div className={`h-full rounded-full transition-all duration-1000 ${colorClass}`} style={{ width: `${score}%` }}></div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen py-8 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center text-gray-500 hover:text-primary mb-6 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Listings
        </Link>

        {/* Job Info Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <p className="text-lg text-primary font-medium">{job.company}</p>
            </div>
            <div className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold">
              {job.type}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-6 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-lg shadow-sm text-gray-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Location</p>
                <p className="font-medium text-gray-900">{job.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-lg shadow-sm text-gray-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Compensation</p>
                <p className="font-medium text-gray-900">{job.payRate}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-lg shadow-sm text-gray-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Published</p>
                <p className="font-medium text-gray-900">{job.postedDate}</p>
              </div>
            </div>
          </div>
          
          <div className="prose prose-blue max-w-none text-gray-600">
            <h3 className="text-gray-900 text-lg font-bold mb-3">Position Summary</h3>
            <p className="mb-4">{job.description}</p>
            <h3 className="text-gray-900 text-lg font-bold mb-3">Requirements</h3>
            <ul className="list-disc pl-5 space-y-1">
              {job.requirements.map((req, i) => <li key={i}>{req}</li>)}
            </ul>
          </div>
        </div>

        {/* AI Results Section */}
        <div className="bg-white rounded-xl shadow-lg border border-indigo-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2 text-white">
              <Bot className="w-5 h-5" />
              <h3 className="font-bold text-lg">AI Matching Engine</h3>
            </div>
            <div className="bg-white/20 text-white text-xs px-2 py-1 rounded font-medium backdrop-blur-sm flex items-center gap-1">
              <BrainCircuit className="w-3 h-3" />
              Simulated v2.0
            </div>
          </div>

          <div className="p-4 bg-indigo-50 border-b border-indigo-100">
            <p className="text-xs text-indigo-800 leading-relaxed">
              <span className="font-bold">Metric Analysis:</span> Click any candidate to view full profile and detailed matching data.
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {analyzing ? (
                <div className="p-16 text-center">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
                  <p className="text-sm font-medium text-gray-500">Evaluating talent pool metrics...</p>
                </div>
            ) : matches.length > 0 ? (
              matches.map((match) => {
                const candidate = candidates.find(c => c.id === match.candidateId);
                if (!candidate) return null;
                
                let scoreColor = 'text-green-600 bg-green-50 ring-green-100';
                if (match.score < 80) scoreColor = 'text-indigo-600 bg-indigo-50 ring-indigo-100';
                if (match.score < 60) scoreColor = 'text-yellow-600 bg-yellow-50 ring-yellow-100';
                if (match.score < 50) scoreColor = 'text-red-600 bg-red-50 ring-red-100';

                return (
                  <button 
                    key={match.candidateId} 
                    onClick={() => setSelectedMatch({ candidate, match })}
                    className="w-full text-left p-6 hover:bg-gray-50 transition-all group flex items-start gap-6 border-b border-gray-50 last:border-0"
                  >
                    {/* Score Circle */}
                    <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center ring-1 ${scoreColor} flex-shrink-0 shadow-sm transition-transform group-hover:scale-105`}>
                      <span className="text-2xl font-black leading-none">{match.score}</span>
                      <span className="text-[10px] uppercase font-bold opacity-70">Score</span>
                    </div>

                    {/* Basic Info */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">{candidate.name}</h4>
                        <div className="flex gap-1.5">
                          {match.strengths?.map((tag, i) => (
                            <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 whitespace-nowrap">
                              <Sparkles className="w-2.5 h-2.5 mr-1 text-indigo-500" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{candidate.title}</p>
                      
                      {/* Mini Breakdown */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 max-w-2xl">
                        <ScoreBar label="Skills" score={match.breakdown.hardSkills} colorClass="bg-blue-400" />
                        <ScoreBar label="Exp" score={match.breakdown.experience} colorClass="bg-emerald-500" />
                        <ScoreBar label="Soft" score={match.breakdown.softSkills} colorClass="bg-purple-500" />
                        <ScoreBar label="Loc" score={match.breakdown.location} colorClass="bg-orange-500" />
                      </div>
                    </div>

                    <div className="self-center text-gray-300 group-hover:text-primary transition-colors">
                      <ChevronRight className="w-6 h-6" />
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-16 text-center text-gray-400 font-medium">No results found.</div>
            )}
          </div>
        </div>
      </div>

      {/* Slide-over Detailed Panel */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setSelectedMatch(null)}
          ></div>
          
          {/* Panel */}
          <div className="relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-500 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                 <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <User2 className="w-8 h-8" />
                 </div>
                 <div>
                    <h2 className="text-2xl font-black text-gray-900 leading-tight">{selectedMatch.candidate.name}</h2>
                    <p className="text-sm font-medium text-gray-500">{selectedMatch.candidate.title}</p>
                 </div>
              </div>
              <button 
                onClick={() => setSelectedMatch(null)}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-8 space-y-10">
              
              {/* Match Stats Box */}
              <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl flex items-center justify-between">
                 <div>
                    <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-1">Overall AI Fit Score</p>
                    <h3 className="text-6xl font-black">{selectedMatch.match.score}<span className="text-2xl text-indigo-200">%</span></h3>
                 </div>
                 <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-2">
                    {selectedMatch.match.strengths?.map(s => (
                      <span key={s} className="flex items-center gap-2 text-xs font-bold whitespace-nowrap">
                        <Sparkles className="w-3.5 h-3.5" /> {s}
                      </span>
                    ))}
                 </div>
              </div>

              {/* Contact Information (Masked) */}
              <section>
                 <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Confidential Contact Info</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4 border border-gray-100">
                       <Mail className="w-5 h-5 text-gray-400" />
                       <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Email Address</p>
                          <p className="font-mono text-sm text-gray-700">{maskEmail(selectedMatch.candidate.email)}</p>
                       </div>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4 border border-gray-100">
                       <Phone className="w-5 h-5 text-gray-400" />
                       <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Phone Number</p>
                          <p className="font-mono text-sm text-gray-700">{maskPhone(selectedMatch.candidate.phone)}</p>
                       </div>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4 border border-gray-100 col-span-full">
                       <Linkedin className="w-5 h-5 text-gray-400" />
                       <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Professional Network</p>
                          <p className="text-sm font-bold text-primary">{selectedMatch.candidate.linkedIn || 'linkedin.com/in/private'}</p>
                       </div>
                    </div>
                 </div>
              </section>

              {/* Detailed Breakdown */}
              <section>
                 <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Match Metric Breakdown</h4>
                 <div className="grid grid-cols-1 gap-2">
                    <ScoreBar label="Hard Skills & Certification" score={selectedMatch.match.breakdown.hardSkills} colorClass="bg-blue-500" size="large" />
                    <ScoreBar label="Experience Volume & Relevance" score={selectedMatch.match.breakdown.experience} colorClass="bg-emerald-500" size="large" />
                    <ScoreBar label="Soft Skills & Personality Fit" score={selectedMatch.match.breakdown.softSkills} colorClass="bg-purple-600" size="large" />
                    <ScoreBar label="Location & Commute Proximity" score={selectedMatch.match.breakdown.location} colorClass="bg-orange-500" size="large" />
                 </div>
              </section>

              {/* Skills Analysis */}
              {selectedMatch.match.analysis && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <ListChecks className="w-5 h-5 text-indigo-600" />
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Detailed Skills Analysis</h4>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase mb-2 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Matched Requirements
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedMatch.match.analysis.matchedSkills.map(skill => (
                          <span key={skill} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-100">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    {selectedMatch.match.analysis.missingSkills.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-orange-600 uppercase mb-2 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Skill Gaps Identified
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedMatch.match.analysis.missingSkills.map(skill => (
                            <span key={skill} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs font-bold border border-orange-100">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* AI Reasoning */}
              <section className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                 <div className="flex items-center gap-2 mb-4">
                    <Bot className="w-5 h-5 text-indigo-600" />
                    <h4 className="text-sm font-black text-gray-900 uppercase">AI Analyst Insight</h4>
                 </div>
                 <p className="text-gray-600 leading-relaxed font-medium italic italic-serif">
                   "{selectedMatch.match.reasoning}"
                 </p>
              </section>

              {/* Background */}
              <section>
                 <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Candidate Profile</h4>
                 <div className="space-y-6">
                    <div className="flex gap-4">
                       <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
                       <div>
                          <p className="text-sm font-bold text-gray-900">Current/Previous Employer</p>
                          <p className="text-sm text-gray-500">{selectedMatch.candidate.currentEmployer || 'Confidential Enterprise'}</p>
                       </div>
                    </div>
                    <div className="flex gap-4">
                       <Briefcase className="w-5 h-5 text-gray-400 flex-shrink-0" />
                       <div>
                          <p className="text-sm font-bold text-gray-900">Experience History</p>
                          <p className="text-sm text-gray-500">{selectedMatch.candidate.experienceYears} Years in Relevant Field</p>
                       </div>
                    </div>
                    <div className="bg-gray-100/50 rounded-2xl p-5">
                       <p className="text-xs font-black text-gray-400 uppercase mb-2">Professional Bio</p>
                       <p className="text-sm text-gray-700 leading-relaxed">{selectedMatch.candidate.bio}</p>
                    </div>
                 </div>
              </section>

              {/* Footer Actions */}
              <div className="flex gap-4 pt-6 pb-12">
                 <button className="flex-1 bg-primary hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95">
                    Shortlist Candidate
                 </button>
                 <button className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-4 rounded-2xl hover:bg-gray-50 transition-all active:scale-95">
                    Request Full Resume
                 </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetail;