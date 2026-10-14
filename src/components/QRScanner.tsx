import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  expectedCode: string;
  onScanSuccess: () => void;
  onScanError?: (error: string) => void;
}

export default function QRScanner({ expectedCode, onScanSuccess }: QRScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');

  useEffect(() => {
    Html5Qrcode.getCameras().then((devices) => {
      if (devices && devices.length) {
        setCameras(devices);
        // Prefer rear camera
        const rearCamera = devices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        );
        setSelectedCamera(rearCamera ? rearCamera.id : devices[0].id);
      }
    }).catch((err) => {
      setError('Camera access denied. Please allow camera access to scan the QR code.');
      console.error(err);
    });

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanning = async () => {
    if (!scannerRef.current || !selectedCamera) return;
    
    setError('');
    setScanning(true);

    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        selectedCamera,
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          if (decodedText.trim() === expectedCode.trim()) {
            html5QrCode.stop().then(() => {
              onScanSuccess();
            }).catch(() => {
              onScanSuccess();
            });
          } else {
            setError('❌ Wrong QR code! Place the bathroom QR code in front of the camera.');
          }
        },
        () => {} // Ignore errors during scanning
      );
    } catch (err) {
      setError('Failed to start camera. Please try again.');
      setScanning(false);
      console.error(err);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4 text-center">
          📷 Scan Bathroom QR Code
        </h3>
        
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 mb-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {cameras.length > 1 && (
          <select 
            className="w-full bg-gray-800 text-white rounded-lg p-2 mb-4 border border-gray-600"
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
          >
            {cameras.map((cam) => (
              <option key={cam.id} value={cam.id}>{cam.label}</option>
            ))}
          </select>
        )}

        {!scanning ? (
          <button
            onClick={startScanning}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all active:scale-95"
          >
            🎯 Start Scanning
          </button>
        ) : (
          <div>
            <div id="qr-reader" ref={scannerRef} className="rounded-lg overflow-hidden mb-4"></div>
            <p className="text-yellow-400 text-center text-sm animate-pulse">
              Point camera at the QR code in your bathroom...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
