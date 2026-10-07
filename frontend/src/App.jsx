import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import CreateJobPage from './pages/CreateJobPage';
import JobsListPage from './pages/JobsListPage';
import JobDetailPage from './pages/JobDetailPage';
import CertificatesListPage from './pages/CertificatesListPage';
import CertificateDetailPage from './pages/CertificateDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased font-sans flex">
        {/* Fixed Left Sidebar */}
        <Sidebar />

        {/* Main Content Area offset by Sidebar width */}
        <div className="pl-64 flex-1 flex flex-col min-h-screen w-full min-w-0 bg-[#fafbfe]">
          <Header />
          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto pb-24">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/create-job" element={<CreateJobPage />} />
              <Route path="/jobs" element={<JobsListPage />} />
              <Route path="/jobs/:id" element={<JobDetailPage />} />
              <Route path="/certificates" element={<CertificatesListPage />} />
              <Route path="/certificates/:id" element={<CertificateDetailPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
