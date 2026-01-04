
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Copy, Globe, MessageCircle, Twitter, FileText } from 'lucide-react';

const TokenPage: React.FC = () => {
  const navigate = useNavigate();

  const copyAddress = () => {
    navigator.clipboard.writeText("B5wYCjComoHbf8CMq5nonhScdi1njuweoytS77QyXW1z");
    alert("Token Address Copied!");
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-hker-red selection:text-white pb-20">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-hker-red/30 px-6 py-4 flex justify-between items-center">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:text-hker-yellow transition font-bold text-sm">
          <ArrowLeft size={18} /> BACK
        </button>
        <div className="text-2xl font-black text-hker-yellow tracking-widest flex items-center gap-2">
            <span className="text-hker-red">HKER</span> TOKEN
        </div>
        <div className="w-16"></div> {/* Spacer */}
      </nav>

      {/* Hero Section with Lion Rock Night View */}
      <header className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background Image: Lion Rock Night / Hong Kong Night */}
        <div className="absolute inset-0 z-0">
             <img 
                src="https://images.unsplash.com/photo-1558273618-6225a075d58c?q=80&w=2500&auto=format&fit=crop" 
                alt="Lion Rock Spirit" 
                className="w-full h-full object-cover opacity-40"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30"></div>
        </div>

        <div className="max-w-4xl mx-auto z-10 relative text-center px-6">
          {/* Logo Container (Simulating the Red Coin Logo) */}
          <div className="relative inline-block mb-10 group cursor-pointer">
             <div className="absolute inset-0 bg-hker-red blur-[60px] opacity-50 rounded-full group-hover:opacity-70 transition duration-700"></div>
             
             {/* CSS Constructed Logo based on Red Coin Image */}
             <div className="w-56 h-56 mx-auto rounded-full bg-[#D32F2F] border-[6px] border-[#C5A000] shadow-2xl flex flex-col items-center justify-center relative overflow-hidden transform group-hover:scale-105 transition duration-500 ring-4 ring-black/50">
                {/* Mountain Silhouette */}
                <div className="absolute bottom-16 w-full h-24">
                   <svg viewBox="0 0 100 50" className="w-full h-full fill-none stroke-[#FFD700] stroke-[3]" style={{filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.5))'}}>
                      <path d="M10,50 Q30,20 40,30 T60,25 T90,50" />
                   </svg>
                </div>
                {/* HKER Text */}
                <div className="relative z-10 mt-6">
                    <div className="text-white text-7xl font-bold tracking-tighter" style={{fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif', textShadow: '2px 2px 0px #000'}}>HKER</div>
                </div>
                {/* Texture Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/20 pointer-events-none rounded-full"></div>
             </div>
          </div>
          
          <h1 className="text-6xl md:text-9xl font-black mb-6 text-white tracking-tighter drop-shadow-lg leading-tight">
            獅子山<span className="text-hker-red">精神</span>
          </h1>
          <p className="text-xl md:text-3xl text-hker-yellow mb-10 font-light tracking-widest uppercase">
            Hongkongers Token
          </p>
          
          <div className="flex flex-col md:flex-row justify-center gap-4 mb-16">
            <a href="https://jup.ag/tokens/B5wYCjComoHbf8CMq5nonhScdi1njuweoytS77QyXW1z" target="_blank" rel="noreferrer" className="bg-hker-yellow text-black font-black py-4 px-10 rounded-full hover:bg-white hover:scale-105 transition flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,215,0,0.3)] text-lg">
              Trade on Jupiter <ExternalLink size={20} />
            </a>
            <button onClick={copyAddress} className="bg-white/10 backdrop-blur border border-white/30 text-white py-4 px-10 rounded-full hover:bg-white/20 transition flex items-center justify-center gap-2 font-mono text-sm">
              <span className="truncate max-w-[150px] md:max-w-none text-hker-yellow">B5wYC...QyXW1z</span> <Copy size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto text-sm font-bold tracking-widest text-gray-400">
             <div className="border-r border-gray-700 last:border-0">UNITY</div>
             <div className="border-r border-gray-700 last:border-0">FREEDOM</div>
             <div className="border-r border-gray-700 last:border-0">COURAGE</div>
             <div>PRIDE</div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-gray-500">
            <div className="w-0.5 h-16 bg-gradient-to-b from-transparent to-hker-yellow"></div>
        </div>
      </header>

      {/* Liquidity Pools Section */}
      <section className="py-16 bg-[#111] border-y border-gray-900">
        <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-8">
                {/* Orca */}
                <a href="https://www.orca.so/pools/6anyfgQ2G9WgeCEh3XBfrzmLLKgb2WVvW5HAsQgb2Bss" target="_blank" rel="noreferrer" className="group bg-black border border-gray-800 p-8 rounded-2xl hover:border-hker-yellow transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-20 bg-hker-yellow opacity-5 blur-3xl rounded-full group-hover:opacity-10 transition"></div>
                    <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                        <span className="text-hker-yellow">◈</span> Orca Liquidity Pool
                    </h3>
                    <p className="text-gray-400 text-sm">Trade and provide liquidity on Solana's most user-friendly DEX.</p>
                </a>
                
                {/* Raydium */}
                <a href="https://raydium.io/liquidity-pools/?token=B5wYCjComoHbf8CMq5nonhScdi1njuweoytS77QyXW1z" target="_blank" rel="noreferrer" className="group bg-black border border-gray-800 p-8 rounded-2xl hover:border-purple-500 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-20 bg-purple-600 opacity-5 blur-3xl rounded-full group-hover:opacity-10 transition"></div>
                    <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                        <span className="text-purple-500">◈</span> Raydium Liquidity Pool
                    </h3>
                    <p className="text-gray-400 text-sm">Join the ecosystem on the premier AMM for the Solana blockchain.</p>
                </a>
            </div>
        </div>
      </section>

      {/* Core Content */}
      <section className="py-24 px-6 relative">
        <div className="max-w-4xl mx-auto space-y-24">
          
          {/* Item 1 */}
          <div className="group">
             <div className="text-hker-red font-black text-8xl opacity-10 mb-[-40px] ml-[-20px] select-none group-hover:opacity-20 transition">01</div>
             <div className="relative z-10 pl-6 border-l-4 border-hker-yellow">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Memorabilia Collection</h2>
                <p className="text-gray-300 leading-relaxed text-lg md:text-xl font-light">
                    HKER (Hongkongers Token) is a project initiated by the Hong Kong community. 
                    Inspired by the <strong className="text-hker-yellow">"Lion Rock Spirit,"</strong> it promotes a digital symbol of unity, freedom, and creativity among Hong Kong people.
                </p>
                <p className="text-gray-400 mt-4 leading-relaxed">
                    This is not a transactional currency, but a symbol of community spirit and culture. 
                    We hope to connect Hong Kong people around the world through Web3 and build our own values ​​and stories together.
                </p>
             </div>
          </div>

          {/* Item 2 */}
          <div className="group text-right">
             <div className="text-hker-red font-black text-8xl opacity-10 mb-[-40px] mr-[-20px] select-none group-hover:opacity-20 transition">02</div>
             <div className="relative z-10 pr-6 border-r-4 border-hker-yellow">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Coin Design</h2>
                <p className="text-gray-300 leading-relaxed text-lg md:text-xl font-light">
                    Enduring Lion Rock spirit for future generations, HKER is more than a token — 
                    it’s the blockchain embodiment of <strong className="text-hker-yellow">Hong Kong’s identity.</strong>
                </p>
                <p className="text-gray-400 mt-4 leading-relaxed">
                    A symbol of courage, unity, and pride that will live on forever in the world of Web3.
                </p>
             </div>
          </div>

          {/* Item 3 */}
          <div className="group">
             <div className="text-hker-red font-black text-8xl opacity-10 mb-[-40px] ml-[-20px] select-none group-hover:opacity-20 transition">03</div>
             <div className="relative z-10 pl-6 border-l-4 border-hker-yellow">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Lion Rock Spirit Meme Coin</h2>
                <p className="text-gray-300 leading-relaxed text-lg md:text-xl font-light">
                    The Lion Rock spirit embodies Hong Kong’s unity, resilience, and collective strength to overcome challenges, inspiring generations to cherish these values.
                </p>
                <p className="text-gray-400 mt-4 leading-relaxed">
                    This commemorative coin celebrates Hong Kong’s true population and the enduring Lion Rock spirit, ensuring its legacy for future generations.
                </p>
             </div>
          </div>

        </div>
      </section>

      {/* Tokenomics & Info Card */}
      <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto bg-[#0a0a0a] rounded-3xl p-8 md:p-12 border border-gray-800 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-hker-red opacity-10 blur-[100px]"></div>
              
              <div className="relative z-10">
                  <h2 className="text-3xl font-bold text-white mb-10 border-b border-gray-800 pb-6 flex items-center gap-3">
                      <span className="text-4xl">🦁</span> Token Information
                  </h2>
                  
                  <div className="grid md:grid-cols-2 gap-12">
                      <div className="space-y-6">
                          <div>
                              <div className="text-xs font-bold text-hker-red uppercase tracking-widest mb-1">Token Name</div>
                              <div className="text-2xl font-bold text-white">HKER (HongKongers Token)</div>
                          </div>
                          <div>
                              <div className="text-xs font-bold text-hker-red uppercase tracking-widest mb-1">Blockchain</div>
                              <div className="text-xl text-white">Solana</div>
                              <div className="text-xs text-gray-500 mt-1">Fast, Secure, Low-Fee</div>
                          </div>
                          <div>
                              <div className="text-xs font-bold text-hker-red uppercase tracking-widest mb-1">Official Website</div>
                              <a href="https://www.hker.ch/" target="_blank" className="text-xl text-hker-yellow hover:underline">www.hker.ch</a>
                          </div>
                      </div>

                      <div className="space-y-6">
                           <div>
                              <div className="text-xs font-bold text-hker-red uppercase tracking-widest mb-1">Total Supply</div>
                              <div className="text-3xl font-mono font-bold text-white tracking-tight">6,499,545,072 <span className="text-lg text-gray-500">HKER</span></div>
                          </div>
                          <div>
                              <div className="text-xs font-bold text-hker-red uppercase tracking-widest mb-1">Contract Address</div>
                              <div className="bg-gray-900 p-4 rounded-xl flex items-center justify-between group cursor-pointer border border-gray-800 hover:border-hker-yellow/50 transition" onClick={copyAddress}>
                                  <span className="font-mono text-gray-300 text-xs break-all mr-2">B5wYCjComoHbf8CMq5nonhScdi1njuweoytS77QyXW1z</span>
                                  <Copy size={16} className="text-hker-yellow shrink-0" />
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Core Values Footer */}
                  <div className="mt-12 pt-8 border-t border-gray-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="p-4 bg-gray-900/50 rounded-xl">
                          <div className="text-2xl mb-2">🦁</div>
                          <div className="text-xs font-bold text-gray-400">CULTURAL LEGACY</div>
                      </div>
                      <div className="p-4 bg-gray-900/50 rounded-xl">
                          <div className="text-2xl mb-2">💎</div>
                          <div className="text-xs font-bold text-gray-400">COMMUNITY DRIVEN</div>
                      </div>
                      <div className="p-4 bg-gray-900/50 rounded-xl">
                          <div className="text-2xl mb-2">⚡</div>
                          <div className="text-xs font-bold text-gray-400">SOLANA SPEED</div>
                      </div>
                      <div className="p-4 bg-gray-900/50 rounded-xl">
                          <div className="text-2xl mb-2">🌏</div>
                          <div className="text-xs font-bold text-gray-400">RESILIENCE</div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-16 text-center border-t border-gray-900">
          <div className="max-w-4xl mx-auto px-6">
              <div className="flex justify-center gap-8 mb-8">
                  <a href="#" className="p-3 bg-gray-900 rounded-full hover:bg-hker-yellow hover:text-black transition"><Globe size={20}/></a>
                  <a href="#" className="p-3 bg-gray-900 rounded-full hover:bg-[#0088cc] hover:text-white transition"><MessageCircle size={20}/></a>
                  <a href="#" className="p-3 bg-gray-900 rounded-full hover:bg-black hover:text-white border border-gray-800 transition"><Twitter size={20}/></a>
                  <a href="#" className="p-3 bg-gray-900 rounded-full hover:bg-green-600 hover:text-white transition"><FileText size={20}/></a>
              </div>
              <p className="text-gray-600 text-sm">
                HKER is a community project. Not financial advice. <br/>
                Email: hkerstoken@gmail.com
              </p>
          </div>
      </footer>
    </div>
  );
};

export default TokenPage;
