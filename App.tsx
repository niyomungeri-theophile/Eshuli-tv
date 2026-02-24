
import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Page, Lesson, Mark, ContactMessage } from './types';
import { translations } from './translations';
import { db, auth, storage } from './services/firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, doc, setDoc, getDoc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';

import Sidebar from './components/Sidebar';
import ChatBot from './components/ChatBot';
import Home from './components/Home';
import About from './components/About';
import Courses from './components/Courses';
import Contact from './components/Contact';
import AdminSettings from './components/AdminSettings';
import StudentPortal from './pages/StudentPortal';

const App: React.FC = () => {
  const [lang, setLang] = useState<'en' | 'rw'>(() => {
    const saved = localStorage.getItem('eshuli_lang');
    return (saved as 'en' | 'rw') || 'en';
  });

  const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [formRole, setFormRole] = useState<string>('student');
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const t = translations[lang];
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('eshuli_lang', lang);
  }, [lang]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [demos, setDemos] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [regSettings, setRegSettings] = useState<{ startDate: string; endDate: string } | null>(null);
  const [marksVisibility, setMarksVisibility] = useState<{ semester1: boolean; semester2: boolean }>({ semester1: true, semester2: true });
  const [privateLessons, setPrivateLessons] = useState<any[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<any[]>([]);
  const [editingSubmission, setEditingSubmission] = useState<{id: string, score: number} | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<any[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState<{question: string, type: 'multiple' | 'written', options: string[], correct: number | string}[]>([]);
  const [quizTimeLimit, setQuizTimeLimit] = useState<number>(0);
  const [allowQuizReview, setAllowQuizReview] = useState<boolean>(false);
  const [isGlobalLesson, setIsGlobalLesson] = useState<boolean>(false);
  const [isPublished, setIsPublished] = useState<boolean>(true);
  const [scheduledAt, setScheduledAt] = useState<string>('');

  const cleanYouTubeUrl = (url: string) => {
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) return url;
    let videoId = '';
    if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
    else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
    else if (url.includes('embed/')) videoId = url.split('embed/')[1].split('?')[0];
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&controls=1`;
    }
    return url;
  };

  useEffect(() => {
    const lessonsRef = collection(db, 'lessons');
    const coursesRef = collection(db, 'courses');
    const demosRef = collection(db, 'demos');

    const qLessons = query(lessonsRef, orderBy('created_at', 'desc'));

    const unsubscribeLessons = onSnapshot(qLessons, (snapshot) => {
      if (!snapshot.empty) {
        setLessons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson)));
      } else {
        const initial = [
          { title: lang === 'rw' ? 'Gukora TV Flat' : 'Introduction to Flat TV Repair', video_url: 'https://www.w3schools.com/html/mov_bbb.mp4', description: lang === 'rw' ? 'Iga ibice bigize TV za kijyambere nka LED na LCD.' : 'Learn the basic components of modern LED and LCD screens.', created_at: new Date().toISOString() },
          { title: lang === 'rw' ? 'Embedded Systems ya Arduino' : 'Embedded Systems with Arduino', video_url: 'https://www.w3schools.com/html/movie.mp4', description: lang === 'rw' ? 'Tangira kwiga microcontrollers n’ama circuits yoroshye.' : 'Getting started with microcontrollers and simple circuits.', created_at: new Date().toISOString() }
        ];
        initial.forEach(l => addDoc(lessonsRef, l));
      }
    });

    const unsubscribeCourses = onSnapshot(coursesRef, (snapshot) => {
      if (!snapshot.empty) {
        setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else {
        const initial = [
          { title: lang === 'rw' ? 'Gukora TV za Kijyambere' : 'Advanced Flat TV Repair', description: lang === 'rw' ? 'Iga byimbitse gukora LED, OLED na Smart TV. Master COF bonding na Panel repair.' : 'A comprehensive deep dive into LED, OLED, and Smart TV architecture.', category: 'Electronics', duration: '3 Months', image: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&q=80&w=800' },
          { title: lang === 'rw' ? 'Embedded Systems & IoT' : 'Embedded Systems & IoT', description: lang === 'rw' ? 'Andika code za hardware. Iga Arduino, ESP32 na Raspberry Pi.' : 'Learn to design and code hardware using Arduino, ESP32, and Raspberry Pi.', category: 'Embedded Systems', duration: '6 Months', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800' }
        ];
        initial.forEach(c => addDoc(coursesRef, c));
      }
    });

    const unsubscribeDemos = onSnapshot(demosRef, (snapshot) => {
      if (!snapshot.empty) {
        setDemos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else {
        const initial = [
          { title: t.repair_demo, image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80&w=400", category: "Electronics", url: "https://www.youtube.com/@eshulitv4016" },
          { title: t.embedded_demo, image: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&q=80&w=400", category: "Embedded", url: "https://www.youtube.com/@eshulitv4016" }
        ];
        initial.forEach(d => addDoc(demosRef, d));
      }
    });

    const unsubscribeStudents = onSnapshot(collection(db, 'users'), (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)).filter(u => u.role === 'student'));
    });

    const unsubscribeMarks = onSnapshot(collection(db, 'marks'), (snapshot) => {
      setMarks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mark)));
    });

    const unsubscribeRegSettings = onSnapshot(doc(db, 'settings', 'registration'), (snapshot) => {
      if (snapshot.exists()) {
        setRegSettings(snapshot.data() as { startDate: string; endDate: string });
      }
    });

    const unsubscribeMarksVisibility = onSnapshot(doc(db, 'settings', 'marks_visibility'), (snapshot) => {
      if (snapshot.exists()) {
        setMarksVisibility(snapshot.data() as { semester1: boolean; semester2: boolean });
      }
    });

    const unsubscribeMessages = onSnapshot(collection(db, 'contact_messages'), (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactMessage)));
    });

    const unsubscribePrivateLessons = onSnapshot(collection(db, 'private_lessons'), (snapshot) => {
      setPrivateLessons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubscribeQuizSubmissions = onSnapshot(collection(db, 'quiz_submissions'), (snapshot) => {
      setQuizSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeLessons();
      unsubscribeCourses();
      unsubscribeDemos();
      unsubscribeStudents();
      unsubscribeMarks();
      unsubscribeRegSettings();
      unsubscribeMarksVisibility();
      unsubscribeMessages();
      unsubscribePrivateLessons();
    };
  }, [lang]);

  const addLesson = async (newLesson: Omit<Lesson, 'id'>) => {
    try {
      await addDoc(collection(db, 'lessons'), {
        ...newLesson,
        created_at: serverTimestamp()
      });
    } catch (err) {
      console.error("Error adding lesson:", err);
    }
  };

  const filteredLessons = lessons.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         l.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (userRole === 'admin') return matchesSearch;
    
    // For students, only show published lessons
    const published = l.isPublished !== false; // Default to true for legacy
    const now = new Date();
    const scheduled = l.scheduledAt ? new Date(l.scheduledAt) <= now : true;
    
    return matchesSearch && published && scheduled;
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // First check hardcoded admin for safety
        if (user.email === 'niyomungeritheophile02@gmail.com') {
          setUserRole('admin');
          setUserData({ email: user.email, fullName: 'NIYOMWUNGERI Theophile', role: 'admin' });
          return;
        }

        // Fetch user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            setUserRole(data.role || 'student');
          } else {
            setUserData({ email: user.email, role: 'student' });
            setUserRole('student');
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
          setUserRole('student');
        }
      } else {
        setUserRole(null);
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Handle redirection after login/register
  useEffect(() => {
    if (userRole && (currentPage === Page.LOGIN || currentPage === Page.REGISTRATION)) {
      if (userRole === 'student') {
        setCurrentPage(Page.STUDENT_PORTAL);
      } else if (userRole === 'admin') {
        setCurrentPage(Page.ADMIN_SETTINGS);
      } else {
        setCurrentPage(Page.LESSONS);
      }
    }
  }, [userRole, currentPage]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Role-based redirection will happen in useEffect onAuthStateChanged
    } catch (err: any) {
      if (err.code === 'auth/network-request-failed') {
        setError(lang === 'rw' ? 'Ikibazo cy’itumanaho: Reba niba ufite internet.' : 'Network error: Please check your internet connection.');
      } else {
        setError(err.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string || 'student';
    
    // Student specific fields
    const regNumber = formData.get('regNumber') as string;
    const indexNumber = formData.get('indexNumber') as string;
    const nationalId = formData.get('nationalId') as string;
    const college = formData.get('college') as string;
    const department = formData.get('department') as string;
    const program = formData.get('program') as string;
    const classType = formData.get('classType') as string;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user data to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        fullName,
        email,
        role,
        regNumber,
        indexNumber,
        nationalId,
        college,
        department,
        program,
        classType,
        status: 'pending', // Default status
        created_at: serverTimestamp()
      });

      // Role-based redirection will happen in useEffect onAuthStateChanged
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentPage(Page.HOME);
  };

  const renderHeader = () => (
    <header className="px-8 py-5 flex items-center justify-end border-b border-white/5 bg-black/90 backdrop-blur-2xl sticky top-0 z-40">
      <div className="relative" ref={langRef}>
        <button 
          onClick={() => setShowLangDropdown(!showLangDropdown)}
          className="flex items-center gap-2 bg-[#0a0a0a] border border-white/10 px-5 py-2.5 rounded-full text-[9px] font-black tracking-[0.2em] text-white hover:border-[#A3E635]/30 transition-all"
        >
          {lang === 'en' ? 'ENGLISH' : 'KINYARWANDA'}
          <svg className={`w-3 h-3 transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showLangDropdown && (
          <div className="absolute right-0 mt-2 w-40 bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            <button 
              onClick={() => { setLang('en'); setShowLangDropdown(false); }}
              className={`w-full text-left px-4 py-3 text-[9px] font-black tracking-widest hover:bg-[#A3E635] hover:text-black transition-colors ${lang === 'en' ? 'text-[#A3E635]' : 'text-gray-400'}`}
            >
              ENGLISH
            </button>
            <button 
              onClick={() => { setLang('rw'); setShowLangDropdown(false); }}
              className={`w-full text-left px-4 py-3 text-[9px] font-black tracking-widest hover:bg-[#A3E635] hover:text-black transition-colors ${lang === 'rw' ? 'text-[#A3E635]' : 'text-gray-400'}`}
            >
              KINYARWANDA
            </button>
          </div>
        )}
      </div>
    </header>
  );

  const handlePrivateUpload = async () => {
    if (!isGlobalLesson && selectedStudents.length === 0) return;
    if (!uploadTitle) return;
    if (uploadMode === 'file' && !uploadFile) return;
    if (uploadMode === 'url' && !uploadUrl) return;

    setIsProcessing(true);
    setUploadProgress(0);
    try {
      let finalUrl = uploadMode === 'url' ? cleanYouTubeUrl(uploadUrl) : uploadUrl;
      let finalType = uploadMode === 'url' ? 'link' : 'file';

      if (uploadMode === 'file' && uploadFile) {
        // Sanitize filename: remove spaces and special characters
        const sanitizedName = uploadFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const storagePath = isGlobalLesson 
          ? `global_lessons/${Date.now()}_${sanitizedName}`
          : `private_lessons/${selectedStudents[0]?.id || 'bulk'}/${Date.now()}_${sanitizedName}`;
        
        const fileRef = ref(storage, storagePath);
        
        // Use uploadBytesResumable for better reliability
        const uploadTask = uploadBytesResumable(fileRef, uploadFile);
        
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            uploadTask.cancel();
            reject(new Error('Upload timed out after 60 seconds. Please check your connection.'));
          }, 60000);

          const unsubscribe = uploadTask.on('state_changed', 
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
              console.log('Upload is ' + progress + '% done');
            }, 
            (error) => {
              clearTimeout(timeout);
              unsubscribe();
              console.error("Upload task error:", error);
              reject(error);
            }, 
            () => {
              clearTimeout(timeout);
              unsubscribe();
              resolve(null);
            }
          );
        });

        finalUrl = await getDownloadURL(fileRef);
        
        const mimeType = uploadFile.type.toLowerCase();
        if (mimeType.includes('video')) finalType = 'video';
        else if (mimeType.includes('audio')) finalType = 'audio';
        else if (mimeType.includes('pdf') || uploadFile.name.toLowerCase().endsWith('.pdf')) finalType = 'pdf';
        else finalType = 'file';
      }
      
      const lessonData = {
        title: uploadTitle,
        description: uploadDesc,
        url: finalUrl,
        type: finalType,
        quiz: quizQuestions,
        timeLimit: quizTimeLimit > 0 ? quizTimeLimit : null,
        allowReview: allowQuizReview,
        isPublished: isPublished,
        scheduledAt: scheduledAt || null,
        created_at: serverTimestamp()
      };

      if (isGlobalLesson) {
        await addDoc(collection(db, 'lessons'), lessonData);
      } else if (selectedStudents.length > 0) {
        // If multiple students selected, we store them in studentIds array
        await addDoc(collection(db, 'private_lessons'), {
          ...lessonData,
          studentIds: selectedStudents.map(s => s.id),
          // For backward compatibility with single studentId if needed
          studentId: selectedStudents.length === 1 ? selectedStudents[0].id : 'multiple'
        });
      }
      
      setSelectedStudents([]);
      setIsGlobalLesson(false);
      setUploadFile(null);
      setUploadUrl('');
      setUploadTitle('');
      setUploadDesc('');
      setUploadProgress(0);
      setQuizQuestions([]);
      setQuizTimeLimit(0);
      setAllowQuizReview(false);
      setIsPublished(true);
      setScheduledAt('');
      alert('Lesson added successfully!');
    } catch (err: any) {
      console.error("Upload error:", err);
      alert(`Operation failed: ${err.message || 'Please try again.'}`);
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.HOME: return <Home onNavigate={setCurrentPage} lang={lang} demos={demos} />;
      case Page.ABOUT: return <About lang={lang} />;
      case Page.COURSES: return <Courses lang={lang} courses={courses} />;
      case Page.CONTACT: return <Contact lang={lang} />;
      case Page.DEMOS: return <Home onNavigate={setCurrentPage} lang={lang} scrollTarget="demos" />;
      case Page.STUDENT_PORTAL: return <StudentPortal lang={lang} userData={userData} marks={marks.filter(m => m.studentId === auth.currentUser?.uid)} privateLessons={privateLessons.filter(l => l.studentId === auth.currentUser?.uid)} quizSubmissions={quizSubmissions.filter(s => s.studentId === auth.currentUser?.uid)} marksVisibility={marksVisibility} onLogout={handleLogout} />;
      case Page.REGISTRATION:
        const now = new Date();
        const startDate = regSettings?.startDate ? new Date(regSettings.startDate) : null;
        const endDate = regSettings?.endDate ? new Date(regSettings.endDate) : null;
        const isRegOpen = (!startDate || now >= startDate) && (!endDate || now <= endDate);

        return (
          <div className="relative p-8 flex items-center justify-center min-h-[calc(100vh-100px)] overflow-hidden">
             {/* Vibrant Background Blobs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 blur-[120px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/20 blur-[120px] rounded-full animate-pulse delay-700"></div>

            <div className="max-w-md w-full relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/30 via-cyan-500/30 to-[#A3E635]/30 blur-2xl rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              <div className="relative bg-black/60 backdrop-blur-xl p-12 rounded-[40px] border border-white/10 shadow-2xl">
                {!isRegOpen ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-4">Registration Closed</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                      {lang === 'rw' 
                        ? `Kwiyandikisha bifunze. Bizafungurwa kuva tariki ${regSettings?.startDate || '...'} kugeza ${regSettings?.endDate || '...'}`
                        : `Registration is currently closed. It will be open from ${regSettings?.startDate || '...'} to ${regSettings?.endDate || '...'}`
                      }
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-10 text-center">
                      <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 to-cyan-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-purple-500/20">
                         <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                         </svg>
                      </div>
                      <h2 className="text-2xl font-black uppercase tracking-tighter bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">{t.join_eshuli}</h2>
                      <p className="text-[9px] font-bold text-gray-500 mt-2 tracking-[0.2em] uppercase">Create your tech future</p>
                    </div>
                    
                    <form onSubmit={handleRegister} className="space-y-4">
                      {error && <p className="text-red-500 text-[10px] text-center bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</p>}
                      <div className="relative">
                        <input name="fullName" placeholder={t.full_name} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all placeholder:text-gray-600 text-white" />
                      </div>
                      <div className="relative">
                        <input name="email" type="email" placeholder={t.email} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all placeholder:text-gray-600 text-white" />
                      </div>
                      <div className="relative">
                        <input name="password" type="password" placeholder={t.password} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] outline-none focus:border-[#A3E635]/50 focus:ring-1 focus:ring-[#A3E635]/20 transition-all placeholder:text-gray-600 text-white" />
                      </div>

                      <div className="relative">
                        <select 
                          name="role" 
                          onChange={(e) => {
                            // Force a re-render if needed, but since it's a controlled component or we use state
                            // Actually, let's just use a state for role in the form to show/hide fields
                            setFormRole(e.target.value);
                          }}
                          className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all text-white appearance-none"
                        >
                          <option value="student" className="bg-black text-white">Student</option>
                          <option value="user" className="bg-black text-white">User</option>
                          <option value="admin" className="bg-black text-white">Admin</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {formRole === 'student' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
                          <input name="regNumber" placeholder="Registration Number" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] outline-none focus:border-purple-500/50 text-white" />
                          <input name="indexNumber" placeholder="Index Number" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] outline-none focus:border-purple-500/50 text-white" />
                          <input name="nationalId" placeholder="National ID" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] outline-none focus:border-purple-500/50 text-white" />
                          <input name="college" placeholder="College" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] outline-none focus:border-purple-500/50 text-white" />
                          <input name="department" placeholder="Department" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] outline-none focus:border-purple-500/50 text-white" />
                          <input name="program" placeholder="Program/Option" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] outline-none focus:border-purple-500/50 text-white" />
                          
                          <div className="sm:col-span-2 relative">
                            <select 
                              name="classType" 
                              required
                              className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] outline-none focus:border-purple-500/50 text-white appearance-none"
                            >
                              <option value="" className="bg-black text-white">Select Class Type</option>
                              <option value="Online Class" className="bg-black text-white">Online Class</option>
                              <option value="Physical Class" className="bg-black text-white">Physical Class</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <button type="submit" disabled={isProcessing} className="w-full bg-gradient-to-r from-purple-600 via-cyan-600 to-[#A3E635] text-white p-4 rounded-2xl font-black uppercase tracking-widest text-[10px] mt-4 shadow-xl shadow-purple-900/20 hover:scale-[1.02] transition-transform disabled:opacity-50">
                        {isProcessing ? t.processing : t.register_now}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      case Page.LOGIN:
        return (
          <div className="relative p-8 flex items-center justify-center min-h-[calc(100vh-100px)] overflow-hidden">
            {/* Colorful Background Accents */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#A3E635]/10 blur-[150px] rounded-full"></div>

            <div className="max-w-sm w-full relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-[#A3E635] rounded-[45px] blur opacity-25"></div>
              <div className="relative bg-black/80 backdrop-blur-3xl p-12 rounded-[40px] border border-white/5 shadow-2xl">
                <div className="mb-10 text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-[#A3E635] rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-4.514A9.01 9.01 0 0012 2c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01.427 4.474c-.218 2.146-1.055 4.07-2.33 5.608a10.477 10.477 0 01-5.118 3.537m-2.83-3.131A8.92 8.92 0 0110 18c-3.12 0-5.845-1.591-7.447-4.017" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-black mb-1 uppercase tracking-tighter text-white">{t.portal_login}</h2>
                  <p className="text-[9px] font-bold text-gray-500 tracking-[0.3em] uppercase">Member Access</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-center animate-shake">
                      <p className="text-red-500 text-[10px] font-bold">
                        {error.includes('auth/invalid-credential') || error.includes('auth/user-not-found') || error.includes('auth/wrong-password')
                          ? (t as any).invalid_credentials
                          : error
                        }
                      </p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase text-gray-500 ml-4 tracking-widest">{t.email}</label>
                    <input name="email" type="email" required placeholder="e.g. student@eshuli.rw" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] outline-none focus:border-blue-500 transition-all placeholder:text-gray-700 text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase text-gray-500 ml-4 tracking-widest">{t.password}</label>
                    <input name="password" type="password" required placeholder="••••••••" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] outline-none focus:border-[#A3E635] transition-all placeholder:text-gray-700 text-white" />
                  </div>
                  
                  <button type="submit" disabled={isProcessing} className="w-full bg-white text-black p-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gradient-to-r hover:from-blue-500 hover:to-[#A3E635] hover:text-white transition-all duration-500 shadow-xl disabled:opacity-50">
                    {isProcessing ? t.processing : t.login}
                  </button>
                  
                  <div className="flex flex-col items-center gap-4 pt-4">
                    <div className="w-full flex items-center gap-4">
                      <div className="h-px bg-white/10 flex-1"></div>
                      <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">OR</span>
                      <div className="h-px bg-white/10 flex-1"></div>
                    </div>

                    <button 
                      type="button" 
                      onClick={() => setCurrentPage(Page.REGISTRATION)} 
                      className="w-full border border-blue-500/30 text-blue-500 p-4 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-blue-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      {lang === 'rw' ? 'Kora Konti Nshya' : 'Create New Account'}
                    </button>
                    
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
                      <svg className="w-3 h-3 text-[#A3E635]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[7px] font-black uppercase tracking-widest text-gray-500">Secure Firebase Authentication</span>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        );
      case Page.MANAGE_MARKS:
        return (
          <div className="p-8 lg:p-16 max-w-7xl mx-auto">
            <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Manage Student Marks</h2>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-3">Assign and publish grades</p>
              </div>
              
              <div className="flex items-center gap-4 bg-[#0a0a0a] p-4 rounded-3xl border border-white/5">
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 mr-2">Global Visibility:</span>
                <button 
                  onClick={() => setDoc(doc(db, 'settings', 'marks_visibility'), { ...marksVisibility, semester1: !marksVisibility.semester1 })}
                  className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase transition-all flex items-center gap-2 ${marksVisibility.semester1 ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-500'}`}
                >
                  {marksVisibility.semester1 ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                  )}
                  Sem 1
                </button>
                <button 
                  onClick={() => setDoc(doc(db, 'settings', 'marks_visibility'), { ...marksVisibility, semester2: !marksVisibility.semester2 })}
                  className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase transition-all flex items-center gap-2 ${marksVisibility.semester2 ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-500'}`}
                >
                  {marksVisibility.semester2 ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                  )}
                  Sem 2
                </button>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] p-8">
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const formData = new FormData(form);
                  const studentId = formData.get('studentId') as string;
                  const student = students.find(s => s.id === studentId);
                  const moduleCode = formData.get('moduleCode') as string;
                  const module = formData.get('module') as string;
                  const credits = Number(formData.get('credits'));
                  const continuousAssessment = Number(formData.get('continuousAssessment'));
                  const examAssessment = Number(formData.get('examAssessment'));
                  const semester = Number(formData.get('semester')) as 1 | 2;
                  const marksVal = continuousAssessment + examAssessment;
                  const grade = marksVal >= 80 ? 'A' : marksVal >= 70 ? 'B' : marksVal >= 60 ? 'C' : marksVal >= 50 ? 'D' : 'F';
                  const status = marksVal >= 50 ? 'Passed' : 'Failed';

                  await addDoc(collection(db, 'marks'), {
                    studentId,
                    studentName: student?.fullName || 'Unknown',
                    moduleCode,
                    module,
                    credits,
                    continuousAssessment,
                    examAssessment,
                    semester,
                    marks: marksVal,
                    grade,
                    status,
                    created_at: serverTimestamp()
                  });
                  form.reset();
                }}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12"
              >
                <select name="studentId" required className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] text-white outline-none">
                  <option value="" className="bg-black">Select Student</option>
                  {students.map(s => <option key={s.id} value={s.id} className="bg-black">{s.fullName}</option>)}
                </select>
                <input name="moduleCode" placeholder="Module Code (e.g. CCMRM801)" required className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] text-white outline-none" />
                <input name="module" placeholder="Module Name" required className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] text-white outline-none" />
                <input name="credits" type="number" placeholder="Credits" required className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] text-white outline-none" />
                <select name="semester" required className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] text-white outline-none">
                  <option value="1" className="bg-black">Semester 1</option>
                  <option value="2" className="bg-black">Semester 2</option>
                </select>
                <input name="continuousAssessment" type="number" placeholder="Continuous (e.g. 40)" required className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] text-white outline-none" />
                <input name="examAssessment" type="number" placeholder="Exam (e.g. 60)" required className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] text-white outline-none" />
                <button type="submit" className="bg-[#A3E635] text-black rounded-2xl p-4 text-[10px] font-black uppercase tracking-widest md:col-span-2">Add Mark</button>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="text-gray-500 uppercase tracking-widest border-b border-white/5">
                      <th className="pb-4 px-4">Student</th>
                      <th className="pb-4 px-4">Code</th>
                      <th className="pb-4 px-4">Module</th>
                      <th className="pb-4 px-4 text-center">Sem</th>
                      <th className="pb-4 px-4 text-center">Total</th>
                      <th className="pb-4 px-4 text-center">Grade</th>
                      <th className="pb-4 px-4 text-center">Status</th>
                      <th className="pb-4 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marks.map(m => (
                      <tr key={m.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4 font-bold">{m.studentName}</td>
                        <td className="py-4 px-4 text-gray-400 font-mono">{m.moduleCode}</td>
                        <td className="py-4 px-4 text-gray-400">{m.module}</td>
                        <td className="py-4 px-4 text-center text-blue-400 font-bold">{m.semester}</td>
                        <td className="py-4 px-4 text-center font-mono">{m.marks}</td>
                        <td className="py-4 px-4 text-center font-black text-[#A3E635]">{m.grade}</td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${m.status === 'Passed' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button 
                            onClick={() => deleteDoc(doc(db, 'marks', m.id))}
                            className="text-red-500 hover:text-red-400 font-black uppercase tracking-widest"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case Page.ADMIN_SETTINGS:
        return <AdminSettings lang={lang} />;
      case Page.VIEW_MESSAGES:
        return (
          <div className="p-8 lg:p-16 max-w-7xl mx-auto">
            <div className="mb-12">
              <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Contact Messages</h2>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-3">{messages.length} messages received</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {messages.sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)).map(m => (
                <div key={m.id} className="bg-[#0a0a0a] border border-white/5 rounded-[30px] p-8 hover:border-blue-500/30 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight text-white">{m.firstName} {m.lastName}</h3>
                      <p className="text-blue-500 text-[10px] font-bold uppercase tracking-widest mt-1">{m.email}</p>
                    </div>
                    <div className="text-right">
                      <span className="bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                        {m.subject}
                      </span>
                      <p className="text-gray-600 text-[8px] mt-2 uppercase font-bold">
                        {m.timestamp?.toDate ? m.timestamp.toDate().toLocaleString() : 'Just now'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-6 text-gray-400 text-[11px] leading-relaxed">
                    {m.message}
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button 
                      onClick={() => deleteDoc(doc(db, 'contact_messages', m.id))}
                      className="text-red-500 hover:text-red-400 text-[9px] font-black uppercase tracking-widest"
                    >
                      Delete Message
                    </button>
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="text-center py-20 bg-[#0a0a0a] rounded-[40px] border border-white/5">
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">No messages yet</p>
                </div>
              )}
            </div>
          </div>
        );
      case Page.MANAGE_STUDENTS:
        return (
          <div className="p-8 lg:p-16 max-w-7xl mx-auto">
            <div className="mb-12">
              <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Manage Students</h2>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-3">Approve or reject student registrations</p>
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] p-8 overflow-x-auto">
              <table className="w-full text-left text-[10px]">
                <thead>
                  <tr className="text-gray-500 uppercase tracking-widest border-b border-white/5">
                    <th className="pb-4 px-4">Student Name</th>
                    <th className="pb-4 px-4">Email</th>
                    <th className="pb-4 px-4">Reg Number</th>
                    <th className="pb-4 px-4">Class Type</th>
                    <th className="pb-4 px-4 text-center">Status</th>
                    <th className="pb-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.filter(s => s.role === 'student').map(s => (
                    <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4 font-bold text-white">{s.fullName}</td>
                      <td className="py-4 px-4 text-gray-400">{s.email}</td>
                      <td className="py-4 px-4 text-gray-400">{s.regNumber}</td>
                      <td className="py-4 px-4 text-blue-400">{s.classType}</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${s.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right space-x-4">
                        <button 
                          onClick={() => setSelectedStudents([s])}
                          className="text-blue-500 hover:text-blue-400 font-black uppercase tracking-widest"
                        >
                          Upload Lesson
                        </button>
                        {s.status === 'pending' && (
                          <button 
                            onClick={() => updateDoc(doc(db, 'users', s.id), { status: 'active' })}
                            className="text-[#A3E635] hover:text-[#A3E635]/80 font-black uppercase tracking-widest"
                          >
                            Approve
                          </button>
                        )}
                        <button 
                          onClick={() => deleteDoc(doc(db, 'users', s.id))}
                          className="text-red-500 hover:text-red-400 font-black uppercase tracking-widest"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case Page.QUIZ_SUBMISSIONS:
        return (
          <div className="p-8 lg:p-16 max-w-7xl mx-auto">
            <div className="mb-12">
              <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Quiz Submissions</h2>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-3">View and grade student quiz answers</p>
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] p-8 overflow-x-auto">
              <table className="w-full text-left text-[10px]">
                <thead>
                  <tr className="text-gray-500 uppercase tracking-widest border-b border-white/5">
                    <th className="pb-4 px-4">Student</th>
                    <th className="pb-4 px-4">Lesson</th>
                    <th className="pb-4 px-4 text-center">Score</th>
                    <th className="pb-4 px-4 text-center">Date</th>
                    <th className="pb-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quizSubmissions.sort((a,b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0)).map(s => (
                    <React.Fragment key={s.id}>
                      <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4 font-bold text-white">{s.studentName}</td>
                        <td className="py-4 px-4 text-gray-400">{s.lessonTitle}</td>
                        <td className="py-4 px-4 text-center font-black text-[#A3E635]">
                          {editingSubmission?.id === s.id ? (
                            <div className="flex items-center justify-center gap-2">
                              <input 
                                type="number" 
                                value={editingSubmission.score}
                                onChange={(e) => setEditingSubmission({...editingSubmission, score: parseInt(e.target.value) || 0})}
                                className="w-12 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-center"
                              />
                              <button 
                                onClick={async () => {
                                  await updateDoc(doc(db, 'quiz_submissions', s.id), { score: editingSubmission.score });
                                  setEditingSubmission(null);
                                }}
                                className="text-[#A3E635] hover:text-white"
                              >
                                ✓
                              </button>
                              <button 
                                onClick={() => setEditingSubmission(null)}
                                className="text-red-500 hover:text-white"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <span>{s.score} / {s.total}</span>
                              <button 
                                onClick={() => setEditingSubmission({ id: s.id, score: s.score })}
                                className="text-blue-500 hover:text-blue-400 text-[8px] font-black uppercase tracking-widest ml-2"
                              >
                                Grade
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center text-gray-500">
                          {s.submittedAt?.toDate ? s.submittedAt.toDate().toLocaleString() : 'Recently'}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button 
                            onClick={() => deleteDoc(doc(db, 'quiz_submissions', s.id))}
                            className="text-red-500 hover:text-red-400 font-black uppercase tracking-widest"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={5} className="px-8 py-4 bg-white/5">
                          <div className="space-y-4">
                            {s.quiz.map((q: any, idx: number) => (
                              <div key={idx} className="border-l-2 border-blue-500 pl-4 py-2">
                                <p className="text-gray-300 font-bold mb-1">Q: {q.question}</p>
                                <p className="text-[#A3E635]">Student Answer: {q.type === 'multiple' ? q.options[s.answers[idx]] : s.answers[idx]}</p>
                                <p className="text-gray-500 text-[8px] uppercase font-black">Correct Answer: {q.type === 'multiple' ? q.options[q.correct] : q.correct}</p>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                  {quizSubmissions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-gray-500 font-black uppercase tracking-widest">No submissions yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case Page.LESSONS:
        return (
          <div className="p-8 lg:p-16 max-w-7xl mx-auto">
            <div className="mb-12 flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">{t.video_lessons}</h2>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-3">{filteredLessons.length} lessons discovered</p>
              </div>
              {userRole === 'admin' && (
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsGlobalLesson(true)}
                    className="bg-[#A3E635] text-black px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Global Lesson
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {filteredLessons.map(l => (
                <div key={l.id} className="bg-[#0a0a0a] border border-white/5 rounded-[40px] overflow-hidden group hover:border-[#A3E635]/20 transition-all duration-700">
                  <div className="aspect-video relative overflow-hidden bg-black">
                    <video controls className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity"><source src={l.video_url} /></video>
                  </div>
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-black text-xl group-hover:text-[#A3E635] transition-colors uppercase tracking-tight">{l.title}</h3>
                      {userRole === 'admin' && (
                        <div className="flex gap-2">
                          <button 
                            onClick={async () => {
                              const { db } = await import('./services/firebase');
                              const { doc, updateDoc } = await import('firebase/firestore');
                              await updateDoc(doc(db, 'lessons', l.id), { isPublished: !l.isPublished });
                            }}
                            className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-colors ${l.isPublished !== false ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}
                          >
                            {l.isPublished !== false ? 'Published' : 'Draft'}
                          </button>
                          <button 
                            onClick={async () => {
                              if (confirm('Delete this lesson?')) {
                                const { db } = await import('./services/firebase');
                                const { doc, deleteDoc } = await import('firebase/firestore');
                                await deleteDoc(doc(db, 'lessons', l.id));
                              }
                            }}
                            className="p-1 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-500 text-[10px] leading-relaxed line-clamp-2">{l.description}</p>
                    {l.scheduledAt && (
                      <p className="text-[8px] text-indigo-400 font-bold uppercase tracking-widest mt-2">
                        Scheduled: {new Date(l.scheduledAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default: return <Home onNavigate={setCurrentPage} lang={lang} />;
    }
  };

  if (currentPage === Page.STUDENT_PORTAL) {
    return (
      <div className="font-sans">
        <StudentPortal 
          lang={lang} 
          userData={userData} 
          marks={marks.filter(m => m.studentId === auth.currentUser?.uid)} 
          privateLessons={privateLessons.filter(l => 
            l.studentId === auth.currentUser?.uid || 
            (l.studentIds && l.studentIds.includes(auth.currentUser?.uid))
          )}
          globalLessons={lessons}
          quizSubmissions={quizSubmissions.filter(s => s.studentId === auth.currentUser?.uid)}
          marksVisibility={marksVisibility}
          onLogout={handleLogout} 
        />
        <ChatBot lang={lang} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden font-sans text-white">
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        userRole={userRole} 
        setUserRole={setUserRole}
        lang={lang}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto bg-black relative">
        {renderHeader()}
        <div className="relative z-10">
          {renderPage()}
        </div>
      </main>
      <ChatBot lang={lang} />
      
      {/* Upload Lesson Modal */}
      {(selectedStudents.length > 0 || isGlobalLesson) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-2 md:p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-[24px] w-full max-w-5xl h-full max-h-[85vh] flex flex-col animate-in zoom-in duration-300 overflow-hidden shadow-2xl shadow-black">
            <div className="p-4 pb-3 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter">
                  {isGlobalLesson ? 'Upload Global Lesson' : 'Upload Private Lesson'}
                </h3>
                <p className="text-gray-500 text-[8px] font-bold uppercase tracking-widest">
                  {isGlobalLesson ? 'Visible to all students' : `${selectedStudents.length} students selected`}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-1 bg-white/5 p-0.5 rounded-lg">
                  <button 
                    onClick={() => setUploadMode('file')}
                    className={`px-4 py-1 rounded-md text-[7px] font-black uppercase tracking-widest transition-all ${uploadMode === 'file' ? 'bg-[#A3E635] text-black' : 'text-gray-500'}`}
                  >
                    File
                  </button>
                  <button 
                    onClick={() => setUploadMode('url')}
                    className={`px-4 py-1 rounded-md text-[7px] font-black uppercase tracking-widest transition-all ${uploadMode === 'url' ? 'bg-[#A3E635] text-black' : 'text-gray-500'}`}
                  >
                    URL
                  </button>
                </div>
                <button 
                  onClick={() => {
                    setSelectedStudents([]);
                    setIsGlobalLesson(false);
                  }}
                  className="p-1 hover:bg-white/5 rounded-full transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {!isGlobalLesson && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <label className="block text-[8px] font-black uppercase tracking-widest text-gray-500 mb-2">Target Students</label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedStudents.map(s => (
                      <div key={s.id} className="bg-[#A3E635] text-black px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-2">
                        {s.fullName}
                        <button onClick={() => setSelectedStudents(prev => prev.filter(p => p.id !== s.id))}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <select 
                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white outline-none"
                    onChange={(e) => {
                      const student = students.find(s => s.id === e.target.value);
                      if (student && !selectedStudents.find(s => s.id === student.id)) {
                        setSelectedStudents([...selectedStudents, student]);
                      }
                      e.target.value = "";
                    }}
                  >
                    <option value="">Add more students...</option>
                    {students.filter(s => s.role === 'student' && !selectedStudents.find(ps => ps.id === s.id)).map(s => (
                      <option key={s.id} value={s.id}>{s.fullName} ({s.email})</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[8px] font-black uppercase tracking-widest text-gray-500 mb-1">Lesson Title</label>
                    <input 
                      type="text"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white focus:border-[#A3E635] outline-none transition-colors"
                      placeholder="e.g. Advanced Electronics Part 1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[8px] font-black uppercase tracking-widest text-gray-500 mb-1">Description</label>
                    <textarea 
                      value={uploadDesc}
                      onChange={(e) => setUploadDesc(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white h-24 focus:border-[#A3E635] outline-none transition-colors resize-none"
                      placeholder="What will students learn?"
                    />
                  </div>

                  {uploadMode === 'file' ? (
                    <div className="space-y-1">
                      <label className="block text-[8px] font-black uppercase tracking-widest text-gray-500">Video/Audio File</label>
                      <div className="relative group">
                        <input 
                          type="file"
                          onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          accept="video/*,audio/*,application/pdf"
                        />
                        <div className="bg-white/5 border border-dashed border-white/10 rounded-lg p-6 text-center group-hover:border-[#A3E635]/50 transition-colors">
                          <svg className="w-6 h-6 text-gray-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                            {uploadFile ? uploadFile.name : 'Click or drag to upload'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[8px] font-black uppercase tracking-widest text-gray-500 mb-1">YouTube URL</label>
                      <input 
                        type="text"
                        value={uploadUrl}
                        onChange={(e) => setUploadUrl(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white focus:border-[#A3E635] outline-none transition-colors"
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[8px] font-black uppercase tracking-widest text-gray-500">Quiz Questions ({quizQuestions.length})</label>
                    <button 
                      onClick={() => setQuizQuestions([...quizQuestions, { question: '', type: 'multiple', options: ['', '', '', ''], correct: 0 }])}
                      className="text-[#A3E635] text-[8px] font-black uppercase tracking-widest hover:underline"
                    >
                      + Add Question
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {quizQuestions.map((q, qIdx) => (
                      <div key={qIdx} className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2 relative group">
                        <button 
                          onClick={() => setQuizQuestions(quizQuestions.filter((_, i) => i !== qIdx))}
                          className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        
                        <div className="flex gap-2">
                          <select 
                            value={q.type}
                            onChange={(e) => {
                              const newQs = [...quizQuestions];
                              newQs[qIdx].type = e.target.value as 'multiple' | 'written';
                              if (newQs[qIdx].type === 'written') newQs[qIdx].correct = '';
                              setQuizQuestions(newQs);
                            }}
                            className="bg-black border border-white/10 rounded-lg px-2 py-1 text-[8px] text-white outline-none"
                          >
                            <option value="multiple">Multiple Choice</option>
                            <option value="written">Written Answer</option>
                          </select>
                          <input 
                            type="text"
                            value={q.question}
                            onChange={(e) => {
                              const newQs = [...quizQuestions];
                              newQs[qIdx].question = e.target.value;
                              setQuizQuestions(newQs);
                            }}
                            className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-1 text-[9px] text-white outline-none focus:border-[#A3E635]"
                            placeholder={`Question ${qIdx + 1}`}
                          />
                        </div>

                        {q.type === 'multiple' ? (
                          <div className="grid grid-cols-2 gap-2">
                            {q.options.map((opt: string, oIdx: number) => (
                              <div key={oIdx} className="flex items-center gap-2">
                                <input 
                                  type="radio"
                                  name={`correct-${qIdx}`}
                                  checked={q.correct === oIdx}
                                  onChange={() => {
                                    const newQs = [...quizQuestions];
                                    newQs[qIdx].correct = oIdx;
                                    setQuizQuestions(newQs);
                                  }}
                                  className="accent-[#A3E635]"
                                />
                                <input 
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const newQs = [...quizQuestions];
                                    newQs[qIdx].options[oIdx] = e.target.value;
                                    setQuizQuestions(newQs);
                                  }}
                                  className="flex-1 bg-black border border-white/10 rounded-lg px-2 py-1 text-[8px] text-white outline-none"
                                  placeholder={`Option ${oIdx + 1}`}
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <input 
                            type="text"
                            value={q.correct}
                            onChange={(e) => {
                              const newQs = [...quizQuestions];
                              newQs[qIdx].correct = e.target.value;
                              setQuizQuestions(newQs);
                            }}
                            className="w-full bg-black border border-white/10 rounded-lg px-3 py-1 text-[8px] text-white outline-none focus:border-[#A3E635]"
                            placeholder="Correct Answer"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <label className="block text-[8px] font-black uppercase tracking-widest text-gray-500">Time Limit (Min)</label>
                      <input 
                        type="number"
                        value={quizTimeLimit}
                        onChange={(e) => setQuizTimeLimit(parseInt(e.target.value) || 0)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white focus:border-[#A3E635] outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[8px] font-black uppercase tracking-widest text-gray-500">Review Access</label>
                      <button 
                        onClick={() => setAllowQuizReview(!allowQuizReview)}
                        className={`w-full py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${allowQuizReview ? 'bg-[#A3E635] text-black border-[#A3E635]' : 'bg-white/5 text-gray-500 border-white/10'}`}
                      >
                        {allowQuizReview ? 'Review Allowed' : 'Review Disabled'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[8px] font-black uppercase tracking-widest text-gray-500">Publish Status</label>
                      <button 
                        onClick={() => setIsPublished(!isPublished)}
                        className={`w-full py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${isPublished ? 'bg-[#A3E635] text-black border-[#A3E635]' : 'bg-white/5 text-gray-500 border-white/10'}`}
                      >
                        {isPublished ? 'Published' : 'Draft'}
                      </button>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[8px] font-black uppercase tracking-widest text-gray-500">Schedule (Optional)</label>
                      <input 
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white focus:border-[#A3E635] outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 flex gap-2 border-t border-white/5 bg-[#0a0a0a]">
              <button 
                onClick={() => {
                  setSelectedStudents([]);
                  setIsGlobalLesson(false);
                }}
                className="px-6 bg-white/5 text-white py-3 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handlePrivateUpload}
                disabled={isProcessing || !uploadTitle || (uploadMode === 'file' ? !uploadFile : !uploadUrl)}
                className="flex-1 bg-[#A3E635] text-black py-3 rounded-lg text-[8px] font-black uppercase tracking-widest hover:scale-[1.01] active:scale-95 transition-all shadow-xl shadow-[#A3E635]/10 disabled:opacity-50 disabled:hover:scale-100"
              >
                {isProcessing ? (
                  <div className="flex flex-col items-center justify-center gap-1">
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-3 w-3 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      <span>{uploadProgress > 0 && uploadProgress < 100 ? `Uploading ${Math.round(uploadProgress)}%` : 'Processing...'}</span>
                    </div>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="w-32 h-0.5 bg-black/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-black transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                ) : (uploadMode === 'file' ? 'Upload & Save' : 'Save Link')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
