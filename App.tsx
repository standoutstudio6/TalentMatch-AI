import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import JobList from './pages/JobList';
import JobDetail from './pages/JobDetail';
import CandidateMatches from './pages/CandidateMatches';
import Layout from './components/Layout';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App: React.FC = () => {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<JobList />} />
          <Route path="/job/:jobId" element={<JobDetail />} />
          <Route path="/my-matches" element={<CandidateMatches />} />
          {/* Catch-all route: Redirects any unknown URL back to the main Job List */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;