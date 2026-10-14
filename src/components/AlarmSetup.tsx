import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { startAlarmSound, stopAlarmSound } from '../utils/sound';

interface AlarmSetupProps {
  onAlarmSet: (time: string, qrCode: string) => void;
}

export default function AlarmSetup({ onAlarmSet }: AlarmSetupProps) {
  const [hour, setHour] = useState('07');
  const [minute, setMinute] = useState('00');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [qrData, setQrData] = useState<string>('');
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    // Generate a unique QR code data
    const code = `BATHROOM_ALARM_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    setQrData(code);
    
    QRCode.toDataURL(code, { 
      width: 300, 
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    }).then(setQrCodeUrl);
  }, []);

  const handleGenerate = () => {
    setGenerated(true);
  };

  const handleSetAlarm = () => {
    const timeStr = `${hour}:${minute}`;
    onAlarmSet(timeStr, qrData);
  };

  const handleTestAlarm = () => {
    startAlarmSound();
    setTimeout(() => {
      stopAlarmSound();
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-white mb-2">⏰ WAKE UP!</h1>
          <p className="text-purple-300 text-lg">The alarm that forces you out of bed</p>
        </div>

        <div className="bg-gray-800/80 backdrop-blur rounded-3xl p-6 border border-purple-500/30 shadow-2xl">
          {/* Step 1: Generate QR Code */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">1</span>
              <h2 className="text-xl font-bold text-white">Generate Bathroom QR Code</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Print this QR code and place it in your bathroom. You'll need to scan it to turn off the alarm!
            </p>
            
            {qrCodeUrl && (
              <div className="bg-white rounded-xl p-4 flex justify-center mb-4">
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={handleGenerate}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-all"
              >
                🔄 Regenerate Code
              </button>
              {qrCodeUrl && (
                <a
                  href={qrCodeUrl}
                  download="bathroom-qr-code.png"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-all text-center"
                >
                  💾 Download QR
                </a>
              )}
            </div>
          </div>

          {/* Step 2: Set Time */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">2</span>
              <h2 className="text-xl font-bold text-white">Set Alarm Time</h2>
            </div>
            
            <div className="flex items-center justify-center gap-3">
              <div className="flex flex-col items-center">
                <label className="text-gray-400 text-xs mb-1">HOUR</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={hour}
                  onChange={(e) => setHour(e.target.value.padStart(2, '0'))}
                  className="w-20 h-20 bg-gray-900 border-2 border-purple-500 rounded-xl text-white text-3xl font-bold text-center focus:border-purple-300 focus:outline-none"
                />
              </div>
              <span className="text-4xl text-purple-400 font-bold mt-5">:</span>
              <div className="flex flex-col items-center">
                <label className="text-gray-400 text-xs mb-1">MIN</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minute}
                  onChange={(e) => setMinute(e.target.value.padStart(2, '0'))}
                  className="w-20 h-20 bg-gray-900 border-2 border-purple-500 rounded-xl text-white text-3xl font-bold text-center focus:border-purple-300 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Step 3: Activate */}
          <div className="space-y-3">
            <button
              onClick={handleSetAlarm}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-black py-4 px-6 rounded-xl text-xl transition-all active:scale-95 shadow-lg shadow-red-500/30"
            >
              🚀 ACTIVATE ALARM
            </button>
            
            <button
              onClick={handleTestAlarm}
              className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold py-3 px-4 rounded-xl transition-all"
            >
              🔊 Test Alarm Sound (3s)
            </button>
          </div>
        </div>

        <div className="mt-6 bg-yellow-900/30 border border-yellow-600/50 rounded-xl p-4">
          <h3 className="text-yellow-400 font-bold mb-2">⚠️ Instructions:</h3>
          <ol className="text-yellow-200/80 text-sm space-y-1 list-decimal list-inside">
            <li>Download and print the QR code above</li>
            <li>Place it in your bathroom (on the mirror, wall, etc.)</li>
            <li>Set your alarm time and activate</li>
            <li>Keep your phone nearby with this page open</li>
            <li>When alarm goes off, go to bathroom and scan the QR code</li>
            <li>Only the correct QR code will stop the alarm!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
