
import React, { useState, useEffect } from 'react';
import { User, Batch, UserRole, BatchStatus, GSTDetails, EWayBill, ReturnReason } from '../types';
import { LedgerService } from '../services/ledgerService';
import { AuthService } from '../services/authService';
import { Plus, Search, Eye, ArrowRight, Package, Zap, Truck, ArrowUpRight, ArrowDownLeft, Send, CheckSquare, Square, Layers, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import BatchLabel from './BatchLabel';
import TransferModal from './TransferModal'; 
import { toast } from 'react-toastify';

interface BatchManagerProps {
  user: User;
}

const BatchManager: React.FC<BatchManagerProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'shipments'>('inventory');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Selection State
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedBatchForReturn, setSelectedBatchForReturn] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    gtin: '',
    productName: '',
    lotNumber: '',
    expiryDate: '',
    quantity: 0,
    unit: 'boxes'
  });

  // Return Form State
  const [returnData, setReturnData] = useState({
    toGLN: '',
    reason: ReturnReason.DAMAGED,
    refundAmount: 0
  });

  const fetchData = async () => {
    setLoading(true);
    const data = await LedgerService.getBatches(user);
    setBatches(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Bulk Selection Logic
  const toggleSelection = (id: string) => {
    if (selectedBatchIds.includes(id)) {
      setSelectedBatchIds(prev => prev.filter(bid => bid !== id));
    } else {
      setSelectedBatchIds(prev => [...prev, id]);
    }
  };

  const getSelectedBatches = () => {
    return batches.filter(b => selectedBatchIds.includes(b.batchID));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const batchID = await LedgerService.createBatch(formData, user);
      toast.success(`Batch ${batchID} minted successfully!`);
      setShowCreateModal(false);
      fetchData(); // Refresh list
      setFormData({ gtin: '', productName: '', lotNumber: '', expiryDate: '', quantity: 0, unit: 'boxes' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to create batch');
    }
  };

  const handleTransferSubmit = async (toGLN: string, toName: string, gst?: GSTDetails, ewbPartial?: Partial<EWayBill>, payment?: any) => {
    const batchesToTransfer = getSelectedBatches();
    if (batchesToTransfer.length === 0) return;
    
    try {
        await LedgerService.transferBatches(
            batchesToTransfer.map(b => b.batchID),
            toGLN,
            toName,
            user,
            gst,
            ewbPartial,
            payment
        );
        toast.success(`Transferred ${batchesToTransfer.length} items to ${toName}`);
        // Modal handles closing itself or switching to print view
        // But we need to refresh data and clear selection
        fetchData();
        setSelectedBatchIds([]);
    } catch (err: any) {
        toast.error(`Transfer failed: ${err.message || err}`);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchForReturn) return;

    try {
      await LedgerService.returnBatch(
        selectedBatchForReturn.batchID,
        returnData.toGLN,
        returnData.reason,
        user,
        returnData.refundAmount
      );
      toast.success(`Batch ${selectedBatchForReturn.batchID} marked as RETURNED.`);
      setShowReturnModal(false);
      setSelectedBatchForReturn(null);
      setReturnData({ toGLN: '', reason: ReturnReason.DAMAGED, refundAmount: 0 });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Return failed');
    }
  };

  const handleAutoFill = () => {
    const products = [
      'Amoxicillin 500mg', 'Ibuprofen 200mg', 'Paracetamol 650mg', 'Insulin Glargine', 'Covid-19 Vaccine'
    ];
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const randomLot = `LOT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    
    setFormData({
      gtin: AuthService.generateGTIN(),
      productName: randomProduct,
      lotNumber: randomLot,
      expiryDate: futureDate.toISOString().split('T')[0],
      quantity: Math.floor(Math.random() * 5000) + 100,
      unit: 'boxes'
    });
    toast.info('Form auto-filled');
  };

  const getStatusColor = (status: BatchStatus) => {
    switch (status) {
      case BatchStatus.CREATED: return 'bg-slate-100 text-slate-600';
      case BatchStatus.IN_TRANSIT: return 'bg-blue-100 text-blue-600';
      case BatchStatus.RECEIVED: return 'bg-emerald-100 text-emerald-600';
      case BatchStatus.SOLD: return 'bg-indigo-100 text-indigo-600';
      case BatchStatus.RETURNED: return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Batch Inventory</h2>
            <p className="text-sm text-slate-500">Manage stock and track movements</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
             <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                   onClick={() => setActiveTab('inventory')}
                   className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'inventory' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    Current Stock
                </button>
                <button
                   onClick={() => setActiveTab('shipments')}
                   className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'shipments' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    Shipment Logs
                </button>
             </div>

            {user.role === UserRole.MANUFACTURER && (
            <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-sm ml-auto"
            >
                <Plus size={18} />
                <span className="hidden sm:inline">Create Batch</span>
            </button>
            )}
        </div>
      </div>

      {activeTab === 'inventory' && (
      <>
        {/* Actions Bar */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div className="flex items-center space-x-4 w-full sm:w-auto flex-1">
                <Search className="text-slate-400 shrink-0" size={20} />
                <input 
                    type="text" 
                    placeholder="Search inventory..." 
                    className="flex-1 outline-none text-slate-700 placeholder-slate-400 min-w-0"
                />
            </div>
            
            {/* Bulk Action Button */}
            {selectedBatchIds.length > 0 && (
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end animate-in fade-in slide-in-from-right-2">
                    <span className="text-sm font-semibold text-slate-600">{selectedBatchIds.length} Selected</span>
                    <button 
                        onClick={() => setShowTransferModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md"
                    >
                        <Layers size={16} />
                        <span>Bulk Transfer</span>
                    </button>
                </div>
            )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {loading ? (
            <div className="p-8 text-center text-slate-500">Syncing with Ledger...</div>
            ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                    <th className="px-4 py-4 w-10"></th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Batch ID / Product</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">GTIN</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Expiry</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {batches.map((batch) => {
                        const canTransfer = batch.currentOwnerGLN === user.gln && batch.status !== 'SOLD' && batch.status !== 'IN_TRANSIT' && batch.status !== 'RETURNED';
                        const isSelected = selectedBatchIds.includes(batch.batchID);

                        return (
                        <tr key={batch.batchID} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-indigo-50/50' : ''}`}>
                            <td className="px-4 py-4 text-center">
                                {canTransfer ? (
                                    <button 
                                        onClick={() => toggleSelection(batch.batchID)}
                                        className="text-slate-400 hover:text-indigo-600"
                                    >
                                        {isSelected ? <CheckSquare className="text-indigo-600" /> : <Square />}
                                    </button>
                                ) : (
                                    <Square className="text-slate-200 cursor-not-allowed" />
                                )}
                            </td>
                            <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                <Package size={20} />
                                </div>
                                <div>
                                <p className="font-medium text-slate-800">{batch.productName}</p>
                                <p className="text-xs text-slate-500 font-mono">{batch.batchID}</p>
                                </div>
                            </div>
                            </td>
                            <td className="px-6 py-4 font-mono text-sm text-slate-600">{batch.gtin}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{batch.expiryDate}</td>
                            <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border border-opacity-20 ${getStatusColor(batch.status)} border-current whitespace-nowrap`}>
                                {batch.status.replace('_', ' ')}
                            </span>
                            </td>
                            <td className="px-6 py-4 text-right flex items-center justify-end space-x-4">
                                {/* Actions */}
                                {canTransfer && (
                                    <>
                                        <button 
                                            onClick={() => { setSelectedBatchIds([batch.batchID]); setShowTransferModal(true); }}
                                            className="text-indigo-600 hover:text-indigo-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1"
                                        >
                                            <Send size={14} />
                                            <span>Transfer</span>
                                        </button>
                                        <button 
                                            onClick={() => { 
                                                setSelectedBatchForReturn(batch); 
                                                setReturnData({ ...returnData, toGLN: batch.manufacturerGLN }); 
                                                setShowReturnModal(true); 
                                            }}
                                            className="text-orange-600 hover:text-orange-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1"
                                        >
                                            <RotateCcw size={14} />
                                            <span>Return</span>
                                        </button>
                                    </>
                                )}
                                
                                <Link 
                                    to={`/trace/${batch.batchID}`}
                                    className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                    <span>Trace</span>
                                    <ArrowRight size={16} />
                                </Link>
                            </td>
                        </tr>
                    )})}
                </tbody>
                </table>
            </div>
            )}
            {!loading && batches.length === 0 && (
            <div className="p-12 text-center">
                <div className="inline-block p-4 bg-slate-50 rounded-full mb-4">
                <Package size={40} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">No batches found</h3>
                <p className="text-slate-500">Get started by creating a new batch or waiting for a shipment.</p>
            </div>
            )}
        </div>
      </>
      )}

      {/* Shipment Logs Tab */}
      {activeTab === 'shipments' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <Truck className="text-blue-600" />
                <h3 className="font-bold text-slate-800">Transfer & Shipment History</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                        <tr>
                            <th className="px-6 py-4">Direction</th>
                            <th className="px-6 py-4">Partner (GLN)</th>
                            <th className="px-6 py-4">Product / Batch</th>
                            <th className="px-6 py-4">Compliance Doc</th>
                            <th className="px-6 py-4 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {batches.flatMap(b => {
                            const events = [];
                            const dispatch = b.trace.find(t => t.type === 'DISPATCH' && t.actorGLN === user.gln);
                            if (dispatch) events.push({
                                type: 'OUTBOUND',
                                partner: dispatch.metadata?.recipientGLN || 'Unknown',
                                partnerName: dispatch.metadata?.recipient || 'Unknown',
                                date: dispatch.timestamp,
                                batch: b,
                                ewb: dispatch.metadata?.ewayBill
                            });
                            const receive = b.trace.find(t => t.type === 'RECEIVE' && t.actorGLN === user.gln);
                            if (receive) events.push({
                                type: 'INBOUND',
                                partner: b.trace.find(t => t.type === 'DISPATCH' && new Date(t.timestamp) < new Date(receive.timestamp))?.actorGLN || b.manufacturerGLN,
                                partnerName: 'Supplier',
                                date: receive.timestamp,
                                batch: b,
                                ewb: null
                            });
                            return events;
                        }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    {log.type === 'OUTBOUND' ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                                            <ArrowUpRight size={14} /> Sent
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                                            <ArrowDownLeft size={14} /> Received
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <p className="font-medium text-slate-800">{log.partnerName}</p>
                                    <p className="font-mono text-xs text-slate-400">{log.partner}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm font-medium text-slate-800">{log.batch.productName}</p>
                                    <p className="font-mono text-xs text-slate-500">{log.batch.batchID}</p>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">
                                    {log.ewb ? (
                                        <div className="flex flex-col text-xs">
                                          <span className="font-bold text-slate-700">EWB: {log.ewb.ewbNo}</span>
                                          <span className="text-slate-400">{new Date(log.ewb.generatedDate).toLocaleDateString()}</span>
                                        </div>
                                    ) : (
                                        <span className="text-slate-300 italic">--</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link to={`/trace/${log.batch.batchID}`} className="text-blue-600 hover:underline text-xs font-bold">
                                        View
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            <div className="flex-1 p-6 md:p-8 flex flex-col overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-slate-800">Mint New Batch</h3>
                <button onClick={() => setShowCreateModal(false)} className="md:hidden text-slate-400 hover:text-slate-600">✕</button>
              </div>
              <div className="mb-4">
                <button onClick={handleAutoFill} className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors border border-indigo-200">
                  <Zap size={16} className="text-indigo-600 fill-current" />
                  <span>Auto-Fill Form (Fast Mode)</span>
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-5 flex-1">
                <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Product Name</label><input required type="text" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition" value={formData.productName} onChange={e => setFormData({...formData, productName: e.target.value})} placeholder="e.g. Amoxicillin 500mg" /></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">GTIN</label><input required maxLength={14} minLength={14} type="text" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition font-mono" value={formData.gtin} onChange={e => setFormData({...formData, gtin: e.target.value})} placeholder="00089012345678" /></div><div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Lot Number</label><input required type="text" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition" value={formData.lotNumber} onChange={e => setFormData({...formData, lotNumber: e.target.value})} placeholder="LOT-2024-X" /></div></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Expiry Date</label><input required type="date" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} /></div><div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Quantity</label><input required type="number" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} /></div></div>
                <div className="pt-6 flex justify-end space-x-3 mt-auto"><button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancel</button><button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:scale-[1.02]">Mint Batch on Chain</button></div>
              </form>
            </div>
            <div className="w-full md:w-80 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200 p-6 md:p-8 flex flex-col items-center justify-center">
                <div className="mb-6 text-center"><h4 className="text-sm font-bold text-slate-600 uppercase tracking-wide">Live Label Preview</h4><p className="text-xs text-slate-400 mt-1">GS1-Compliant DataMatrix</p></div>
                <BatchLabel gtin={formData.gtin} lot={formData.lotNumber} expiry={formData.expiryDate} productName={formData.productName} />
                <div className="mt-8 text-center px-4"><p className="text-xs text-slate-400 leading-relaxed">This barcode encodes the GTIN, Expiry, and Lot number standard Application Identifiers (AIs).</p></div>
            </div>
          </div>
        </div>
      )}

      {/* NEW Transfer Modal: Handles both Single and Bulk with EWB and Payment */}
      {showTransferModal && selectedBatchIds.length > 0 && (
        <TransferModal 
          batches={getSelectedBatches()} // Pass array
          onClose={() => { setShowTransferModal(false); setSelectedBatchIds([]); }}
          onSubmit={handleTransferSubmit}
          currentUser={user}
        />
      )}

      {/* Return Modal */}
      {showReturnModal && selectedBatchForReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                   <RotateCcw className="text-orange-500" />
                   <span>Initiate Return</span>
                </h3>
                <button onClick={() => setShowReturnModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg mb-6 border border-orange-100">
                 <p className="text-sm text-orange-900 font-medium">Returning: {selectedBatchForReturn.productName}</p>
                 <p className="text-xs text-orange-700 font-mono mt-1">{selectedBatchForReturn.batchID}</p>
              </div>

              <form onSubmit={handleReturnSubmit} className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Return To (GLN)</label>
                      <input 
                        required
                        className="w-full border border-slate-300 rounded-lg px-4 py-2 font-mono text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                        placeholder="Manufacturer GLN"
                        value={returnData.toGLN}
                        onChange={e => setReturnData({...returnData, toGLN: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reason</label>
                      <select 
                        className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                        value={returnData.reason}
                        onChange={e => setReturnData({...returnData, reason: e.target.value as ReturnReason})}
                      >
                         {Object.values(ReturnReason).map(r => (
                             <option key={r} value={r}>{r}</option>
                         ))}
                      </select>
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Refund Amount (INR)</label>
                      <input 
                        type="number"
                        className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                        value={returnData.refundAmount}
                        onChange={e => setReturnData({...returnData, refundAmount: parseFloat(e.target.value)})}
                      />
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-6">
                      <button 
                        type="button"
                        onClick={() => setShowReturnModal(false)}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                      >
                          Cancel
                      </button>
                      <button 
                        type="submit"
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 shadow-md"
                      >
                          Process Return
                      </button>
                  </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default BatchManager;
