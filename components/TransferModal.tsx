
import React, { useState } from 'react';
import { Batch, User, GSTDetails, EWayBill, PaymentStatus } from '../types';
import { Truck, FileText, IndianRupee, ShieldCheck, Printer, ArrowRight, CreditCard, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';
import PrintableInvoice from './PrintableInvoice';

interface TransferModalProps {
  batches: Batch[]; 
  onClose: () => void;
  onSubmit: (toGLN: string, toName: string, gst?: GSTDetails, ewbPartial?: Partial<EWayBill>, payment?: any) => Promise<void>;
  currentUser: User;
}

const TransferModal: React.FC<TransferModalProps> = ({ batches, onClose, onSubmit, currentUser }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Recipient, 2: Tax/EWB, 3: Payment
  const [loading, setLoading] = useState(false);
  const [printData, setPrintData] = useState<any>(null);
  
  // 1. Basic Info
  const [recipient, setRecipient] = useState({ gln: '', name: '' });
  
  // 2. Compliance Info
  // Default values for EWB and GST
  const [gstData, setGstData] = useState({
    hsn: '3004',
    value: 10000 * batches.length, 
    rate: 12,
    invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
  });
  
  const [transportData, setTransportData] = useState({
    vehicleNo: '',
    distance: 50,
    fromPlace: currentUser.orgName.split(' ')[0] + ' Warehouse',
    toPlace: ''
  });

  // 3. Payment Info
  const taxAmount = (gstData.value * gstData.rate) / 100;
  const totalAmount = gstData.value + taxAmount;

  const [paymentData, setPaymentData] = useState({
    amountPaid: 0,
    isCredit: true,
    waived: 0,
    notes: ''
  });

  const handleSubmit = async () => {
    if (!recipient.gln || !recipient.name) {
      toast.error("Recipient details required");
      return;
    }

    setLoading(true);
    
    // Construct GST Object
    const gst: GSTDetails = {
      hsnCode: gstData.hsn,
      taxableValue: gstData.value,
      taxRate: gstData.rate,
      taxAmount: taxAmount,
      invoiceNo: gstData.invoiceNo,
      invoiceDate: new Date().toISOString()
    };

    // Construct EWB Object
    const ewbPartial: Partial<EWayBill> = {
      vehicleNo: transportData.vehicleNo || 'XX-00-0000', // Default if empty for simulation
      distanceKm: transportData.distance,
      fromPlace: transportData.fromPlace,
      toPlace: transportData.toPlace || recipient.name + ' Depot'
    };

    // Construct Payment Metadata
    let derivedStatus = PaymentStatus.UNPAID;
    if (paymentData.amountPaid >= totalAmount) derivedStatus = PaymentStatus.PAID;
    else if (paymentData.amountPaid > 0) derivedStatus = PaymentStatus.PARTIAL;
    else if (paymentData.waived >= totalAmount) derivedStatus = PaymentStatus.WAIVED;
    else if (paymentData.isCredit) derivedStatus = PaymentStatus.CREDIT;

    const paymentMeta = {
        totalAmount: totalAmount,
        amountPaid: paymentData.amountPaid,
        amountRemaining: Math.max(0, totalAmount - paymentData.amountPaid - paymentData.waived),
        waivedAmount: paymentData.waived,
        status: derivedStatus,
        method: 'BANK_TRANSFER',
        notes: paymentData.notes
    };

    try {
      await onSubmit(recipient.gln, recipient.name, gst, ewbPartial, paymentMeta);
      
      // Prepare print data on success
      setPrintData({
        id: gstData.invoiceNo,
        date: new Date().toISOString(),
        from: { name: currentUser.orgName, gln: currentUser.gln, address: transportData.fromPlace },
        to: { name: recipient.name, gln: recipient.gln, address: transportData.toPlace },
        items: batches.map(b => ({
            product: b.productName,
            batch: b.batchID,
            hsos: gstData.hsn,
            qty: b.quantity,
            unit: b.unit,
            rate: (gstData.value / batches.length) / (b.quantity || 1),
            amount: gstData.value / batches.length
        })),
        tax: { rate: gstData.rate, amount: taxAmount },
        total: totalAmount,
        remarks: `Payment Status: ${derivedStatus}. Paid: ${paymentData.amountPaid}. Balance: ${paymentMeta.amountRemaining}.`,
        ewayBill: {
            ewbNo: '141' + Math.floor(100000000 + Math.random() * 900000000), // Simulated
            vehicleNo: transportData.vehicleNo,
            fromPlace: transportData.fromPlace,
            toPlace: transportData.toPlace || recipient.name + ' Depot',
            distanceKm: transportData.distance,
            validUntil: new Date(Date.now() + (Math.ceil(transportData.distance / 200) * 86400000)).toISOString(),
            generatedDate: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (printData) {
    return <PrintableInvoice type="INVOICE" data={printData} onClose={onClose} />;
  }

  const isBulk = batches.length > 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Truck className="text-blue-400" />
            <span>Initiate {isBulk ? 'Bulk Transfer' : 'Transfer'}</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Stepper */}
          <div className="mb-6 flex items-center justify-between text-sm">
             <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">1</span>
                <span className="hidden sm:inline">Recipient</span>
             </div>
             <div className="h-px bg-slate-200 flex-1 mx-2"></div>
             <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">2</span>
                <span className="hidden sm:inline">E-Way Bill</span>
             </div>
             <div className="h-px bg-slate-200 flex-1 mx-2"></div>
             <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">3</span>
                <span className="hidden sm:inline">Payment</span>
             </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-200 text-sm">
             {isBulk ? (
                 <p className="font-bold text-slate-800">{batches.length} Items Selected for Shipment</p>
             ) : (
                 <p className="font-bold text-slate-800">{batches[0].productName} <span className="font-normal text-slate-500">({batches[0].quantity} {batches[0].unit})</span></p>
             )}
          </div>

          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Recipient GLN</label>
                <input 
                  required
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0490001234567"
                  value={recipient.gln}
                  onChange={e => setRecipient({...recipient, gln: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Recipient Organization</label>
                <input 
                  required
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Global Distro Corp"
                  value={recipient.name}
                  onChange={e => setRecipient({...recipient, name: e.target.value})}
                />
              </div>
              <div className="pt-4 flex justify-end">
                <button 
                  onClick={() => {
                     if(!recipient.gln || !recipient.name) {
                       toast.warning("Please fill recipient details");
                       return;
                     }
                     setStep(2);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold transition-colors flex items-center gap-2"
                >
                  <span>Next Step</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              
              {/* E-Way Bill Section */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-1">
                   <Truck size={16} className="text-emerald-600" />
                   <span>Transport & E-Way Bill Details</span>
                </h4>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vehicle No.</label>
                     <input type="text" className="w-full border border-slate-300 rounded px-3 py-2 text-sm uppercase placeholder:text-slate-300"
                       placeholder="XX-00-XX-0000"
                       value={transportData.vehicleNo} onChange={e => setTransportData({...transportData, vehicleNo: e.target.value})} />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Distance (Km)</label>
                     <input type="number" className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                       value={transportData.distance} onChange={e => setTransportData({...transportData, distance: Number(e.target.value)})} />
                   </div>
                   <div className="col-span-2 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Origin (From)</label>
                            <div className="relative">
                                <MapPin size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                                <input type="text" className="w-full border border-slate-300 rounded pl-8 pr-3 py-2 text-sm"
                                value={transportData.fromPlace} onChange={e => setTransportData({...transportData, fromPlace: e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Destination (To)</label>
                            <div className="relative">
                                <MapPin size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                                <input type="text" className="w-full border border-slate-300 rounded pl-8 pr-3 py-2 text-sm placeholder:text-slate-300"
                                placeholder="City/Hub"
                                value={transportData.toPlace} onChange={e => setTransportData({...transportData, toPlace: e.target.value})} />
                            </div>
                        </div>
                   </div>
                </div>
                
                <div className="flex items-start gap-2 bg-emerald-50 p-3 rounded-lg border border-emerald-100 mt-2">
                    <ShieldCheck className="text-emerald-600 mt-0.5" size={16} />
                    <div>
                       <p className="text-xs font-bold text-emerald-800">NIC E-Way Bill Integration</p>
                       <p className="text-[10px] text-emerald-600">
                         EWB will be auto-generated for {transportData.distance}km validity.
                       </p>
                    </div>
                </div>
              </div>

              {/* GST Section */}
              <div className="space-y-4 pt-2">
                <h4 className="font-bold text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-1">
                   <IndianRupee size={16} className="text-blue-600" />
                   <span>Invoice Value</span>
                </h4>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Taxable Value</label>
                     <input type="number" className="w-full border border-slate-300 rounded px-2 py-1.5"
                       value={gstData.value} onChange={e => setGstData({...gstData, value: Number(e.target.value)})} />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">HSN Code</label>
                     <input type="text" className="w-full border border-slate-300 rounded px-2 py-1.5"
                       value={gstData.hsn} onChange={e => setGstData({...gstData, hsn: e.target.value})} />
                   </div>
                </div>
              </div>

              <div className="pt-2 flex justify-between gap-3">
                 <button onClick={() => setStep(1)} className="text-slate-500 text-sm font-medium px-4 py-2">Back</button>
                 <button onClick={() => setStep(3)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold">Next: Payment</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <h4 className="font-bold text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-1">
                   <CreditCard size={16} />
                   <span>Payment Terms</span>
                </h4>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex justify-between mb-4">
                        <span className="text-sm font-medium text-slate-600">Total Invoice Amount</span>
                        <span className="text-lg font-bold text-slate-900">₹{totalAmount.toLocaleString()}</span>
                    </div>
                    
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount Paid Now</label>
                            <input 
                                type="number" 
                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={paymentData.amountPaid}
                                onChange={e => setPaymentData({...paymentData, amountPaid: Number(e.target.value)})}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Waived / Discount</label>
                            <input 
                                type="number" 
                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                value={paymentData.waived}
                                onChange={e => setPaymentData({...paymentData, waived: Number(e.target.value)})}
                            />
                        </div>

                        <div className="flex items-center pt-2">
                            <input 
                                type="checkbox" 
                                id="credit"
                                checked={paymentData.isCredit}
                                onChange={e => setPaymentData({...paymentData, isCredit: e.target.checked})}
                                className="h-4 w-4 text-blue-600 rounded"
                            />
                            <label htmlFor="credit" className="ml-2 text-sm text-slate-700">Mark remaining balance as <strong>Credit</strong></label>
                        </div>

                        <div className="pt-2 border-t border-slate-200 mt-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Remaining Balance</span>
                                <span className="font-bold text-red-600">
                                    ₹{Math.max(0, totalAmount - paymentData.amountPaid - paymentData.waived).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-2 flex justify-between gap-3">
                    <button onClick={() => setStep(2)} className="text-slate-500 text-sm font-medium px-4 py-2">Back</button>
                    <button 
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-bold flex-1 shadow-lg shadow-emerald-900/20"
                    >
                        {loading ? 'Processing...' : 'Generate EWB & Send'}
                    </button>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransferModal;
