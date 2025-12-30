
import React, { useState } from 'react';
import { Sparkles, Brain, Compass, Hand, Layout } from 'lucide-react';
import { DIVINATION_APPS } from '../constants';
import { TarotGame } from './TarotGame';
import { ZiWeiGame } from './ZiWeiGame';
import { FingerFortuneGame } from './FingerFortuneGame';

export const DivinationCenter: React.FC = () => {
  const [activeApp, setActiveApp] = useState<string | null>(null);

  if (activeApp === 'tarot') {
      return (
          <div className="p-4">
              <button onClick={() => setActiveApp(null)} className="mb-4 text-purple-600 hover:text-purple-800 flex items-center font-bold">
                  <Layout className="mr-1" size={16}/> 返回算命大廳
              </button>
              <TarotGame />
          </div>
      );
  }

  if (activeApp === 'ziwei') {
      return (
          <div className="p-4">
              <button onClick={() => setActiveApp(null)} className="mb-4 text-purple-600 hover:text-purple-800 flex items-center font-bold">
                  <Layout className="mr-1" size={16}/> 返回算命大廳
              </button>
              <ZiWeiGame />
          </div>
      );
  }

  if (activeApp === 'finger') {
      return (
          <div className="p-4">
              <button onClick={() => setActiveApp(null)} className="mb-4 text-purple-600 hover:text-purple-800 flex items-center font-bold">
                  <Layout className="mr-1" size={16}/> 返回算命大廳
              </button>
              <FingerFortuneGame />
          </div>
      );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-purple-100">
      <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-800">
        <Sparkles className="mr-2 text-purple-500" /> 
        算命區 (Divination Center)
      </h2>
      
      <p className="text-gray-500 mb-8">
        探索未知的命運，透過傳統與科技的結合，為您指引迷津。
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {DIVINATION_APPS.map(app => (
          <button 
            key={app.id}
            onClick={() => setActiveApp(app.id)}
            className={`
              p-8 rounded-xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-4 h-48
              ${activeApp === app.id 
                ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md transform scale-105' 
                : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 text-gray-600 hover:shadow-lg hover:-translate-y-1'
              }
            `}
          >
            {app.id === 'tarot' ? <Brain size={48} className="text-purple-500"/> :
             app.id === 'ziwei' ? <Compass size={48} className="text-indigo-500"/> :
             <Hand size={48} className="text-amber-600"/>}
            <span className="text-lg">{app.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
