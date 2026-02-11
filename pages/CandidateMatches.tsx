import React, { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { getCurrentUser, getJobs } from '../services/dataService';
import { rankJobsForCandidate, JobMatchResult } from '../services/geminiService';
import { Candidate, Job } from '../types';
import { Loader2, Sparkles, MapPin, DollarSign, ArrowRight, UserCheck } from 'lucide-react';

const CandidateMatches: React.FC = () => {
  const [user, setUser] = useState<Candidate | null>(null);
  const [matches, setMatches] = useState<{ job: Job; match: JobMatchResult }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setLoading(false);
        return;
      }
      setUser(currentUser);

      try {
        // 1. Get all available jobs
        const allJobs = await getJobs();
        
        // 2. Run AI matching (Job List vs Candidate)
        // Note: For demo performance, we might limit the input list inside the service
        const rankedResults = await rankJobsForCandidate(currentUser, allJobs);
        
        // 3. Merge data for display
        const displayData = rankedResults.map(result => {
            const job = allJobs.find(j => j.id === result.jobId);
            return job ? { job, match: result } : null;
        }).filter(item => item !== null) as { job: Job; match: JobMatchResult }[];

        setMatches(displayData);
      } catch (error) {
        console.error("Error matching jobs", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  if (!loading && !user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Profile Summary Card */}
        {user && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8 flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-20 h-20 bg-blue-100 text-primary rounded-full flex items-center justify-center flex-shrink-0">
               <UserCheck className="w-10 h-10" />
            </div>
            <div className="flex-grow text-center md:text-left">
               <h1 className="text-2xl font-bold text-gray-900">Hello, {user.name}</h1>
               <p className="text-gray-500 font-medium mb-2">{user.title}</p>
               <div className="flex flex-wrap justify-center md:justify-start gap-2">
                 {user.skills.map(skill => (
                   <span key={skill} className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full border border-gray-200">
                     {skill}
                   </span>
                 ))}
               </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-4 py-2 bg-green-50 text-green-700 text-sm font-bold rounded-lg border border-green-100">
                {matches.length} Jobs Found
              </span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">Finding your perfect fit...</h2>
            <p className="text-gray-500">Comparing your skills against our open positions.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Top AI Recommendations
            </h2>
            
            {matches.map(({ job, match }, index) => {
              // Styling based on score
              const isTopMatch = index === 0;
              let scoreColor = 'text-green-600';
              if (match.score < 70) scoreColor = 'text-yellow-600';
              
              return (
                <div 
                  key={job.id} 
                  className={`bg-white rounded-xl overflow-hidden transition-shadow hover:shadow-lg border ${isTopMatch ? 'border-indigo-200 ring-2 ring-indigo-100 shadow-md' : 'border-gray-200'}`}
                >
                  <div className="p-6 flex flex-col md:flex-row gap-6">
                    {/* Score Column */}
                    <div className="flex flex-col items-center justify-center md:border-r border-gray-100 md:pr-6 min-w-[100px]">
                       <div className={`text-3xl font-extrabold ${scoreColor}`}>{match.score}%</div>
                       <div className="text-[10px] uppercase font-bold text-gray-400">Match Score</div>
                    </div>

                    {/* Job Details */}
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 hover:text-primary transition-colors">
                            <Link to={`/job/${job.id}`}>{job.title}</Link>
                          </h3>
                          <p className="text-gray-500 font-medium">{job.company}</p>
                        </div>
                        {isTopMatch && (
                          <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded font-bold">
                            TOP CHOICE
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-gray-400" /> {job.location}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-gray-700">
                          <DollarSign className="w-4 h-4 text-accent" /> {job.payRate}
                        </span>
                      </div>

                      {/* AI Reasoning */}
                      <div className="bg-indigo-50 rounded-lg p-3 text-sm text-indigo-900 italic border border-indigo-100 mb-4">
                        <span className="font-bold not-italic mr-1">Why:</span>
                        {match.reasoning}
                      </div>

                      {/* Strengths Tags */}
                      <div className="flex flex-wrap gap-2">
                         {match.strengths?.map(tag => (
                           <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-gray-600">
                             <Sparkles className="w-3 h-3 text-indigo-400" /> {tag}
                           </span>
                         ))}
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex items-center md:pl-4">
                      <Link 
                        to={`/job/${job.id}`}
                        className="w-full md:w-auto px-6 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-primary font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        View Job <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}

            {matches.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <p className="text-gray-500">No strong matches found for your profile yet.</p>
                <Link to="/" className="text-primary hover:underline mt-2 inline-block">Browse all jobs</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateMatches;