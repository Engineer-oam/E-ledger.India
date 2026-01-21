
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
    // Prioritize EXCISE, PHARMA, FMCG in order
    const sectors = Object.keys(selectedCountry.sectors) as Sector[];
    const priority = [Sector.EXCISE, Sector.PHARMA, Sector.FMCG];
    return sectors.sort((a, b) => priority.indexOf(a) - priority.indexOf(b));
  }, [selectedCountry]);

  const availablePositions = useMemo(() => {
    if (!selectedCountry) return [];
    const sectorConfig = selectedCountry.sectors[formData.sector as Sector];
    return sectorConfig ? sectorConfig.roles : [];
  }, [selectedCountry, formData.sector]);

  // Focus search input when modal opens
  useEffect(() => {
    if (isCountryModalOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isCountryModalOpen]);

  // Reset sector and position when country changes
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

  // Update role/label when sector changes
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

  /**
   * Generates a country flag emoji based on ISO code.
   */
  const getCountryFlag = (countryCode: string) => {
    if (!countryCode || countryCode.length !== 2) return '🌐';
    return countryCode
      .toUpperCase()
      .split('')
      .map(char => String.fromCodePoint(char.charCodeAt(0) + 127397))
      .join('');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      
      {/* Country Selection Pop-up Modal */}
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
                      placeholder="Search by country name or ISO code..." 
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-500 font-medium"
                    />
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50">
                 <div className="grid grid-cols-1 gap-2">
                    {filteredCountries.map(c => (
                      <button 
                        key={c.code} 
                        type="button" 
                        onClick={() => handleCountrySelect(c.code)} 
                        className={`group flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${formData.country === c.code ? 'border-indigo-600 bg-white shadow-xl shadow-indigo-900/5 ring-4 ring-indigo-500/5' : 'border-white hover:border-slate-200 bg-white'}`}
                      >
                        <div className="flex items-center gap-4">
                           <span className="text-3xl filter drop-shadow-sm group-hover:scale-110 transition-transform">{getCountryFlag(c.code)}</span>
                           <div className="text-left">
                              <p className={`font-black text-sm uppercase tracking-tight ${formData.country === c.code ? 'text-indigo-600' : 'text-slate-700'}`}>{c.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Network Node: {c.code}-MAINNET</p>
                           </div>
                        </div>
                        {formData.country === c.code ? (
                          <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg">
                             <Check size={14} strokeWidth={3} />
                          </div>
                        ) : (
                          <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
                        )}
                      </button>
                    ))}
                    {filteredCountries.length === 0 && (
                      <div className="py-20 text-center flex flex-col items-center gap-4 text-slate-400">
                         <Globe size={48} className="opacity-10" />
                         <p className="text-sm font-bold uppercase tracking-widest">No matching markets found</p>
                      </div>
                    )}
                 </div>
              </div>
              <div className="p-6 bg-white border-t border-slate-100 shrink-0 text-center">
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">E-Ledger Multi-Country Registry v2.5</p>
              </div>
           </div>
        </div>
      )}

      <div className="max-w-4xl w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[750px]">
        
        {/* Sidebar Info */}
        <div className="hidden md:flex w-5/12 bg-slate-900 p-10 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          
          <div className="relative z-10">
            <div className="inline-block p-3 bg-indigo-600 rounded-2xl mb-6 shadow-lg">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-3xl font-extrabold mb-3 tracking-tight">E-Ledger Node</h2>
            <p className="text-slate-400 text-sm">Deploying GS1 standards for {formData.sector} across {selectedCountry?.name}.</p>
          </div>

          <div className="relative z-10 space-y-4">
             {[1, 2, 3, 4].map(s => (
                <div key={s} className={`flex items-center gap-4 text-sm transition-all ${step === s ? 'text-white' : 'text-slate-500'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border transition-all ${step === s ? 'bg-indigo-600 border-indigo-600 scale-110 shadow-lg shadow-indigo-900/50' : 'bg-slate-800 border-slate-700'}`}>{s}</div>
                  <p className={`font-bold ${step === s ? 'translate-x-1' : ''} transition-transform`}>{s === 1 ? 'Global Market' : s === 2 ? 'Node Identity' : s === 3 ? 'ERP Protocol' : 'Finalize Cryptography'}</p>
                </div>
             ))}
          </div>

          <div className="text-[10px] text-slate-500 font-mono relative z-10 border-t border-slate-800 pt-6">
            PROTOCOL: EPCIS 2.0 <br/> 
            STATUS: READY TO PROVISION
          </div>
        </div>

        {/* Form Area */}
        <div className="flex-1 p-8 md:p-12 flex flex-col">
          <div className="flex justify-between items-start mb-8">
             <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Register Terminal</h2>
                <p className="text-slate-500 text-sm font-medium">Stage {step} of 4</p>
             </div>
             <Link to="/login" className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full uppercase tracking-widest hover:bg-indigo-100 transition-colors">Sign In</Link>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-xl flex items-center gap-3">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          <div className="flex-1">
          <form onSubmit={handleSubmit} className="space-y-8">
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Global Jurisdiction</label>
                  <button 
                    type="button"
                    onClick={() => setIsCountryModalOpen(true)}
                    className="group w-full flex items-center justify-between p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl hover:bg-white hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-900/5 transition-all duration-300"
                  >
                     <div className="flex items-center gap-5">
                        <div className="text-4xl filter drop-shadow-sm group-hover:scale-110 transition-transform text-slate-400 group-hover:text-slate-600">
                          {formData.country}
                        </div>
                        <div className="text-left">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Active Market</p>
                           <p className="text-xl font-black text-slate-900 tracking-tight">{selectedCountry?.name}</p>
                        </div>
                     </div>
                     <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        Change <ChevronDown size={14} />
                     </div>
                  </button>
                  <p className="text-[10px] text-slate-400 italic px-2">Tax compliance and reporting formats will adjust to local regulations.</p>
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Industry Protocol</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                    {availableSectors.map(s => (
                      <button 
                        key={s} 
                        type="button" 
                        onClick={() => setFormData(prev => ({...prev, sector: s}))} 
                        className={`flex items-center gap-4 p-5 rounded-3xl border-2 transition-all group ${formData.sector === s ? 'border-indigo-600 bg-white ring-4 ring-indigo-500/5 shadow-xl shadow-indigo-900/5' : 'border-slate-100 hover:border-slate-200 bg-slate-50'}`}
                      >
                        <div className={`p-4 rounded-2xl transition-all ${formData.sector === s ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'bg-slate-200 text-slate-500'}`}>
                          {s === Sector.EXCISE ? <Stamp size={24} /> : s === Sector.PHARMA ? <Pill size={24} /> : s === Sector.FMCG ? <ShoppingBag size={24} /> : <MapPin size={24} />}
                        </div>
                        <span className={`font-black text-xs uppercase tracking-widest transition-colors ${formData.sector === s ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>{s}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <button type="button" onClick={() => setStep(2)} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-3xl flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-[0.98] uppercase text-xs tracking-[0.3em]">
                  Proceed to Identity <ArrowRight size={18} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Node Ownership Details</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <UserCircle className="absolute left-4 top-3.5 text-slate-400" size={18} />
                      <input name="name" required value={formData.name} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all" placeholder="Authorized Signatory" />
                    </div>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-3.5 text-slate-400" size={18} />
                      <input name="orgName" required value={formData.orgName} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all" placeholder="Registered Entity" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Position & GLN Identity</label>
                  <select name="position" value={formData.positionLabel} onChange={handleChange} className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl outline-none text-sm bg-white font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10">
                    {availablePositions.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Globe className="absolute left-4 top-3.5 text-slate-400" size={18} />
                      <input name="gln" required maxLength={13} minLength={13} value={formData.gln} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl text-sm font-mono focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all" placeholder="GLN (13 Digits)" />
                    </div>
                    <button type="button" onClick={handleGenerateGLN} className="px-6 bg-slate-100 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors flex items-center gap-2">
                      <RefreshCw size={14} />
                      <span className="hidden sm:inline">Mint</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 py-4 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:border-slate-200 transition-colors">Go Back</button>
                  <button type="button" onClick={() => setStep(3)} className="flex-[2] bg-slate-900 text-white font-black py-4 rounded-2xl uppercase text-[10px] tracking-[0.2em] shadow-xl">Integrate ERP</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="bg-indigo-50 p-6 rounded-2xl flex gap-4 border border-indigo-100 shadow-inner">
                  <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shrink-0 h-fit">
                    <Cpu size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-indigo-900 text-sm uppercase tracking-tight">Middleware Integration</h4>
                    <p className="text-xs text-indigo-700/80 leading-relaxed font-medium mt-1">Select an automated adapter to sync your internal transactions with the public ledger.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                   {Object.values(ERPType).map(type => (
                     <button key={type} type="button" onClick={() => setFormData({...formData, erpType: type})} className={`p-5 border-2 rounded-2xl flex justify-between items-center transition-all ${formData.erpType === type ? 'border-indigo-600 bg-indigo-50 shadow-lg ring-4 ring-indigo-500/5' : 'border-slate-100 hover:border-slate-200 bg-slate-50'}`}>
                        <div className="flex flex-col text-left">
                          <span className={`font-black text-xs uppercase tracking-widest ${formData.erpType === type ? 'text-indigo-900' : 'text-slate-600'}`}>{type}</span>
                          <span className="text-[10px] text-slate-400 font-bold mt-0.5">{type === ERPType.MANUAL ? 'Web Terminal Interface' : 'Direct API Link'}</span>
                        </div>
                        {formData.erpType === type && <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg"><Check size={14} strokeWidth={4} /></div>}
                     </button>
                   ))}
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)} className="flex-1 py-4 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Back</button>
                  <button type="button" onClick={() => setStep(4)} className="flex-[2] bg-slate-900 text-white font-black py-4 rounded-2xl uppercase text-[10px] tracking-[0.2em] shadow-xl">Final Security</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Node Access Secret</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input name="password" type="password" required value={formData.password} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none" placeholder="Master Key" />
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    Ledger Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase">Region</span>
                      <span className="text-xs font-black text-slate-800">{selectedCountry?.name}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase">Node Type</span>
                      <span className="text-xs font-black text-slate-800">{formData.positionLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(3)} className="flex-1 py-4 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Back</button>
                  <button type="submit" disabled={loading} className="flex-[2] bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-900/20 flex items-center justify-center gap-3 transition-all hover:translate-y-[-2px] active:scale-[0.98] uppercase text-[10px] tracking-[0.2em]">
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <span>Provision Node</span>}
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
