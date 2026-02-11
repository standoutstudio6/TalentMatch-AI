import React, { useEffect, useState, useMemo, useRef } from 'react';
import { getJobs, scrapeLiveJobs, loadMoreJobs, updateJobCache, getRecentlyViewed, removeFromRecentlyViewed, clearRecentlyViewed } from '../services/dataService';
import { Job } from '../types';
import JobCard from '../components/JobCard';
import { Link } from 'react-router-dom';
import { Search, Filter, Loader2, X, SlidersHorizontal, RefreshCw, CheckCircle2, Terminal, ChevronDown, DownloadCloud, History, Clock, Trash2 } from 'lucide-react';

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
  
  // Scraper State
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  
  // Load More State
  const [loadingMore, setLoadingMore] = useState(false);

  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('Any Location');

  // Advanced Filters State
  const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  
  // Mobile filter visibility
  const [showFilters, setShowFilters] = useState(false);

  // Ref for auto-scrolling terminal
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      const data = await getJobs();
      setJobs(data);
      updateJobCache(data);
      setLoading(false);
    };
    fetchJobs();
    
    // Load recently viewed jobs from local storage
    setRecentJobs(getRecentlyViewed());
  }, []);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [scanLogs]);

  const addLog = (msg: string) => {
    setScanLogs(prev => [...prev, msg]);
  };

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleScan = async () => {
    setScanning(true);
    setScanSuccess(false);
    setScanLogs([]);

    try {
      addLog("> Initializing SmartScraper Engine...");
      await wait(600);
      addLog("> Aggregating distributed job feeds...");
      await wait(800);
      addLog("> Feed Connection Established (200 OK)");
      addLog("> Authorization successful. API Token verified.");
      await wait(600);
      addLog("> Loading data structures...");
      await wait(500);
      addLog("> Identifying relevant opportunity nodes...");
      await wait(400);

      // Simulate parsing "pages" of jobs
      const newJobs = await scrapeLiveJobs();
      const totalNew = newJobs.filter(j => j.isNew).length;
      
      // Simulate iteration through found jobs
      for (let i = 0; i < 15; i++) {
         if (Math.random() > 0.3) {
           const randJob = newJobs[Math.floor(Math.random() * newJobs.length)];
           addLog(`> Found Entry ID [${randJob.id}]: ${randJob.title} - ${randJob.location}`);
           await wait(150);
         }
      }
      addLog("> ... Synchronizing remaining data packets ...");
      await wait(400);
      
      addLog(`> Aggregation Complete. Identified ${totalNew} new opportunities.`);
      addLog("> Processing AI-readiness for incoming data...");
      await wait(400);
      addLog("> Updating localized cache...");
      await wait(400);
      addLog("> DONE.");

      setJobs(newJobs);
      updateJobCache(newJobs);
      setScanSuccess(true);
      
      // Close modal after short success delay
      await wait(1500);
      setScanning(false);
      setScanLogs([]);
      
    } catch (error) {
      console.error("Scraping failed", error);
      addLog("> ERROR: Data stream interrupted.");
    }
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const updatedJobs = await loadMoreJobs();
      setJobs(updatedJobs);
    } catch (error) {
      console.error("Failed to load more jobs", error);
    } finally {
      setLoadingMore(false);
    }
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

  // Derived Options
  const uniqueTypes = useMemo(() => Array.from(new Set(jobs.map(j => j.type))).sort(), [jobs]);
  const uniqueSkills = useMemo(() => Array.from(new Set(jobs.flatMap(j => j.skills))).sort(), [jobs]);

  // Filter Logic
  const filteredJobs = jobs.filter(job => {
    // Text Search
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      job.title.toLowerCase().includes(searchLower) || 
      job.company.toLowerCase().includes(searchLower);

    // Location
    let matchesLocation = true;
    if (locationFilter === 'Remote') {
      matchesLocation = job.location.toLowerCase().includes('remote');
    } else if (locationFilter !== 'Any Location') {
       matchesLocation = job.location.toLowerCase().includes(locationFilter.toLowerCase().split(',')[0].trim());
    }

    // Experience
    const jobLevel = getExperienceLevel(job.yearsExperience);
    const matchesExperience = selectedExperience.length === 0 || selectedExperience.includes(jobLevel);

    // Type
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(job.type);

    // Skills
    const matchesSkills = selectedSkills.length === 0 || 
      job.skills.some(skill => selectedSkills.includes(skill));

    return matchesSearch && matchesLocation && matchesExperience && matchesType && matchesSkills;
  });

  const toggleFilter = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLocationFilter('Any Location');
    setSelectedExperience([]);
    setSelectedTypes([]);
    setSelectedSkills([]);
  };

  const activeFiltersCount = selectedExperience.length + selectedTypes.length + selectedSkills.length;

  return (
    <div className="bg-gray-50 min-h-screen pb-12 relative">
      
      {/* --- Scraping Overlay --- */}
      {scanning && (
        <div className="fixed inset-0 z-50 bg-gray-900/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-black text-green-500 font-mono w-full max-w-2xl rounded-lg shadow-2xl border border-gray-700 overflow-hidden flex flex-col h-[500px]">
            {/* Header */}
            <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700 text-gray-300">
               <div className="flex items-center gap-2">
                 <Terminal className="w-4 h-4" />
                 <span className="text-sm font-semibold">TalentMatch Scraper v2.1.0 -- Live Data Sync</span>
               </div>
               <div className="flex gap-1.5">
                 <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                 <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                 <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
               </div>
            </div>
            
            {/* Terminal Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-700">
              {scanLogs.map((log, i) => (
                <div key={i} className={`${log.includes('ERROR') ? 'text-red-500' : 'text-green-400'}`}>
                  {log}
                </div>
              ))}
              <div ref={logEndRef} className="animate-pulse">_</div>
            </div>

            {/* Footer */}
            <div className="bg-gray-800 px-4 py-3 border-t border-gray-700 text-xs text-gray-400 flex justify-between items-center">
               <span>Target: Multi-Channel Job Aggregator</span>
               {scanSuccess ? (
                 <span className="text-green-400 font-bold flex items-center gap-1">
                   <CheckCircle2 className="w-3 h-3" /> SYNCHRONIZED
                 </span>
               ) : (
                 <span className="text-yellow-400 font-bold flex items-center gap-1">
                   <Loader2 className="w-3 h-3 animate-spin" /> SCANNING...
                 </span>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Search Hero Section */}
      <div className="bg-white shadow-sm border-b border-gray-200 pt-8 pb-8 px-4">
        <div className="max-w-4xl mx-auto text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
            Find Your Next Employee or Career Path
          </h1>
          <p className="text-gray-500 text-lg">
            Intelligent job discovery and candidate matching powered by general AI simulation.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          <div className="bg-white p-2 rounded-xl shadow-lg border border-gray-100 flex flex-col md:flex-row gap-2">
            <div className="flex-grow relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text"
                placeholder="Job title, keywords, or company name"
                className="w-full pl-10 pr-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:outline-none text-gray-900 placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="md:w-48 relative border-t md:border-t-0 md:border-l border-gray-200">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select 
                className="w-full pl-10 pr-8 py-3 rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:outline-none text-gray-900 bg-transparent appearance-none cursor-pointer"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <option>Any Location</option>
                <option>Remote</option>
                <option>Minneapolis, MN</option>
                <option>St. Paul, MN</option>
                <option>Bloomington, MN</option>
                <option>Rochester, MN</option>
                <option>Duluth, MN</option>
                <option>Brooklyn Park, MN</option>
                <option>Plymouth, MN</option>
                <option>St. Cloud, MN</option>
                <option>Woodbury, MN</option>
                <option>Eagan, MN</option>
                <option>Maple Grove, MN</option>
                <option>Eden Prairie, MN</option>
              </select>
            </div>
            <button className="bg-primary hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition-colors shadow-md">
              Search
            </button>
          </div>

          {/* Scrape Button Area */}
          <div className="flex justify-center gap-3">
            <button
              onClick={handleScan}
              disabled={scanning}
              className={`
                flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm shadow-sm transition-all
                bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md
              `}
            >
              <RefreshCw className="w-4 h-4" />
              Update Job Feed
            </button>

            <button
              onClick={handleLoadMore}
              disabled={loadingMore || scanning}
              className={`
                flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm shadow-sm transition-all
                bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {loadingMore ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <DownloadCloud className="w-4 h-4 text-gray-600" />
              )}
              Fetch More Jobs
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 p-3 rounded-lg font-semibold text-gray-700 shadow-sm"
            >
              <SlidersHorizontal className="w-5 h-5" />
              {showFilters ? 'Hide Filters' : 'Show Advanced Filters'}
              {activeFiltersCount > 0 && (
                <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Sidebar Filters */}
          <aside className={`lg:w-64 flex-shrink-0 space-y-8 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            
            {/* Active Filters Clear */}
            {(activeFiltersCount > 0 || searchTerm || locationFilter !== 'Any Location') && (
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="font-semibold text-gray-900">Filters</span>
                <button 
                  onClick={clearFilters}
                  className="text-sm text-primary hover:text-blue-700 font-medium hover:underline flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear All
                </button>
              </div>
            )}

            {/* Experience Level */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Experience Level</h3>
              <div className="space-y-2">
                {EXPERIENCE_LEVELS.map(level => (
                  <label key={level} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox"
                      className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary focus:ring-offset-0"
                      checked={selectedExperience.includes(level)}
                      onChange={() => toggleFilter(level, selectedExperience, setSelectedExperience)}
                    />
                    <span className="text-gray-600 group-hover:text-gray-900 text-sm transition-colors">{level}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Employment Type */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Employment Type</h3>
              <div className="space-y-2">
                {uniqueTypes.map(type => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox"
                      className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary focus:ring-offset-0"
                      checked={selectedTypes.includes(type)}
                      onChange={() => toggleFilter(type, selectedTypes, setSelectedTypes)}
                    />
                    <span className="text-gray-600 group-hover:text-gray-900 text-sm transition-colors">{type}</span>
                  </label>
                ))}
              </div>
            </div>

             {/* Skills */}
             <div>
              <h3 className="font-bold text-gray-900 mb-3">Skills</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                {uniqueSkills.map(skill => (
                  <label key={skill} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox"
                      className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary focus:ring-offset-0"
                      checked={selectedSkills.includes(skill)}
                      onChange={() => toggleFilter(skill, selectedSkills, setSelectedSkills)}
                    />
                    <span className="text-gray-600 group-hover:text-gray-900 text-sm transition-colors">{skill}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Results List */}
          <div className="flex-1">
            
            {/* Recently Viewed - Featured Section in Main Content */}
            {recentJobs.length > 0 && (
              <div className="mb-8 bg-gray-50/50 rounded-xl p-1 relative">
                <div className="flex justify-between items-center mb-4 pl-1 pr-2">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    Recently Viewed
                  </h2>
                  <button
                    onClick={handleClearRecent}
                    className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear History
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentJobs.map(job => (
                    <Link 
                      key={job.id} 
                      to={`/job/${job.id}`}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:border-primary hover:shadow-md transition-all group flex flex-col h-full relative"
                    >
                      <button
                        onClick={(e) => handleRemoveRecent(e, job.id)}
                        className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                        title="Remove from history"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-900 text-sm group-hover:text-primary line-clamp-1 pr-2" title={job.title}>{job.title}</h3>
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full whitespace-nowrap font-medium">{job.type}</span>
                      </div>
                      <div className="mt-auto">
                        <p className="text-xs text-gray-500 font-medium mb-1.5 line-clamp-1">{job.company}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-400">
                           <div className="flex items-center gap-1">
                             <Clock className="w-3 h-3" />
                             <span className="truncate max-w-[80px]">{job.postedDate}</span>
                           </div>
                           <span className="text-green-600 font-bold bg-green-50 px-1.5 rounded">{job.payRate.split(' ')[0]}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {loading ? 'Processing...' : `Available Positions (${filteredJobs.length})`}
              </h2>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Aggregating job feeds...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredJobs.length > 0 ? (
                  filteredJobs.map(job => (
                    <JobCard key={job.id} job={job} />
                  ))
                ) : (
                  <div className="text-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
                       <Filter className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No matches found</h3>
                    <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                      Try broadening your search criteria or clearing specific filters.
                    </p>
                    <button 
                      onClick={clearFilters}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
                
                {/* Load More Button */}
                {filteredJobs.length > 0 && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Fetching data...
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          View More Opportunities
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-400 mt-2">
                      Retrieved from simulated global job feeds.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default JobList;