
import React, { useEffect, useState } from 'react';
import { Batch, User, UserRole, BatchStatus } from '../types';
import { LedgerService } from '../services/ledgerService';
import { AuthService } from '../services/authService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { 
  PackageCheck, AlertTriangle, Truck, Activity, ScanBarcode, Globe, 
  ShieldCheck, Fingerprint, TrendingUp, AlertCircle, CheckCircle2, Lightbulb
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DistributorDashboard from './DistributorDashboard';
import RetailerDashboard from './RetailerDashboard';

interface DashboardProps {
  user: User;
}

const StatCard = ({ title, value, icon: Icon, color, subtitle }: { title: string; value: string | number; icon: any; color: string; subtitle?: string }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between transition-all hover:shadow-md">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
    <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
      <Icon className={color.replace('bg-', 'text-')} size={24} />
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const data = await LedgerService.getBatches(user);
      setBatches(data);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading) return <div className="animate-pulse flex space-x-4 p-8"><div className="h-12 w-full bg-slate-200 rounded"></div></div>;

  // --- ROLE ROUTING ---
  if (user.role === UserRole.DISTRIBUTOR) {
    return <DistributorDashboard user={user} />;
  }
  
  if (user.role === UserRole.RETAILER) {
    return <RetailerDashboard user={user} />;
  }

  // --- STANDARD / MANUFACTURER / REGULATOR DASHBOARD LOGIC ---
  const totalBatches = batches.length;
  const inTransit = batches.filter(b => b.status === BatchStatus.IN_TRANSIT).length;
  const expiries = batches.filter(b => new Date(b.expiryDate) < new Date(new Date().setFullYear(new Date().getFullYear() + 1))).length;
  const received = batches.filter(b => b.status === BatchStatus.RECEIVED || b.status === BatchStatus.SOLD).length;

  // --- GS1 & Data Quality Metrics ---
  const validGTINs = batches.filter(b => AuthService.validateGS1(b.gtin)).length;
  const gtinComplianceRate = totalBatches > 0 ? Math.round((validGTINs / totalBatches) * 100) : 100;
  
  // Integrity Hash (Digital Twin) Coverage
  const integrityCount = batches.filter(b => b.integrityHash).length;
  const integrityRate = totalBatches > 0 ? Math.round((integrityCount / totalBatches) * 100) : 0;

  // Network Reach
  const allGLNs = new Set<string>();
  batches.forEach(b => {
    if (b.manufacturerGLN) allGLNs.add(b.manufacturerGLN);
    if (b.currentOwnerGLN) allGLNs.add(b.currentOwnerGLN);
    b.trace.forEach(t => {
      if (t.actorGLN) allGLNs.add(t.actorGLN);
    });
  });
  const networkSize = allGLNs.size;
  const validGLNs = Array.from(allGLNs).filter(gln => AuthService.validateGS1(gln)).length;
  const totalEvents = batches.reduce((acc, b) => acc + b.trace.length, 0);

  // --- Compliance Issues Detection ---
  const qualityIssues = batches.reduce((acc, batch) => {
    const issues = [];
    if (!AuthService.validateGS1(batch.gtin)) issues.push('Invalid GTIN Checksum');
    if (!batch.integrityHash) issues.push('Missing Digital Twin ID');
    if (new Date(batch.expiryDate) < new Date()) issues.push('Expired Product');
    
    if (issues.length > 0) {
      acc.push({ 
        id: batch.batchID, 
        product: batch.productName, 
        issues, 
        integrityHash: batch.integrityHash 
      });
    }
    return acc;
  }, [] as any[]);

  // --- Smart Recommendations ---
  const getRecommendations = () => {
    const recs = [];
    if (gtinComplianceRate < 100) {
      recs.push({ 
        icon: ScanBarcode, 
        color: 'text-red-500', 
        text: "Fix invalid GTIN checksums to ensure global scannability." 
      });
    }
    if (integrityRate < 80) {
      recs.push({ 
        icon: Fingerprint, 
        color: 'text-blue-500', 
        text: "Low Digital Twin adoption. Enable auto-hashing for new production lines." 
      });
    }
    if (validGLNs < networkSize) {
      recs.push({ 
        icon: Globe, 
        color: 'text-amber-500', 
        text: "Unverified actors detected. Audit partner GLN registrations." 
      });
    }
    if (expiries > 5) {
      recs.push({ 
        icon: AlertTriangle, 
        color: 'text-orange-500', 
        text: `High expiry risk detected (${expiries} batches). Prioritize dispatch.` 
      });
    }
    
    if (recs.length === 0) {
      recs.push({ 
        icon: CheckCircle2, 
        color: 'text-green-500', 
        text: "GS1 Compliance is excellent. Maintain current protocols." 
      });
    }
    return recs;
  };
  const recommendations = getRecommendations();

  // --- Chart Data ---
  const statusData = [
    { name: 'Created', value: batches.filter(b => b.status === 'CREATED').length },
    { name: 'In Transit', value: batches.filter(b => b.status === 'IN_TRANSIT').length },
    { name: 'Received', value: batches.filter(b => b.status === 'RECEIVED').length },
    { name: 'Sold', value: batches.filter(b => b.status === 'SOLD').length },
  ].filter(d => d.value > 0);

  const complianceTrendData = [
    { month: 'Week 1', score: 82, target: 95 },
    { month: 'Week 2', score: 88, target: 95 },
    { month: 'Week 3', score: 91, target: 95 },
    { month: 'Current', score: Math.round((gtinComplianceRate + integrityRate) / 2), target: 95 },
  ];

  const COLORS = ['#94a3b8', '#3b82f6', '#10b981', '#6366f1'];

  return (
    <div className="space-y-8 pb-12">
      {/* Primary Ops Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Batches" value={totalBatches} icon={PackageCheck} color="bg-blue-500" />
        <StatCard title="Active Shipments" value={inTransit} icon={Truck} color="bg-indigo-500" />
        <StatCard title="Risk / Near Expiry" value={expiries} icon={AlertTriangle} color="bg-orange-500" />
        <StatCard title="Completed Cycles" value={received} icon={Activity} color="bg-emerald-500" />
      </div>

      {/* --- ENHANCED GS1 SECTION --- */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-900 p-2 rounded-lg text-white">
              <ScanBarcode size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">GS1 Data Quality & Network Health</h2>
              <p className="text-xs text-slate-500">Real-time compliance monitoring and digital twin verification</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
            <CheckCircle2 size={16} />
            <span className="font-semibold">System Operational</span>
          </div>
        </div>

        <div className="p-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            
            {/* Metric 1: GTIN Integrity */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">GTIN Compliance</p>
                <ShieldCheck size={20} className={gtinComplianceRate === 100 ? "text-green-500" : "text-amber-500"} />
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-bold text-slate-800">{gtinComplianceRate}%</span>
                <span className="text-xs text-slate-400">checksum verified</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className={`h-full rounded-full ${gtinComplianceRate === 100 ? 'bg-green-500' : 'bg-amber-400'}`} style={{ width: `${gtinComplianceRate}%` }}></div>
              </div>
            </div>

            {/* Metric 2: Digital Twin ID Coverage */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Digital Twin IDs</p>
                <Fingerprint size={20} className={integrityRate > 90 ? "text-blue-500" : "text-slate-400"} />
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-bold text-slate-800">{integrityRate}%</span>
                <span className="text-xs text-slate-400">batches secured</span>
              </div>
               <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${integrityRate}%` }}></div>
              </div>
            </div>

            {/* Metric 3: Network Nodes */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Nodes</p>
                <Globe size={20} className="text-indigo-500" />
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-bold text-slate-800">{validGLNs}</span>
                <span className="text-xs text-slate-400">/ {networkSize} GLNs active</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-2">
                {validGLNs === networkSize ? "All peers valid" : `${networkSize - validGLNs} unverified peers`}
              </div>
            </div>

             {/* Metric 4: EPCIS Events */}
             <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">EPCIS Events</p>
                <Activity size={20} className="text-purple-500" />
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-bold text-slate-800">{totalEvents}</span>
                <span className="text-xs text-slate-400">trace records</span>
              </div>
               <div className="text-[10px] text-slate-400 mt-2">
                Processed via Chaincode
              </div>
            </div>
          </div>

          {/* Charts & Insights Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Compliance Trend Chart */}
            <div className="lg:col-span-2 bg-white rounded-lg flex flex-col h-96">
              <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <TrendingUp size={16} />
                <span>Compliance Score Trend (4 Weeks)</span>
              </h4>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={complianceTrendData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} domain={[60, 100]} />
                    <Tooltip 
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#3b82f6" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorScore)" 
                      name="Actual Score"
                    />
                    <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeDasharray="5 5" name="Target" dot={false} />
                    <Legend wrapperStyle={{paddingTop: '10px'}}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Insights & Alerts */}
            <div className="flex flex-col gap-6 h-96">
              
              {/* Quality Alerts Feed */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 overflow-hidden flex flex-col flex-1">
                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center justify-between shrink-0">
                  <span className="flex items-center gap-2">
                     <AlertCircle size={16} className="text-amber-500" />
                     <span>Quality Alerts</span>
                  </span>
                  {qualityIssues.length > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">{qualityIssues.length}</span>
                  )}
                </h4>
                
                <div className="overflow-y-auto flex-1 pr-1 space-y-3 min-h-0">
                  {qualityIssues.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                      <CheckCircle2 size={32} className="mb-2 opacity-50" />
                      <p className="text-xs">No critical data issues found.</p>
                    </div>
                  ) : (
                    qualityIssues.map((item) => (
                      <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-slate-800 truncate pr-2">{item.product}</span>
                          <Link to={`/trace/${item.id}`} className="text-blue-600 text-xs hover:underline shrink-0">View</Link>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mb-2 truncate">{item.id}</p>
                        
                        {!item.integrityHash && (
                          <div className="flex items-center gap-1 text-[10px] text-red-500 bg-red-50 px-2 py-1 rounded w-fit mb-1 border border-red-100">
                            <Fingerprint size={10} />
                            <span>Missing Digital Twin ID</span>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1">
                          {item.issues.map((issue: string, idx: number) => (
                            <span key={idx} className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-medium border border-amber-100">
                              {issue}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recommendations Panel */}
              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 shrink-0">
                <h4 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                  <Lightbulb size={16} className="text-indigo-600" />
                  <span>Actionable Tips</span>
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2 bg-white/50 rounded-lg">
                      <rec.icon size={14} className={`mt-0.5 shrink-0 ${rec.color}`} />
                      <p className="text-xs text-indigo-900 leading-snug">{rec.text}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Batch Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-4 mt-2">
             {statusData.map((entry, index) => (
               <div key={index} className="flex items-center text-xs text-slate-500">
                 <span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS[index] }}></span>
                 {entry.name} ({entry.value})
               </div>
             ))}
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Ledger Events</h3>
          <div className="flex-1 overflow-auto max-h-[300px]">
            <ul className="space-y-4">
              {batches.slice(0, 5).flatMap(b => b.trace.slice(-1)).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((trace, idx) => (
                 <li key={idx} className="flex items-start space-x-3 pb-3 border-b border-slate-50 last:border-0">
                    <div className="mt-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-50"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{trace.type}</p>
                      <p className="text-xs text-slate-500">{trace.actorName} at {trace.location}</p>
                      <p className="text-xs text-slate-400 mt-1 font-mono">{new Date(trace.timestamp).toLocaleString()}</p>
                    </div>
                 </li>
              ))}
              {batches.length === 0 && <p className="text-sm text-slate-400 italic">No events recorded.</p>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
