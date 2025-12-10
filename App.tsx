import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context';
import Login from './Login';
import Layout from './Layout';
import Dashboard from './Dashboard';
import Leaves from './Leaves';
import Payslips from './Payslips';
import Holidays from './Holidays';
import Profile from './Profile';
import Directory from './Directory';
import Organization from './Organization';
import TimeLogs from './TimeLogs';

// Auth Guard
const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAppContext();
  return currentUser ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/time-logs" element={<RequireAuth><TimeLogs /></RequireAuth>} />
          <Route path="/leaves" element={<RequireAuth><Leaves /></RequireAuth>} />
          <Route path="/payslips" element={<RequireAuth><Payslips /></RequireAuth>} />
          <Route path="/holidays" element={<RequireAuth><Holidays /></RequireAuth>} />
          <Route path="/directory" element={<RequireAuth><Directory /></RequireAuth>} />
          <Route path="/organization" element={<RequireAuth><Organization /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/profile/:id" element={<RequireAuth><Profile /></RequireAuth>} />
        </Routes>
      </AppProvider>
    </HashRouter>
  );
}
