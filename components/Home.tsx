
import React, { useRef, useEffect } from 'react';
import { Page } from '../types';
import { translations } from '../translations';

interface HomeProps {
  onNavigate: (page: Page) => void;
  lang: 'en' | 'rw';
  scrollTarget?: string;
  demos: any[];
}

const Home: React.FC<HomeProps> = ({ onNavigate, lang, scrollTarget, demos }) => {
  const t = translations[lang];
  const demosRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (scrollTarget === 'demos' && demosRef.current) {
      demosRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [scrollTarget]);

  return (
    <div className="min-h-full bg-black text-white relative">
      <div className="max-w-7xl mx-auto px-8 lg:px-20 py-16 lg:py-24 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 mb-24">
          <div className="flex-1 text-left space-y-8">
            <div className="space-y-2">
              <h1 className="text-5xl lg:text-7xl font-black leading-none tracking-tighter uppercase">
                ESHULI<br /><span className="text-[#A3E635]">{t.technology}</span><br />LTD
              </h1>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (<div key={i} className="w-10 h-10 bg-[#A3E635] rounded-md shadow-lg shadow-[#A3E635]/10"></div>))}
            </div>
            <div className="space-y-4">
              <p className="text-3xl lg:text-4xl font-black tracking-tight leading-tight">{t.inspire}<br />{t.transform}<br /><span className="text-[#A3E635]">{t.technology}</span></p>
            </div>
            <div className="grid grid-cols-2 gap-10 pt-6">
              <div className="group cursor-pointer">
                <p className="text-[#A3E635] text-[9px] font-black uppercase tracking-[0.3em] mb-2 group-hover:translate-x-1 transition-transform">{t.online_campus}</p>
                <p className="text-sm font-black uppercase tracking-tight">{t.secure_portal}</p>
              </div>
              <div className="group cursor-pointer">
                <p className="text-[#A3E635] text-[9px] font-black uppercase tracking-[0.3em] mb-2 group-hover:translate-x-1 transition-transform">{t.physical_center}</p>
                <p className="text-sm font-black uppercase tracking-tight">{t.hands_on}</p>
              </div>
            </div>
          </div>
          <div className="flex-1 relative w-full max-w-xl">
            <div className="relative rounded-[50px] overflow-hidden border border-white/5 group shadow-2xl">
               <img src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=1200" alt="Electronics Lab" className="w-full aspect-[4/5] object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000" />
               <div className="absolute top-8 right-8 w-32 h-32 bg-[#A3E635] rounded-full shadow-2xl flex flex-col items-center justify-center p-4 text-center rotate-12 group-hover:rotate-0 transition-all duration-700">
                 <p className="text-[8px] font-black text-black leading-none uppercase tracking-widest mb-2">ESHULI TV</p>
                 <div className="bg-red-600 w-10 h-8 rounded-lg flex items-center justify-center shadow-lg mb-2"><svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></div>
                 <p className="text-[8px] font-black text-black leading-none uppercase tracking-widest">COLLEGE</p>
               </div>
               <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
            </div>
          </div>
        </div>
        <section ref={demosRef} id="demos" className="mt-20 scroll-mt-24">
          <div className="flex justify-between items-end mb-10">
            <div><h2 className="text-2xl font-black uppercase tracking-tighter">{t.lesson_demos}</h2><p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-2">Latest from Eshuli TV</p></div>
            <a href="https://www.youtube.com/@eshulitv4016" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#A3E635]/10 border border-[#A3E635]/20 px-4 py-2 rounded-full text-[9px] font-black text-[#A3E635] hover:bg-[#A3E635] hover:text-black transition-all"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>{t.watch_on_youtube}</a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {demos.map((demo, idx) => (
              <a key={idx} href={demo.url} target="_blank" rel="noopener noreferrer" className="group relative bg-[#0a0a0a] border border-white/5 rounded-[35px] overflow-hidden shadow-2xl hover:border-[#A3E635]/30 transition-all duration-500">
                <div className="aspect-video relative overflow-hidden">
                  <img src={demo.image} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                  <div className="absolute inset-0 flex items-center justify-center"><div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-125 group-hover:bg-[#A3E635] transition-all duration-500"><svg className="w-5 h-5 text-white group-hover:text-black fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></div></div>
                  <div className="absolute top-4 left-4"><span className="text-[7px] font-black uppercase tracking-[0.2em] bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">{demo.category}</span></div>
                </div>
                <div className="p-6"><h3 className="text-lg font-black uppercase tracking-tight group-hover:text-[#A3E635] transition-colors">{demo.title}</h3><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Eshuli TV Channel</p></div>
              </a>
            ))}
          </div>
        </section>
      </div>
      <div className="fixed top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#A3E635]/5 blur-[150px] rounded-full pointer-events-none z-0"></div>
    </div>
  );
};

export default Home;
