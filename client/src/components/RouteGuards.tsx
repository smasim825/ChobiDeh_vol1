import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EDFDF9]">
        <div className="w-8 h-8 rounded-full border-2 border-[#0F766E] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const RequireCompletedProfile: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EDFDF9]">
        <div className="w-8 h-8 rounded-full border-2 border-[#0F766E] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (currentUser && currentUser.profileCompleted === false) {
    return <Navigate to="/complete-profile" replace />;
  }

  return <>{children}</>;
};

export const RedirectIfAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EDFDF9]">
        <div className="w-8 h-8 rounded-full border-2 border-[#0F766E] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (currentUser) {
    const from = (location.state as any)?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};
