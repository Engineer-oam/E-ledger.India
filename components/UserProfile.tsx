
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { AuthService } from '../services/authService';
import { UserCircle, Building2, MapPin, Shield, Save, Loader2, Cpu, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

interface UserProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    orgName: user.orgName
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real app, this would be an API call
      const updatedUser = {
        ...user,
        name: formData.name,
        orgName: formData.orgName
      };
      onUpdate(updatedUser);
      toast.success('Profile updated successfully.');
    } catch (error) {
      toast.error('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const isAuthority = user.role === UserRole.REGULATOR || user.role === UserRole.AUDITOR;

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">User Profile</h2>
          <p className="text-slate-500 text-sm">Manage account and organization details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full">
            {/* Header / Banner */}
            <div className="bg-slate-900 p-8 text-white flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
              <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-3xl font-bold shrink-0 shadow-lg ring-4 ring-slate-800">
                {user.name.charAt(0)}
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold">{user.name}</h3>
                <div className="flex items-center justify-center md:justify-start space-x-2 text-slate-400 mt-1">
                  <Shield size={16} />
                  <span className="text-sm font-medium">{user.role}</span>
                </div>
              </div>
            </div>

            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Read Only Fields */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2 tracking-wider">GLN (Digital Identity)</label>
                    <div className="relative">
                      <MapPin size={18} className="absolute left-3 top-3 text-slate-400" />
                      <input
                        disabled
                        value={user.gln}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 font-mono text-sm cursor-not-allowed"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Immutable GS1 Identifier</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2 tracking-wider">Account Role</label>
                    <div className="relative">
                      <Shield size={18} className="absolute left-3 top-3 text-slate-400" />
                      <input
                        disabled
                        value={user.role}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Editable Fields */}
                  <div className="md:col-span-2 border-t border-slate-100 pt-6 mt-2">
                    <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <UserCircle size={18} className="text-indigo-600" />
                        Account Holder Details
                    </h4>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Full Name</label>
                    <div className="relative">
                      <UserCircle size={18} className="absolute left-3 top-3 text-slate-400" />
                      <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Organization Name</label>
                    <div className="relative">
                      <Building2 size={18} className="absolute left-3 top-3 text-slate-400" />
                      <input
                        name="orgName"
                        value={formData.orgName}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-70 shadow-lg shadow-indigo-900/10 active:scale-95"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    <span>Update Account Details</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
            {!isAuthority && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="p-3 bg-indigo-50 rounded-xl w-fit mb-4">
                        <Cpu className="text-indigo-600" size={24} />
                    </div>
                    <h3 className="font-bold text-slate-800 mb-2">ERP Integration</h3>
                    <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                        Your account is currently linked via <strong>{user.erpType}</strong>. 
                        Configure automated data synchronization from your local enterprise system.
                    </p>
                    <Link 
                        to="/erp-settings" 
                        className="flex items-center justify-between w-full p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-xl transition-all group"
                    >
                        <span className="text-sm font-bold text-slate-700">Manage Integration</span>
                        <ArrowRight size={18} className="text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-slate-800 mb-4">Security Status</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">2FA Verification</span>
                        <span className="text-emerald-600 font-bold">Enabled</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">API Gateway</span>
                        <span className="text-emerald-600 font-bold">Active</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Last Login</span>
                        <span className="text-slate-700 font-medium">Today, 10:45 AM</span>
                    </div>
                </div>
                <button className="w-full mt-6 py-2.5 text-red-600 font-bold text-xs uppercase border border-red-100 rounded-lg hover:bg-red-50 transition-colors">
                    Reset Security Keys
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
