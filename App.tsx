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
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <MorphingScene text={debouncedText} />
      </div>

      {/* UI Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-end pb-8">
        <div className="pointer-events-auto w-11/12 max-w-md bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-2xl transition-all hover:bg-white/15">
          <label 
            htmlFor="textInput" 
            className="block text-gray-300 text-sm font-semibold mb-2 uppercase tracking-wider"
          >
            Metni Değiştir
          </label>
          <input
            id="textInput"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Yazı yazın..."
            className="w-full bg-black/50 text-white placeholder-gray-500 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            maxLength={15}
          />
          <p className="mt-3 text-xs text-gray-400 text-center">
            Boş bırakırsanız küreye dönüşür.
          </p>
        </div>
      </div>
      
      {/* Title/Overlay */}
      <div className="absolute top-8 left-8 z-10 pointer-events-none">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-white">
          Kenan Aliyev
        </h1>
        <p className="text-sm text-gray-400 mt-1 uppercase tracking-[0.2em] font-light">Partüküler</p>
      </div>
    </div>
  );
};

export default App;