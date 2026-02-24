
import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AdminSettingsProps {
  lang: 'en' | 'rw';
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ lang }) => {
  const [regPeriod, setRegPeriod] = useState({ startDate: '', endDate: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const t = {
    en: {
      title: "Admin Settings",
      reg_period: "Registration Period",
      start_date: "Start Date",
      end_date: "End Date",
      save: "Save Settings",
      saving: "Saving...",
      success: "Settings saved successfully!",
      error: "Error saving settings."
    },
    rw: {
      title: "Igenamiterere rya Admin",
      reg_period: "Igihe cyo Kwiyandikisha",
      start_date: "Itariki Itangiriraho",
      end_date: "Itariki Irangiriraho",
      save: "Bika Igenamiterere",
      saving: "Birabikwa...",
      success: "Igenamiterere ryabitswe neza!",
      error: "Habaye ikibazo mu kubika."
    }
  }[lang];

  useEffect(() => {
    const fetchSettings = async () => {
      const docRef = doc(db, 'settings', 'registration');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setRegPeriod(docSnap.data() as { startDate: string; endDate: string });
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      await setDoc(doc(db, 'settings', 'registration'), regPeriod);
      setMessage({ text: t.success, type: 'success' });
    } catch (err) {
      console.error(err);
      setMessage({ text: t.error, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 lg:p-16 max-w-4xl mx-auto">
      <div className="mb-12">
        <h2 className="text-3xl font-black uppercase tracking-tighter leading-none text-white">{t.title}</h2>
        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-3">System Configuration</p>
      </div>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] p-10 shadow-2xl">
        <h3 className="text-xl font-black text-[#A3E635] mb-8 uppercase tracking-tight flex items-center gap-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002-2z" />
          </svg>
          {t.reg_period}
        </h3>

        <form onSubmit={handleSave} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500 ml-2 tracking-widest">{t.start_date}</label>
              <input 
                type="date" 
                value={regPeriod.startDate}
                onChange={(e) => setRegPeriod({ ...regPeriod, startDate: e.target.value })}
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] text-white outline-none focus:border-[#A3E635] transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500 ml-2 tracking-widest">{t.end_date}</label>
              <input 
                type="date" 
                value={regPeriod.endDate}
                onChange={(e) => setRegPeriod({ ...regPeriod, endDate: e.target.value })}
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] text-white outline-none focus:border-[#A3E635] transition-all"
                required
              />
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-2xl text-[10px] font-bold text-center ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
              {message.text}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full bg-white text-black p-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-[#A3E635] transition-all duration-300 shadow-xl disabled:opacity-50"
          >
            {isSaving ? t.saving : t.save}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;
