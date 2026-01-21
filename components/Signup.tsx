
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AuthService } from '../services/authService';
import { UserRole, Sector, ERPType } from '../types';
import { REGISTRY_CONFIG } from '../constants';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Loader2, Building2, UserCircle, RefreshCw, 
  AlertTriangle, ArrowRight, Globe, ShoppingBag, 
  Pill, Stamp, Cpu, Check, Lock, Search, X, ChevronDown, ChevronRight,
  MapPin
} from 'lucide-react';

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    orgName: '',
    gln: '',
    country: 'IN',
    sector: Sector.EXCISE,
    role: UserRole.MANUFACTURER,
    positionLabel: '',
    password: '',
    erpType: ERPType.MANUAL
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

  const availableSectors = useMemo(() => {
    if (!selectedCountry) return [];
    const sectors = Object.keys(selectedCountry.sectors) as Sector[];
    const priority = [Sector.EXCISE, Sector.PHARMA, Sector.FMCG];
    return sectors.sort((a, b) => priority.indexOf(a) - priority.indexOf(b));
  }, [selectedCountry]);

  const availablePositions = useMemo(() => {
    if (!selectedCountry) return [];
    const sectorConfig = selectedCountry.sectors[formData.sector as Sector];
    return sectorConfig ? sectorConfig.roles : [];
  }, [selectedCountry, formData.sector]);

  useEffect(() => {
    if (isCountryModalOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isCountryModalOpen]);

  useEffect(() => {
    if (availableSectors.length > 0) {
      const firstSector = availableSectors[0];
      const sectorConfig = selectedCountry!.sectors[firstSector];
      if (sectorConfig) {
        setFormData(prev => ({
          ...prev,
          sector: firstSector,
          role: sectorConfig.roles[0].role,
          positionLabel: sectorConfig.roles[0].label
        }));
      }
    }
  }, [formData.country, availableSectors, selectedCountry]);

  useEffect(() => {
    if (availablePositions.length > 0) {
      setFormData(prev => ({
        ...prev,
        role: availablePositions[0].role,
        positionLabel: availablePositions[0].label
      }));
    }
  }, [formData.sector, availablePositions]);

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
      
      {isCountryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col h-[80vh] max-h-[700px] animate-in zoom-in-95 duration-300">
              <div className="bg-slate-900 p-8 text-white shrink-0">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black tracking-tight">Select Operational Market</h3>
                    <button onClick={() => setIsCountryModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                       <X size={24} />
                    </button>
                 </div>
                 <div className="relative group">
                    <Search className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                    <input 
                      ref={searchInputRef}
                      type="text" 
                      placeholder="Search market..." 
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-500 font-medium"
                    />
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                 <div className="grid grid-cols-1 gap-2">
                    {filteredCountries.map(c => (
                      <button 
                        key={c.code} 
                        type="button" 
                        onClick={() => handleCountrySelect(c.code)} 
                        className={`group flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${formData.country === c.code ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-50 hover:border-slate-200 bg-white'}`}
                      >
                        <div className="flex items-center gap-4">
                           <span className="text-3xl">{getCountryFlag(c.code)}</span>
                           <div className="text-left">
                              <p className={`font-black text-sm uppercase tracking-tight ${formData.country === c.code ? 'text-indigo-600' : 'text-slate-700'}`}>{c.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Network Node: {c.code}-MAINNET</p>
                           </div>
                        </div>
                        {formData.country === c.code && <Check size={18} className="text-indigo-600" />}
                      </button>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="max-w-4xl w-full bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row min-h-[750px]">
        
        {/* Left Sidebar */}
        <div className="hidden md:flex w-[42%] bg-[#0f172a] p-10 text-white flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-block p-4 bg-indigo-600 rounded-2xl mb-8 shadow-xl">
              <ShieldCheck size={36} />
            </div>
            <h2 className="text-4xl font-black mb-4 tracking-tight">E-Ledger Node</h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Deploying GS1 standards for {formData.sector} across {selectedCountry?.name}.
            </p>
          </div>

          <div className="relative z-10 space-y-8">
             {[1, 2, 3, 4].map(s => (
                <div key={s} className="flex items-center gap-6">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step === s ? 'bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'bg-slate-800 text-slate-500'}`}>{s}</div>
                  <p className={`font-bold text-sm tracking-wide ${step === s ? 'text-white' : 'text-slate-500'}`}>
                    {s === 1 ? 'Global Market' : s === 2 ? 'Node Identity' : s === 3 ? 'ERP Protocol' : 'Finalize Cryptography'}
                  </p>
                </div>
             ))}
          </div>

          <div className="text-[11px] text-slate-600 font-bold uppercase tracking-[0.2em] relative z-10">
            Protocol: EPCIS 2.0 / DSCSA 2023
          </div>
        </div>

        {/* Right Form Area */}
        <div className="flex-1 p-8 md:p-12 flex flex-col bg-white">
          <div className="flex justify-between items-start mb-10">
             <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Register Terminal</h2>
                <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest">Stage {step} of 4</p>
             </div>
             <Link to="/login" className="px-5 py-2.5 bg-[#eff2f9] text-[#4d69ff] rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-[#e0e7ff] transition-all">Sign In</Link>
          </div>

          <div className="flex-1">
          <form onSubmit={handleSubmit} className="space-y-10">
            {step === 1 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
                {/* Active Market Card matching screenshot */}
                <div className="space-y-4">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Global Jurisdiction</label>
                  <div className="flex items-center justify-between p-7 bg-[#f8faff] border border-[#e8effd] rounded-[2rem]">
                     <div className="flex items-center gap-6">
                        <div className="text-4xl font-bold text-slate-300 font-mono tracking-tighter">
                          {formData.country}
                        </div>
                        <div className="text-left">
                           <p className="text-[10px] font-black text-[#899bbc] uppercase tracking-widest leading-none mb-2">Active Market</p>
                           <p className="text-2xl font-black text-slate-900 tracking-tight">{selectedCountry?.name}</p>
                        </div>
                     </div>
                     <button 
                        type="button" 
                        onClick={() => setIsCountryModalOpen(true)}
                        className="bg-[#e9f0ff] text-[#4263eb] px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#dbeafe] transition-all"
                      >
                        Change <ChevronDown size={14} />
                     </button>
                  </div>
                  <p className="text-[11px] text-slate-400 italic font-medium px-2">Tax compliance and reporting formats will adjust to local regulations.</p>
                </div>

                {/* Industry Protocol Section matching screenshot circles */}
                <div className="space-y-4">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Industry Protocol</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                    {availableSectors.map(s => (
                      <button 
                        key={s} 
                        type="button" 
                        onClick={() => setFormData(prev => ({...prev, sector: s}))} 
                        className={`flex items-center gap-5 p-6 rounded-[2rem] border-2 transition-all ${formData.sector === s ? 'border-[#4d69ff] bg-white ring-8 ring-[#4d69ff]/5 shadow-[0_15px_40px_rgba(77,105,255,0.1)]' : 'border-transparent bg-[#f8faff] hover:bg-[#f1f5ff]'}`}
                      >
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${formData.sector === s ? 'bg-[#4d69ff] text-white' : 'bg-slate-200 text-slate-500'}`}>
                          {s === Sector.EXCISE ? <Stamp size={26} /> : s === Sector.PHARMA ? <Pill size={26} /> : s === Sector.FMCG ? <ShoppingBag size={26} /> : <MapPin size={26} />}
                        </div>
                        <span className={`font-black text-xs uppercase tracking-widest ${formData.sector === s ? 'text-slate-900' : 'text-slate-400'}`}>{s}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <button type="button" onClick={() => setStep(2)} className="w-full bg-[#0f172a] hover:bg-slate-800 text-white font-black py-6 rounded-[2rem] flex items-center justify-center gap-4 shadow-2xl transition-all active:scale-[0.98] uppercase text-xs tracking-[0.3em]">
                  Proceed to Identity <ArrowRight size={20} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-4">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">Node Ownership Details</label>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="relative">
                      <UserCircle className="absolute left-5 top-4.5 text-slate-400" size={20} />
                      <input name="name" required value={formData.name} onChange={handleChange} className="w-full pl-14 pr-6 py-4 bg-[#f8faff] border-transparent rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all" placeholder="Authorized Signatory" />
                    </div>
                    <div className="relative">
                      <Building2 className="absolute left-5 top-4.5 text-slate-400" size={20} />
                      <input name="orgName" required value={formData.orgName} onChange={handleChange} className="w-full pl-14 pr-6 py-4 bg-[#f8faff] border-transparent rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all" placeholder="Registered Entity Name" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">Position & Identity</label>
                  <select name="position" value={formData.positionLabel} onChange={handleChange} className="w-full px-6 py-4 bg-[#f8faff] border-transparent rounded-2xl outline-none text-sm font-bold text-slate-700 focus:bg-white">
                    {availablePositions.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                  </select>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Globe className="absolute left-5 top-4.5 text-slate-400" size={20} />
                      <input name="gln" required maxLength={13} minLength={13} value={formData.gln} onChange={handleChange} className="w-full pl-14 pr-6 py-4 bg-[#f8faff] border-transparent rounded-2xl text-sm font-mono focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" placeholder="License No / GLN" />
                    </div>
                    <button type="button" onClick={handleGenerateGLN} className="px-6 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors">
                      <RefreshCw size={20} className="text-slate-600" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 py-5 border-2 border-[#eff2f9] rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50 transition-colors">Back</button>
                  <button type="button" onClick={() => setStep(3)} className="flex-[2] bg-[#0f172a] text-white font-black py-5 rounded-2xl uppercase text-[11px] tracking-[0.2em] shadow-xl">Integrate ERP</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="bg-[#f0f4ff] p-7 rounded-[2rem] flex gap-5 border border-[#e0e7ff]">
                  <div className="p-4 bg-[#4d69ff] rounded-2xl text-white shadow-lg shrink-0 h-fit">
                    <Cpu size={28} />
                  </div>
                  <div>
                    <h4 className="font-black text-[#0f172a] text-sm uppercase tracking-tight">Middleware Integration</h4>
                    <p className="text-xs text-[#5c6b8c] leading-relaxed font-medium mt-2">Connect your internal system to the blockchain gateway for automated reporting.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                   {Object.values(ERPType).map(type => (
                     <button key={type} type="button" onClick={() => setFormData({...formData, erpType: type})} className={`p-6 rounded-2xl flex justify-between items-center transition-all ${formData.erpType === type ? 'bg-white border-2 border-[#4d69ff] shadow-xl' : 'bg-[#f8faff] border-2 border-transparent hover:bg-[#f1f5ff]'}`}>
                        <div className="flex flex-col text-left">
                          <span className={`font-black text-xs uppercase tracking-widest ${formData.erpType === type ? 'text-[#4d69ff]' : 'text-slate-400'}`}>{type}</span>
                          <span className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">{type === ERPType.MANUAL ? 'Standard Web Terminal' : 'API Connection Hook'}</span>
                        </div>
                        {formData.erpType === type && <div className="w-6 h-6 bg-[#4d69ff] rounded-full flex items-center justify-center text-white"><Check size={14} strokeWidth={4} /></div>}
                     </button>
                   ))}
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setStep(2)} className="flex-1 py-5 border-2 border-[#eff2f9] rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Back</button>
                  <button type="button" onClick={() => setStep(4)} className="flex-[2] bg-[#0f172a] text-white font-black py-5 rounded-2xl uppercase text-[11px] tracking-[0.2em] shadow-xl">Final Security</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-4">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">Master Node Secret</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-4.5 text-slate-400" size={20} />
                    <input name="password" type="password" required value={formData.password} onChange={handleChange} className="w-full pl-14 pr-6 py-4 bg-[#f8faff] border-transparent rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-[#4d69ff]/10 outline-none" placeholder="••••••••••••" />
                  </div>
                </div>

                <div className="bg-[#f8faff] p-8 rounded-[2rem] border border-[#e8effd] space-y-5">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    Terminal Provisioning Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Region Node</span>
                      <span className="text-sm font-black text-slate-900">{selectedCountry?.name}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Sector Protocol</span>
                      <span className="text-sm font-black text-slate-900">{formData.sector}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setStep(3)} className="flex-1 py-5 border-2 border-[#eff2f9] rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Back</button>
                  <button type="submit" disabled={loading} className="flex-[2] bg-[#4d69ff] text-white font-black py-5 rounded-2xl shadow-2xl shadow-[#4d69ff]/30 flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase text-[11px] tracking-[0.2em]">
                    {loading ? <Loader2 size={22} className="animate-spin" /> : <span>Initialize Terminal</span>}
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
