import { useState, useEffect, useCallback } from 'react';
import AlarmSetup from './components/AlarmSetup';
import AlarmActive from './components/AlarmActive';

type AppState = 'setup' | 'waiting' | 'active' | 'dismissed';

interface AlarmData {
  time: string;
  qrCode: string;
  timestamp: number;
}

function App() {
  const [state, setState] = useState<AppState>('setup');
  const [alarmData, setAlarmData] = useState<AlarmData | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load saved alarm from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('qr-alarm-data');
    if (saved) {
      try {
        const data: AlarmData = JSON.parse(saved);
        setAlarmData(data);
        
        // Check if alarm should be active now
        const now = new Date();
        const [hours, minutes] = data.time.split(':').map(Number);
        const alarmDate = new Date();
        alarmDate.setHours(hours, minutes, 0, 0);
        
        // If alarm time has passed and was set recently (within 24h)
        if (now >= alarmDate && now.getTime() - data.timestamp < 24 * 60 * 60 * 1000) {
          setState('active');
        } else if (now < alarmDate) {
          setState('waiting');
        }
      } catch (e) {
        console.error('Failed to load saved alarm', e);
      }
    }
  }, []);

  // Check alarm time every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      if (state === 'waiting' && alarmData) {
        const [hours, minutes] = alarmData.time.split(':').map(Number);
        const alarmDate = new Date();
        alarmDate.setHours(hours, minutes, 0, 0);

        if (now >= alarmDate) {
          setState('active');
        } else {
          // Update countdown
          const diff = alarmDate.getTime() - now.getTime();
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          setCountdown(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state, alarmData]);

  // Prevent tab close when alarm is active
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state === 'active') {
        e.preventDefault();
        e.returnValue = 'The alarm is still ringing! Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state]);

  // Prevent visibility change (keeps alarm running in background)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && state === 'active') {
        // Try to bring focus back
        window.focus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [state]);

  const handleAlarmSet = useCallback((time: string, qrCode: string) => {
    const data: AlarmData = {
      time,
      qrCode,
      timestamp: Date.now(),
    };
    setAlarmData(data);
    localStorage.setItem('qr-alarm-data', JSON.stringify(data));
    setState('waiting');
  }, []);

  const handleDismissed = useCallback(() => {
    setState('dismissed');
    localStorage.removeItem('qr-alarm-data');
    setAlarmData(null);
  }, []);

  const handleReset = useCallback(() => {
    setState('setup');
    setAlarmData(null);
    localStorage.removeItem('qr-alarm-data');
  }, []);

  // Render based on state
  if (state === 'active' && alarmData) {
    return (
      <AlarmActive
        qrCode={alarmData.qrCode}
        alarmTime={alarmData.time}
        onDismissed={handleDismissed}
      />
    );
  }

  if (state === 'waiting' && alarmData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-lg text-center">
          <div className="bg-gray-800/80 backdrop-blur rounded-3xl p-8 border border-blue-500/30 shadow-2xl">
            <div className="mb-6">
              <h1 className="text-4xl font-black text-white mb-2">⏰ Alarm Set</h1>
              <p className="text-blue-300">Your alarm is armed and waiting...</p>
            </div>

            <div className="bg-black/40 rounded-2xl p-6 mb-6">
              <p className="text-gray-400 text-sm mb-1">Alarm Time</p>
              <p className="text-5xl font-bold text-white font-mono">{alarmData.time}</p>
            </div>

            <div className="bg-black/40 rounded-2xl p-6 mb-6">
              <p className="text-gray-400 text-sm mb-1">Time Until Alarm</p>
              <p className="text-3xl font-bold text-blue-400 font-mono">{countdown}</p>
            </div>

            <div className="bg-black/40 rounded-2xl p-4 mb-6">
              <p className="text-gray-400 text-sm mb-1">Current Time</p>
              <p className="text-xl text-white font-mono">
                {currentTime.toLocaleTimeString()}
              </p>
            </div>

            <div className="bg-green-900/30 border border-green-500/50 rounded-xl p-4 mb-6">
              <p className="text-green-300 text-sm">
                ✅ QR code is ready. Make sure it's placed in your bathroom!
              </p>
              <p className="text-green-200/70 text-xs mt-1">
                Keep this page open. The alarm will ring at the set time and won't stop until you scan the QR code.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setState('active')}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-all"
              >
                🧪 Test Alarm Now
              </button>
              <button
                onClick={handleReset}
                className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold py-3 px-4 rounded-xl transition-all"
              >
                ❌ Cancel Alarm
              </button>
            </div>
          </div>

          <div className="mt-6 text-gray-500 text-sm">
            <p>💡 Tip: Keep your phone screen on and volume at maximum</p>
            <p className="mt-1">🔒 The alarm cannot be dismissed without scanning the QR code</p>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'dismissed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-green-900 flex items-center justify-center p-4">
        <div className="w-full max-w-lg text-center">
          <div className="bg-gray-800/80 backdrop-blur rounded-3xl p-8 border border-green-500/30 shadow-2xl">
            <div className="text-8xl mb-6">🎉</div>
            <h1 className="text-4xl font-black text-white mb-4">ALARM DISMISSED!</h1>
            <p className="text-green-300 text-xl mb-2">
              Great job getting out of bed!
            </p>
            <p className="text-green-200/70 mb-8">
              You scanned the QR code at {currentTime.toLocaleTimeString()}
            </p>
            
            <button
              onClick={handleReset}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl text-xl transition-all"
            >
              ⏰ Set Another Alarm
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <AlarmSetup onAlarmSet={handleAlarmSet} />;
}

export default App;
