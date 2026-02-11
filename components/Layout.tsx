import React, { useState, useEffect } from 'react';
import { Briefcase, UserCircle, UploadCloud, X, Loader2, CheckCircle2, FileText, LogOut, Sparkles } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser, uploadResume, clearCurrentUser } from '../services/dataService';
import { Candidate } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<Candidate | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success'>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    // Check for existing session on mount
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, [location.pathname]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadState('uploading');
    try {
      const profile = await uploadResume(selectedFile);
      setUser(profile);
      setUploadState('success');
      
      // Close modal after success
      setTimeout(() => {
        setIsModalOpen(false);
        setUploadState('idle');
        setSelectedFile(null);
        navigate('/my-matches');
      }, 1500);
    } catch (error) {
      console.error("Upload failed", error);
      setUploadState('idle');
    }
  };

  const handleSignOut = () => {
    clearCurrentUser();
    setUser(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-slate-800 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Briefcase className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-gray-900 tracking-tight">
              Talent<span className="text-primary">Match</span> AI
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-600">
            {user && (
               <Link to="/my-matches" className="text-primary font-bold flex items-center gap-1">
                 <Sparkles className="w-4 h-4" />
                 My Recommendations
               </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
             {user && (
               <div className="flex items-center gap-4">
                 <div className="text-right hidden sm:block">
                   <p className="text-xs text-gray-400 font-medium">Signed in as</p>
                   <p className="text-sm font-bold text-gray-800 leading-none">{user.name}</p>
                 </div>
                 <button 
                   onClick={handleSignOut}
                   className="text-gray-400 hover:text-red-500 transition-colors p-2"
                   title="Sign Out"
                 >
                   <LogOut className="w-5 h-5" />
                 </button>
               </div>
             )}
             
             {!user && (
               <button 
                 onClick={() => setIsModalOpen(true)}
                 className="bg-primary hover:bg-blue-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-md transition-all flex items-center gap-2"
               >
                 <UploadCloud className="w-4 h-4" />
                 Upload Resume
               </button>
             )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">TalentMatch AI</h3>
              <p className="text-sm leading-relaxed">
                A conceptual recruitment platform demonstrating intelligent talent matching and career discovery.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="hover:text-white transition-colors">Search Jobs</Link></li>
                <li><button onClick={() => !user && setIsModalOpen(true)} className="hover:text-white transition-colors">Submit Resume</button></li>
              </ul>
            </div>
             <div>
              <h4 className="text-white font-semibold mb-3">Contact Information</h4>
              <ul className="space-y-2 text-sm">
                <li>X-XXX-XXXXX-XX</li>
                <li>XXXXXXX@XXXXXXXXXX.XX</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
            <p>&copy; 2024 TalentMatch AI Platform. Demonstration Only.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
               <a href="#" className="hover:text-white">Privacy Policy</a>
               <a href="#" className="hover:text-white">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <UploadCloud className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Upload Your Resume</h2>
              <p className="text-sm text-gray-500 mt-1">We accept PDF, DOCX, and TXT files for analysis.</p>
            </div>

            {uploadState === 'success' ? (
               <div className="text-center py-8">
                 <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4 animate-bounce" />
                 <h3 className="text-lg font-bold text-gray-900">Profile Processed!</h3>
                 <p className="text-gray-500 text-sm mt-2">Opening your personalized recommendations...</p>
               </div>
            ) : uploadState === 'uploading' ? (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">Analyzing Experience...</h3>
                <p className="text-gray-500 text-sm mt-2">AI is mapping your background to current opportunities.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    selectedFile ? 'border-primary bg-blue-50' : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                  }`}
                >
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden" 
                    id="resume-upload"
                    onChange={handleFileSelect}
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center">
                    {selectedFile ? (
                      <>
                        <FileText className="w-8 h-8 text-primary mb-2" />
                        <span className="font-medium text-gray-900">{selectedFile.name}</span>
                        <span className="text-xs text-gray-500 mt-1">{(selectedFile.size / 1024).toFixed(0)} KB</span>
                        <span className="text-primary text-xs font-semibold mt-3">Click to change</span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-medium text-gray-700">Click to browse or drag file here</span>
                        <span className="text-xs text-gray-400 mt-2">Max file size 5MB</span>
                      </>
                    )}
                  </label>
                </div>

                <button 
                  onClick={handleUpload}
                  disabled={!selectedFile}
                  className="w-full bg-primary hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-md"
                >
                  Analyze & Show Recommendations
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;