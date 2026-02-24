
export interface Course {
  id: string;
  title: string;
  description: string;
  category: 'Electronics' | 'Embedded Systems' | 'Graphic Design';
  duration: string;
  image: string;
}

export interface Lesson {
  id: string;
  title: string;
  video_url?: string;
  url?: string;
  description: string;
  type?: 'video' | 'audio' | 'pdf' | 'link' | 'file';
  quiz?: any[];
  timeLimit?: number; // in minutes
  allowReview?: boolean;
  isPublished?: boolean;
  scheduledAt?: any;
  studentIds?: string[];
  created_at: any;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface ContactMessage {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  timestamp: any;
}

export interface RegistrationStatus {
  is_open: boolean;
  start_date: string;
  end_date: string;
}

export interface Mark {
  id: string;
  studentId: string;
  studentName: string;
  moduleCode: string;
  module: string;
  credits: number;
  continuousAssessment: number;
  examAssessment: number;
  marks: number;
  grade: string;
  status: 'Passed' | 'Failed';
  semester: 1 | 2;
  published: boolean;
  created_at: any;
}

export enum Page {
  HOME = 'home',
  ABOUT = 'about',
  COURSES = 'courses',
  CONTACT = 'contact',
  REGISTRATION = 'registration',
  LOGIN = 'login',
  ADMIN_SETTINGS = 'admin_settings',
  LESSONS = 'lessons',
  DEMOS = 'demos',
  STUDENT_PORTAL = 'student_portal',
  MANAGE_MARKS = 'manage_marks',
  VIEW_MESSAGES = 'view_messages',
  MANAGE_STUDENTS = 'manage_students',
  QUIZ_SUBMISSIONS = 'quiz_submissions'
}
