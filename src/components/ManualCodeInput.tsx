import { useState } from 'react';

interface ManualCodeInputProps {
  qrCode: string;
  onSuccess: () => void;
}

export default function ManualCodeInput({ qrCode, onSuccess }: ManualCodeInputProps) {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    if (inputValue.trim() === qrCode.trim()) {
      onSuccess();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  if (!showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold py-3 px-4 rounded-xl transition-all text-sm"
      >
        📝 Camera not working? Type the code manually
      </button>
    );
  }

  return (
    <div className="mt-4 bg-gray-800/80 rounded-2xl p-4 border border-gray-600">
      <p className="text-gray-300 text-sm mb-3">
        Type the exact code from the QR code in your bathroom:
      </p>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Enter the code..."
        className={`w-full bg-gray-900 border-2 ${error ? 'border-red-500' : 'border-gray-600'} rounded-lg p-3 text-white text-sm font-mono placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-3`}
        autoFocus
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      />
      <button
        onClick={handleSubmit}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all"
      >
        ✓ Submit Code
      </button>
      {error && (
        <p className="text-red-400 text-xs mt-2">
          ❌ Wrong code! Go back to the bathroom and check again.
        </p>
      )}
      <p className="text-gray-500 text-xs mt-2">
        💡 The code looks like: BATHROOM_ALARM_1234567_abcdef
      </p>
    </div>
  );
}
