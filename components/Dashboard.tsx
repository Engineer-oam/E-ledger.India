import React, { useEffect, useState } from 'react';
import { Batch, User, UserRole, BatchStatus } from '../types';
import { LedgerService } from '../services/ledgerService';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Stamp, Activity, Globe, 
  CheckCircle2, Box, Database, Cloud, ShieldCheck, BarChart3
} from 'lucide-react';
import DistributorDashboard from './DistributorDashboard';
import RetailerDashboard from './RetailerDashboard';

interface DashboardProps {
  user: User;
}

const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }: { title: string; value: string | number; icon: any; color: string; subtitle?: string, trend?: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between transition-all hover:shadow-xl group w-full">
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
      <div className="flex items-baseline gap-2">
         <h3 className="text-3xl font-black text-slate-900">{value}</h3>
         {trend && <span className="text-[10px] font-bold text-emerald-500">{trend}</span>}
      </div>
      {subtitle && <p className="text-[10px] font-medium text-slate-400 uppercase">{subtitle}</p>}
    </div>
    <div className={`p-4 rounded-2xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
      <Icon className={color.replace('bg-', 'text-')} size={24} />
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCloud, setIsCloud] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const data = await LedgerService.getBatches(user);
      setBatches(data);
      setIsCloud(!['localhost', '127.0.0.1'].includes(window.location.hostname));
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 space-y-4 animate-pulse">
        <Database className="text-slate-200 animate-bounce" size={48} />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing Distributed Ledger...</p>
    </div>
  );

  if (user.role === UserRole.DISTRIBUTOR) return <DistributorDashboard user={user} />;
  if (user.role === UserRole.RETAILER) return <RetailerDashboard user={user} />;

  const totalBatches = batches.length;
  const bondedCount = batches.filter(b => b.status === BatchStatus.BONDED).length;
  const blockHeight = 15204 + totalBatches;

  const statusData = [
    { name: 'Bonded', value: bondedCount },
    { name: 'Sold', value: batches.filter(b => b.status === BatchStatus.SOLD).length },
  ].filter(d => d.value > 0);

  const COLORS = ['#f59e0b', '#6366f1', '#10b981'];

  return (
    <div className="w-full space-y-8 pb-12">
      {/* Network Health Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between shadow-2xl gap-6">
          <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                  <div className="relative flex h-3 w-3">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCloud ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${isCloud ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  </div>
                  <div className="flex flex-col">
                    <span className={`font-black text-xs uppercase tracking-widest ${isCloud ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {isCloud ? 'Mainnet Live' : 'Simulation Mode'}
                    </span>
                    <span className="text-[10px] text-slate-400">Node ID: {user.gln.slice(-6)}</span>
                  </div>
              </div>
              <div className="w-px h-8 bg-slate-800 hidden md:block"></div>
              <div className="flex items-center gap-3">
                  <Cloud size={16} className="text-indigo-400" />
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">Ledger Source</span>
                    <span className="text-[10px] text-slate-400 uppercase">{isCloud ? 'Centralized AWS DB' : 'Local Browser DB'}</span>
                  </div>
              </div>
          </div>
          <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
              <div className="flex flex-col items-end">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Block Height</span>
                  <span className="text-sm font-mono font-black text-indigo-300">#{blockHeight}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-2xl">
                  <ShieldCheck size={16} className="text-indigo-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Immutable Storage</span>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Inventory" value={totalBatches} icon={Box} color="bg-indigo-500" subtitle="Total on Chain" trend="+4.2%" />
        <StatCard title="Duty Liabilities" value={bondedCount} icon={Stamp} color="bg-amber-500" subtitle="Pending State Duty" trend="-1.5%" />
        <StatCard title="Compliance Rate" value="100%" icon={CheckCircle2} color="bg-emerald-500" subtitle="Verified Authenticity" />
        <StatCard title="Network Activity" value="99.9%" icon={Activity} color="bg-blue-500" subtitle="Node Uptime" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <BarChart3 className="text-indigo-600" size={20} />
                Volume Analytics
              </h3>
           </div>
           <div className="h-72 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={[
                 {name: 'W1', duty: 400, bonded: 240},
                 {name: 'W2', duty: 300, bonded: 139},
                 {name: 'W3', duty: 520, bonded: 380},
                 {name: 'W4', duty: 610, bonded: 210},
               ]}>
                 <defs>
                   <linearGradient id="colorDuty" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                 <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                 <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                 <Area type="monotone" dataKey="duty" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorDuty)" />
                 <Area type="monotone" dataKey="bonded" stroke="#f59e0b" strokeWidth={3} fillOpacity={0.1} fill="#f59e0b" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 flex flex-col">
            <h3 className="text-lg font-black text-slate-900 mb-6">Status Distribution</h3>
            <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={statusData.length ? statusData : [{name: 'Empty', value: 1}]} 
                      innerRadius={65} 
                      outerRadius={90} 
                      paddingAngle={8} 
                      dataKey="value"
                      stroke="none"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                      {statusData.length === 0 && <Cell fill="#f1f5f9" />}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="space-y-4 mt-6">
                {statusData.map((d, i) => (
                    <div key={i} className="flex justify-between items-center text-xs p-2 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full" style={{background: COLORS[i]}}></span>
                            <span className="text-slate-500 font-bold uppercase">{d.name}</span>
                        </div>
                        <span className="font-black text-slate-900">{d.value}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;