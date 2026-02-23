
import React, { useState } from 'react';
import { translations } from '../translations';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface ContactProps {
  lang: 'en' | 'rw';
}

const Contact: React.FC<ContactProps> = ({ lang }) => {
  const t = translations[lang];
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setIsSending(true);
    const formData = new FormData(form);
    
    try {
      await addDoc(collection(db, 'contact_messages'), {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message'),
        timestamp: serverTimestamp()
      });
      setSent(true);
      form.reset();
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const socialLinks = [
    { icon: "F", bg: "bg-blue-100", color: "text-blue-600", path: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" },
    { icon: "T", bg: "bg-cyan-100", color: "text-cyan-500", path: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" },
    { icon: "I", bg: "bg-pink-100", color: "text-pink-500", path: "M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M7.5 21h9a5 5 0 005-5V8a5 5 0 00-5-5h-9a5 5 0 00-5 5v8a5 5 0 005 5z" },
    { icon: "L", bg: "bg-blue-600", color: "text-white", path: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 2a2 2 0 110 4 2 2 0 010-4z" },
    { icon: "Y", bg: "bg-gray-100", color: "text-gray-600", path: "M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33zM9.75 15.02V8.48L15.45 11.75l-5.7 3.27z" }
  ];

  return (
    <div className="bg-[#f8f9fa] min-h-full py-12 px-6 lg:px-16 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="bg-[#3b46f1] rounded-2xl p-10 lg:p-14 text-white shadow-xl shadow-blue-500/10">
          <h1 className="text-4xl font-extrabold mb-6 tracking-tight">{t.get_in_touch}</h1>
          <p className="text-blue-50 text-base leading-relaxed max-w-2xl font-medium opacity-90">
            {t.contact_desc}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Section */}
          <div className="lg:col-span-7 bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="text-blue-500">
                <svg className="w-6 h-6 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#1e293b]">{t.send_message}</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {sent && (
                <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
                  {lang === 'rw' ? 'Ubutumwa bwanyu bwoherejwe neza!' : 'Your message has been sent successfully!'}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">{t.first_name}</label>
                  <input name="firstName" required type="text" placeholder="John" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-800" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">{t.last_name}</label>
                  <input name="lastName" required type="text" placeholder="Doe" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-800" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">{t.email}</label>
                <input name="email" required type="email" placeholder="you@example.com" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-800" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">{t.subject}</label>
                <div className="relative">
                  <select name="subject" required className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none text-gray-800">
                    <option value="">{t.select_subject}</option>
                    <option value="Technical Inquiry">Technical Inquiry</option>
                    <option value="Registration">Registration</option>
                    <option value="Partnership">Partnership</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">{t.your_message}</label>
                <textarea name="message" required placeholder="How can we help you?" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none h-40 resize-none text-gray-800"></textarea>
              </div>

              <button disabled={isSending} className="w-full bg-[#3b46f1] hover:bg-[#2a35d1] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50">
                <svg className="w-4 h-4 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                {isSending ? (lang === 'rw' ? 'Biracyoherezwa...' : 'Sending...') : t.send_message}
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 space-y-8">
            {/* Contact Details Card */}
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="text-blue-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-[#1e293b]">{t.contact_details}</h2>
              </div>

              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-0.5">Email</p>
                    <p className="text-sm font-semibold text-blue-600">info@eshuli.rw</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-0.5">Phone</p>
                    <p className="text-sm font-semibold text-[#1e293b]">+250 785 133 511</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Mon-Fri, 8am-5pm (GMT+2)</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-0.5">{t.headquarters}</p>
                    <p className="text-sm font-semibold text-[#1e293b]">Kigali Innovation City</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">KG 7 Avenue, Kigali, Rwanda</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Connect Card */}
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="text-blue-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-[#1e293b]">{t.connect_with_us}</h2>
              </div>

              <div className="flex flex-wrap gap-4">
                {socialLinks.map((social, i) => (
                  <button key={i} className={`w-12 h-12 ${social.bg} ${social.color} rounded-xl flex items-center justify-center hover:scale-110 transition-transform shadow-sm`}>
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d={social.path} />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
