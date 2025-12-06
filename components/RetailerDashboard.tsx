
import React, { useState, useEffect } from 'react';
import { User, Batch, BatchStatus } from '../types';
import { LedgerService } from '../services/ledgerService';
import { 
  Scan, 
  ShoppingBag, 
  PackageCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Store, 
  Camera, 
  ArrowDownToLine, 
  CreditCard 
} from 'lucide-react';
import QRScanner from './QRScanner';
import { toast } from 'react-toastify';

interface RetailerDashboardProps {
  user: User;
}

const RetailerDashboard: React.FC<RetailerDashboardProps> = ({ user }) => {
  const [activeMode, setActiveMode] = useState<'receive' | 'dispense'>('dispense');
  
  const [scanInput, setScanInput] = useState('');
  const [scannedBatch, setScannedBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  
  const [inventory, setInventory] = useState<Batch[]>([]);

  useEffect(() => {
    fetchInventory();
  }, [user]);

  const fetchInventory = async () => {
    const data = await LedgerService.getBatches(user);
    setInventory(data);
  };

  const handleScan = async (e?: React.FormEvent, directInput?: string) => {
    if (e) e.preventDefault();
    const query = directInput || scanInput;
    if (!query.trim()) return;

    setLoading(true);
    setScannedBatch(null);

    try {
      let batch = await LedgerService.getBatchByID(query.trim());
      if (!batch) {
        batch = await LedgerService.verifyByHash(query.trim());
      }

      if (batch) {
        setScannedBatch(batch);
        setScanInput(query.trim());
        toast.info(`Item found: ${batch.productName}`);
      } else {
        toast.error('Product not found on ledger.');
      }
    } catch (err) {
      toast.error('Scan failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCameraScan = (text: string) => {
    setShowScanner(false);
    setScanInput(text);
    handleScan(undefined, text);
  };

  const executeAction = async () => {
    if (!scannedBatch) return;
    setActionLoading(true);
    try {
      if (activeMode === 'receive') {
        await LedgerService.receiveBatch(scannedBatch.batchID, user);
        toast.success(`Stock received: ${scannedBatch.productName}`);
      } else {
        await LedgerService.sellBatch(scannedBatch.batchID, user);
        toast.success(`Sale recorded: ${scannedBatch.productName}`);
      }
      setScannedBatch(null);
      setScanInput('');
      fetchInventory();
    } catch (err: any) {
      toast.error(err.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const stockCount = inventory.filter(b => b.status === BatchStatus.RECEIVED).length;
  const soldCount = inventory.filter(b => b.status === BatchStatus.SOLD).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {showScanner && (
        <QRScanner onScan={handleCameraScan} onClose={() => setShowScanner(false)} />
      )}

      {/* Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Retail & Pharmacy</h2>
          <p className="text-slate-500 text-sm">Point of Dispensing & Inventory Control</p>
        </div>
        
        <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex">
           <button
             onClick={() => { setActiveMode('receive'); setScanInput(''); setScannedBatch(null); }}
             className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${
               activeMode === 'receive' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'
             }`}
           >
             <ArrowDownToLine size={16} />
             <span>Receive Stock</span>
           </button>
           <button
             onClick={() => { setActiveMode('dispense'); setScanInput(''); setScannedBatch(null); }}
             className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${
               activeMode === 'dispense' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'
             }`}
           >
             <ShoppingBag size={16} />
             <span>POS / Dispense</span>
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Action Area */}
        <div className="lg:col-span-2">
          <div className={`rounded-xl shadow-lg overflow-hidden border transition-colors ${
            activeMode === 'receive' ? 'bg-blue-50 border-blue-100' : 'bg-emerald-50 border-emerald-100'
          }`}>
            <div className={`p-6 text-white flex justify-between items-center ${
              activeMode === 'receive' ? 'bg-blue-600' : 'bg-emerald-600'
            }`}>
               <div>
                 <h3 className="text-lg font-bold flex items-center gap-2">
                   {activeMode === 'receive' ? <ArrowDownToLine /> : <CreditCard />}
                   <span>{activeMode === 'receive' ? 'Inbound Scan' : 'Checkout & Dispense'}</span>
                 </h3>
                 <p className="text-white/80 text-xs mt-1">
                   {activeMode === 'receive' 
                     ? 'Scan incoming shipments to add to inventory.' 
                     : 'Scan items being sold to verify and deduct stock.'}
                 </p>
               </div>
               <button 
                 onClick={() => setShowScanner(true)}
                 className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg font-bold flex items-center gap-2 text-sm"
               >
                 <Camera size={18} />
                 <span>Scan</span>
               </button>
            </div>

            <div className="p-8">
               <form onSubmit={e => handleScan(e)} className="relative mb-6">
                 <input 
                   type="text" 
                   value={scanInput}
                   onChange={e => setScanInput(e.target.value)}
                   placeholder={activeMode === 'receive' ? "Scan shipment QR..." : "Scan product for sale..."}
                   className="w-full pl-12 pr-4 py-4 text-lg border-2 border-white bg-white/50 rounded-xl focus:border-current focus:ring-0 outline-none transition font-mono shadow-inner"
                   autoFocus
                 />
                 <Scan className="absolute left-4 top-5 text-slate-400" size={24} />
                 <button type="submit" className="absolute right-3 top-2.5 bg-slate-800 text-white px-4 py-2 rounded-lg font-bold text-sm">
                   Lookup
                 </button>
               </form>

               {scannedBatch && (
                 <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 animate-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-xl text-slate-800">{scannedBatch.productName}</h4>
                        <p className="text-sm text-slate-500 font-mono mt-1">{scannedBatch.batchID}</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        scannedBatch.status === 'SOLD' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
                      }`}>
                        {scannedBatch.status}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                      <div className="bg-slate-50 p-2 rounded">
                        <span className="block text-xs text-slate-400 uppercase">Expiry</span>
                        <span className="font-medium">{scannedBatch.expiryDate}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded">
                        <span className="block text-xs text-slate-400 uppercase">Qty</span>
                        <span className="font-medium">{scannedBatch.quantity} {scannedBatch.unit}</span>
                      </div>
                    </div>

                    <button
                      onClick={executeAction}
                      disabled={actionLoading || (activeMode === 'dispense' && scannedBatch.status === 'SOLD')}
                      className={`w-full py-3 rounded-lg font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 ${
                        activeMode === 'receive' 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400'
                      }`}
                    >
                      {actionLoading ? 'Processing...' : (
                        activeMode === 'receive' ? 'Confirm Receipt' : 'Complete Sale'
                      )}
                    </button>
                    
                    {activeMode === 'dispense' && scannedBatch.status === 'SOLD' && (
                      <p className="text-center text-xs text-red-500 mt-2 font-medium">
                        Item already marked as SOLD.
                      </p>
                    )}
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Stats & Info */}
        <div className="space-y-6">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <div className="flex items-center gap-3 mb-2 text-slate-500">
               <Store size={20} />
               <span className="text-sm font-bold uppercase">Store Inventory</span>
             </div>
             <p className="text-4xl font-bold text-slate-800">{stockCount}</p>
             <p className="text-xs text-slate-400 mt-1">Items available for sale</p>
           </div>

           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <div className="flex items-center gap-3 mb-2 text-slate-500">
               <ShoppingBag size={20} />
               <span className="text-sm font-bold uppercase">Total Sales</span>
             </div>
             <p className="text-4xl font-bold text-slate-800">{soldCount}</p>
             <p className="text-xs text-slate-400 mt-1">Recorded on blockchain</p>
           </div>

           <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
             <h4 className="font-bold text-slate-700 text-sm mb-3">Recent Transactions</h4>
             <ul className="space-y-3">
               {inventory.slice(0,5).map(b => (
                 <li key={b.batchID} className="text-sm flex justify-between items-center">
                   <span className="truncate flex-1 pr-2">{b.productName}</span>
                   <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                     b.status === 'SOLD' ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-700'
                   }`}>
                     {b.status}
                   </span>
                 </li>
               ))}
             </ul>
           </div>
        </div>

      </div>
    </div>
  );
};

export default RetailerDashboard;
