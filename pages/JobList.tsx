import React, { useEffect, useState, useMemo } from 'react';
import { getJobs, loadMoreJobs, updateJobCache, getRecentlyViewed, removeFromRecentlyViewed, clearRecentlyViewed } from '../services/dataService';
import { Job } from '../types';
import JobCard from '../components/JobCard';
import { Link } from 'react-router-dom';
import { Search, Filter, Loader2, X, SlidersHorizontal, RefreshCw, ChevronDown, DownloadCloud, History, Trash2 } from 'lucide-react';

const EXPERIENCE_LEVELS = ['Entry Level (0-2 yrs)', 'Mid Level (3-5 yrs)', 'Senior Level (6+ yrs)'];

const getExperienceLevel = (years: number) => {
  if (years <= 2) return 'Entry Level (0-2 yrs)';
  if (years <= 5) return 'Mid Level (3-5 yrs)';
  return 'Senior Level (6+ yrs)';
};

const JobList: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('Any Location');
  const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      const data = await getJobs();
      setJobs(data);
      updateJobCache(data);
      setLoading(false);
      setRecentJobs(getRecentlyViewed());
    };
    fetchJobs();
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    const data = await getJobs();
    setJobs(data);
    setLoading(false);
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    const updatedJobs = await loadMoreJobs();
    setJobs(updatedJobs);
    setLoadingMore(false);
  };

  const handleRemoveRecent = (e: React.MouseEvent, jobId: string) => {
    e.preventDefault();
    e.stopPropagation();
    removeFromRecentlyViewed(jobId);
    setRecentJobs(prev => prev.filter(j => j.id !== jobId));
  };

  const handleClearRecent = () => {
    clearRecentlyViewed();
    setRecentJobs([]);
  };

  const uniqueTypes = useMemo(() => Array.from(new Set(jobs.map(j => j.type))).sort(), [jobs]);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchTerm || job.title.toLowerCase().includes(searchTerm.toLowerCase()) || job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = locationFilter === 'Any Location' || job.location.includes(locationFilter);
    const jobLevel = getExperienceLevel(job.yearsExperience);
    const matchesExperience = selectedExperience.length === 0 || selectedExperience.includes(jobLevel);
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(job.type);
    return matchesSearch && matchesLocation && matchesExperience && matchesType;
  });

  const toggleFilter = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="bg-white border-b border-gray-200 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
            AI-Powered Talent Matching
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            A high-fidelity mockup showing how automated candidate ranking and job discovery transforms recruitment.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-2 rounded-2xl shadow-xl border border-gray-100 flex flex-col md:flex-row gap-2">
            <div className="flex-grow relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text"
                placeholder="Job title or company..."
                className="w-full pl-12 pr-4 py-4 rounded-xl border-0 focus:ring-2 focus:ring-primary/20 focus:outline-none text-gray-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="bg-primary hover:bg-blue-700 text-white px-10 py-4 rounded-xl font-bold transition-all shadow-lg active:scale-95">
              Find Jobs
            </button>
          </div>

          <div className="flex justify-center gap-4 mt-6">
            <button onClick={handleRefresh} className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
              <RefreshCw className="w-4 h-4" /> Sync Mock Data
            </button>
            <button onClick={handleLoadMore} className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
              <DownloadCloud className="w-4 h-4" /> Load More
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex flex-col lg:flex-row gap-10">
          
          <aside className="lg:w-64 space-y-8">
            <div>
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" /> Filters
              </h3>
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-black uppercase text-gray-400 mb-3 tracking-widest">Experience</p>
                  <div className="space-y-2">
                    {EXPERIENCE_LEVELS.map(level => (
                      <label key={level} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-primary rounded border-gray-300"
                          checked={selectedExperience.includes(level)}
                          onChange={() => toggleFilter(level, selectedExperience, setSelectedExperience)}
                        />
                        <span className="text-sm text-gray-600 group-hover:text-gray-900">{level}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-gray-400 mb-3 tracking-widest">Job Type</p>
                  <div className="space-y-2">
                    {uniqueTypes.map(type => (
                      <label key={type} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-primary rounded border-gray-300"
                          checked={selectedTypes.includes(type)}
                          onChange={() => toggleFilter(type, selectedTypes, setSelectedTypes)}
                        />
                        <span className="text-sm text-gray-600 group-hover:text-gray-900">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            {recentJobs.length > 0 && (
              <div className="mb-10">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" /> Recently Viewed
                  </h2>
                  <button onClick={handleClearRecent} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recentJobs.map(job => (
                    <Link key={job.id} to={`/job/${job.id}`} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all group relative">
                       <button onClick={(e) => handleRemoveRecent(e, job.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                         <X className="w-4 h-4" />
                       </button>
                       <h4 className="font-bold text-gray-900 text-sm truncate pr-4">{job.title}</h4>
                       <p className="text-xs text-gray-500 truncate">{job.company}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {loading ? 'Refreshing Results...' : `Active Opportunities (${filteredJobs.length})`}
              </h2>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Loading mock database...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map(job => (
                  <JobCard key={job.id} job={job} />
                ))}
                {filteredJobs.length === 0 && (
                  <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                    <p className="text-gray-500">No results found for your search.</p>
                  </div>
                )}
                <div className="text-center pt-8">
                  <button onClick={handleLoadMore} disabled={loadingMore} className="inline-flex items-center gap-2 px-8 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
                    {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                    Discover More
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobList;