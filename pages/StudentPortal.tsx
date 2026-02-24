
import React, { useState, useRef, useEffect } from 'react';
import { auth } from '../services/firebase';
import { Mark } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface StudentPortalProps {
  lang: 'en' | 'rw';
  userData: any;
  marks: Mark[];
  privateLessons: any[];
  globalLessons?: any[];
  quizSubmissions: any[];
  marksVisibility: { semester1: boolean; semester2: boolean };
  onLogout: () => void;
}

const StudentPortal: React.FC<StudentPortalProps> = ({ 
  lang, 
  userData, 
  marks, 
  privateLessons, 
  globalLessons = [],
  quizSubmissions = [],
  marksVisibility = { semester1: true, semester2: true }, 
  onLogout 
}) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any | null>(null);
  const [quizState, setQuizState] = useState<{ current: number, answers: (number | string)[], finished: boolean } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [reviewMode, setReviewMode] = useState<boolean>(false);
  const [selectedSem, setSelectedSem] = useState(1);
  const proofRef = useRef<HTMLDivElement>(null);

  // Ensure marksVisibility is never null
  const visibility = marksVisibility || { semester1: true, semester2: true };

  const allLessons = [...privateLessons, ...globalLessons]
    .filter(l => {
      const published = l.isPublished !== false;
      const now = new Date();
      const scheduled = l.scheduledAt ? new Date(l.scheduledAt) <= now : true;
      return published && scheduled;
    })
    .sort((a, b) => {
      const dateA = a.created_at?.seconds || 0;
      const dateB = b.created_at?.seconds || 0;
      return dateB - dateA;
    });

  const submitQuiz = async () => {
    if (!selectedLesson || !quizState) return;
    
    try {
      const { db } = await import('../services/firebase');
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      
      const score = quizState.answers.filter((a, i) => {
        const q = selectedLesson.quiz[i];
        if (q.type === 'written') {
          return String(a || '').toLowerCase().trim() === String(q.correct).toLowerCase().trim();
        }
        return a === q.correct;
      }).length;

      await addDoc(collection(db, 'quiz_submissions'), {
        studentId: auth.currentUser?.uid,
        studentName: userData?.fullName || 'Unknown',
        lessonId: selectedLesson.id,
        lessonTitle: selectedLesson.title,
        answers: quizState.answers,
        quiz: selectedLesson.quiz,
        score,
        total: selectedLesson.quiz.length,
        submittedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving quiz submission:', error);
    }
    setQuizState({ ...quizState, finished: true });
    setTimeLeft(null);
  };

  useEffect(() => {
    let timer: any;
    if (timeLeft !== null && timeLeft > 0 && !quizState?.finished) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev !== null && prev <= 1) {
            clearInterval(timer);
            submitQuiz();
            return 0;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeLeft, quizState?.finished]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownloadPDF = async () => {
    if (!proofRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(proofRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Proof_of_Registration_${userData?.fullName?.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const t = {
    en: {
      welcome: "Welcome to your Eshuli Student Portal",
      admission_details: "Admission Details",
      reg_history: "Registration History",
      reg_num: "Registration Number",
      index_num: "Index Number",
      national_id: "National ID Number",
      name: "Name",
      email: "Email",
      college: "College",
      dept: "Department",
      program: "Program/Option",
      class_type: "Class Type",
      ac_year: "Ac. Year",
      year_study: "Year of Study",
      ac_status: "Ac. Status",
      date: "Date",
      newly_admitted: "Newly Admitted",
      logout: "Logout",
      academic_marks: "Academic Marks",
      proof_of_reg: "Proof of Registration",
      module: "Module",
      marks: "Marks",
      grade: "Grade",
      status: "Status",
      not_admitted: "You are not yet admitted. Please contact the administration."
    },
    rw: {
      welcome: "Murakaza neza kuri Portal y'Abanyeshuri ba Eshuli",
      admission_details: "Amakuru y'Ubwemererwe",
      reg_history: "Amateka yo Kwiyandikisha",
      reg_num: "Nimero yo Kwiyandikisha",
      index_num: "Index Number",
      national_id: "Indangamuntu",
      name: "Izina",
      email: "Imeri",
      college: "Koleji",
      dept: "Ishami",
      program: "Gahunda",
      class_type: "Ubwoko bw'Ishuri",
      ac_year: "Umwaka w'Ishuri",
      year_study: "Umwaka wo Kwiga",
      ac_status: "Imiterere",
      date: "Itariki",
      newly_admitted: "Mushya",
      logout: "Sohoka",
      academic_marks: "Amanota",
      proof_of_reg: "Icyemezo cyo Kwiyandikisha",
      module: "Isomo",
      marks: "Amanota",
      grade: "Icyiciro",
      status: "Imiterere",
      not_admitted: "Ntabwo uremerewa kwiga. Mwabaza ubuyobozi."
    }
  }[lang];

  const renderContent = () => {
    switch (activeTab) {
      case 'marks':
        const safeMarks = marks || [];
        const sem1Marks = safeMarks.filter(m => m.semester === 1);
        const sem2Marks = safeMarks.filter(m => m.semester === 2);

        const renderMarksTable = (semesterMarks: Mark[]) => {
          const totalMarks = semesterMarks.reduce((acc, m) => acc + (m.marks || 0), 0);
          const totalCredits = semesterMarks.reduce((acc, m) => acc + (m.credits || 0), 0);
          const averagePercentage = semesterMarks.length > 0 ? (totalMarks / (semesterMarks.length * 100)) * 100 : 0;

          return (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse bg-white">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="px-4 py-4 text-[11px] font-black uppercase text-gray-900 tracking-tight border border-gray-100">Module Code</th>
                    <th className="px-4 py-4 text-[11px] font-black uppercase text-gray-900 tracking-tight border border-gray-100">Module Name</th>
                    <th className="px-4 py-4 text-[11px] font-black uppercase text-gray-900 tracking-tight text-center border border-gray-100">Credits</th>
                    <th className="px-4 py-4 text-[11px] font-black uppercase text-gray-900 tracking-tight text-center border border-gray-100">Continous Assessement</th>
                    <th className="px-4 py-4 text-[11px] font-black uppercase text-gray-900 tracking-tight text-center border border-gray-100">Exams(Summative Assessement)</th>
                    <th className="px-4 py-4 text-[11px] font-black uppercase text-gray-900 tracking-tight text-center border border-gray-100">Total</th>
                    <th className="px-4 py-4 text-[11px] font-black uppercase text-gray-900 tracking-tight text-center border border-gray-100">2nd Attempt</th>
                    <th className="px-4 py-4 text-[11px] font-black uppercase text-gray-900 tracking-tight text-right border border-gray-100">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {semesterMarks.length > 0 ? (
                    <>
                      {semesterMarks.map((m, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 text-[11px] font-mono text-gray-600 border border-gray-100">{m.moduleCode || 'N/A'}</td>
                          <td className="px-4 py-4 text-[11px] font-medium text-gray-700 border border-gray-100">{m.module}</td>
                          <td className="px-4 py-4 text-[11px] text-center text-gray-600 border border-gray-100">{m.credits || 0}</td>
                          <td className="px-4 py-4 text-[11px] text-center text-gray-600 border border-gray-100">{m.continuousAssessment || 0}</td>
                          <td className="px-4 py-4 text-[11px] text-center text-gray-600 border border-gray-100">{m.examAssessment || 0}</td>
                          <td className="px-4 py-4 text-[11px] text-center font-bold text-gray-900 border border-gray-100">{m.marks}</td>
                          <td className="px-4 py-4 text-[11px] text-center text-gray-400 border border-gray-100">-</td>
                          <td className="px-4 py-4 text-right border border-gray-100">
                            <span className={`text-[11px] font-medium ${m.status === 'Passed' ? 'text-green-600' : 'text-red-600'}`}>
                              {m.status === 'Passed' ? 'Pass' : 'Fail'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {/* Summary Footer Row */}
                      <tr className="bg-gray-50/80 font-black">
                        <td colSpan={2} className="px-4 py-5 text-[11px] uppercase tracking-widest text-gray-900 border border-gray-100">Semester Summary</td>
                        <td className="px-4 py-5 text-[11px] text-center text-gray-900 border border-gray-100">{totalCredits}</td>
                        <td colSpan={2} className="px-4 py-5 text-[11px] text-right text-gray-500 font-medium border border-gray-100">Total Marks & Percentage:</td>
                        <td className="px-4 py-5 text-[11px] text-center text-blue-600 border border-gray-100">{totalMarks}</td>
                        <td colSpan={2} className="px-4 py-5 text-[12px] text-right text-blue-700 border border-gray-100">
                          <span className="bg-blue-100 px-3 py-1 rounded-full">{averagePercentage.toFixed(1)}%</span>
                        </td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400 italic text-xs">No marks published for this semester yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          );
        };

        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Breadcrumbs & Title */}
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-light text-gray-800">Academic Records</h1>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => setActiveTab('dashboard')}>Home</span>
                <span>/</span>
                <span className="text-gray-500">Marks Records</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-8 border-b border-gray-100">
                <div className="max-w-xs">
                  <label className="block text-[12px] font-bold text-gray-900 mb-2">Academic Year</label>
                  <div className="relative">
                    <select className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 appearance-none cursor-pointer text-gray-700">
                      <option>2025 - 2026</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-100 bg-gray-50/30">
                <button 
                  onClick={() => setSelectedSem(1)}
                  className={`px-10 py-5 text-sm font-medium transition-all relative border-r border-gray-100 ${selectedSem === 1 ? 'text-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                  Semester 1
                  {selectedSem === 1 && <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-500"></div>}
                </button>
                <button 
                  onClick={() => setSelectedSem(2)}
                  className={`px-10 py-5 text-sm font-medium transition-all relative border-r border-gray-100 ${selectedSem === 2 ? 'text-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                  Semester 2
                  {selectedSem === 2 && <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-500"></div>}
                </button>
                <button 
                  onClick={() => setSelectedSem(3)}
                  className={`px-10 py-5 text-sm font-medium transition-all relative border-r border-gray-100 ${selectedSem === 3 ? 'text-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                  Formative Assessments
                  {selectedSem === 3 && <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-500"></div>}
                </button>
                <div className="flex-1 border-b border-gray-100"></div>
              </div>

              <div className="p-6">
                {selectedSem === 1 ? (
                  visibility.semester1 ? renderMarksTable(sem1Marks) : (
                    <div className="flex items-center justify-center py-16">
                      <div className="bg-[#FFC107] text-gray-900 px-10 py-6 rounded-xl font-medium text-xl shadow-md border border-[#FFB300] animate-in zoom-in duration-300">
                        Marks not published Yet
                      </div>
                    </div>
                  )
                ) : selectedSem === 2 ? (
                  visibility.semester2 ? renderMarksTable(sem2Marks) : (
                    <div className="flex items-center justify-center py-16">
                      <div className="bg-[#FFC107] text-gray-900 px-10 py-6 rounded-xl font-medium text-xl shadow-md border border-[#FFB300] animate-in zoom-in duration-300">
                        Marks not published Yet
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center py-16">
                    <div className="bg-blue-50 text-blue-600 px-10 py-6 rounded-xl font-medium text-xl shadow-md border border-blue-100 animate-in zoom-in duration-300 flex flex-col items-center gap-4">
                      <p>View your Quiz results in the dedicated section</p>
                      <button 
                        onClick={() => setActiveTab('formative')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-blue-700 transition-all"
                      >
                        Go to Formative Assessments
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'formative':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-light text-gray-800">Formative Assessments</h1>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => setActiveTab('dashboard')}>Home</span>
                <span>/</span>
                <span className="text-gray-500">Formative Assessments</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 tracking-widest">Lesson / Assessment</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 tracking-widest text-center">Score</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 tracking-widest text-center">Total</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 tracking-widest text-center">Percentage</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 tracking-widest text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {quizSubmissions.length > 0 ? (
                        quizSubmissions.sort((a,b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0)).map((s) => (
                          <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-gray-900">{s.lessonTitle}</p>
                              <p className="text-[10px] text-gray-500 uppercase font-black">Formative Assessment</p>
                            </td>
                            <td className="px-6 py-4 text-center font-black text-blue-600">{s.score}</td>
                            <td className="px-6 py-4 text-center text-gray-500">{s.total}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                                (s.score / s.total) >= 0.5 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                              }`}>
                                {Math.round((s.score / s.total) * 100)}%
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-gray-500 text-xs">
                              {s.submittedAt?.toDate ? s.submittedAt.toDate().toLocaleDateString() : 'Recently'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-20 text-center text-gray-400 font-medium">No formative assessments found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      case 'private_lessons':
        if (selectedLesson) {
          return (
            <div className="space-y-8 animate-in fade-in duration-500">
              <button 
                onClick={() => { setSelectedLesson(null); setQuizState(null); }}
                className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest transition-colors mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Lessons
              </button>

              <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden">
                <div className="aspect-video bg-black relative">
                  {selectedLesson.type === 'video' || (selectedLesson.type === 'link' && selectedLesson.url.includes('embed')) ? (
                    <iframe 
                      src={selectedLesson.url} 
                      className="w-full h-full" 
                      allowFullScreen 
                      title={selectedLesson.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    ></iframe>
                  ) : selectedLesson.type === 'pdf' ? (
                    <iframe 
                      src={selectedLesson.url} 
                      className="w-full h-full" 
                      title={selectedLesson.title}
                    ></iframe>
                  ) : selectedLesson.type === 'audio' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50 p-12">
                      <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-indigo-200">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      </div>
                      <audio controls className="w-full max-w-md"><source src={selectedLesson.url} /></audio>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 p-12">
                      <svg className="w-24 h-24 text-gray-200 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <a 
                        href={selectedLesson.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform shadow-lg shadow-indigo-200"
                      >
                        Download / Open {selectedLesson.type === 'pdf' ? 'PDF' : 'File'}
                      </a>
                    </div>
                  )}
                </div>
                <div className="p-10">
                  <h2 className="text-3xl font-black text-gray-900 mb-4">{selectedLesson.title}</h2>
                  <p className="text-gray-600 leading-relaxed mb-8">{selectedLesson.description}</p>
                  
                  {selectedLesson.quiz && selectedLesson.quiz.length > 0 && !quizState && (
                    <button 
                      onClick={() => {
                        setQuizState({ current: 0, answers: [], finished: false });
                        if (selectedLesson.timeLimit) {
                          setTimeLeft(selectedLesson.timeLimit * 60);
                        }
                      }}
                      className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-xl shadow-indigo-100"
                    >
                      Take Lesson Quiz {selectedLesson.timeLimit ? `(${selectedLesson.timeLimit} min)` : ''}
                    </button>
                  )}

                  {quizState && !quizState.finished && (
                    <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Question {quizState.current + 1} of {selectedLesson.quiz.length}</span>
                          <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mt-1">
                            {selectedLesson.quiz[quizState.current].type === 'written' ? 'Written Answer Required' : 'Select the correct option'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          {timeLeft !== null && (
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black ${timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-indigo-100 text-indigo-600'}`}>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              {formatTime(timeLeft)}
                            </div>
                          )}
                          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-600 transition-all duration-500" 
                              style={{ width: `${((quizState.current + 1) / selectedLesson.quiz.length) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 mb-8">{selectedLesson.quiz[quizState.current].question}</h4>
                      
                      {selectedLesson.quiz[quizState.current].type === 'written' ? (
                        <div className="space-y-4">
                          <textarea 
                            value={quizState.answers[quizState.current] || ''}
                            onChange={(e) => {
                              const newAnswers = [...quizState.answers];
                              newAnswers[quizState.current] = e.target.value;
                              setQuizState({ ...quizState, answers: newAnswers });
                            }}
                            placeholder="Write your answer here..."
                            className="w-full bg-white border border-gray-200 rounded-2xl p-6 text-sm outline-none focus:border-indigo-600 h-32 resize-none text-gray-900"
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          {selectedLesson.quiz[quizState.current].options.map((opt: string, idx: number) => (
                            <button 
                              key={idx}
                              onClick={() => {
                                const newAnswers = [...quizState.answers];
                                newAnswers[quizState.current] = idx;
                                setQuizState({ ...quizState, answers: newAnswers });
                              }}
                              className={`w-full text-left p-5 border rounded-2xl transition-all font-medium ${
                                quizState.answers[quizState.current] === idx 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-600 hover:bg-indigo-50'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-200">
                        <button 
                          disabled={quizState.current === 0}
                          onClick={() => setQuizState({ ...quizState, current: quizState.current - 1 })}
                          className="px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-gray-200 text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          Previous
                        </button>
                        
                        <button 
                          disabled={quizState.answers[quizState.current] === undefined || quizState.answers[quizState.current] === ''}
                          onClick={() => {
                            if (quizState.current + 1 < selectedLesson.quiz.length) {
                              setQuizState({ ...quizState, current: quizState.current + 1 });
                            } else {
                              submitQuiz();
                            }
                          }}
                          className="px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 disabled:opacity-50"
                        >
                          {quizState.current + 1 < selectedLesson.quiz.length ? 'Next Question' : 'Finish Quiz'}
                        </button>
                      </div>
                    </div>
                  )}

                  {quizState?.finished && (
                    <div className="bg-indigo-600 rounded-3xl p-10 text-center text-white">
                      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <h4 className="text-3xl font-black uppercase tracking-tighter mb-2">Quiz Completed!</h4>
                      <p className="text-white/80 mb-8">You have successfully finished the lesson assessment.</p>
                      <div className="text-5xl font-black mb-8">
                        {quizState.answers.filter((a, i) => {
                          const q = selectedLesson.quiz[i];
                          if (q.type === 'written') {
                            return String(a).toLowerCase().trim() === String(q.correct).toLowerCase().trim();
                          }
                          return a === q.correct;
                        }).length} / {selectedLesson.quiz.length}
                      </div>
                      <div className="flex flex-col gap-4">
                        <button 
                          onClick={() => {
                            setQuizState(null);
                            setReviewMode(false);
                          }}
                          className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform"
                        >
                          Back to Lesson
                        </button>
                        {selectedLesson.allowReview && (
                          <button 
                            onClick={() => setReviewMode(true)}
                            className="bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform"
                          >
                            Review Results
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {reviewMode && quizState?.finished && (
                    <div className="mt-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xl font-black uppercase tracking-tighter text-gray-900">Review Your Answers</h4>
                        <button 
                          onClick={() => setReviewMode(false)}
                          className="text-indigo-600 font-bold text-xs uppercase tracking-widest"
                        >
                          Close Review
                        </button>
                      </div>
                      <div className="space-y-4">
                        {selectedLesson.quiz.map((q: any, idx: number) => {
                          const studentAnswer = quizState.answers[idx];
                          const isCorrect = q.type === 'written' 
                            ? String(studentAnswer || '').toLowerCase().trim() === String(q.correct).toLowerCase().trim()
                            : studentAnswer === q.correct;
                          
                          return (
                            <div key={idx} className={`p-6 rounded-2xl border ${isCorrect ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                              <p className="font-bold text-gray-900 mb-3">Q: {q.question}</p>
                              <div className="space-y-2 text-sm">
                                <p className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                                  <span className="font-black uppercase text-[10px] mr-2">Your Answer:</span>
                                  {q.type === 'multiple' ? q.options[studentAnswer as number] : studentAnswer}
                                </p>
                                {!isCorrect && (
                                  <p className="text-gray-600">
                                    <span className="font-black uppercase text-[10px] mr-2">Correct Answer:</span>
                                    {q.type === 'multiple' ? q.options[q.correct as number] : q.correct}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                <h3 className="text-white text-xl font-medium">My Course Content</h3>
                <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                  {allLessons.length} Items
                </span>
              </div>
              <div className="p-0">
                {allLessons.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 tracking-widest w-16">Type</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 tracking-widest">Lesson Details</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 tracking-widest hidden md:table-cell">Date</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 tracking-widest text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {allLessons.map((l) => (
                          <tr key={l.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => setSelectedLesson(l)}>
                            <td className="px-6 py-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                l.type === 'video' ? 'bg-red-50 text-red-600' :
                                l.type === 'audio' ? 'bg-blue-50 text-blue-600' :
                                l.type === 'pdf' ? 'bg-orange-50 text-orange-600' :
                                'bg-indigo-50 text-indigo-600'
                              }`}>
                                {l.type === 'video' ? (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                                ) : l.type === 'audio' ? (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                                ) : l.type === 'pdf' ? (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 mb-0.5">
                                <h4 className="font-bold text-gray-900 text-sm">{l.title}</h4>
                                {!l.studentId && (
                                  <span className="bg-amber-100 text-amber-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-widest">Global</span>
                                )}
                                {l.quiz && l.quiz.length > 0 && (
                                  <span className="bg-indigo-100 text-indigo-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-widest">Quiz</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 line-clamp-1">{l.description}</p>
                            </td>
                            <td className="px-6 py-4 hidden md:table-cell">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {l.created_at?.toDate ? l.created_at.toDate().toLocaleDateString() : 'Recently'}
                              </p>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
                              >
                                <span>Study</span>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <p className="text-gray-400 text-sm italic">No course content assigned to you yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'proof':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-4 md:p-12 flex flex-col items-center">
            {userData?.status === 'pending' ? (
              <div className="space-y-4 text-center">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium">{t.not_admitted}</p>
              </div>
            ) : (
              <>
                <div ref={proofRef} className="w-full max-w-[210mm] bg-white p-[20mm] border border-gray-100 shadow-2xl relative overflow-hidden text-black font-serif">
                  {/* Header Section */}
                  <div className="flex justify-between items-start border-b border-gray-300 pb-4 mb-4">
                    <div className="flex flex-col items-center">
                      <div className="w-24 h-24 bg-blue-900 rounded-lg flex items-center justify-center mb-2">
                        <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <p className="text-[10px] font-bold text-blue-900 uppercase tracking-tighter">ESHULI TV COLLEGE</p>
                    </div>
                    <div className="w-1/2">
                      <table className="w-full text-[11px] border-collapse">
                        <tbody>
                          <tr className="border-t border-gray-200">
                            <td className="py-1 text-gray-600">Website:</td>
                            <td className="py-1 font-medium text-right">www.eshuli.ac.rw</td>
                          </tr>
                          <tr className="border-t border-gray-200">
                            <td className="py-1 text-gray-600">Email:</td>
                            <td className="py-1 font-medium text-right">info@eshuli.ac.rw</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="text-center mb-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-1">Office of the Registrar</h2>
                    <h3 className="text-md font-bold text-gray-900 underline uppercase decoration-1 underline-offset-4">Proof of Registration</h3>
                  </div>

                  <div className="text-left space-y-4 text-[13px] leading-relaxed">
                    <p>This is to confirm that the student below has registered with the following details</p>
                    
                    <div className="space-y-2">
                      {[
                        { label: 'Student Names', value: userData?.fullName },
                        { label: 'Student ID', value: userData?.regNumber },
                        { label: 'College Name', value: 'Eshuli TV College' },
                        { label: 'Level of Study', value: 'Forth year' },
                        { label: 'Academic Year', value: '2025 - 2026' },
                        { label: 'Program Name', value: userData?.program || 'Bachelor of Technology in Electronics and Telecommunication Technology' },
                        { label: 'Department Name', value: userData?.department || 'Electrical and Electronics Engineering' },
                        { label: 'Study Mode', value: userData?.classType === 'Physical Class' ? 'Full Time' : 'Part Time' },
                        { label: 'Date of Registration', value: 'August 28, 2025' },
                        { label: 'Registration Fees paid', value: '57,000RWF' },
                        { label: 'Sponsor', value: 'Private' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start">
                          <span className="w-48 shrink-0 text-gray-700">{item.label}:</span>
                          <span className="font-bold text-gray-900">{item.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4">
                      <p>Kindly note that your school email is <span className="font-bold">{userData?.regNumber?.toLowerCase()}@stud.eshuli.ac.rw</span> and your default password is <span className="font-bold">myP@55Word@1234</span> and can be accessed through <a href="https://login.microsoftonline.com" className="text-blue-600 underline">https://login.microsoftonline.com</a></p>
                    </div>

                    <div className="pt-8">
                      <p>Sincerely</p>
                      
                      <div className="mt-4 relative">
                        {/* Mock Stamp/Seal */}
                        <div className="absolute -top-4 left-24 opacity-40 pointer-events-none">
                          <div className="w-32 h-32 border-4 border-blue-800 rounded-full flex items-center justify-center rotate-12">
                            <div className="text-center text-blue-800 font-bold text-[8px] uppercase leading-none">
                              <p>ESHULI TV COLLEGE</p>
                              <div className="w-full h-[1px] bg-blue-800 my-1"></div>
                              <p>OFFICIAL STAMP</p>
                              <div className="w-full h-[1px] bg-blue-800 my-1"></div>
                              <p>REGISTRAR</p>
                            </div>
                          </div>
                        </div>

                        {/* Mock Signature */}
                        <div className="mb-2">
                          <p className="font-serif italic text-2xl text-blue-900 opacity-80 select-none" style={{ fontFamily: "'Dancing Script', cursive" }}>
                            Theophile N.
                          </p>
                        </div>
                        
                        <div className="pt-2">
                          <p className="font-bold text-gray-900">NIYOMWUNGERI Theophile</p>
                          <p className="text-xs text-gray-600">Ag. Registrar - Eshuli TV College</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 w-full max-w-2xl flex justify-center">
                  <button 
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                    className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 flex items-center gap-3 disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Official PDF
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        );
      default:
        return (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            {/* Admission Details */}
            <div className="xl:col-span-3 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-[#26a69a] px-6 py-4">
                <h3 className="text-white text-xl font-medium">{t.admission_details}</h3>
              </div>
              <div className="p-8 space-y-4">
                {[
                  { label: t.reg_num, value: userData?.regNumber || "25ESH20741", bold: true },
                  { label: t.index_num, value: userData?.indexNumber || "21ESH03535", bold: true },
                  { label: t.national_id, value: userData?.nationalId || "1200080253186071", bold: true },
                  { label: t.name, value: userData?.fullName || "NIYOMWUNGERI Theophile", bold: true },
                  { label: t.email, value: userData?.email || "niyomungeritheophile02@gmail.com", bold: true },
                  { label: t.college, value: userData?.college || "Eshuli college", bold: true },
                  { label: t.dept, value: userData?.department || "Electrical and Electronics Engineering", bold: true },
                  { label: t.program, value: userData?.program || "Bachelor of Technology in Electronics and Telecommunication Technology", bold: true },
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                    <span className="text-gray-600 min-w-[180px]">{item.label}:</span>
                    <span className={`text-gray-800 ${item.bold ? 'font-bold' : ''}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Registration History */}
            <div className="xl:col-span-2 space-y-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="bg-[#007bff] px-6 py-4">
                  <h3 className="text-white text-xl font-medium">{t.reg_history}</h3>
                </div>
                <div className="p-6 flex-1">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-gray-700 font-bold border-b border-gray-200">
                        <tr>
                          <th className="pb-4 pr-4">{t.ac_year}</th>
                          <th className="pb-4 px-4">{t.year_study}</th>
                          <th className="pb-4 px-4">{t.ac_status}</th>
                          <th className="pb-4 pl-4">{t.date}</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-600">
                        <tr className="border-b border-gray-100 last:border-0">
                          <td className="py-4 pr-4">2025 - 2026</td>
                          <td className="py-4 px-4 flex items-center gap-2">
                            4
                            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                            </svg>
                          </td>
                          <td className="py-4 px-4">{t.newly_admitted}</td>
                          <td className="py-4 pl-4 whitespace-nowrap">2025-08-28</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* My Course Summary Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                  <h3 className="text-white text-xl font-medium">My Course</h3>
                  <button 
                    onClick={() => setActiveTab('private_lessons')}
                    className="text-white/80 hover:text-white text-[10px] font-bold uppercase tracking-widest border border-white/20 px-3 py-1 rounded-full transition-all"
                  >
                    View All
                  </button>
                </div>
                <div className="p-0">
                  {privateLessons.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {privateLessons.slice(0, 4).map((l) => (
                        <div 
                          key={l.id} 
                          className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-all group" 
                          onClick={() => setActiveTab('private_lessons')}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            l.type === 'video' ? 'bg-red-50 text-red-600' :
                            l.type === 'audio' ? 'bg-blue-50 text-blue-600' :
                            l.type === 'pdf' ? 'bg-orange-50 text-orange-600' :
                            'bg-indigo-50 text-indigo-600'
                          }`}>
                            {l.type === 'video' ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                            ) : l.type === 'audio' ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                            ) : l.type === 'pdf' ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-800 truncate group-hover:text-indigo-600 transition-colors">{l.title}</p>
                            <p className="text-[9px] text-gray-400 uppercase font-black tracking-tighter">{l.type}</p>
                          </div>
                          <svg className="w-3 h-3 text-gray-300 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-gray-400 text-xs italic">No course content assigned yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
          <h1 className="text-gray-600 font-medium">Welcome {userData?.college || 'Eshuli TV College'}</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="bg-gray-100 px-4 py-1.5 rounded text-gray-600 text-sm font-medium">
            2025 - 2026
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors text-sm font-medium"
          >
            {t.logout}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="absolute inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="w-64 h-full bg-white shadow-xl animate-in slide-in-from-left duration-300" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-100">
                <h2 className="font-bold text-gray-800 uppercase tracking-tight text-sm">Menu</h2>
              </div>
              <nav className="py-4">
                {[
                  { id: 'dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Dashboard' },
                  { id: 'private_lessons', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', label: 'My Course' },
                  { id: 'proof', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: t.proof_of_reg },
                  { id: 'marks', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: t.academic_marks },
                  { id: 'formative', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Formative Assessment' },
                ].map((item) => (
                  <button 
                    key={item.id} 
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-6 py-4 transition-colors text-sm font-bold ${activeTab === item.id ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 hidden lg:flex flex-col">
          <div className="p-6 flex flex-col items-center border-b border-gray-100">
            <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-4 border-gray-50 shadow-sm">
              <img 
                src="https://picsum.photos/seed/student/200" 
                alt="Profile" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <h2 className="font-bold text-gray-800 text-center text-sm uppercase tracking-tight">
              {userData?.fullName || 'NIYOMWUNGERI Theophile'}
            </h2>
          </div>
          <nav className="flex-1 overflow-y-auto py-4">
            {[
              { id: 'dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Dashboard' },
              { id: 'private_lessons', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', label: 'My Course' },
              { id: 'proof', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: t.proof_of_reg },
              { id: 'marks', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: t.academic_marks },
              { id: 'formative', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Formative Assessment' },
              { id: 'payments', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', label: 'Payments' },
              { id: 'security', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Security' },
            ].map((item) => (
              <button 
                key={item.id} 
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-6 py-3 transition-colors text-sm font-medium ${activeTab === item.id ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-light text-gray-700 mb-8">{t.welcome}</h2>
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentPortal;
