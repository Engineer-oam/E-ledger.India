import React, { useState } from 'react';
import { AuthService } from '../services/authService';
import { UserRole } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2, Building2, UserCircle, MapPin, RefreshCw } from 'lucide-react';

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    orgName: '',
    gln: '',
    role: UserRole.MANUFACTURER,
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerateGLN = (e: React.MouseEvent) => {
    e.preventDefault();
    const newGln = AuthService.generateGLN();
    setFormData(prev => ({ ...prev, gln: newGln }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (formData.gln.length !== 13) {
        throw new Error('GLN must be exactly 13 digits.');
      }
      
      await AuthService.signup(
        formData.name,
        formData.orgName,
        formData.gln,
        formData.role,
        formData.password
      );
      
      // Auto redirect to login after signup
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Failed to register.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Decorative Side (Hidden on mobile) */}
        <div className="hidden md:flex flex-col justify-between w-1/3 bg-slate-900 p-8 text-white">
          <div>
            <div className="inline-block p-2 bg-blue-600 rounded-lg mb-4">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-xl font-bold mb-2">Join the Network</h2>
            <p className="text-slate-400 text-sm">Become a verified participant in the global supply chain ledger.</p>
          </div>
          <div className="text-xs text-slate-500">
            © 2024 E-Ledger Consortium
          </div>
        </div>

        {/* Form Side */}
        <div className="flex-1 p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Create Account</h2>
          
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Full Name</label>
                <div className="relative">
                  <UserCircle size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="John Doe"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Org Name</label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    name="orgName"
                    required
                    value={formData.orgName}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="Acme Corp"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">GLN (13-Digits)</label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    name="gln"
                    required
                    maxLength={13}
                    minLength={13}
                    value={formData.gln}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                    placeholder="0000000000000"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGenerateGLN}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg border border-slate-300 transition-colors flex items-center"
                  title="Generate Random GLN"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Organization Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
              >
                {Object.values(UserRole).map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Password</label>
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-70 text-white font-bold py-3 rounded-lg shadow-md transition-all flex items-center justify-center"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm">Already registered?</p>
            <Link to="/login" className="text-blue-600 hover:text-blue-800 font-semibold text-sm">
              Sign In here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;