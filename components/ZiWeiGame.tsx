
import React, { useState } from 'react';
import { Solar } from 'lunar-javascript';
import { RefreshCw, Compass } from 'lucide-react';

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
        return (2 + lunar_day + bureau) % 12; // Simplified
    }
    place_major_stars(ziwei_index: number) {
        const placements: Record<number, string[]> = {};
        for (let i = 0; i < 12; i++) placements[i] = [];
        placements[ziwei_index].push("紫微");
        placements[(ziwei_index + 11) % 12].push("天機");
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
        if(!dateTime) return alert("請輸入出生日期時間");
        
        const d = new Date(dateTime);
        const solar = Solar.fromYmdHms(d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), 0);
        const lunar = solar.getLunar();

        const mingIndex = engine.get_ming_gong(lunar.getMonth(), ZHI_NAMES.indexOf(lunar.getTimeZhi()));
        const bureau = engine.get_wuxing_ju(GAN_NAMES.indexOf(lunar.getYearGan()), mingIndex);
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
        <div className="bg-slate-900 rounded-xl p-6 shadow-2xl border border-slate-700 min-h-[500px] text-slate-200 font-sans max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                <h2 className="text-2xl font-bold text-purple-400 flex items-center gap-2">
                    <Compass className="animate-spin-slow"/> 紫微斗數
                </h2>
                {gameState === 'RESULT' && (
                    <button onClick={() => setGameState('INPUT')} className="text-sm flex items-center hover:text-white">
                        <RefreshCw size={14} className="mr-1"/> 重排
                    </button>
                )}
            </div>

            {gameState === 'INPUT' && (
                <div className="flex flex-col items-center justify-center py-10">
                    <div className="bg-slate-800 p-8 rounded-2xl border border-slate-600 shadow-xl w-full max-w-md">
                        <h3 className="text-xl font-bold mb-6 text-center text-white">輸入出生資料</h3>
                        <div className="space-y-4">
                            <label className="block text-sm text-slate-400 mb-2">日期與時間</label>
                            {/* Optimized for mobile input */}
                            <input 
                                type="datetime-local" 
                                value={dateTime}
                                onChange={(e) => setDateTime(e.target.value)}
                                className="w-full bg-white text-black rounded p-3 text-lg font-bold outline-none cursor-pointer"
                            />
                            <button 
                                onClick={processChart}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl shadow-lg mt-4"
                            >
                                開始排盤
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {gameState === 'RESULT' && result && (
                <div className="animate-fade-in">
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-600 mb-6 text-center">
                        <div className="text-xl font-bold text-white mb-2">{result.lunarStr}</div>
                        <div className="text-purple-400 font-bold">{result.mingGongName}宮 / {result.bureauName}</div>
                    </div>
                    {/* Simplified Result for Demo */}
                    <div className="text-center p-10 text-slate-400">
                        命宮主星: <span className="text-yellow-400 font-bold text-2xl">{result.mingStars.length > 0 ? result.mingStars[0] : '無正曜'}</span>
                    </div>
                </div>
            )}
        </div>
    );
};
