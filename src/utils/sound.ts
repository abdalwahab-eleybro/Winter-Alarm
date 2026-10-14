let audioContext: AudioContext | null = null;
let intervalId: number | null = null;
let startTime = 0;

export function startAlarmSound() {
  if (audioContext) return;

  audioContext = new AudioContext();
  startTime = Date.now();
  
  const playBeep = () => {
    if (!audioContext) return;
    
    // Increase intensity over time
    const elapsed = (Date.now() - startTime) / 1000;
    const intensity = Math.min(1, 0.5 + elapsed / 60); // Gets louder over 60 seconds
    
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    
    // More aggressive frequencies
    const freqs = [880, 1200, 880, 660, 1200, 1500, 880, 1200];
    const now = audioContext.currentTime;
    
    freqs.forEach((freq, i) => {
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      osc2.frequency.setValueAtTime(freq * 1.5, now + i * 0.12);
    });
    
    gain.gain.setValueAtTime(0.9 * intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.95);
    gain2.gain.setValueAtTime(0.4 * intensity, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.95);
    
    osc.type = 'sawtooth';
    osc2.type = 'square';
    
    osc.start(now);
    osc.stop(now + 0.95);
    osc2.start(now);
    osc2.stop(now + 0.95);
  };

  playBeep();
  intervalId = window.setInterval(playBeep, 1000);
}

export function stopAlarmSound() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
}

export function playSuccessSound() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(523, now);
  osc.frequency.setValueAtTime(659, now + 0.15);
  osc.frequency.setValueAtTime(784, now + 0.3);
  osc.frequency.setValueAtTime(1047, now + 0.45);
  
  gain.gain.setValueAtTime(0.5, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
  
  osc.start(now);
  osc.stop(now + 0.7);
  
  setTimeout(() => ctx.close(), 1000);
}

let speechInterval: number | null = null;

export function startSpeechAlarm() {
  if (!('speechSynthesis' in window)) return;
  if (speechInterval) return;

  const speak = () => {
    const messages = [
      "WAKE UP! WAKE UP! WAKE UP!",
      "GET OUT OF BED RIGHT NOW!",
      "GO TO THE BATHROOM AND SCAN THE Q R CODE!",
      "THIS ALARM WILL NOT STOP UNTIL YOU SCAN THE CODE!",
      "GET UP! GET UP! GET UP!",
    ];
    const msg = messages[Math.floor(Math.random() * messages.length)];
    const utterance = new SpeechSynthesisUtterance(msg);
    utterance.rate = 1.3;
    utterance.pitch = 1.5;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  };

  speak();
  speechInterval = window.setInterval(speak, 5000);
}

export function stopSpeechAlarm() {
  if (speechInterval) {
    clearInterval(speechInterval);
    speechInterval = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
