
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/authService';
import { User } from '../types';
import { 
  ShieldCheck, ArrowRight, Loader2, KeyRound, Server, 
  Settings, Stamp, Pill, Truck, Globe, Box, 
  Database, Lock, CheckCircle2, Zap, RefreshCw
} from 'lucide-react';

interface LandingPageProps {
  onLogin: (user: User) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [gln, setGln] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [useRemote, setUseRemote] = useState(false);
  const [apiUrl, setApiUrl] = useState('http://localhost:3001/api');

  useEffect(() => {
    setUseRemote(localStorage.getItem('ELEDGER_USE_REMOTE') === 'true');
    setApiUrl(localStorage.getItem('ELEDGER_API_URL') || 'http://localhost:3001/api');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await AuthService.login(gln, password);
      if (user) {
        onLogin(user);
        navigate('/dashboard');
      } else {
        setError('Invalid credentials.');
      }
    } catch (err) {
      setError('Connection failed. Please check network node.');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = () => {
    localStorage.setItem('ELEDGER_USE_REMOTE', String(useRemote));
    localStorage.setItem('ELEDGER_API_URL', apiUrl);
    window.location.reload();
  };

  const FeatureCard = ({ icon: Icon, title, desc, color }: any) => (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
        <Icon className="text-white" size={24} />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-900/50">
              <Stamp size={24} className="text-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-tighter uppercase">E-Ledger</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-400 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors">Solutions</a>
            <a href="#compliance" className="text-slate-400 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors">GS1 Standards</a>
            <button onClick={() => setShowSettings(true)} className="text-slate-400 hover:text-white">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Integrated Login */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 bg-slate-900 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-indigo-600/30 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-emerald-600/20 rounded-full blur-[100px] animate-pulse delay-700"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            {/* Left: Value Proposition */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-900/40 border border-indigo-500/30 rounded-full text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-8 animate-in slide-in-from-top-4 duration-500">
                <Globe size={14} />
                Global Permissioned GS1 Ledger
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] mb-6 tracking-tight animate-in slide-in-from-left-8 duration-700">
                Verifiable Integrity <br/>
                <span className="text-indigo-500">for Every Unit.</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-400 max-w-xl leading-relaxed mb-10 animate-in slide-in-from-left-8 duration-700 delay-100">
                A blockchain-powered supply chain backbone for Excise and Pharma. Track every bottle, tablet, and shipment with immutable cryptographic proofs.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <div className="flex items-center gap-3 bg-slate-800/50 border border-slate-700 px-6 py-4 rounded-2xl">
                   <ShieldCheck className="text-emerald-400" size={24} />
                   <div className="text-left">
                      <p className="text-white font-bold text-sm">Mainnet Status</p>
                      <p className="text-xs text-slate-500">99.9% Uptime Verified</p>
                   </div>
                </div>
              </div>
            </div>

            {/* Right: Login Form */}
            <div className="w-full max-w-md animate-in zoom-in duration-700 delay-200">
              <div className="bg-white/10 backdrop-blur-xl p-1 rounded-[2.5rem] border border-white/10 shadow-2xl">
                <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Partner Login</h2>
                    <p className="text-slate-500 text-sm font-medium mt-1">Access the Distributed Ledger</p>
                  </div>

                  {error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl text-center">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">License GLN</label>
                      <div className="relative">
                        <KeyRound className="absolute left-4 top-3.5 text-slate-400" size={18} />
                        <input
                          type="text"
                          required
                          value={gln}
                          onChange={(e) => setGln(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-12 py-3.5 text-sm font-mono focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                          placeholder="0000000000000"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                        <Link to="/forgot-password" size={14} className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline">Forgot?</Link>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-12 py-3.5 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-900/20 flex items-center justify-center gap-3 transition-all transform hover:translate-y-[-2px] active:scale-95 disabled:opacity-70"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : (
                        <>
                          <span>Establish Node Connection</span>
                          <ArrowRight size={20} />
                        </>
                      )}
                    </button>

                    <div className="pt-6 border-t border-slate-100 text-center">
                      <p className="text-slate-400 text-xs font-medium">New Trading Partner?</p>
                      <Link to="/signup" className="text-indigo-600 font-black text-xs uppercase tracking-widest mt-2 block hover:text-indigo-800 transition-colors">Request ATP Credentials</Link>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-4">Enterprise Verticals</h2>
            <h2 className="text-4xl font-black text-slate-900 leading-tight">GS1-Compliant Traceability for Every Sector.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Stamp} 
              title="Excise & Spirits" 
              desc="Digital holograms and duty-paid verification. Automatically calculate state liabilities and track bonded stock transfers." 
              color="bg-amber-500"
            />
            <FeatureCard 
              icon={Pill} 
              title="Pharma / DSCSA" 
              desc="Full DSCSA compliance with serialized drug tracking. Instant recall propagation and saleable returns verification (VRS)." 
              color="bg-emerald-500"
            />
            <FeatureCard 
              icon={Truck} 
              title="Global Logistics" 
              desc="Generate SSCC labels for bulk aggregation. Real-time chain-of-custody transfer between GLN-verified nodes." 
              color="bg-indigo-600"
            />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 border-y border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-md">
              <h3 className="text-2xl font-black text-slate-900 mb-4">Secured by Cryptographic Proof</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                E-Ledger utilizes SHA-256 block linking and digital signatures to ensure that once a record is written, it cannot be altered without detection.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-12 grayscale opacity-50">
               <div className="flex items-center gap-2 font-black text-2xl text-slate-900"><Database /> <span>EPCIS 2.0</span></div>
               <div className="flex items-center gap-2 font-black text-2xl text-slate-900"><Zap /> <span>GS1</span></div>
               <div className="flex items-center gap-2 font-black text-2xl text-slate-900"><CheckCircle2 /> <span>ATP</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 text-white">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Stamp size={20} />
              </div>
              <span className="font-black uppercase tracking-tighter">E-Ledger</span>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">© 2025 Distributed Logistics Network. Built for Enterprise Sovereignty.</p>
            <div className="flex gap-6">
              <button onClick={() => setShowSettings(true)} className="text-slate-500 hover:text-white"><Settings size={18} /></button>
              <div className="w-px h-6 bg-slate-800"></div>
              <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold uppercase">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                Mainnet Synced
              </div>
            </div>
         </div>
      </footer>

      {/* Network Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
               <h3 className="font-bold flex items-center gap-2">
                 <Server size={18} className="text-indigo-400" />
                 <span>Network Protocol Settings</span>
               </h3>
               <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="p-8 space-y-6">
               <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                  <Database size={20} className="text-blue-600 mt-1 shrink-0" />
                  <p className="text-xs text-blue-800 leading-relaxed font-medium">
                    Configure your node connection. Production nodes require an authorized AWS API Gateway endpoint.
                  </p>
               </div>
               
               <div className="space-y-4">
                 <label className="flex items-center gap-4 cursor-pointer p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                    <input type="checkbox" className="w-6 h-6 text-indigo-600 rounded-lg" checked={useRemote} onChange={e => setUseRemote(e.target.checked)} />
                    <div>
                      <span className="block font-bold text-slate-800 text-sm">Mainnet Node Integration</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Enable AWS Centralized DB</span>
                    </div>
                 </label>

                 <div className={`transition-all duration-300 ${useRemote ? 'opacity-100 translate-y-0' : 'opacity-30 pointer-events-none translate-y-2'}`}>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Node Endpoint (AWS/Custom)</label>
                    <input 
                      type="text" 
                      value={apiUrl} 
                      onChange={e => setApiUrl(e.target.value)} 
                      className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm font-mono focus:ring-4 focus:ring-indigo-500/10 outline-none"
                    />
                 </div>
               </div>

               <button onClick={saveSettings} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl flex justify-center items-center gap-2 shadow-xl transition-all">
                 <RefreshCw size={18} />
                 <span>Synchronize Protocol</span>
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
