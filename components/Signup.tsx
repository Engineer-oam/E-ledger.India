import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AuthService } from '../services/authService';
import { UserRole, Sector, ERPType } from '../types';
import { REGISTRY_CONFIG, PHARMA_SUB_CATEGORIES } from '../constants';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Loader2, Building2, UserCircle, RefreshCw, 
  ArrowRight, Globe, Pill, Cpu, Check, Lock, Search, X, ChevronDown,
  CheckCircle2, Tags, Stethoscope
} from 'lucide-react';
import Logo from './Logo';

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    orgName: '',
    gln: '',
    country: 'IN',
    sector: Sector.PHARMA, // Forced to Pharma
    role: UserRole.MANUFACTURER,
    positionLabel: '',
    password: '',
    erpType: ERPType.MANUAL,
    subCategories: [] as string[]
  });

  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredCountries = useMemo(() => {
    return REGISTRY_CONFIG.filter(c => 
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
      c.code.toLowerCase().includes(countrySearch.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [countrySearch]);

  const selectedCountry = useMemo(() => 
    REGISTRY_CONFIG.find(c => c.code === formData.country), 
  [formData.country]);

  // Always use Pharma config
  const availablePositions = useMemo(() => {
    if (!selectedCountry) return [];
    const sectorConfig = selectedCountry.sectors[Sector.PHARMA];
    return sectorConfig ? sectorConfig.roles : [];
  }, [selectedCountry]);

  useEffect(() => {
    if (isCountryModalOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isCountryModalOpen]);

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

  const toggleSubCategory = (category: string) => {
    setFormData(prev => {
      const exists = prev.subCategories.includes(category);
      if (exists) {
        return { ...prev, subCategories: prev.subCategories.filter(c => c !== category) };
      } else {
        return { ...prev, subCategories: [...prev.subCategories, category] };
      }
    });
  };

  const handleCountrySelect = (code: string) => {
    setFormData(prev => ({ ...prev, country: code }));
    setIsCountryModalOpen(false);
    setCountrySearch('');
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
      if (formData.gln.length !== 13) throw new Error('Identifier must be 13 digits (GS1 Standard).');
      
      await AuthService.signup(
        formData.name,
        formData.orgName,
        formData.gln,
        formData.role,
        formData.password,
        {
          country: formData.country,
          sector: Sector.PHARMA,
          positionLabel: formData.positionLabel,
          erpType: formData.erpType,
          erpStatus: formData.erpType === ERPType.MANUAL ? 'CONNECTED' : 'PENDING',
          subCategories: formData.subCategories
        }
      );
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Failed to register.');
    } finally {
      setLoading(false);
    }
  };

  const getCountryFlag = (countryCode: string) => {
    if (!countryCode || countryCode.length !== 2) return '🌐';
    return countryCode
      .toUpperCase()
      .split('')
      .map(char => String.fromCodePoint(char.charCodeAt(0) + 127397))
      .join('');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
      
      <div className="max-w-4xl w-full bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row max-h-[90vh] min-h-[600px]">
        
        {/* Left Sidebar */}
        <div className="hidden md:flex w-[38%] bg-[#0f172a] p-8 text-white flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-block p-3 bg-white rounded-xl mb-6 shadow-xl">
              <Logo size="md" />
            </div>
            <h2 className="text-2xl font-black mb-2 tracking-tight">E-Ledger India</h2>
            <p className="text-slate-400 text-xs leading-relaxed max-w-xs">
              Secure Pharmaceutical Supply Chain Network. CDSCO & GST Compliant.
            </p>
          </div>

          <div className="relative z-10 space-y-6">
             {[1, 2, 3, 4].map(s => (
                <div key={s} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step === s ? 'bg-teal-600 shadow-[0_0_15px_rgba(13,148,136,0.4)]' : 'bg-slate-800 text-slate-500'}`}>{s}</div>
                  <p className={`font-bold text-xs tracking-wide ${step === s ? 'text-white' : 'text-slate-500'}`}>
                    {s === 1 ? 'Market Context' : s === 2 ? 'Identity & License' : s === 3 ? 'ERP Protocol' : 'Finalize Keys'}
                  </p>
                </div>
             ))}
          </div>

          <div className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em] relative z-10">
            Protocol: Drugs & Cosmetics Act, 1940
          </div>
        </div>

        {/* Right Form Area */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          <div className="p-8 pb-4 shrink-0 flex justify-between items-start">
             <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Register Node</h2>
                <p className="text-slate-400 text-[11px] font-bold mt-0.5 uppercase tracking-widest">Stage {step} of 4</p>
             </div>
             <Link to="/login" className="px-4 py-1.5 bg-[#eff2f9] text-[#4d69ff] rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#e0e7ff] transition-all">Sign In</Link>
          </div>

          <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-8">
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                {/* Active Market Card */}
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Jurisdiction</label>
                  <div className="flex items-center justify-between p-5 bg-teal-50 border border-teal-100 rounded-2xl">
                     <div className="flex items-center gap-4">
                        <div className="text-3xl font-bold text-teal-200 font-mono tracking-tighter">
                          {formData.country}
                        </div>
                        <div className="text-left">
                           <p className="text-[9px] font-black text-teal-700 uppercase tracking-widest leading-none mb-1">Active Market</p>
                           <p className="text-lg font-black text-slate-900 tracking-tight">India</p>
                        </div>
                     </div>
                     <span className="text-2xl">🇮🇳</span>
                  </div>
                  <p className="text-[10px] text-slate-400 italic font-medium px-1 leading-tight">Regulatory reporting and serialization rules adapt to Indian standards (iVEDA).</p>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                   <div className="flex items-start gap-4">
                      <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm text-indigo-600">
                         <Stethoscope size={24} />
                      </div>
                      <div>
                         <h4 className="font-bold text-slate-800 text-sm">Pharmaceutical Supply Chain</h4>
                         <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            This node will be initialized for drug tracking, Schedule H1 monitoring, and anti-counterfeit verification.
                         </p>
                      </div>
                   </div>
                </div>
                
                <button type="button" onClick={() => setStep(2)} className="w-full bg-[#0f172a] hover:bg-slate-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-[0.98] uppercase text-xs tracking-[0.3em]">
                  Proceed to Identity <ArrowRight size={18} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Organization Details</label>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="relative">
                      <UserCircle className="absolute left-4 top-3 text-slate-400" size={18} />
                      <input name="name" required value={formData.name} onChange={handleChange} className="w-full pl-11 pr-4 py-3 bg-[#f8faff] border-transparent rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all" placeholder="Authorized Signatory" />
                    </div>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-3 text-slate-400" size={18} />
                      <input name="orgName" required value={formData.orgName} onChange={handleChange} className="w-full pl-11 pr-4 py-3 bg-[#f8faff] border-transparent rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all" placeholder="Registered Entity Name" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Role & License</label>
                  <select name="position" value={formData.positionLabel} onChange={handleChange} className="w-full px-4 py-3 bg-[#f8faff] border-transparent rounded-xl outline-none text-sm font-bold text-slate-700 focus:bg-white">
                    {availablePositions.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                  </select>
                  
                  {/* Always Show Pharma Sub-Categories */}
                  <div className="space-y-2 pt-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Tags size={12} />
                      Operational Scope
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PHARMA_SUB_CATEGORIES.map(category => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => toggleSubCategory(category)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                            formData.subCategories.includes(category)
                              ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                    <p className="text-[9px] text-slate-400 italic">Select all domains covered by your FDA/Drug Control license.</p>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Globe className="absolute left-4 top-3 text-slate-400" size={18} />
                      <input name="gln" required maxLength={13} minLength={13} value={formData.gln} onChange={handleChange} className="w-full pl-11 pr-4 py-3 bg-[#f8faff] border-transparent rounded-xl text-sm font-mono focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" placeholder="License No. / GSTIN (13 digit GLN)" />
                    </div>
                    <button type="button" onClick={handleGenerateGLN} className="px-4 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors" title="Generate Demo GLN">
                      <RefreshCw size={18} className="text-slate-600" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 py-4 border-2 border-[#eff2f9] rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50 transition-colors">Back</button>
                  <button type="button" onClick={() => setStep(3)} className="flex-[2] bg-[#0f172a] text-white font-black py-4 rounded-xl uppercase text-[10px] tracking-[0.2em] shadow-xl">Integrate ERP</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="bg-[#f0f4ff] p-5 rounded-2xl flex gap-4 border border-[#e0e7ff]">
                  <div className="p-3 bg-[#4d69ff] rounded-xl text-white shadow-lg shrink-0 h-fit">
                    <Cpu size={22} />
                  </div>
                  <div>
                    <h4 className="font-black text-[#0f172a] text-[13px] uppercase tracking-tight">Middleware Integration</h4>
                    <p className="text-[11px] text-[#5c6b8c] leading-relaxed font-medium mt-1">Connect your internal system to the blockchain gateway.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                   {Object.values(ERPType).map(type => (
                     <button key={type} type="button" onClick={() => setFormData({...formData, erpType: type})} className={`p-4 rounded-xl flex justify-between items-center transition-all ${formData.erpType === type ? 'bg-white border-2 border-[#4d69ff] shadow-lg' : 'bg-[#f8faff] border-2 border-transparent hover:bg-[#f1f5ff]'}`}>
                        <div className="flex flex-col text-left">
                          <span className={`font-black text-[11px] uppercase tracking-widest ${formData.erpType === type ? 'text-[#4d69ff]' : 'text-slate-400'}`}>{type}</span>
                          <span className="text-[9px] text-slate-500 font-bold mt-0.5 uppercase tracking-tighter">{type === ERPType.MANUAL ? 'Standard Web Terminal' : 'API Connection Hook'}</span>
                        </div>
                        {formData.erpType === type && <div className="w-5 h-5 bg-[#4d69ff] rounded-full flex items-center justify-center text-white"><Check size={12} strokeWidth={4} /></div>}
                     </button>
                   ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(2)} className="flex-1 py-4 border-2 border-[#eff2f9] rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Back</button>
                  <button type="button" onClick={() => setStep(4)} className="flex-[2] bg-[#0f172a] text-white font-black py-4 rounded-xl uppercase text-[10px] tracking-[0.2em] shadow-xl">Final Security</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Node Secret</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3 text-slate-400" size={18} />
                    <input name="password" type="password" required value={formData.password} onChange={handleChange} className="w-full pl-11 pr-4 py-3 bg-[#f8faff] border-transparent rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-[#4d69ff]/10 outline-none" placeholder="••••••••••••" />
                  </div>
                </div>

                <div className="bg-[#f8faff] p-6 rounded-2xl border border-[#e8effd] space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    Terminal Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Region Node</span>
                      <span className="text-xs font-black text-slate-900 truncate block">INDIA</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Sector Protocol</span>
                      <span className="text-xs font-black text-slate-900 truncate block">PHARMA (CDSCO)</span>
                    </div>
                  </div>
                  {formData.subCategories.length > 0 && (
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Operations</span>
                      <div className="flex flex-wrap gap-1">
                        {formData.subCategories.map(sub => (
                          <span key={sub} className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-bold uppercase">{sub}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(3)} className="flex-1 py-4 border-2 border-[#eff2f9] rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Back</button>
                  <button type="submit" disabled={loading} className="flex-[2] bg-[#4d69ff] text-white font-black py-4 rounded-xl shadow-xl shadow-[#4d69ff]/30 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase text-[10px] tracking-[0.2em]">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <span>Initialize Terminal</span>}
                  </button>
                </div>
              </div>
            )}
          </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;