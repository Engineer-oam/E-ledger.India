
import React, { useState, useEffect } from 'react';
import { AuthService } from '../services/authService';
import { User } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2, ArrowRight, Lock, KeyRound, CheckCircle2 } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const REMEMBER_KEY = 'eledger_remembered_gln';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [view, setView] = useState<'login' | 'forgot'>('login');
  
  // Login State
  const [gln, setGln] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Forgot Password State
  const [resetGln, setResetGln] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1: Enter GLN, 2: Enter New Pass

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Load remembered GLN on mount
  useEffect(() => {
    const savedGln = localStorage.getItem(REMEMBER_KEY);
    if (savedGln) {
      setGln(savedGln);
      setRememberMe(true);
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await AuthService.login(gln, password);
      if (user) {
        // Handle Remember Me
        if (rememberMe) {
          localStorage.setItem(REMEMBER_KEY, gln);
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }
        
        onLogin(user);
        navigate('/dashboard');
      } else {
        setError('Invalid GLN or Password');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (newPassword.length < 4) {
        throw new Error("Password is too short.");
      }
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const result = await AuthService.resetPassword(resetGln, newPassword);
      if (result) {
        setSuccess('Password reset successfully. You can now login.');
        // Reset state to login view after delay
        setTimeout(() => {
            setView('login');
            setGln(resetGln); // Pre-fill login
            setPassword('');
            setResetStep(1);
            setSuccess('');
        }, 2000);
      } else {
        setError('GLN not found in system.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300">
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10">
            <div className="inline-block p-3 bg-blue-600 rounded-xl mb-4 shadow-lg shadow-blue-900/50">
              {view === 'login' ? <ShieldCheck size={32} className="text-white" /> : <KeyRound size={32} className="text-white" />}
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">E-Ledger</h1>
            <p className="text-slate-400 text-sm">
              {view === 'login' ? 'Secure Supply Chain Login' : 'Account Recovery'}
            </p>
          </div>
        </div>
        
        <div className="p-8 pt-10">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg text-center animate-in fade-in">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg text-center flex items-center justify-center gap-2 animate-in fade-in">
              <CheckCircle2 size={16} />
              {success}
            </div>
          )}
          
          {view === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Global Location Number (GLN)
                </label>
                <input
                  type="text"
                  required
                  value={gln}
                  onChange={(e) => setGln(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-mono text-sm"
                  placeholder="0000000000000"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Password
                  </label>
                  <button 
                    type="button"
                    onClick={() => { setView('forgot'); setError(''); }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 cursor-pointer select-none">
                  Remember my GLN
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow-md transition-all flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetSubmit} className="space-y-5">
              {resetStep === 1 && (
                <>
                  <p className="text-sm text-slate-600 text-center mb-4">
                    Enter your GLN to locate your account. In a real system, we would email you a reset link.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Your GLN
                    </label>
                    <input
                      type="text"
                      required
                      value={resetGln}
                      onChange={(e) => setResetGln(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder="0000000000000"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                        if(resetGln.length >= 8) setResetStep(2);
                        else setError('Please enter a valid GLN');
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg transition-colors"
                  >
                    Next Step
                  </button>
                </>
              )}

              {resetStep === 2 && (
                <>
                   <p className="text-sm text-slate-600 text-center mb-4">
                     Identity verified (Simulated). Set a new password below.
                   </p>
                   <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                      placeholder="New password"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirm password"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2"
                  >
                     {loading ? <Loader2 size={18} className="animate-spin"/> : <Lock size={18} />}
                     <span>Reset Password</span>
                  </button>
                </>
              )}

              <button 
                type="button"
                onClick={() => { setView('login'); setError(''); setResetStep(1); }}
                className="w-full mt-2 text-slate-500 hover:text-slate-800 text-sm font-medium py-2"
              >
                Cancel and return to Login
              </button>
            </form>
          )}

          {view === 'login' && (
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-slate-500 text-sm mb-3">Don't have an identity?</p>
              <Link 
                to="/signup" 
                className="text-blue-600 hover:text-blue-800 font-semibold text-sm transition-colors"
              >
                Register New Organization
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
