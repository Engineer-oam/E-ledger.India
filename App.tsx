
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import BatchManager from './components/BatchManager';
import TraceVisualizer from './components/TraceVisualizer';
import Assistant from './components/Assistant';
import LandingPage from './components/LandingPage';
import Signup from './components/Signup';
import UserProfile from './components/UserProfile';
import ProductVerifier from './components/ProductVerifier';
import SSCCManager from './components/SSCCManager';
import VRSManager from './components/VRSManager';
import NetworkDirectory from './components/NetworkDirectory';
import FinancialRecords from './components/FinancialRecords';
import SystemSettings from './components/SystemSettings';
import ERPManager from './components/ERPManager';
import ERPModule from './components/ERPModule';
import BlockchainExplorer from './components/BlockchainExplorer';
import { User } from './types';
import { ToastContainer } from 'react-toastify';

const SESSION_KEY = 'eledger_active_session';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const storedSession = localStorage.getItem(SESSION_KEY);
      return storedSession ? JSON.parse(storedSession) : null;
    } catch (error) {
      console.error("Failed to parse session:", error);
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  });

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === SESSION_KEY) {
        if (event.newValue) {
          try {
            const user = JSON.parse(event.newValue);
            setCurrentUser(user);
          } catch (e) {
            console.error("Error parsing session from storage event", e);
          }
        } else {
          setCurrentUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogin = (user: User) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
  };

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
  };

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} newestOnTop={true} closeOnClick theme="colored" />
      <Routes>
        <Route path="/login" element={currentUser ? <Navigate to="/dashboard" replace /> : <LandingPage onLogin={handleLogin} />} />
        <Route path="/signup" element={currentUser ? <Navigate to="/dashboard" replace /> : <Signup />} />
        <Route path="/" element={currentUser ? <Navigate to="/dashboard" replace /> : <LandingPage onLogin={handleLogin} />} />

        <Route
          path="/*"
          element={
            currentUser ? (
              <Layout user={currentUser} onLogout={handleLogout}>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard user={currentUser} />} />
                  <Route path="/erp" element={<ERPModule user={currentUser} />} />
                  <Route path="/batches" element={<BatchManager user={currentUser} />} />
                  <Route path="/trace/:id" element={<TraceVisualizer user={currentUser} />} />
                  <Route path="/assistant" element={<Assistant />} />
                  <Route path="/transfers" element={<BatchManager user={currentUser} />} />
                  <Route path="/profile" element={<UserProfile user={currentUser} onUpdate={handleUserUpdate} />} />
                  <Route path="/verify" element={<ProductVerifier />} />
                  <Route path="/sscc" element={<SSCCManager user={currentUser} />} />
                  <Route path="/vrs" element={<VRSManager user={currentUser} />} />
                  <Route path="/network" element={<NetworkDirectory />} />
                  <Route path="/financials" element={<FinancialRecords user={currentUser} />} />
                  <Route path="/erp-settings" element={<ERPManager user={currentUser} />} />
                  <Route path="/blockchain" element={<BlockchainExplorer />} />
                  <Route path="/settings" element={<SystemSettings />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
