import React from 'react';
import { Job } from '../types';
import { MapPin, Clock, DollarSign, ChevronRight, Sparkles, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

interface JobCardProps {
  job: Job;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const isNew = job.isNew;

  return (
    <Link 
      to={`/job/${job.id}`}
      className={`block bg-white border rounded-xl p-6 hover:shadow-lg transition-all duration-200 group relative overflow-hidden ${
        isNew 
          ? 'border-orange-300 ring-1 ring-orange-100 shadow-md' 
          : 'border-gray-200 hover:border-primary/30'
      }`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-6 h-6 text-primary" />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
              {job.title}
            </h3>
            {isNew && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 animate-pulse">
                <Flame className="w-3 h-3 mr-1" /> NEW
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 font-medium mb-3">{job.company}</p>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-gray-400" />
              {job.location}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gray-400" />
              {job.type}
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-gray-700">
              <DollarSign className="w-4 h-4 text-accent" />
              {job.payRate}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-primary rounded-full text-sm font-semibold whitespace-nowrap">
           <Sparkles className="w-4 h-4" />
           <span>AI Matches Available</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
        {job.skills.slice(0, 3).map((skill, index) => (
          <span key={index} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
            {skill}
          </span>
        ))}
        {job.skills.length > 3 && (
          <span className="px-2.5 py-1 text-gray-400 text-xs">
            +{job.skills.length - 3} more
          </span>
        )}
      </div>
    </Link>
  );
};

export default JobCard;