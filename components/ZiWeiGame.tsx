
import React, { useState } from 'react';
import { Solar } from 'lunar-javascript';
import { RefreshCw, Compass, Info } from 'lucide-react';

const ZHI_NAMES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const GAN_NAMES = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

class ZiWeiEngine {
    get_ming_gong(month: number, hour_zhi_index: number) {
        return (2 + (month - 1) - hour_zhi_index + 12) % 12;
    }
    get_wuxing_ju(year_gan_index: number, ming_gong_index: number) {
        const tiger_gan_map = [2, 4, 6, 8, 0];
        const start_gan = tiger_gan_map[year_gan_index % 5];
        let dist = (ming_gong_index - 2);
        if (dist < 0) dist += 12;
        const ming_gan_index = (start_gan + dist) % 10;
        const lookup = [4, 2, 6, 5, 3];
        return lookup[(ming_gan_index + ming_gong_index) % 5];
    }
    get_ziwei_pos(lunar_day: number, bureau: number) {
        return (2 + lunar_day + bureau) % 12; // Simplified logic
    }
    place_major_stars(ziwei_index: number) {
        const placements: Record<number, string[]> = {};
        for (let i = 0; i < 12; i++) placements[i] = [];
        placements[ziwei_index].push("紫微");
        placements[(ziwei_index + 11) % 12].push("天機");
        placements[(ziwei_index + 9) % 12].push("太陽");
        placements[(ziwei_index + 8) % 12].push("武曲");
        placements[(ziwei_index + 7) % 12].push("天同");
        placements[(ziwei_index + 5) % 12].push("廉貞");
        return placements;
    }
}

type GameState = 'INPUT' | 'RESULT';

interface ChartResult {
    lunarStr: string;
    bazi: string;
    mingGongName: string;
    bureauName: string;
    mingStars: string[];
}

export const ZiWeiGame: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>('INPUT');
    const [dateTime, setDateTime] = useState("");
    const [result, setResult] = useState<ChartResult | null>(null);
    
    const engine = new ZiWeiEngine();

    const processChart = () => {
        if(!dateTime) return alert("請輸入出生日期時間以啟動排盤 (Enter birth date/time)");
        
        const d = new Date(dateTime);
        const solar = Solar.fromYmdHms(d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), 0);
        const lunar = solar.getLunar();

        const mingIndex = engine.get_ming_gong(lunar.getMonth(), ZHI_NAMES.indexOf(lunar.getTimeZhi()));
        const year_gan_idx = GAN_NAMES.indexOf(lunar.getYearGan());
        const bureau = engine.get_wuxing_ju(year_gan_idx, mingIndex);
        const starsLayout = engine.place_major_stars(engine.get_ziwei_pos(lunar.getDay(), bureau));
        
        const bureauNames: Record<number, string> = {2:"水二局", 3:"木三局", 4:"金四局", 5:"土五局", 6:"火六局"};

        setResult({
            lunarStr: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()} ${lunar.getTimeZhi()}時`,
            bazi: `${lunar.getYearInGanZhi()} ${lunar.getMonthInGanZhi()} ${lunar.getDayInGanZhi()} ${lunar.getTimeInGanZhi()}`,
            mingGongName: ZHI_NAMES[mingIndex],
            bureauName: bureauNames[bureau] || "金四局",
            mingStars: starsLayout[mingIndex] || []
        });

        setGameState('RESULT');
    };

    return (
        <div className="bg-slate-950 rounded-2xl p-6 md:p-8 shadow-2xl border-2 border-indigo-900/30 text-slate-200 font-sans max-w-5xl mx-auto relative overflow-hidden">
            
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                <Compass size={200} />
            </div>

            <div className="flex justify-between items-center mb-10 border-b border-indigo-900/50 pb-6 relative z-10">
                <h2 className="text-3xl font-black text-indigo-400 flex items-center gap-3 italic tracking-tighter">
                    <Compass className="animate-spin-slow text-indigo-500"/> 紫微斗數 (Zi Wei Astrology)
                </h2>
                {gameState === 'RESULT' && (
                    <button onClick={() => setGameState('INPUT')} className="bg-indigo-900/50 text-indigo-200 px-6 py-2 rounded-full font-black text-sm flex items-center hover:bg-indigo-800 transition shadow-lg">
                        <RefreshCw size={16} className="mr-2"/> 重新排盤
                    </button>
                )}
            </div>

            {gameState === 'INPUT' && (
                <div className="flex flex-col items-center justify-center py-12 relative z-10 animate-fade-in">
                    <div className="bg-slate-900 p-10 rounded-3xl border border-indigo-500/30 shadow-[0_0_50px_rgba(79,70,229,0.1)] w-full max-w-md">
                        <h3 className="text-xl font-black mb-8 text-center text-white border-b border-white/5 pb-4">初始化用戶星盤資料</h3>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-indigo-400 mb-2 uppercase tracking-widest">出生日期與時間 (Birth Epoch)</label>
                                {/* Native Picker for Mobile Efficiency - Req 58, 75 */}
                                <input 
                                    type="datetime-local" 
                                    value={dateTime}
                                    onChange={(e) => setDateTime(e.target.value)}
                                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-4 text-white text-lg font-black outline-none focus:border-indigo-500 transition-all cursor-pointer"
                                />
                            </div>
                            <button 
                                onClick={processChart}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all transform hover:scale-105 active:scale-95"
                            >
                                執行全自動排盤 (EXECUTE)
                            </button>
                            <div className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1 font-bold">
                               <Info size={10}/> 排盤邏輯由 AI 核心自動計算座標
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {gameState === 'RESULT' && result && (
                <div className="animate-fade-in relative z-10">
                    <div className="bg-indigo-900/20 p-8 rounded-3xl border-2 border-indigo-500/30 mb-8 text-center shadow-xl backdrop-blur-sm">
                        <div className="text-sm text-indigo-300 font-black mb-2 uppercase tracking-[0.3em]">Lunar Calendar Matrix</div>
                        <div className="text-3xl font-black text-white mb-4 drop-shadow-md">{result.lunarStr}</div>
                        <div className="flex justify-center gap-4 text-xs font-black">
                            <span className="bg-indigo-600 px-4 py-1.5 rounded-full shadow-lg">{result.mingGongName}宮 (Ming Gong)</span>
                            <span className="bg-slate-800 px-4 py-1.5 rounded-full border border-indigo-500/30">{result.bureauName}</span>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-slate-900 p-8 rounded-3xl border border-indigo-500/20 shadow-lg">
                           <h4 className="text-indigo-400 text-xs font-black uppercase mb-6 tracking-widest">命盤核心參數 (Bazi Matrix)</h4>
                           <div className="flex justify-around items-center">
                              {result.bazi.split(' ').map((part, i) => (
                                <div key={i} className="flex flex-col items-center">
                                   <div className="text-4xl font-black text-white mb-2 font-serif">{part}</div>
                                   <div className="text-[10px] text-slate-500 font-black">
                                     {['年', '月', '日', '時'][i]}
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                        
                        <div className="bg-slate-900 p-8 rounded-3xl border border-indigo-500/20 shadow-lg flex flex-col justify-center items-center text-center">
                           <h4 className="text-indigo-400 text-xs font-black uppercase mb-4 tracking-widest">命宮主星 (Primary Stars)</h4>
                           <div className="text-5xl font-black text-yellow-400 mb-4 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]">
                             {result.mingStars.length > 0 ? result.mingStars.join(' & ') : '無正曜'}
                           </div>
                           <p className="text-xs text-slate-400 leading-relaxed font-bold">
                             {result.mingStars.length > 0 
                               ? `系統偵測到 ${result.mingStars[0]} 星坐命，具有強大的架構力與開創性。建議保持核心邏輯穩定。`
                               : '命無正曜，適合採取分散式架構發展，應靈活應對外部變量。'
                             }
                           </p>
                        </div>
                    </div>

                    <div className="mt-8 p-6 bg-slate-900/50 rounded-2xl border border-white/5 text-[10px] text-slate-500 text-center font-bold">
                       ⚠️ 系統免責聲明：紫微斗數結果僅供娛樂與技術參考。AI 演算基於大數據模擬，不應視為現實生活決策之唯一依據。祝您系統運行順暢！
                    </div>
                </div>
            )}
        </div>
    );
};
