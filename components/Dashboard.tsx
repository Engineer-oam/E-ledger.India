
import React, { useState, useEffect } from 'react';
import { User, Batch, BatchStatus } from '../types';
import { LedgerService } from '../services/ledgerService';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Box, Activity, ShieldCheck, Database, Landmark, TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-start justify-between group transition-all hover:shadow-xl">
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{title}</p>
      <h3 className="text-3xl font-black text-slate-900">{value}</h3>
      {trend && <p className="text-[10px] font-bold text-emerald-500 mt-2 flex items-center gap-1"><TrendingUp size={12}/> {trend} vs Last Week</p>}
    </div>
    <div className={`p-4 rounded-2xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
      <Icon className={color.replace('bg-', 'text-')} size={24} />
    </div>
  </div>
);

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [batches, setBatches] = useState<Batch[]>([]);

  useEffect(() => {
    LedgerService.getBatches(user).then(setBatches);
  }, [user]);

  const mockData = [
    { name: 'Mon', vol: 400 },
    { name: 'Tue', vol: 300 },
    { name: 'Wed', vol: 600 },
    { name: 'Thu', vol: 800 },
    { name: 'Fri', vol: 500 },
    { name: 'Sat', vol: 900 },
    { name: 'Sun', vol: 1100 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Network Header */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Activity size={32} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-slate-900 rounded-full"></div>
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">E-Ledger Mainnet Node</h2>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mt-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              Synchronized & Validated • Block #15,804
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-800 px-6 py-3 rounded-2xl border border-slate-700">
            <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Node Latency</p>
            <p className="text-lg font-mono font-bold text-indigo-400">14ms</p>
          </div>
          <div className="bg-slate-800 px-6 py-3 rounded-2xl border border-slate-700">
            <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Peer Group</p>
            <p className="text-lg font-mono font-bold text-emerald-400">18 Nodes</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Inventory" value={batches.length} icon={Box} trend="+12.5%" color="bg-indigo-600" />
        <StatCard title="Duty Liabilities" value="₹2.4M" icon={Landmark} color="bg-amber-500" />
        <StatCard title="Compliance Health" value="100%" icon={ShieldCheck} color="bg-emerald-500" />
        <StatCard title="Ledger Entries" value="2.1k" icon={Database} color="bg-slate-600" />
      </div>

      {/* Analytics Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-600" />
            Blockchain Transaction Volume
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData}>
                <defs>
                  <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="vol" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorVol)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-center">
          <h3 className="text-lg font-black text-slate-900 mb-6">Recent Alerts</h3>
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <Activity size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Batch Expiring Soon</p>
                  <p className="text-[10px] text-slate-500 uppercase font-black mt-1">Lot: LOT-2024-001</p>
                </div>
              </div>
            ))}
            <button className="w-full py-4 text-[10px] font-black uppercase text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
              View All Audits
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
