import React from 'react';
import { Printer, ScanBarcode } from 'lucide-react';

interface BatchLabelProps {
  gtin: string;
  lot: string;
  expiry: string; // YYYY-MM-DD
  productName: string;
}

const BatchLabel: React.FC<BatchLabelProps> = ({ gtin, lot, expiry, productName }) => {
  // Format Expiry YYYY-MM-DD -> YYMMDD for GS1 AI (17)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '000000';
    try {
      const d = new Date(dateStr);
      const yy = d.getFullYear().toString().slice(-2);
      const mm = (d.getMonth() + 1).toString().padStart(2, '0');
      const dd = d.getDate().toString().padStart(2, '0');
      return `${yy}${mm}${dd}`;
    } catch {
      return '000000';
    }
  };

  const expShort = formatDate(expiry);
  
  // Construct GS1 Element String
  // AI (01) GTIN
  // AI (17) Expiration Date
  // AI (10) Batch/Lot Number
  const gs1Text = `(01)${gtin || '00000000000000'}(17)${expShort}(10)${lot || '000'}`;
  
  // Encode for URL (bwip-js API)
  const encodedText = encodeURIComponent(gs1Text);

  return (
    <div className="bg-white border-2 border-slate-800 p-4 w-full max-w-sm rounded-lg shadow-sm print:border-black print:shadow-none">
        {/* Label Header */}
        <div className="flex items-start justify-between mb-3 border-b border-slate-200 pb-2">
             <div className="overflow-hidden">
                 <h4 className="font-bold text-lg leading-tight truncate text-slate-900">{productName || 'PRODUCT NAME'}</h4>
                 <p className="text-[10px] text-slate-500 font-medium">Rx Only • Sterile Injectable</p>
             </div>
             <div className="text-right shrink-0 ml-2">
                 <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400">
                    <ScanBarcode size={12} />
                    <span>GS1 DataMatrix</span>
                 </div>
             </div>
        </div>
        
        {/* Label Content */}
        <div className="flex flex-row items-center gap-4">
            {/* Barcode Image via API */}
            <div className="shrink-0 border border-slate-100 p-1 rounded bg-white">
                <img 
                    src={`https://bwipjs-api.metafloor.com/?bcid=datamatrix&text=${encodedText}&scale=3&includetext`}
                    alt="GS1 DataMatrix"
                    className="w-24 h-24 object-contain"
                />
            </div>

            {/* Human Readable Text */}
            <div className="flex-1 text-xs font-mono space-y-1.5 text-slate-700">
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-sans leading-none">GTIN (01)</span>
                    <span className="font-bold">{gtin || '----------------'}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-sans leading-none">EXP (17)</span>
                    <span className="font-bold">{expShort}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-sans leading-none">LOT (10)</span>
                    <span className="font-bold">{lot || '---'}</span>
                </div>
            </div>
        </div>
        
        {/* Actions (Hidden in Print) */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center print:hidden">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Label Preview</span>
            <button 
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded transition-colors"
            >
                <Printer size={14} /> 
                <span>Print Label</span>
            </button>
        </div>
        
        {/* Print Only Footer */}
        <div className="hidden print:block text-[8px] text-right mt-1">
          Generated via E-Ledger Blockchain
        </div>
    </div>
  );
};

export default BatchLabel;
