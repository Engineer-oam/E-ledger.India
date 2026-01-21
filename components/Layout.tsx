

import React, { useState, useEffect } from 'react';
import { User, UserRole, Sector } from '../types';
import { 
  LayoutDashboard, Truck, FileText, LogOut, Bot, ScanLine, Box, ShieldCheck, 
  Building2, Menu, X, Wallet, Settings, Wine, Stamp, Pill, Globe, ShoppingBag, Leaf, Cpu,
  Database, Cog, Link as LinkIcon
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const NavItem = ({ to, icon: Icon, label, active, onClick }: { to: string; icon: any; label: string; active: boolean; onClick?: () => void }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <Icon size={20} className={`shrink-0 ${active ? 'animate-pulse' : ''}`} />
    <span className="font-medium text-sm">{label}</span>
  </Link>
);

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isAuthority = user.role === UserRole.REGULATOR || user.role === UserRole.AUDITOR;

  const getSectorBranding = (s: Sector) => {
    switch(s) {
      case Sector.EXCISE: return { icon: Stamp, color: 'from-indigo-500 to-indigo-700', label: 'Excise Stock' };
      case Sector.PHARMA: return { icon: Pill, color: 'from-emerald-500 to-emerald-700', label: 'Pharma / Drug' };
      case Sector.FMCG: return { icon: ShoppingBag, color: 'from-amber-500 to-amber-700', label: 'FMCG Goods' };
      case Sector.AGRICULTURE: return { icon: Leaf, color: 'from-green-600 to-green-800', label: 'Agri Produce' };
      // Adding branding for LOGISTICS sector
      case Sector.LOGISTICS: return { icon: Truck, color: 'from-blue-500 to-blue-700', label: 'Logistics Hub' };
      default: return { icon: Box, color: 'from-slate-500 to-slate-700', label: 'Inventory' };
    }
  };

  const branding = getSectorBranding(user.sector);
  
  return (
    <div className="flex h-[100dvh] bg-slate-50 overflow-hidden">
      
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/80 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col shadow-2xl transition-transform duration-300 ease-out border-r border-slate-800
        lg:translate-x-0 lg:static lg:inset-auto
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800/50 bg-slate-900">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl shadow-lg bg-gradient-to-br ${branding.color}`}>
              <branding.icon size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">E-Ledger</h1>
              <p className="text-[10px] font-medium text-indigo-400 uppercase tracking-wider">{user.sector} HUB</p>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Network Panel" active={location.pathname === '/dashboard'} onClick={() => setIsMobileMenuOpen(false)} />
          
          <NavItem to="/blockchain" icon={LinkIcon} label="Mainnet Explorer" active={location.pathname === '/blockchain'} onClick={() => setIsMobileMenuOpen(false)} />

          {!isAuthority && (
            <>
              <NavItem to="/erp" icon={Database} label="Internal ERP" active={location.pathname === '/erp'} onClick={() => setIsMobileMenuOpen(false)} />
              <NavItem to="/erp-settings" icon={Cog} label="ERP Integration" active={location.pathname === '/erp-settings'} onClick={() => setIsMobileMenuOpen(false)} />
            </>
          )}

          <NavItem to="/batches" icon={branding.icon} label={branding.label} active={location.pathname === '/batches'} onClick={() => setIsMobileMenuOpen(false)} />
          
          {!isAuthority && (
            <NavItem to="/transfers" icon={Truck} label="Logistics Events" active={location.pathname === '/transfers'} onClick={() => setIsMobileMenuOpen(false)} />
          )}

          <NavItem to="/financials" icon={Wallet} label="Duty & Tax Logs" active={location.pathname === '/financials'} onClick={() => setIsMobileMenuOpen(false)} />
          <NavItem to="/verify" icon={ScanLine} label="Verify Product" active={location.pathname === '/verify'} onClick={() => setIsMobileMenuOpen(false)} />
          <NavItem to="/assistant" icon={Bot} label="Audit AI" active={location.pathname === '/assistant'} onClick={() => setIsMobileMenuOpen(false)} />
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <Link to="/profile" className="block group">
            <div className="flex items-center space-x-3 px-4 py-3 mb-2 bg-slate-800 rounded-xl border border-slate-700 group-hover:bg-slate-700/80 transition-all">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate text-white">{user.name}</p>
                <p className="text-[9px] text-slate-400 truncate uppercase tracking-wide">
                  {user.positionLabel}
                </p>
              </div>
            </div>
          </Link>
          <button 
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden w-full relative bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shadow-sm shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-bold text-slate-800 capitalize truncate flex items-center gap-2">
              {location.pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
             <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 text-slate-600">
               <Globe size={14} />
               <span className="text-[10px] font-bold uppercase tracking-widest">{user.country} | {user.sector}</span>
             </div>
             <div className="hidden sm:flex flex-col items-end">
               <span className="text-[10px] text-slate-400 font-bold uppercase">License ID</span>
               <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{user.gln}</span>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;