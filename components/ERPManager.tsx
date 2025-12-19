
import React, { useState, useEffect } from 'react';
import { User, ERPType } from '../types';
import { Cpu, RefreshCw, CheckCircle2, AlertCircle, Link as LinkIcon, Database, Terminal, FileJson, Clock, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { ERPService } from '../services/erpService';

interface ERPManagerProps {
  user: User;
}

const ERPManager: React.FC<ERPManagerProps> = ({ user }) => {
  const [syncing, setSyncing] = useState(false);
  const [checkingConn, setCheckingConn] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'PENDING'>(user.erpStatus || 'PENDING');
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    // Generate dummy logs
    setLogs([
      { id: 1, type: 'FETCH', event: 'New Batch in SAP', status: 'SUCCESS', time: '2 mins ago' },
      { id: 2, type: 'PUBLISH', event: 'Dispatch Event to E-Ledger', status: 'SUCCESS', time: '5 mins ago' },
      { id: 3, type: 'FETCH', event: 'Invoice #123 generated', status: 'SUCCESS', time: '12 mins ago' },
    ]);
  }, []);

  const handleManualSync = () => {
    setSyncing(true);
    toast.info(`Scanning ${user.erpType} for new transactions...`);
    setTimeout(() => {
      setSyncing(false);
      toast.success("ERP Synchronization Complete. 2 New events recorded.");
      setLogs(prev => [
        { id: Date.now(), type: 'FETCH', event: 'Sync Manual Trigger', status: 'SUCCESS', time: 'Just now' },
        ...prev
      ]);
    }, 2000);
  };

  const handleCheckConnection = async () => {
    setCheckingConn(true);
    try {
      const status = await ERPService.checkConnection(user);
      setConnectionStatus(status);
      if (status === 'CONNECTED') {
        toast.success(`Securely connected to ${user.erpType} Gateway`);
      } else {
        toast.error(`Failed to reach ${user.erpType} endpoint`);
      }
    } catch (e) {
      setConnectionStatus('DISCONNECTED');
      toast.error("ERP Network failure");
    } finally {
      setCheckingConn(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">ERP Integration</h2>
          <p className="text-slate-500 text-sm">Adapter status and synchronization health</p>
        </div>
        <button 
          onClick={handleManualSync}
          disabled={syncing || checkingConn}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
          <span>Force ERP Sync</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection Status Card */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-slate-900 rounded-xl text-white">
                    <Cpu size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">{user.erpType}</h3>
                    <p className="text-xs text-slate-400 font-mono">ADAPTER v3.4.1</p>
                </div>
            </div>
            
            <div className="space-y-4 flex-1">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Connection Status</p>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${connectionStatus === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : connectionStatus === 'PENDING' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                            <span className={`font-bold ${connectionStatus === 'CONNECTED' ? 'text-emerald-700' : connectionStatus === 'PENDING' ? 'text-amber-700' : 'text-red-700'}`}>
                                {connectionStatus}
                            </span>
                        </div>
                        <button 
                          onClick={handleCheckConnection}
                          disabled={checkingConn}
                          className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded hover:bg-slate-100 font-bold uppercase tracking-tighter flex items-center gap-1 transition-colors"
                        >
                          {checkingConn ? <RefreshCw size={10} className="animate-spin" /> : <Wifi size={10} />}
                          Check
                        </button>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Endpoint URL</p>
                    <div className="flex items-center gap-2 font-mono text-xs text-slate-600 truncate">
                        <LinkIcon size={12} />
                        <span>https://sync.eledger.org/v1/adapter/{user.gln}</span>
                    </div>
                </div>
            </div>

            <button className="mt-6 w-full py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                Configure API Gateway
            </button>
        </div>

        {/* Integration Logs */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Terminal size={18} className="text-slate-400" />
                    <span>Live Adapter Stream</span>
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Auto-Refresh: ON</span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-96">
                <table className="w-full text-left">
                    <thead className="text-[10px] text-slate-400 uppercase bg-slate-50/50 sticky top-0">
                        <tr>
                            <th className="px-6 py-3 font-bold">Event</th>
                            <th className="px-6 py-3 font-bold">Operation</th>
                            <th className="px-6 py-3 font-bold text-right">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.map(log => (
                            <tr key={log.id} className="text-sm hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <FileJson size={16} className="text-slate-400" />
                                        <span className="font-medium text-slate-700">{log.event}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                        log.type === 'FETCH' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                    }`}>
                                        {log.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-xs text-slate-400 flex items-center justify-end gap-1">
                                    <Clock size={12} />
                                    {log.time}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="p-4 bg-slate-900 text-emerald-400 font-mono text-[10px] h-24 overflow-hidden shadow-inner">
                <p>&gt; Starting ERP background worker...</p>
                <p>&gt; Auth: {user.gln} validated.</p>
                <p>&gt; Polling SAP instance at sap.prod.corp...</p>
                <p>&gt; Heartbeat OK. Listening for EPCIS Events.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ERPManager;
