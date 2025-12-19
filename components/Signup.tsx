
import React, { useState, useEffect, useMemo } from 'react';
import { AuthService } from '../services/authService';
import { UserRole, Sector, ERPType } from '../types';
import { REGISTRY_CONFIG } from '../constants';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2, Building2, UserCircle, MapPin, RefreshCw, AlertTriangle, ArrowRight, Globe, Layers, ShoppingBag, Leaf, Pill, Stamp, Cpu, Check } from 'lucide-react';

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    orgName: '',
    gln: '',
    country: 'IN',
    sector: Sector.EXCISE,
    role: UserRole.MANUFACTURER,
    positionLabel: 'Distillery / Brewery / Bottler',
    password: '',
    erpType: ERPType.MANUAL
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const selectedCountry = useMemo(() => 
    REGISTRY_CONFIG.find(c => c.code === formData.country), 
  [formData.country]);

  const availablePositions = useMemo(() => {
    if (!selectedCountry) return [];
    return selectedCountry.sectors[formData.sector]?.roles || [];
  }, [selectedCountry, formData.sector]);

  useEffect(() => {
    if (availablePositions.length > 0) {
      setFormData(prev => ({
        ...prev,
        role: availablePositions[0].role,
        positionLabel: availablePositions[0].label
      }));
    }
  }, [availablePositions]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'position') {
      const pos = availablePositions.find(p => p.label === value);
      if (pos) {
        setFormData(prev => ({ ...prev, role: pos.role, positionLabel: pos.label }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
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
      if (formData.gln.length !== 13) throw new Error('GLN must be exactly 13 digits.');
      
      await AuthService.signup(
        formData.name,
        formData.orgName,
        formData.gln,
        formData.role,
        formData.password,
        {
          country: formData.country,
          sector: formData.sector,
          positionLabel: formData.positionLabel,
          erpType: formData.erpType,
          erpStatus: formData.erpType === ERPType.MANUAL ? 'CONNECTED' : 'PENDING'
        }
      );
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Failed to register.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[650px]">
        
        {/* Sidebar Info */}
        <div className="hidden md:flex w-5/12 bg-slate-900 p-10 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          
          <div className="relative z-10">
            <div className="inline-block p-3 bg-indigo-600 rounded-2xl mb-6 shadow-lg">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-3xl font-extrabold mb-3 tracking-tight">E-Ledger Node</h2>
            <p className="text-slate-400 text-sm">Join the global {formData.sector} network across {selectedCountry?.name}.</p>
          </div>

          <div className="relative z-10 space-y-4">
             {[1, 2, 3, 4].map(s => (
                <div key={s} className={`flex items-center gap-4 text-sm transition-all ${step === s ? 'text-white' : 'text-slate-500'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border ${step === s ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-800 border-slate-700'}`}>{s}</div>
                  <p>{s === 1 ? 'Market' : s === 2 ? 'Identity' : s === 3 ? 'Integration' : 'Security'}</p>
                </div>
             ))}
          </div>

          <div className="text-[10px] text-slate-500 font-mono relative z-10">EPCIS 2.0 • ERP ADAPTER READY</div>
        </div>

        {/* Form Area */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
          <div className="flex justify-between items-start mb-8">
             <div>
                <h2 className="text-2xl font-bold text-slate-800">Registration</h2>
                <p className="text-slate-500 text-sm">Step {step} of 4</p>
             </div>
             <Link to="/login" className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">SIGN IN</Link>
          </div>

          {error && <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Country</label>
                  <select name="country" value={formData.country} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl outline-none text-sm bg-white">
                    {REGISTRY_CONFIG.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Sector</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[Sector.EXCISE, Sector.PHARMA, Sector.FMCG, Sector.AGRICULTURE].map(s => (
                      <button key={s} type="button" onClick={() => setFormData(prev => ({...prev, sector: s}))} className={`py-3 rounded-xl border text-[10px] font-bold ${formData.sector === s ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}>{s}</button>
                    ))}
                  </div>
                </div>
                <button type="button" onClick={() => setStep(2)} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2">Continue <ArrowRight size={18} /></button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                   <input name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm" placeholder="Full Name" />
                   <input name="orgName" required value={formData.orgName} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm" placeholder="Company Name" />
                </div>
                <div className="flex gap-2">
                  <input name="gln" required maxLength={13} minLength={13} value={formData.gln} onChange={handleChange} className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-mono" placeholder="License GLN (13 digits)" />
                  <button type="button" onClick={handleGenerateGLN} className="px-4 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold"><RefreshCw size={14} /></button>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 py-3.5 border border-slate-200 rounded-xl text-sm">Back</button>
                  <button type="button" onClick={() => setStep(3)} className="flex-[2] bg-slate-900 text-white font-bold py-3.5 rounded-xl">Next</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                <div className="bg-blue-50 p-4 rounded-xl flex gap-3 border border-blue-100">
                  <Cpu className="text-blue-600 shrink-0" />
                  <p className="text-xs text-blue-800 leading-relaxed font-medium">Connect your ERP system to automate blockchain event publishing from your invoices and dispatch notes.</p>
                </div>
                <div className="grid grid-cols-1 gap-2">
                   {Object.values(ERPType).map(type => (
                     <button key={type} type="button" onClick={() => setFormData({...formData, erpType: type})} className={`p-4 border rounded-xl flex justify-between items-center transition-all ${formData.erpType === type ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500/10' : 'border-slate-200 hover:border-slate-300'}`}>
                        <span className="font-bold text-sm text-slate-700">{type}</span>
                        {formData.erpType === type && <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white"><Check size={14} /></div>}
                     </button>
                   ))}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)} className="flex-1 py-3.5 border border-slate-200 rounded-xl text-sm">Back</button>
                  <button type="button" onClick={() => setStep(4)} className="flex-[2] bg-slate-900 text-white font-bold py-3.5 rounded-xl">Final Step</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                <input name="password" type="password" required value={formData.password} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm" placeholder="Password" />
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px] text-slate-600">
                  <p><span className="font-bold">ERP Integration:</span> {formData.erpType}</p>
                  <p><span className="font-bold">Mode:</span> {formData.erpType === ERPType.MANUAL ? 'Direct Blockchain Entry' : 'Adapter Middleware'}</p>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(3)} className="flex-1 py-3.5 border border-slate-200 rounded-xl text-sm">Back</button>
                  <button type="submit" disabled={loading} className="flex-[2] bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2">
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <span>Complete Onboarding</span>}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
