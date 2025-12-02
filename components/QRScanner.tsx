import React, { useEffect, useRef } from 'react';
import { X, Camera } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    // Check if library is loaded
    // @ts-ignore
    if (!window.Html5QrcodeScanner) {
      console.error("Html5QrcodeScanner not found");
      return;
    }

    // @ts-ignore
    const scanner = new window.Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true
      },
      false
    );
    
    scannerRef.current = scanner;

    scanner.render((decodedText: string) => {
      onScan(decodedText);
      // Auto-clear after successful scan to prevent multiple triggers
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    }, (error: any) => {
      // ignore scanning errors (happens every frame if no QR found)
    });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
           <h3 className="font-bold text-slate-800 flex items-center gap-2">
             <Camera size={20} className="text-blue-600" />
             <span>Scan QR Code</span>
           </h3>
           <button 
             onClick={onClose}
             className="p-2 bg-white hover:bg-slate-100 rounded-full text-slate-500 transition-colors border border-slate-200"
           >
             <X size={20} />
           </button>
        </div>
        
        <div className="p-0 bg-black relative min-h-[300px]">
           <div id="qr-reader" className="w-full h-full"></div>
        </div>

        <div className="p-4 text-center bg-slate-50 text-xs text-slate-500 border-t border-slate-100">
          Position the GS1 DataMatrix or QR code within the frame.
        </div>
      </div>
    </div>
  );
};

export default QRScanner;