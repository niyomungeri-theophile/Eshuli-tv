
import React from 'react';
import { translations } from '../translations';

interface AboutProps {
  lang: 'en' | 'rw';
}

const About: React.FC<AboutProps> = ({ lang }) => {
  const t = translations[lang];
  return (
    <div className="p-6 lg:p-16 max-w-7xl mx-auto space-y-16">
      <section className="relative">
        <div className="absolute -top-10 -left-10 w-48 h-48 bg-[#A3E635]/10 blur-3xl rounded-full pointer-events-none"></div>
        <h2 className="text-3xl lg:text-4xl font-black mb-4 uppercase tracking-tighter leading-tight">{t.source_of_knowledge}<br /><span className="text-[#A3E635]">{t.engine_of_progress}</span></h2>
        <p className="text-gray-400 text-sm lg:text-base max-w-xl leading-relaxed font-medium">{lang === 'rw' ? 'Eshuli Technology Ltd ni kigo cy’icyitegererezo mu Rwanda kigisha uburyo bwo gukora ibikoresho by’ikoranabuhanga nka TV, Embedded systems n’ubugeni muri mudasobwa.' : 'Eshuli Technology Ltd is Rwanda\'s leading technical college specializing in hands-on electronics repair, embedded systems engineering, and creative graphic design.'}</p>
      </section>
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ label: lang === 'rw' ? 'Kwiga mu Myitozo' : 'Practical Learning', value: '80%' }, { label: lang === 'rw' ? 'Abanyeshuri Bacyaka' : 'Student Success', value: '500+' }, { label: lang === 'rw' ? 'Uburambe' : 'Years Experience', value: '10+' }, { label: 'Workshops', value: '24/7' }].map((stat, i) => (
          <div key={i} className="bg-[#111] p-4 rounded-[25px] border border-white/5 text-center"><p className="text-xl font-black text-[#A3E635] mb-1">{stat.value}</p><p className="text-[7px] text-gray-500 font-black uppercase tracking-[0.2em]">{stat.label}</p></div>
        ))}
      </section>
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#0c0c0c] p-6 rounded-[30px] border border-white/5 space-y-3"><div className="w-10 h-10 bg-[#A3E635] rounded-lg flex items-center justify-center mb-1"><svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div><h3 className="text-xl font-black uppercase tracking-tight">{t.mission}</h3><p className="text-gray-400 text-xs leading-relaxed">{lang === 'rw' ? 'Guha imbaraga abakozi n’abashakashatsi b’ejo hazaza binyuze mu burezi bufatika kandi buhuye n’isoko mpuzamahanga.' : 'To empower the next generation of technicians and engineers in Rwanda by providing high-quality, practical technology education.'}</p></div>
        <div className="bg-[#0c0c0c] p-6 rounded-[30px] border border-white/5 space-y-3"><div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-1"><svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div><h3 className="text-xl font-black uppercase tracking-tight">{t.vision}</h3><p className="text-gray-400 text-xs leading-relaxed">{lang === 'rw' ? 'Kuba moteri y’iterambere ry’ikoranabuhanga muri Afurika y’Iburasirazuba.' : 'To be the engine of technological progress in East Africa, transforming students into innovators.'}</p></div>
      </section>
    </div>
  );
};

export default About;
