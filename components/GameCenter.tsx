
import React, { useState, useContext } from 'react';
import { Award, Dice5, Layout, Zap, Coins, Shield, CreditCard, Disc } from 'lucide-react';
import { DataContext } from '../contexts/DataContext';
import { GAMBLING_GAMES } from '../constants';
import { SicBoGame } from './SicBoGame';
import { LittleMaryGame } from './LittleMaryGame';
import { SlotsGame } from './SlotsGame';
import { BlackjackGame } from './BlackjackGame';
import { BaccaratGame } from './BaccaratGame';
import { RouletteGame } from './RouletteGame';

export const GameCenter: React.FC = () => {
  const { currentUser, updatePoints } = useContext(DataContext);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  
  // Generic simple game states
  const [betAmount, setBetAmount] = useState(100);
  const [result, setResult] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);

  if (!currentUser) return (
    <div className="p-8 text-center bg-red-50 text-red-600 rounded-lg border border-red-200">
      請先登入以進行遊戲
    </div>
  );

  // Generic Simple Game Handler (for placeholders)
  const handleSimplePlay = (gameId: string) => {
    if (currentUser.points < betAmount) {
      alert("HKER 積分不足！");
      return;
    }
    
    setIsSpinning(true);
    setResult("");
    updatePoints(currentUser.id, -betAmount);

    setTimeout(() => {
      const win = Math.random() > 0.55;
      let multiplier = 2;
      
      if (win) {
        const winAmount = Math.floor(betAmount * multiplier);
        updatePoints(currentUser.id, winAmount);
        setResult(`🎉 恭喜！在 ${GAMBLING_GAMES.find(g=>g.id===gameId)?.name} 贏得了 ${winAmount} 積分！`);
      } else {
        setResult(`💸 很遺憾，在 ${GAMBLING_GAMES.find(g=>g.id===gameId)?.name} 輸掉了 ${betAmount} 積分。`);
      }
      setIsSpinning(false);
    }, 1500);
  };

  // Complex Games Rendering
  if (activeGame === 'sicbo') {
      return (
          <div className="p-4">
              <button onClick={() => setActiveGame(null)} className="mb-4 text-blue-600 hover:text-blue-800 flex items-center font-bold">
                  <Layout className="mr-1" size={16}/> 返回遊戲大廳
              </button>
              <SicBoGame />
          </div>
      );
  }

  if (activeGame === 'littlemary') {
      return (
          <div className="p-4">
              <button onClick={() => setActiveGame(null)} className="mb-4 text-blue-600 hover:text-blue-800 flex items-center font-bold">
                  <Layout className="mr-1" size={16}/> 返回遊戲大廳
              </button>
              <LittleMaryGame />
          </div>
      );
  }

  if (activeGame === 'slots') {
      return (
          <div className="p-4">
              <button onClick={() => setActiveGame(null)} className="mb-4 text-blue-600 hover:text-blue-800 flex items-center font-bold">
                  <Layout className="mr-1" size={16}/> 返回遊戲大廳
              </button>
              <SlotsGame />
          </div>
      );
  }

  if (activeGame === 'blackjack') {
      return (
          <div className="p-4">
              <button onClick={() => setActiveGame(null)} className="mb-4 text-blue-600 hover:text-blue-800 flex items-center font-bold">
                  <Layout className="mr-1" size={16}/> 返回遊戲大廳
              </button>
              <BlackjackGame />
          </div>
      );
  }

  if (activeGame === 'baccarat') {
      return (
          <div className="p-4">
              <button onClick={() => setActiveGame(null)} className="mb-4 text-blue-600 hover:text-blue-800 flex items-center font-bold">
                  <Layout className="mr-1" size={16}/> 返回遊戲大廳
              </button>
              <BaccaratGame />
          </div>
      );
  }

  if (activeGame === 'roulette') {
      return (
          <div className="p-4">
              <button onClick={() => setActiveGame(null)} className="mb-4 text-blue-600 hover:text-blue-800 flex items-center font-bold">
                  <Layout className="mr-1" size={16}/> 返回遊戲大廳
              </button>
              <RouletteGame />
          </div>
      );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-800">
        <Award className="mr-2 text-yellow-500" /> 
        遊戲中心 (Game Center)
        <span className="ml-4 text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          當前積分: <span className="font-bold text-blue-600">{currentUser.points}</span>
        </span>
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {GAMBLING_GAMES.map(game => (
          <button 
            key={game.id}
            onClick={() => { setActiveGame(game.id); setResult(""); }}
            className={`p-6 rounded-xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-2
              ${activeGame === game.id 
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md transform scale-105' 
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 text-gray-600'
              }`}
          >
            {game.id === 'littlemary' ? <Zap size={24} className="text-pink-500"/> : 
             game.id === 'slots' ? <Coins size={24} className="text-yellow-500"/> :
             game.id === 'blackjack' ? <Shield size={24} className="text-slate-800"/> :
             game.id === 'baccarat' ? <CreditCard size={24} className="text-red-600"/> :
             game.id === 'roulette' ? <Disc size={24} className="text-cyan-600"/> :
             <Dice5 size={24} className={activeGame === game.id ? 'text-blue-500' : 'text-gray-400'} />}
            {game.name}
          </button>
        ))}
      </div>

      {activeGame && !['sicbo', 'littlemary', 'slots', 'blackjack', 'baccarat', 'roulette'].includes(activeGame) && (
        <div className="bg-gray-50 p-8 rounded-xl text-center border border-gray-200 shadow-inner relative overflow-hidden">
          <h3 className="text-xl font-bold mb-6 text-gray-800">正在遊玩: {GAMBLING_GAMES.find(g=>g.id===activeGame)?.name}</h3>
          
          <div className="flex justify-center items-center gap-4 mb-8">
            <label className="font-medium text-gray-700">下注積分:</label>
            <input 
              type="number" 
              min="10"
              value={betAmount} 
              onChange={(e) => setBetAmount(Math.max(0, Number(e.target.value)))}
              className="p-3 border border-gray-300 rounded-lg w-40 text-center text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              disabled={isSpinning}
            />
          </div>

          <button 
            onClick={() => handleSimplePlay(activeGame)}
            disabled={isSpinning}
            className={`
              px-10 py-4 rounded-full font-bold text-lg shadow-lg transform transition-all
              ${isSpinning 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white hover:scale-105 active:scale-95'
              }
            `}
          >
            {isSpinning ? '遊戲進行中...' : '開始遊戲 (扣除積分)'}
          </button>

          {result && (
            <div className={`mt-6 p-4 rounded-lg shadow-sm text-lg font-bold animate-bounce ${result.includes('恭喜') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {result}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
