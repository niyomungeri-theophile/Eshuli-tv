
import React from 'react';
import { translations } from '../translations';

interface CoursesProps {
  lang: 'en' | 'rw';
  courses: any[];
}

const Courses: React.FC<CoursesProps> = ({ lang, courses }) => {
  const t = translations[lang];

  return (
    <div className="p-6 lg:p-16 max-w-7xl mx-auto">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter">{t.faculty}</h2>
        <p className="text-gray-400 text-sm max-w-xl mx-auto leading-relaxed">
          {lang === 'rw' ? 'Eshuli Technology itanga amahugurwa ashingiye ku myitozo (80%).' : 'Eshuli Technology provides industry-leading technical training.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {courses.map((course) => (
          <div key={course.id} className="group bg-[#0c0c0c] border border-white/5 rounded-[30px] overflow-hidden hover:border-[#A3E635]/20 transition-all duration-700 shadow-2xl flex flex-col">
            <div className="aspect-[16/10] overflow-hidden relative">
              <img 
                src={course.image} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale opacity-80" 
                alt={course.title}
              />
              <div className="absolute top-3 left-3">
                <span className="text-[7px] font-black text-black uppercase tracking-widest bg-[#A3E635] px-2 py-1 rounded-full shadow-lg">
                  {course.category}
                </span>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-xl font-black mb-2 group-hover:text-[#A3E635] transition-colors leading-tight uppercase tracking-tighter">
                {course.title}
              </h3>
              <p className="text-gray-500 text-[10px] leading-relaxed mb-6 flex-1">
                {course.description}
              </p>
              <button className="w-full py-3 rounded-lg border border-white/10 font-black text-[8px] uppercase tracking-[0.2em] text-white hover:bg-[#A3E635] hover:text-black transition-all">
                {t.details}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Courses;
