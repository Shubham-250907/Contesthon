import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/Layout';
import { AuthPage } from './pages/AuthPage';
import { ProfileSetup } from './pages/ProfileSetup';
import { Dashboard } from './pages/Dashboard';
import { Explore } from './pages/Explore';
import { EventDetail } from './pages/EventDetail';
import { Saved } from './pages/Saved';
import { Applications } from './pages/Applications';
import { Loader2, Trophy } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
        <Trophy className="w-6 h-6 text-brand-600" />
      </div>
      <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
      <p className="text-sm text-gray-500">Loading Contesthon...</p>
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/profile"
          element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>}
        />
        <Route
          path="/dashboard"
          element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>}
        />
        <Route
          path="/explore"
          element={<ProtectedRoute><Layout><Explore /></Layout></ProtectedRoute>}
        />
        <Route
          path="/events/:eventId"
          element={<ProtectedRoute><Layout><EventDetail /></Layout></ProtectedRoute>}
        />
        <Route
          path="/saved"
          element={<ProtectedRoute><Layout><Saved /></Layout></ProtectedRoute>}
        />
        <Route
          path="/applications"
          element={<ProtectedRoute><Layout><Applications /></Layout></ProtectedRoute>}
        />
      </Routes>
    </BrowserRouter>
  );
}
