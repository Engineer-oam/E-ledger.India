
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Batch, User } from '../types';
import { LedgerService } from '../services/ledgerService';
import { 
  CheckCircle2, 
  MapPin, 
  User as UserIcon, 
  Clock, 
  ArrowLeft,
  FileBadge,
  Landmark,
  ShieldCheck,
  Receipt,
  RotateCcw
} from 'lucide-react';

const TraceVisualizer = ({ user }: { user: User }) => {
  const { id } = useParams<{ id: string }>();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBatch = async () => {
      if (!id) return;
      const data = await LedgerService.getBatchByID(id);
      if (data) setBatch(data);
      setLoading(false);
    };
    fetchBatch();
  }, [id]);

  if (loading) return <div className="p-8 text-center">Tracing Batch...</div>;
  if (!batch) return <div className="p-8 text-center text-red-500">Batch not found on ledger.</div>;

  return (
    <div className="w-full">
      <Link to="/batches" className="flex items-center space-x-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        <ArrowLeft size={18} />
        <span>Back to Inventory</span>
      </Link>

      <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden mb-8">
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">{batch.productName}</h1>
            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm text-slate-500 font-mono">
              <span>ID: {batch.batchID}</span>
              <span className="hidden md:inline">•</span>
              <span>GTIN: {batch.gtin}</span>
            </div>
          </div>
          <div className="text-left md:text-right">
             <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold tracking-wide uppercase">
               {batch.status}
             </span>
             <p className="text-xs text-slate-400 mt-2">Owner GLN: {batch.currentOwnerGLN}</p>
          </div>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
             <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Manufacturer</p>
             <p className="font-mono text-sm break-all text-slate-700">{batch.manufacturerGLN}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
             <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Expiry</p>
             <p className="font-mono text-sm text-slate-700">{batch.expiryDate}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
             <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Original Qty</p>
             <p className="font-mono text-sm text-slate-700">{batch.quantity} {batch.unit}</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
             <p className="text-[10px] text-orange-400 uppercase font-bold tracking-wider mb-1">Total Returned</p>
             <p className="font-mono text-sm text-orange-700 font-bold">{batch.totalReturnedQuantity || 0} {batch.unit}</p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
             <p className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                <Landmark size={10} /> HSN Code
             </p>
             <p className="font-mono text-sm text-indigo-700 font-bold">{batch.hsnCode || '2208'}</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="w-full">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Clock className="text-slate-400" />
            <span>Chain of Custody</span>
        </h3>
        <div className="relative pl-8 border-l-2 border-slate-200 space-y-12">
            {batch.trace.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((event, index) => (
            <div key={event.eventID} className="relative">
                {/* Dot */}
                <div className={`absolute -left-[41px] p-1 bg-white border-4 ${index === 0 ? 'border-blue-500' : 'border-slate-300'} rounded-full`}>
                <CheckCircle2 size={20} className={index === 0 ? 'text-blue-500' : 'text-slate-400'} />
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-2">
                    <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        {event.type}
                        {event.type === 'MANUFACTURE' && <FileBadge size={18} className="text-amber-500"/>}
                        {event.type === 'DISPATCH' && <Receipt size={18} className="text-blue-500"/>}
                        {event.type === 'RETURN' && <RotateCcw size={18} className="text-orange-500"/>}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-slate-500 mt-1">
                        <span className="flex items-center space-x-1">
                        <Clock size={14} />
                        <span>{new Date(event.timestamp).toLocaleString()}</span>
                        </span>
                    </div>
                    </div>
                    <div className="bg-slate-50 px-3 py-1 rounded text-xs font-mono text-slate-400 border border-slate-200 break-all">
                    Tx: {event.txHash.substring(0, 12)}...
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                    <div className="flex items-center space-x-2">
                    <UserIcon size={16} className="text-slate-400" />
                    <span className="font-medium">{event.actorName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                    <MapPin size={16} className="text-slate-400" />
                    <span>{event.location}</span>
                    </div>
                </div>

                {/* Specific Return Detail View */}
                {event.type === 'RETURN' && (
                  <div className="mt-4 p-4 bg-orange-50 border border-orange-100 rounded-xl space-y-2">
                     <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest">Return Audit</span>
                        <span className="text-xs font-bold text-orange-900">{event.returnQuantity} {batch.unit}</span>
                     </div>
                     <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                           <p className="text-slate-500 font-bold uppercase text-[9px]">Reason</p>
                           <p className="text-orange-800 font-bold">{event.returnReason}</p>
                        </div>
                        <div>
                           <p className="text-slate-500 font-bold uppercase text-[9px]">Recipient Node</p>
                           <p className="font-mono text-orange-800">{event.returnRecipientGLN}</p>
                        </div>
                     </div>
                  </div>
                )}

                {event.metadata && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        <span>Cryptographically Sealed Event Metadata</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(event.metadata).map(([key, val]) => {
                          // Special rendering for GST metadata
                          if (key === 'gst' && typeof val === 'object' && val !== null) {
                            return (
                              <div key={key} className="col-span-full bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 space-y-3 mt-2">
                                  <div className="flex items-center justify-between">
                                     <h5 className="text-[10px] font-black text-blue-800 uppercase tracking-widest flex items-center gap-1.5">
                                        <Landmark size={12} /> Tax Compliance (GST)
                                     </h5>
                                     <span className="text-xs font-mono font-bold text-blue-600 bg-white px-2 py-0.5 rounded border border-blue-100">{(val as any).invoiceNo}</span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-6">
                                     <div>
                                        <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">HSN Code</p>
                                        <p className="text-xs font-mono text-slate-700">{(val as any).hsnCode}</p>
                                     </div>
                                     <div>
                                        <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">Taxable Val</p>
                                        <p className="text-xs font-bold text-slate-800">₹{(val as any).taxableValue?.toLocaleString()}</p>
                                     </div>
                                     <div>
                                        <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">GST ({(val as any).taxRate}%)</p>
                                        <p className="text-xs font-bold text-emerald-600">₹{(val as any).taxAmount?.toLocaleString()}</p>
                                     </div>
                                  </div>
                               </div>
                            )
                          }
                          // Standard metadata fallback
                          return (
                            <div key={key} className="bg-slate-50 px-3 py-2 rounded text-xs break-words border border-slate-100 flex justify-between gap-4">
                                <span className="font-semibold text-slate-500 uppercase text-[9px] tracking-wider">{key}</span>
                                <span className="font-mono text-slate-700 text-right">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                            </div>
                          );
                        })}
                    </div>
                    </div>
                )}
                </div>
            </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default TraceVisualizer;
