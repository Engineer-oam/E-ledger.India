
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
// Added User to imports
import { Batch, User } from '../types';
import { LedgerService } from '../services/ledgerService';
import { 
  CheckCircle2, MapPin, User as UserIcon, Clock, ArrowLeft, 
  ShieldCheck, Database, Link as LinkIcon 
} from 'lucide-react';

// Added user prop to component definition to match App.tsx usage
const TraceVisualizer: React.FC<{ user: User }> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const [batch, setBatch] = useState<Batch | null>(null);

  useEffect(() => {
    if (id) LedgerService.getBatchByID(id).then(setBatch);
  }, [id]);

  if (!batch) return <div className="p-12 text-center text-slate-400">Locating Block...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      <Link to="/batches" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-xs uppercase transition-colors">
        <ArrowLeft size={16} /> Back to Records
      </Link>

      {/* Block Header */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Database size={160} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">
              {batch.status}
            </span>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">{batch.productName}</h1>
            <p className="text-sm font-mono text-slate-500 mt-2">UUID: {batch.batchID}</p>
          </div>
          <div className="text-right">
             <div className="p-4 bg-slate-900 rounded-2xl text-white">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Integrity Hash</p>
                <p className="text-xs font-mono text-indigo-400 break-all max-w-[200px]">{batch.integrityHash?.slice(0, 24)}...</p>
             </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-8 md:pl-0">
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-slate-200 -translate-x-1/2"></div>
        
        <div className="space-y-12 relative">
          {batch.trace.map((event, idx) => (
            <div key={event.eventID} className={`flex flex-col md:flex-row items-center w-full ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
              <div className="flex-1 md:w-1/2"></div>
              
              {/* Dot */}
              <div className="absolute left-4 md:left-1/2 w-8 h-8 bg-white border-4 border-slate-900 rounded-full -translate-x-1/2 z-10 flex items-center justify-center shadow-lg">
                <LinkIcon size={12} className="text-indigo-600" />
              </div>

              <div className={`flex-1 md:w-1/2 p-4 md:p-8 ${idx % 2 === 0 ? 'md:pr-12' : 'md:pl-12'}`}>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs flex items-center gap-2">
                       <ShieldCheck size={14} className="text-emerald-500" />
                       {event.type}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 font-mono">{new Date(event.timestamp).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <UserIcon size={14} className="text-slate-400" />
                      <span className="font-bold">{event.actorName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin size={14} className="text-slate-400" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-50">
                    <p className="text-[9px] font-mono text-slate-300 break-all leading-tight">TX: {event.txHash}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TraceVisualizer;
