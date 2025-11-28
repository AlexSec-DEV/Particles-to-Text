import React, { useState, useEffect } from 'react';
import MorphingScene from './components/MorphingScene';

const App: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [debouncedText, setDebouncedText] = useState<string>('');

  // Debounce the text input to prevent restarting animation on every keystroke instantly
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedText(text);
    }, 800);

    return () => {
      clearTimeout(handler);
    };
  }, [text]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <MorphingScene text={debouncedText} />
      </div>

      {/* Custom Styles for Glow Animation */}
      <style>{`
        @keyframes border-pulse {
          0% {
            box-shadow: 0 0 15px rgba(189, 0, 255, 0.6), inset 0 0 10px rgba(189, 0, 255, 0.2);
            border-color: #bd00ff;
          }
          50% {
            box-shadow: 0 0 25px rgba(30, 58, 138, 0.8), inset 0 0 15px rgba(30, 58, 138, 0.3);
            border-color: #1e3a8a; /* Deep Blue */
          }
          100% {
            box-shadow: 0 0 15px rgba(189, 0, 255, 0.6), inset 0 0 10px rgba(189, 0, 255, 0.2);
            border-color: #bd00ff;
          }
        }
        .glow-input {
          animation: border-pulse 4s infinite ease-in-out;
        }
      `}</style>

      {/* UI Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-end pb-12">
        <div className="pointer-events-auto w-11/12 max-w-md">
          <input
            id="textInput"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="METİN YAZIN..."
            className="w-full bg-black/60 backdrop-blur-md text-white placeholder-gray-500 text-center font-bold tracking-widest rounded-full px-6 py-4 focus:outline-none transition-all glow-input border-2"
            style={{ borderStyle: 'solid' }}
            maxLength={15}
          />
        </div>
      </div>
      
      {/* Title/Overlay */}
      <div className="absolute top-8 left-8 z-10 pointer-events-none select-none">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-white drop-shadow-[0_0_10px_rgba(189,0,255,0.5)]">
          Kenan Aliyev
        </h1>
        <p className="text-xs text-purple-300 mt-1 uppercase tracking-[0.3em] font-medium opacity-80 pl-1">
          Partüküler
        </p>
      </div>
    </div>
  );
};

export default App;