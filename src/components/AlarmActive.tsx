import { useState, useEffect, useCallback, useRef } from 'react';
import { startAlarmSound, stopAlarmSound, playSuccessSound, startSpeechAlarm, stopSpeechAlarm } from '../utils/sound';
import QRScanner from './QRScanner';

interface AlarmActiveProps {
  qrCode: string;
  alarmTime: string;
  onDismissed: () => void;
}

const motivationalMessages = [
  "🚽 GET UP AND GO TO THE BATHROOM!",
  "😤 NO SNOOZE BUTTON HERE!",
  "🔥 THE ALARM WILL NEVER STOP!",
  "💀 SCAN THE QR CODE OR SUFFER!",
  "🏃 MOVE YOUR BODY!",
  "⚡ ELECTRICITY CAN'T SAVE YOU!",
  "🦷 BRUSH YOUR TEETH AFTER THIS!",
  "☀️ GOOD MORNING SUNSHINE!",
  "🎯 ONLY THE BATHROOM QR CODE WORKS!",
  "😈 I WILL RING FOREVER!",
];

export default function AlarmActive({ qrCode, alarmTime, onDismissed }: AlarmActiveProps) {
  const [flash, setFlash] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mathChallenge, setMathChallenge] = useState<{ question: string; answer: number } | null>(null);
  const [mathAnswer, setMathAnswer] = useState('');
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [shakeDetected, setShakeDetected] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [step, setStep] = useState<'initial' | 'hold' | 'math' | 'scanner'>('initial');
  const holdIntervalRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);
  const lastAccelRef = useRef({ x: 0, y: 0, z: 0 });

  // Start the alarm sound and speech immediately
  useEffect(() => {
    startAlarmSound();
    // Delay speech slightly so user hears the beep first
    const speechTimeout = setTimeout(() => {
      startSpeechAlarm();
    }, 2000);
    return () => {
      clearTimeout(speechTimeout);
      stopAlarmSound();
      stopSpeechAlarm();
    };
  }, []);

  // Request wake lock to keep screen on
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.log('Wake lock not available');
      }
    };
    requestWakeLock();
    
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, []);

  // Vibration pattern
  useEffect(() => {
    if ('vibrate' in navigator) {
      const vibrateInterval = setInterval(() => {
        navigator.vibrate([500, 200, 500, 200, 500]);
      }, 2000);
      return () => clearInterval(vibrateInterval);
    }
  }, []);

  // Shake detection using accelerometer
  useEffect(() => {
    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;
      
      const last = lastAccelRef.current;
      const deltaX = Math.abs(acc.x - last.x);
      const deltaY = Math.abs(acc.y - last.y);
      const deltaZ = Math.abs(acc.z - last.z);
      
      if (deltaX + deltaY + deltaZ > 30) {
        setShakeDetected(true);
      }
      
      lastAccelRef.current = { x: acc.x, y: acc.y, z: acc.z };
    };

    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleMotion);
    }
    
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, []);

  // Hold button logic
  const startHold = () => {
    setHoldProgress(0);
    holdIntervalRef.current = window.setInterval(() => {
      setHoldProgress(prev => {
        if (prev >= 100) {
          if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
          setStep('math');
          generateMathChallenge();
          return 100;
        }
        return prev + 2;
      });
    }, 60); // 3 seconds total (50 steps * 60ms)
  };

  const endHold = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
    }
    setHoldProgress(0);
  };

  // Flashing effect
  useEffect(() => {
    const interval = setInterval(() => {
      setFlash(f => !f);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Shake effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShakeCount(c => c + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Update time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Cycle motivational messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(i => (i + 1) % motivationalMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Generate math challenge
  const generateMathChallenge = useCallback(() => {
    const a = Math.floor(Math.random() * 50) + 10;
    const b = Math.floor(Math.random() * 50) + 10;
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let answer: number;
    let question: string;
    
    switch (op) {
      case '+':
        answer = a + b;
        question = `${a} + ${b}`;
        break;
      case '-':
        answer = a - b;
        question = `${a} - ${b}`;
        break;
      case '×':
        answer = a * b;
        question = `${a} × ${b}`;
        break;
      default:
        answer = a + b;
        question = `${a} + ${b}`;
    }
    
    setMathChallenge({ question, answer });
    setMathAnswer('');
  }, []);

  const handleMathSubmit = () => {
    if (parseInt(mathAnswer) === mathChallenge?.answer) {
      setStep('scanner');
      setWrongAttempts(0);
    } else {
      setWrongAttempts(w => w + 1);
      setMathAnswer('');
      generateMathChallenge();
    }
  };

  const handleScanSuccess = () => {
    stopAlarmSound();
    stopSpeechAlarm();
    playSuccessSound();
    onDismissed();
  };

  const handleIAmAwake = () => {
    if (!shakeDetected) {
      // On desktop, skip shake detection
      if (!window.DeviceMotionEvent) {
        setStep('hold');
        return;
      }
      // Show message to shake phone
      setWrongAttempts(w => w + 1);
      return;
    }
    setStep('hold');
  };

  return (
    <div className={`min-h-screen fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden transition-colors duration-200 ${
      flash ? 'bg-red-600' : 'bg-orange-600'
    }`}>
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute text-6xl animate-bounce opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 2}s`,
            }}
          >
            ⏰
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className={`relative z-10 text-center p-6 max-w-lg w-full ${
        shakeCount % 2 === 0 ? 'animate-pulse' : ''
      }`}>
        {(step === 'initial' || step === 'hold') && (
          <>
            {/* Time display */}
            <div className="mb-4">
              <p className="text-white/80 text-lg">Current Time</p>
              <p className="text-white text-4xl font-mono font-bold">
                {currentTime.toLocaleTimeString()}
              </p>
            </div>

            {/* Alarm message */}
            <div className="mb-8">
              <h1 className="text-6xl md:text-8xl font-black text-white mb-4 animate-pulse drop-shadow-lg">
                WAKE UP!
              </h1>
              <p className="text-2xl text-white/90 font-bold">
                ⏰ Alarm set for {alarmTime} is NOW ringing!
              </p>
              <p className="text-xl text-yellow-200 mt-4 animate-bounce">
                🚽 Get up and go to the bathroom!
              </p>
            </div>

            {/* Motivational messages */}
            <div className="bg-black/30 rounded-2xl p-4 mb-6 min-h-[80px] flex items-center justify-center">
              <p className="text-white text-xl font-bold transition-all duration-300">
                {wrongAttempts > 0 
                  ? `🔥 ${wrongAttempts} wrong attempts! The alarm won't stop!`
                  : motivationalMessages[messageIndex]
                }
              </p>
            </div>

            {/* Action button */}
            {step === 'initial' ? (
              <div>
                <button
                  onClick={handleIAmAwake}
                  className="w-full bg-white text-red-600 font-black py-5 px-8 rounded-2xl text-2xl shadow-2xl hover:bg-gray-100 transition-all active:scale-95 animate-bounce"
                >
                  📱 I'M AWAKE!
                </button>
                
                {shakeDetected ? (
                  <p className="text-green-300 text-sm mt-3">✅ Phone shake detected!</p>
                ) : (
                  <p className="text-white/60 text-sm mt-3">
                    {window.DeviceMotionEvent 
                      ? "📱 Shake your phone to prove you're awake!" 
                      : "Tap the button to proceed"
                    }
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-yellow-200 text-lg mb-3 font-bold">
                  👆 HOLD the button for 3 seconds to continue...
                </p>
                <button
                  onMouseDown={startHold}
                  onMouseUp={endHold}
                  onMouseLeave={endHold}
                  onTouchStart={startHold}
                  onTouchEnd={endHold}
                  className="w-full bg-yellow-500 text-black font-black py-5 px-8 rounded-2xl text-2xl shadow-2xl transition-all select-none relative overflow-hidden"
                >
                  <div 
                    className="absolute inset-0 bg-green-400 transition-all duration-100"
                    style={{ width: `${holdProgress}%` }}
                  ></div>
                  <span className="relative z-10">
                    {holdProgress >= 100 ? '✓ RELEASED!' : `HOLD ME (${Math.floor(holdProgress)}%)`}
                  </span>
                </button>
              </div>
            )}
            
            <p className="text-white/60 text-sm mt-4">
              Go to your bathroom and scan the QR code you placed there
            </p>
          </>
        )}

        {/* Math Challenge */}
        {step === 'math' && mathChallenge && (
          <div className="bg-black/50 backdrop-blur rounded-3xl p-8">
            <h2 className="text-3xl font-black text-white mb-2">🧠 PROVE YOU'RE AWAKE</h2>
            <p className="text-yellow-300 mb-6">Solve this math problem first!</p>
            
            <div className="bg-white/10 rounded-2xl p-6 mb-6">
              <p className="text-5xl font-bold text-white font-mono">
                {mathChallenge.question} = ?
              </p>
            </div>

            <input
              type="number"
              value={mathAnswer}
              onChange={(e) => setMathAnswer(e.target.value)}
              placeholder="Your answer..."
              className="w-full bg-white/20 border-2 border-white/50 rounded-xl p-4 text-white text-2xl text-center font-bold placeholder-white/50 focus:outline-none focus:border-white mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleMathSubmit()}
            />

            <button
              onClick={handleMathSubmit}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl text-xl transition-all"
            >
              ✓ Submit Answer
            </button>

            {wrongAttempts > 0 && (
              <p className="text-red-300 mt-3 text-sm">
                ❌ Wrong {wrongAttempts} time(s)! Think carefully!
              </p>
            )}
          </div>
        )}

        {/* QR Scanner */}
        {step === 'scanner' && (
          <div>
            <div className="mb-4">
              <h2 className="text-3xl font-black text-white mb-2">🚽 ALMOST THERE!</h2>
              <p className="text-yellow-200">Scan the QR code in your bathroom!</p>
            </div>
            <QRScanner
              expectedCode={qrCode}
              onScanSuccess={handleScanSuccess}
            />
          </div>
        )}
      </div>

      {/* Pulsing border effect */}
      <div className={`absolute inset-0 border-8 ${flash ? 'border-yellow-400' : 'border-transparent'} pointer-events-none transition-all duration-200`}></div>
    </div>
  );
}
