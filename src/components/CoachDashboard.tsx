import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Dumbbell, 
  Activity, 
  DollarSign, 
  MessageSquare, 
  Search, 
  Bell, 
  User, 
  TrendingUp, 
  Star, 
  Check, 
  Plus, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  ArrowRight, 
  Sparkles, 
  Info, 
  Trash2, 
  GripVertical, 
  Send,
  LogOut,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  X
} from 'lucide-react';
import { LogoIcon, BrandName } from './Brand';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line 
} from 'recharts';
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";

import { auth, db, storage } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { userService } from '../services/userService';
import { coachService } from '../services/coachService';
import { User as AppUser } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoURL: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoURL: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

type Pane = 'overview' | 'sessions' | 'clients' | 'workout' | 'progress' | 'earnings' | 'messages' | 'ai';

interface CoachDashboardProps {
  user: {
    firstName: string;
    lastName: string;
    initials: string;
    photoURL?: string | null;
  };
  appUser: AppUser | null;
  onSignOut: () => void;
  onUpdateUser: (data: { firstName?: string; lastName?: string; photoURL?: string | null }) => void;
  onToggleRole?: () => void;
}

const CLIENTS = [
  { id: 1, name: 'Rania K.', init: 'RK', grad: 'from-warn to-err', goal: 'Strength & fat loss', sessions: 28, total: 40, pack: '10-pack' },
  { id: 2, name: 'Marcus T.', init: 'MT', grad: 'from-info to-ac2', goal: 'Olympic lifting', sessions: 14, total: 20, pack: '5-pack' },
  { id: 3, name: 'Sara A.', init: 'SA', grad: 'from-ok to-warn', goal: 'General fitness', sessions: 9, total: 10, pack: '10-pack' },
  { id: 4, name: 'James O.', init: 'JO', grad: 'from-pur to-ac2', goal: 'Rehabilitation', sessions: 6, total: 10, pack: '5-pack' },
  { id: 5, name: 'Lena M.', init: 'LM', grad: 'from-ac to-info', goal: 'Body composition', sessions: 3, total: 5, pack: 'Single' },
  { id: 6, name: 'Omar F.', init: 'OF', grad: 'from-warn to-err', goal: 'Sports performance', sessions: 18, total: 20, pack: '10-pack' },
];

const SESSIONS = [
  { id: 1, client: 'Rania K.', cinit: 'RK', cgrad: 'from-warn to-err', time: '07:00', date: '24 Mar', type: 'In-Person · Strength', status: 'confirmed', price: 'AED 350' },
  { id: 2, client: 'Marcus T.', cinit: 'MT', cgrad: 'from-info to-ac2', time: '09:00', date: '24 Mar', type: 'In-Person · Olympic Lifting', status: 'confirmed', price: 'AED 350' },
  { id: 3, client: 'Sara A.', cinit: 'SA', cgrad: 'from-ok to-warn', time: '11:00', date: '24 Mar', type: 'In-Person · General Fitness', status: 'pending', price: 'AED 350' },
  { id: 4, client: 'James O.', cinit: 'JO', cgrad: 'from-pur to-ac2', time: '14:00', date: '25 Mar', type: 'Online · Rehab', status: 'confirmed', price: 'AED 280' },
  { id: 5, client: 'Lena M.', cinit: 'LM', cgrad: 'from-ac to-info', time: '16:00', date: '25 Mar', type: 'In-Person · Body Comp', status: 'confirmed', price: 'AED 350' },
  { id: 6, client: 'Omar F.', cinit: 'OF', cgrad: 'from-warn to-err', time: '08:00', date: '26 Mar', type: 'In-Person · Sports', status: 'completed', price: 'AED 350' },
  { id: 7, client: 'Rania K.', cinit: 'RK', cgrad: 'from-warn to-err', time: '07:00', date: '26 Mar', type: 'In-Person · HIIT', status: 'completed', price: 'AED 350' },
];

const MSGS = [
  { name: 'Rania K.', init: 'RK', grad: 'from-warn to-err', preview: 'Can we move Thursday to 8am? I have a work call at 7.', time: '2m', unread: true },
  { name: 'Marcus T.', init: 'MT', grad: 'from-info to-ac2', preview: 'The programme is working well. Snatch PR today — 72kg!', time: '1h', unread: true },
  { name: 'New client enquiry', init: 'NC', grad: 'from-ac to-ac2', preview: 'Hi Ahmed, I found you on BodyGig and was wondering about availability…', time: '3h', unread: true },
  { name: 'Sara A.', init: 'SA', grad: 'from-ok to-warn', preview: 'Can I get the nutrition tracking sheet you mentioned?', time: '5h', unread: false },
  { name: 'BodyGig Platform', init: 'BG', grad: 'from-ac2 to-ac', preview: 'Your payout of AED 8,750 will be released tomorrow at 09:00.', time: '1d', unread: false },
  { name: 'James O.', init: 'JO', grad: 'from-pur to-ac2', preview: 'Knee feeling much better after yesterday. Thank you.', time: '2d', unread: false },
];

const TXNS = [
  { name: 'Rania K. · 5-pack', dir: 'in', amt: 'AED +1,500', date: '24 Mar' },
  { name: 'Marcus T. · Single', dir: 'in', amt: 'AED +350', date: '23 Mar' },
  { name: 'Lena M. · Single', dir: 'in', amt: 'AED +350', date: '22 Mar' },
  { name: 'Withdrawal to ENBD', dir: 'out', amt: 'AED −12,000', date: '20 Mar' },
  { name: 'Omar F. · 10-pack', dir: 'in', amt: 'AED +2,800', date: '19 Mar' },
  { name: 'Sara A. · Single', dir: 'in', amt: 'AED +350', date: '18 Mar' },
];

const NOTIFICATIONS = [
  { id: 1, title: 'New Booking', desc: 'Rania K. booked a session for tomorrow at 07:00.', time: '2m ago', icon: <Calendar className="w-3 h-3" />, color: 'text-ac', fullContent: 'Rania K. has successfully booked a new session. \n\nDetails:\n- Date: Tomorrow\n- Time: 07:00\n- Type: In-Person · Strength\n- Location: Main Gym\n\nPlease ensure you have the necessary equipment ready.' },
  { id: 2, title: 'Payment Received', desc: 'AED 1,500 added to your balance from Rania K.', time: '1h ago', icon: <DollarSign className="w-3 h-3" />, color: 'text-ok', fullContent: 'A payment of AED 1,500.00 has been credited to your account.\n\nTransaction Details:\n- Client: Rania K.\n- Item: 5-Session Pack\n- Date: 24 Mar 2026\n- Status: Completed\n\nYour updated balance is AED 8,750.00.' },
  { id: 3, title: 'Client Milestone', desc: 'Marcus T. hit his weight goal! He reached 78kg today.', time: '3h ago', icon: <Activity className="w-3 h-3" />, color: 'text-ac2', fullContent: 'Congratulations! Your client Marcus T. has reached a significant milestone.\n\nMilestone Details:\n- Goal: Reach 78kg\n- Current Weight: 77.8kg\n- Progress: -4.2kg this month\n\nConsider sending him a congratulatory message to keep the momentum going!' },
  { id: 4, title: 'New Message', desc: 'Sara A. sent you a message regarding nutrition tracking.', time: '5h ago', icon: <MessageSquare className="w-3 h-3" />, color: 'text-info', fullContent: 'You have a new message from Sara A.\n\nMessage:\n"Hi Ahmed, I was wondering if you could send me that nutrition tracking sheet you mentioned during our last session? I want to start logging my meals more accurately. Thanks!"' },
];

const REVENUE_DATA = [
  { name: 'Mon', rev: 3500, sess: 3 },
  { name: 'Tue', rev: 2800, sess: 2 },
  { name: 'Wed', rev: 4200, sess: 4 },
  { name: 'Thu', rev: 3150, sess: 3 },
  { name: 'Fri', rev: 5250, sess: 5 },
  { name: 'Sat', rev: 2100, sess: 2 },
  { name: 'Sun', rev: 0, sess: 0 },
];

const EARNINGS_DATA = [
  { name: 'Oct', rev: 19800 },
  { name: 'Nov', rev: 22100 },
  { name: 'Dec', rev: 31400 },
  { name: 'Jan', rev: 24200 },
  { name: 'Feb', rev: 26700 },
  { name: 'Mar', rev: 28350 },
];

const PROGRESS_DATA = [
  { name: 'Wk1', weight: 82 },
  { name: 'Wk2', weight: 81.4 },
  { name: 'Wk3', weight: 80.8 },
  { name: 'Wk4', weight: 80.1 },
  { name: 'Wk5', weight: 79.6 },
  { name: 'Wk6', weight: 78.9 },
  { name: 'Wk7', weight: 78.2 },
  { name: 'Wk8', weight: 77.8 },
  { name: 'Wk9', weight: 77.1 },
  { name: 'Wk10', weight: 76.4 },
  { name: 'Wk11', weight: 75.8 },
  { name: 'Wk12', weight: 74.9 },
  { name: 'Wk13', weight: 73.8 },
  { name: 'Wk14', weight: 72.1 },
];

export default function CoachDashboard({ user, appUser, onSignOut, onUpdateUser, onToggleRole }: CoachDashboardProps) {
  const [activePane, setActivePane] = useState<Pane>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
  };

  const paneTitle = useMemo(() => {
    switch (activePane) {
      case 'overview': return 'Overview';
      case 'sessions': return 'Sessions';
      case 'clients': return 'Clients';
      case 'workout': return 'Workout Builder';
      case 'progress': return 'Progress';
      case 'earnings': return 'Earnings';
      case 'messages': return 'Messages';
      case 'ai': return 'AI Coaching Copilot';
      default: return '';
    }
  }, [activePane]);

  return (
    <div className="flex h-screen bg-bg text-t1 font-sans overflow-hidden relative">
      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <aside className={cn(
        "bg-s1 border-r border-white/7 flex flex-col transition-all duration-300 z-50 fixed md:relative h-full",
        isSidebarOpen ? "translate-x-0 w-[240px]" : "-translate-x-full md:translate-x-0 w-[80px]"
      )}>
        <div className="p-6 flex items-center gap-4 border-b border-white/7">
          <LogoIcon className="w-9 h-9 text-ac" />
          {isSidebarOpen && (
            <BrandName className="text-lg" />
          )}
        </div>

        <div className="p-4 border-b border-white/7 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ac2 to-ac flex items-center justify-center font-display text-sm font-bold text-white shrink-0 overflow-hidden">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              user.initials
            )}
          </div>
          {isSidebarOpen && (
            <div className="min-w-0">
              <div className="text-sm font-semibold text-t1 truncate">{user.firstName} {user.lastName}</div>
              <div className="text-[11px] text-t3">Personal Trainer</div>
            </div>
          )}
          {isSidebarOpen && <div className="ml-auto w-2 h-2 rounded-full bg-ac animate-pulse" />}
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="px-6 mb-4 text-[10px] font-bold text-t4 uppercase tracking-widest">Main</div>
          <NavItem 
            icon={<LayoutDashboard className="w-5 h-5" />} 
            label="Overview" 
            active={activePane === 'overview'} 
            onClick={() => setActivePane('overview')} 
            collapsed={!isSidebarOpen}
          />
          <NavItem 
            icon={<Calendar className="w-5 h-5" />} 
            label="Sessions" 
            active={activePane === 'sessions'} 
            onClick={() => setActivePane('sessions')} 
            collapsed={!isSidebarOpen}
            badge={3}
          />
          <NavItem 
            icon={<Users className="w-5 h-5" />} 
            label="Clients" 
            active={activePane === 'clients'} 
            onClick={() => setActivePane('clients')} 
            collapsed={!isSidebarOpen}
          />
          <NavItem 
            icon={<Dumbbell className="w-5 h-5" />} 
            label="Workout Builder" 
            active={activePane === 'workout'} 
            onClick={() => setActivePane('workout')} 
            collapsed={!isSidebarOpen}
          />
          <NavItem 
            icon={<Activity className="w-5 h-5" />} 
            label="Progress" 
            active={activePane === 'progress'} 
            onClick={() => setActivePane('progress')} 
            collapsed={!isSidebarOpen}
          />
          <NavItem 
            icon={<Sparkles className="w-5 h-5" />} 
            label="AI Assistant" 
            active={activePane === 'ai'} 
            onClick={() => setActivePane('ai')} 
            collapsed={!isSidebarOpen}
            badge="New"
          />

          <div className="px-6 mt-6 mb-4 text-[10px] font-bold text-t4 uppercase tracking-widest">Finance</div>
          <NavItem 
            icon={<DollarSign className="w-5 h-5" />} 
            label="Earnings" 
            active={activePane === 'earnings'} 
            onClick={() => setActivePane('earnings')} 
            collapsed={!isSidebarOpen}
          />

          <div className="px-6 mt-6 mb-4 text-[10px] font-bold text-t4 uppercase tracking-widest">Comms</div>
          <NavItem 
            icon={<MessageSquare className="w-5 h-5" />} 
            label="Messages" 
            active={activePane === 'messages'} 
            onClick={() => setActivePane('messages')} 
            collapsed={!isSidebarOpen}
            badge={5}
          />
        </nav>

        <div className="p-4 border-t border-white/7">
          <button 
            onClick={onSignOut}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-t3 hover:text-err hover:bg-err/5 transition-all"
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="h-[64px] bg-s1 border-b border-white/7 flex items-center px-4 md:px-8 gap-4 md:gap-6 sticky top-0 z-40">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg border border-white/7 text-t2 hover:text-t1 transition-all"
          >
            <ChevronLeft className={cn("w-5 h-5 transition-transform", !isSidebarOpen && "rotate-180")} />
          </button>

          {onToggleRole && (
            <button 
              onClick={onToggleRole}
              className="px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-ac/30 bg-ac/5 text-ac hover:bg-ac/10 transition-all shrink-0"
            >
              Switch to Client
            </button>
          )}
          
          <h1 className="font-display text-xl font-bold text-t1 flex-1">{paneTitle}</h1>

          <div className="hidden md:flex items-center gap-3 bg-s2 border border-white/7 rounded-xl px-4 py-2 w-[280px]">
            <Search className="w-4 h-4 text-t3" />
            <input 
              type="text" 
              placeholder="Search clients, sessions..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-t1 w-full placeholder:text-t4"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative w-10 h-10 rounded-xl border border-white/7 flex items-center justify-center text-t2 hover:text-t1 transition-all"
              >
                <Bell className="w-5 h-5" />
                <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-err border-2 border-s1" />
              </button>
              
              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-s1 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-white/7 flex items-center justify-between">
                        <span className="text-xs font-bold text-t1 uppercase tracking-widest">Notifications</span>
                        <button 
                          onClick={() => showToast('All notifications marked as read', 'success')}
                          className="text-[10px] text-ac font-bold hover:underline"
                        >
                          Mark all read
                        </button>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {NOTIFICATIONS.map((n) => (
                          <div 
                            key={n.id} 
                            onClick={() => {
                              setSelectedNotification(n);
                              setIsNotificationsOpen(false);
                            }}
                            className="p-4 border-b border-white/5 hover:bg-white/2 transition-colors cursor-pointer"
                          >
                            <div className="flex gap-3">
                              <div className={cn("w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0", n.color)}>
                                {n.icon}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-t1">{n.title}</div>
                                <div className="text-xs text-t3 mt-0.5 line-clamp-2">{n.desc}</div>
                                <div className="text-[10px] text-t4 mt-1.5">{n.time}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={() => showToast('Full notification history coming soon!', 'info')}
                        className="w-full p-3 text-xs text-t3 hover:text-t1 hover:bg-white/2 transition-colors border-t border-white/7"
                      >
                        View all notifications
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-10 h-10 rounded-xl border border-white/7 flex items-center justify-center text-t2 hover:text-t1 transition-all overflow-hidden"
              >
                <div className="w-full h-full bg-gradient-to-br from-ac2 to-ac flex items-center justify-center font-display text-xs font-bold text-white">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    user.initials
                  )}
                </div>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-s1 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-white/7">
                        <div className="text-sm font-bold text-t1">{user.firstName} {user.lastName}</div>
                        <div className="text-[10px] text-t3 mt-0.5">ahmed.trainer@coachly.fit</div>
                      </div>
                      <div className="p-2">
                        <button 
                          onClick={() => { setIsSettingsOpen(true); setIsProfileOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-t2 hover:text-t1 hover:bg-white/5 transition-all"
                        >
                          <User className="w-4 h-4" />
                          Profile Settings
                        </button>
                        <button 
                          onClick={() => { setIsBillingOpen(true); setIsProfileOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-t2 hover:text-t1 hover:bg-white/5 transition-all"
                        >
                          <Wallet className="w-4 h-4" />
                          Billing & Payouts
                        </button>
                        <button 
                          onClick={() => { setIsSubscriptionOpen(true); setIsProfileOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-t2 hover:text-t1 hover:bg-white/5 transition-all"
                        >
                          <Sparkles className="w-4 h-4" />
                          Pro Subscription
                        </button>
                      </div>
                      <div className="p-2 border-t border-white/7">
                        <button 
                          onClick={onSignOut}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-err hover:bg-err/5 transition-all"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <AnimatePresence mode="wait">
            {activePane === 'overview' && <OverviewPane key="overview" onShowClient={setSelectedClientId} />}
            {activePane === 'sessions' && <SessionsPane key="sessions" onOpenNewSession={() => setIsNewSessionModalOpen(true)} />}
            {activePane === 'clients' && <ClientsPane key="clients" onShowClient={setSelectedClientId} />}
            {activePane === 'workout' && <WorkoutPane key="workout" showToast={showToast} />}
            {activePane === 'progress' && <ProgressPane key="progress" showToast={showToast} />}
            {activePane === 'earnings' && <EarningsPane key="earnings" />}
            {activePane === 'messages' && <MessagesPane key="messages" />}
            {activePane === 'ai' && <AIAssistantPane key="ai" />}
          </AnimatePresence>
        </div>

        {/* MODALS */}
        <AnimatePresence>
          {selectedClientId && (
            <ClientDetailsModal 
              client={CLIENTS.find(c => c.id === selectedClientId)!} 
              onClose={() => setSelectedClientId(null)} 
              showToast={showToast}
            />
          )}
          {isNewSessionModalOpen && (
            <NewSessionModal onClose={() => setIsNewSessionModalOpen(false)} showToast={showToast} />
          )}
          {isSettingsOpen && (
            <ProfileSettingsModal onClose={() => setIsSettingsOpen(false)} showToast={showToast} user={user} appUser={appUser} onUpdateUser={onUpdateUser} />
          )}
          {isBillingOpen && (
            <BillingPayoutsModal onClose={() => setIsBillingOpen(false)} showToast={showToast} />
          )}
          {isSubscriptionOpen && (
            <ProSubscriptionModal onClose={() => setIsSubscriptionOpen(false)} showToast={showToast} />
          )}
          {selectedNotification && (
            <NotificationDetailModal 
              notification={selectedNotification} 
              onClose={() => setSelectedNotification(null)} 
            />
          )}
        </AnimatePresence>

        {/* TOAST */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 20, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 20, x: '-50%' }}
              className={cn(
                "fixed bottom-8 left-1/2 px-6 py-3 rounded-xl text-sm font-bold z-[100] border shadow-2xl",
                toast.type === 'success' ? "bg-ac text-black border-ac" : 
                toast.type === 'error' ? "bg-err text-white border-err" : 
                "bg-s3 text-t1 border-white/10"
              )}
            >
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function WithdrawModal({ onClose }: { onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleWithdraw = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-s1 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl font-bold text-t1">Withdraw Funds</h2>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-t3 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-ac/5 border border-ac/20 rounded-2xl">
              <span className="text-[10px] font-bold text-ac uppercase tracking-widest">Available Balance</span>
              <div className="text-2xl font-display font-bold text-ac mt-1">AED 12,450.00</div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-t3 uppercase tracking-widest">Amount to Withdraw</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-t3 font-bold">AED</div>
                <input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-14 pr-4 py-4 bg-s2 border border-white/7 rounded-2xl text-xl font-display font-bold text-t1 outline-none focus:border-ac transition-all"
                />
              </div>
            </div>

            <div className="p-4 bg-s2 border border-white/7 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-ac" />
                </div>
                <div>
                  <div className="text-sm font-bold text-t1">Bank Transfer</div>
                  <div className="text-[10px] text-t3">Ending in **** 4492</div>
                </div>
              </div>
              <button className="text-[10px] font-bold text-ac hover:underline">Edit</button>
            </div>

            <div className="pt-4">
              <button 
                onClick={handleWithdraw}
                disabled={!amount || isProcessing}
                className="w-full py-4 rounded-2xl bg-ac text-black font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-ac/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Withdrawal'
                )}
              </button>
              <p className="text-[10px] text-t4 text-center mt-4">
                Funds typically arrive in your bank account within 2-3 business days.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ClientDetailsModal({ client, onClose, showToast }: { client: any; onClose: () => void; showToast: (m: string, t: any) => void }) {
  const [view, setView] = useState<'details' | 'progress'>('details');
  const [isBooking, setIsBooking] = useState(false);

  const handleBook = () => {
    setIsBooking(true);
    setTimeout(() => {
      setIsBooking(false);
      showToast(`Session with ${client.name} scheduled!`, 'success');
      onClose();
    }, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-s1 border border-white/10 rounded-3xl w-full max-w-[500px] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 border-b border-white/7 flex items-center gap-6">
          <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center font-display text-2xl font-bold text-white shrink-0 bg-gradient-to-br", client.grad)}>
            {client.init}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-extrabold text-t1">{client.name}</h2>
              {view === 'progress' && (
                <button 
                  onClick={() => setView('details')}
                  className="p-2 rounded-lg bg-s2 border border-white/7 text-t3 hover:text-t1 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-sm text-t3 mt-1">{client.goal}</p>
            <div className="flex gap-2 mt-3">
              <span className="px-2.5 py-1 rounded-full bg-ac/10 border border-ac/20 text-[10px] font-bold text-ac uppercase tracking-widest">{client.pack}</span>
              <span className="px-2.5 py-1 rounded-full bg-s2 border border-white/7 text-[10px] font-bold text-t3 uppercase tracking-widest">Active</span>
            </div>
          </div>
        </div>
        
        <div className="p-8">
          <AnimatePresence mode="wait">
            {view === 'details' ? (
              <motion.div 
                key="details"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-s2 border border-white/7 rounded-2xl p-4">
                    <div className="text-[10px] font-bold text-t4 uppercase tracking-widest mb-1">Sessions Used</div>
                    <div className="font-display text-xl font-bold text-t1">{client.sessions} / {client.total}</div>
                    <div className="h-1.5 bg-s3 rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-ac" style={{ width: `${(client.sessions/client.total)*100}%` }} />
                    </div>
                  </div>
                  <div className="bg-s2 border border-white/7 rounded-2xl p-4">
                    <div className="text-[10px] font-bold text-t4 uppercase tracking-widest mb-1">Last Session</div>
                    <div className="font-display text-xl font-bold text-t1">24 Mar</div>
                    <div className="text-[10px] text-t3 mt-1">Strength Training</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-t1 uppercase tracking-widest">Recent Activity</h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Completed session', date: '24 Mar' },
                      { label: 'Updated body weight', date: '22 Mar' },
                      { label: 'Purchased 10-pack', date: '15 Mar' }
                    ].map((act, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-s2/50 border border-white/5 rounded-xl">
                        <span className="text-sm text-t2">{act.label}</span>
                        <span className="text-[10px] text-t4">{act.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="progress"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-t1 uppercase tracking-widest">Weight Progress (kg)</h3>
                  <div className="text-xs text-ac font-bold">-8.2kg total</div>
                </div>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%" minHeight={0} minWidth={0} debounce={100}>
                    <AreaChart data={PROGRESS_DATA}>
                      <defs>
                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00e5a0" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#00e5a0" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#565670', fontSize: 10 }} 
                      />
                      <YAxis 
                        domain={['dataMin - 5', 'dataMax + 5']}
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#565670', fontSize: 10 }} 
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1c1c2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ fontSize: '12px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="#00e5a0" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorWeight)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-t4 uppercase tracking-widest mb-1">Start</div>
                    <div className="text-sm font-bold text-t1">82.0kg</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-t4 uppercase tracking-widest mb-1">Current</div>
                    <div className="text-sm font-bold text-ac">73.8kg</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-t4 uppercase tracking-widest mb-1">Goal</div>
                    <div className="text-sm font-bold text-t1">70.0kg</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 bg-s2/50 border-t border-white/7 flex gap-3">
          <button 
            onClick={() => setView(view === 'details' ? 'progress' : 'details')}
            className="flex-1 py-3 rounded-xl bg-s3 text-t1 text-sm font-bold hover:bg-white/10 transition-all"
          >
            {view === 'details' ? 'View Progress' : 'Back to Details'}
          </button>
          <button 
            onClick={handleBook}
            disabled={isBooking}
            className="flex-1 py-3 rounded-xl bg-ac text-black text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isBooking ? (
              <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              'Book Session'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function NewSessionModal({ onClose, showToast }: { onClose: () => void; showToast: (m: string, t: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState(CLIENTS[0].id.toString());
  const [date, setDate] = useState('2026-03-25');
  const [time, setTime] = useState('09:00');
  const [sessionType, setSessionType] = useState('In-Person · Strength');
  const [notes, setNotes] = useState('');

  const handleCreate = async () => {
    if (!auth.currentUser) {
      showToast('Please sign in to schedule sessions.', 'error');
      return;
    }
    setLoading(true);
    const path = 'sessions';
    try {
      const client = CLIENTS.find(c => c.id.toString() === clientId);
      await addDoc(collection(db, path), {
        clientId,
        clientName: client?.name || 'Unknown Client',
        date,
        time,
        type: sessionType,
        status: 'upcoming',
        notes,
        coachId: auth.currentUser.uid,
        createdAt: new Date().toISOString()
      });
      showToast('Session scheduled successfully!', 'success');
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-s1 border border-white/10 rounded-3xl w-full max-w-[440px] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/7">
          <h2 className="font-display text-xl font-extrabold text-t1">Schedule New Session</h2>
        </div>
        
        <div className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-t3 uppercase tracking-widest">Select Client</label>
            <select 
              className="field-input"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-t3 uppercase tracking-widest">Date</label>
              <input 
                type="date" 
                className="field-input" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-t3 uppercase tracking-widest">Time</label>
              <input 
                type="time" 
                className="field-input" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-t3 uppercase tracking-widest">Session Type</label>
            <select 
              className="field-input"
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
            >
              <option>In-Person · Strength</option>
              <option>In-Person · HIIT</option>
              <option>Online · Coaching</option>
              <option>In-Person · Mobility</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-t3 uppercase tracking-widest">Notes (Optional)</label>
            <textarea 
              className="field-input h-24 resize-none" 
              placeholder="Focus on squat depth..." 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="p-6 bg-s2/50 border-t border-white/7 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-s3 text-t1 text-sm font-bold hover:bg-white/10 transition-all">
            Cancel
          </button>
          <button 
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-ac text-black text-sm font-bold hover:brightness-110 transition-all flex items-center justify-center"
          >
            {loading ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : 'Confirm Session'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ProfileSettingsModal({ onClose, showToast, user, appUser, onUpdateUser }: { onClose: () => void; showToast: (m: string, t: any) => void; user: any; appUser: AppUser | null; onUpdateUser: (data: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [photoURL, setPhotoURL] = useState(user.photoURL);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setLoading(true);
    try {
      let finalPhotoURL = photoURL;
      
      if (selectedFile && auth.currentUser) {
        const storageRef = ref(storage, `avatars/${auth.currentUser.uid}`);
        await uploadBytes(storageRef, selectedFile);
        finalPhotoURL = await getDownloadURL(storageRef);
      }

      if (auth.currentUser) {
        // Update Firebase Auth Profile
        await updateProfile(auth.currentUser, {
          displayName: `${firstName} ${lastName}`,
          photoURL: finalPhotoURL
        });
        
        // Update Firestore User Document
        await userService.updateUser(auth.currentUser.uid, {
          firstName,
          lastName,
          photoURL: finalPhotoURL || undefined
        });

        // If user is a coach, also update their coachProfile displayName
        if (appUser?.role === 'coach') {
          await coachService.createOrUpdateCoachProfile(auth.currentUser.uid, {
            displayName: `${firstName} ${lastName}`
          });
        }

        await auth.currentUser.reload();
      }
      // Add a timestamp to the URL to force a refresh if it's the same path
      const displayPhotoURL = finalPhotoURL ? `${finalPhotoURL}${finalPhotoURL.includes('?') ? '&' : '?'}t=${Date.now()}` : finalPhotoURL;
      onUpdateUser({ firstName, lastName, photoURL: displayPhotoURL });
      showToast('Profile updated successfully!', 'success');
      onClose();
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-s1 border border-white/10 rounded-3xl w-full max-w-[500px] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/7 flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold text-t1">Profile Settings</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-t3 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-ac2 to-ac flex items-center justify-center font-display text-2xl font-bold text-white overflow-hidden">
              {photoURL ? (
                <img src={photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                user.initials
              )}
            </div>
            <div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-s2 border border-white/7 text-xs font-bold text-t1 hover:bg-s3 transition-all"
              >
                Change Avatar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-t3 uppercase tracking-widest">First Name</label>
              <input 
                type="text" 
                className="field-input" 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-t3 uppercase tracking-widest">Last Name</label>
              <input 
                type="text" 
                className="field-input" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-t3 uppercase tracking-widest">Bio</label>
            <textarea 
              className="field-input min-h-[100px] py-3" 
              placeholder="Tell your clients about yourself..."
              defaultValue="Elite personal trainer specializing in strength and conditioning with 8+ years of experience."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-t3 uppercase tracking-widest">Specialties</label>
            <div className="flex flex-wrap gap-2">
              {['Strength', 'Fat Loss', 'Olympic Lifting', 'Nutrition'].map(s => (
                <span key={s} className="px-3 py-1.5 rounded-lg bg-ac/10 border border-ac/20 text-[10px] font-bold text-ac uppercase tracking-widest">
                  {s}
                </span>
              ))}
              <button className="px-3 py-1.5 rounded-lg bg-s2 border border-white/7 text-[10px] font-bold text-t3 hover:text-t1 transition-all">
                + Add
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 bg-s2/50 border-t border-white/7 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-s3 text-t1 text-sm font-bold hover:bg-white/10 transition-all">
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-ac text-black text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function BillingPayoutsModal({ onClose, showToast }: { onClose: () => void; showToast: (m: string, t: any) => void }) {
  const [loading, setLoading] = useState(false);

  const handleWithdraw = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast('Withdrawal initiated! Funds will arrive in 1-2 days.', 'success');
      onClose();
    }, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-s1 border border-white/10 rounded-3xl w-full max-w-[500px] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/7 flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold text-t1">Billing & Payouts</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-t3 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-8 space-y-8">
          <div className="bg-gradient-to-br from-ac/20 to-ac2/20 border border-ac/30 rounded-2xl p-6">
            <div className="text-[10px] font-bold text-ac uppercase tracking-widest mb-1">Available Balance</div>
            <div className="font-display text-3xl font-extrabold text-t1">AED 8,750.00</div>
            <div className="text-[10px] text-t3 mt-2">Next payout scheduled for tomorrow, 09:00</div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-t1 uppercase tracking-widest">Payout Method</h3>
            <div className="flex items-center justify-between p-4 bg-s2 border border-white/7 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-s3 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-t2" />
                </div>
                <div>
                  <div className="text-sm font-bold text-t1">Emirates NBD</div>
                  <div className="text-[10px] text-t3">Ending in •••• 8829</div>
                </div>
              </div>
              <button 
                onClick={() => showToast('Payout method editing coming soon!', 'info')}
                className="text-xs text-ac font-bold hover:underline"
              >
                Edit
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-t1 uppercase tracking-widest">Recent Payouts</h3>
            <div className="space-y-2">
              {[
                { date: '15 Mar', amt: 'AED 12,400', status: 'Completed' },
                { date: '01 Mar', amt: 'AED 9,850', status: 'Completed' }
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-s2/50 border border-white/5 rounded-xl">
                  <div className="text-sm text-t2">{p.date}</div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-bold text-t1">{p.amt}</div>
                    <div className="text-[10px] text-ac font-bold uppercase">{p.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-s2/50 border-t border-white/7 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-s3 text-t1 text-sm font-bold hover:bg-white/10 transition-all">
            Close
          </button>
          <button 
            onClick={handleWithdraw}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-ac text-black text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : 'Withdraw Now'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ProSubscriptionModal({ onClose, showToast }: { onClose: () => void; showToast: (m: string, t: any) => void }) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast('Welcome to BodyGig Pro!', 'success');
      onClose();
    }, 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-s1 border border-white/10 rounded-3xl w-full max-w-[500px] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative h-40 bg-gradient-to-br from-ac to-ac2 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
          </div>
          <Sparkles className="w-16 h-16 text-white relative z-10" />
        </div>
        
        <div className="p-8 space-y-6">
          <div className="text-center">
            <h2 className="font-display text-2xl font-extrabold text-t1">Upgrade to Pro</h2>
            <p className="text-sm text-t3 mt-2">Take your coaching business to the next level</p>
          </div>

          <div className="space-y-4">
            {[
              { title: 'Lower Commission', desc: 'Pay only 5% platform fee (instead of 15%)' },
              { title: 'Featured Placement', desc: 'Appear at the top of client search results' },
              { title: 'Advanced AI Tools', desc: 'Unlimited AI workout & nutrition generation' },
              { title: 'Priority Support', desc: '24/7 dedicated account manager' }
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-5 h-5 rounded-full bg-ac/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-ac" />
                </div>
                <div>
                  <div className="text-sm font-bold text-t1">{f.title}</div>
                  <div className="text-xs text-t3">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-s2 border border-white/7 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-t3 uppercase tracking-widest">Monthly Plan</div>
              <div className="text-sm font-bold text-t1">AED 199 / month</div>
            </div>
            <div className="px-3 py-1 rounded-full bg-ac/10 border border-ac/20 text-[10px] font-bold text-ac uppercase tracking-widest">Best Value</div>
          </div>
        </div>

        <div className="p-6 bg-s2/50 border-t border-white/7 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-s3 text-t1 text-sm font-bold hover:bg-white/10 transition-all">
            Maybe Later
          </button>
          <button 
            onClick={handleUpgrade}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-ac text-black text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : 'Upgrade Now'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function NotificationDetailModal({ notification, onClose }: { notification: any; onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-s1 border border-white/10 rounded-3xl w-full max-w-[440px] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/7 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center", notification.color)}>
              {notification.icon}
            </div>
            <h2 className="font-display text-xl font-extrabold text-t1">{notification.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-t3 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="text-xs text-t4 uppercase tracking-widest">{notification.time}</div>
          <div className="text-sm text-t2 leading-relaxed whitespace-pre-wrap">
            {notification.fullContent}
          </div>
        </div>

        <div className="p-6 bg-s2/50 border-t border-white/7">
          <button onClick={onClose} className="w-full py-3 rounded-xl bg-ac text-black text-sm font-bold hover:brightness-110 transition-all">
            Dismiss
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function NavItem({ icon, label, active, onClick, collapsed, badge }: { 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
  onClick: () => void; 
  collapsed: boolean;
  badge?: number | string;
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-6 py-3.5 transition-all relative group",
        active ? "text-ac bg-ac/5" : "text-t2 hover:text-t1 hover:bg-s2"
      )}
    >
      {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-ac" />}
      <div className={cn("shrink-0", active ? "text-ac" : "text-t3 group-hover:text-t2")}>
        {icon}
      </div>
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
      {!collapsed && badge && (
        <div className={cn(
          "ml-auto rounded-full bg-err text-white text-[10px] font-bold flex items-center justify-center font-display",
          typeof badge === 'number' ? "w-5 h-5" : "px-2 py-0.5"
        )}>
          {badge}
        </div>
      )}
      {collapsed && badge && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-err" />
      )}
    </button>
  );
}

const OverviewPane: React.FC<{ onShowClient: (id: number) => void }> = ({ onShowClient }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          label="This Month" 
          value="AED 28,350" 
          delta="+14%" 
          trend="up" 
          icon={<DollarSign className="w-4 h-4 text-ac" />} 
          data={[22000, 24000, 21000, 26000, 24500, 28350]}
        />
        <KPICard 
          label="Sessions This Week" 
          value="18" 
          delta="+3" 
          trend="up" 
          icon={<Calendar className="w-4 h-4 text-info" />} 
          data={[12, 15, 14, 16, 15, 18]}
        />
        <KPICard 
          label="Active Clients" 
          value="84" 
          delta="+6" 
          trend="up" 
          icon={<Users className="w-4 h-4 text-ac2" />} 
          data={[72, 75, 78, 80, 82, 84]}
        />
        <KPICard 
          label="Avg Rating" 
          value="4.9" 
          delta="127 reviews" 
          trend="up" 
          icon={<Star className="w-4 h-4 text-warn" />} 
          data={[4.7, 4.8, 4.8, 4.9, 4.9, 4.9]}
        />
      </div>

      {/* REVENUE CHART */}
      <div className="bg-s1 border border-white/7 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-display text-base font-bold text-t1">Revenue & Sessions</h3>
            <p className="text-xs text-t3 mt-1">Daily performance overview</p>
          </div>
          <div className="flex bg-s2 border border-white/7 rounded-lg p-1 gap-1">
            <button className="px-3 py-1.5 rounded-md text-[10px] font-bold bg-ac text-black">7D</button>
            <button className="px-3 py-1.5 rounded-md text-[10px] font-bold text-t3 hover:text-t1">30D</button>
            <button className="px-3 py-1.5 rounded-md text-[10px] font-bold text-t3 hover:text-t1">3M</button>
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%" minHeight={0} minWidth={0} debounce={100}>
            <AreaChart data={REVENUE_DATA}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00e5a0" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#00e5a0" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#565670', fontSize: 10 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#565670', fontSize: 10 }} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1c1c2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Area 
                type="monotone" 
                dataKey="rev" 
                stroke="#00e5a0" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRev)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TODAY'S SESSIONS */}
        <div className="bg-s1 border border-white/7 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-base font-bold text-t1">Today's Sessions</h3>
            <button className="text-xs text-ac hover:underline">View all</button>
          </div>
          <div className="space-y-3">
            {SESSIONS.slice(0, 3).map(session => (
              <SessionItem key={session.id} session={session} />
            ))}
          </div>
        </div>

        {/* MINI CALENDAR */}
        <div className="bg-s1 border border-white/7 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-base font-bold text-t1">March 2026</h3>
            <div className="flex gap-2">
              <button className="p-1.5 rounded-lg border border-white/7 text-t3 hover:text-t1 transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded-lg border border-white/7 text-t3 hover:text-t1 transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <MiniCalendar />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* RECENT CLIENTS */}
        <div className="bg-s1 border border-white/7 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-base font-bold text-t1">Recent Clients</h3>
            <button className="text-xs text-ac hover:underline">View all</button>
          </div>
          <div className="space-y-4">
            {CLIENTS.slice(0, 3).map(client => (
              <div key={client.id} onClick={() => onShowClient(client.id)}>
                <ClientRow client={client} />
              </div>
            ))}
          </div>
        </div>

        {/* MESSAGES */}
        <div className="bg-s1 border border-white/7 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-base font-bold text-t1">Messages</h3>
            <button className="text-xs text-ac hover:underline">View all</button>
          </div>
          <div className="space-y-4">
            {MSGS.slice(0, 3).map((msg, i) => (
              <MessageItem key={i} msg={msg} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function KPICard({ label, value, delta, trend, icon, data }: { 
  label: string; 
  value: string; 
  delta: string; 
  trend: 'up' | 'down'; 
  icon: React.ReactNode;
  data: number[];
}) {
  return (
    <div className="bg-s1 border border-white/7 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-s2 border border-white/7 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-[10px] font-bold text-t3 uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <div className={cn("font-display text-2xl font-extrabold text-t1", trend === 'up' && label === 'This Month' && "text-ac")}>
          {value}
        </div>
        <div className={cn("text-[10px] font-bold", trend === 'up' ? "text-ac" : "text-err")}>
          {trend === 'up' ? '↑' : '↓'} {delta}
        </div>
      </div>
      <div className="h-[40px] mt-4">
        <ResponsiveContainer width="100%" height="100%" minHeight={0} minWidth={0} debounce={100}>
          <LineChart data={data.map((v, i) => ({ v, i }))}>
            <Line 
              type="monotone" 
              dataKey="v" 
              stroke="#00e5a0" 
              strokeWidth={2} 
              dot={false} 
              opacity={0.6}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const SessionItem: React.FC<{ session: any }> = ({ session }) => {
  const statusClass = session.status === 'confirmed' ? 'bg-ac/10 border-ac/20 text-ac' : 
                     session.status === 'pending' ? 'bg-warn/10 border-warn/20 text-warn' : 
                     'bg-s3 border-white/7 text-t3';

  return (
    <div className="flex items-center gap-4 p-3 bg-s2 border border-white/7 rounded-xl hover:border-white/13 transition-all cursor-pointer group">
      <div className="w-12 text-center shrink-0">
        <div className="font-display text-sm font-bold text-t1">{session.time}</div>
        <div className="text-[10px] text-t3 mt-0.5">{session.date}</div>
      </div>
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-display text-xs font-bold text-white shrink-0 bg-gradient-to-br", session.cgrad)}>
        {session.cinit}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-t1 truncate group-hover:text-ac transition-colors">{session.client}</div>
        <div className="text-[10px] text-t3 mt-0.5 truncate">{session.type}</div>
      </div>
      <div className={cn("px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider border", statusClass)}>
        {session.status}
      </div>
      <div className="text-xs font-bold text-ac ml-2">{session.price}</div>
    </div>
  );
}

function ClientRow({ client }: { client: any }) {
  const pct = Math.round((client.sessions / client.total) * 100);
  return (
    <div className="flex items-center gap-4 group cursor-pointer">
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-display text-xs font-bold text-white shrink-0 bg-gradient-to-br", client.grad)}>
        {client.init}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-t1 group-hover:text-ac transition-colors">{client.name}</div>
        <div className="text-[10px] text-t3 mt-0.5 truncate">{client.goal}</div>
      </div>
      <div className="hidden sm:block w-32 shrink-0">
        <div className="h-1.5 bg-s3 rounded-full overflow-hidden">
          <div className="h-full bg-ac" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-[9px] text-t3 mt-1.5">{client.sessions}/{client.total} sessions used</div>
      </div>
      <div className="text-[10px] text-t2 font-medium whitespace-nowrap">
        <span className="text-ac font-bold">{client.sessions}</span> done · {client.pack}
      </div>
    </div>
  );
}

const MessageItem: React.FC<{ msg: any }> = ({ msg }) => {
  return (
    <div className={cn(
      "flex gap-4 p-3 rounded-xl border transition-all cursor-pointer relative",
      msg.unread ? "bg-ac/5 border-ac/20" : "bg-s2 border-white/7 hover:border-white/13"
    )}>
      {msg.unread && <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-ac" />}
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-display text-xs font-bold text-white shrink-0 bg-gradient-to-br", msg.grad)}>
        {msg.init}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-t1">{msg.name}</span>
          <span className="text-[10px] text-t3">{msg.time}</span>
        </div>
        <div className="text-[11px] text-t3 truncate leading-relaxed">{msg.preview}</div>
      </div>
      {msg.unread && <div className="w-1.5 h-1.5 rounded-full bg-ac mt-2.5 shrink-0" />}
    </div>
  );
}

function MiniCalendar() {
  const DOWS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const sessDays = [3, 5, 7, 10, 12, 14, 17, 19, 21, 24, 25, 26, 28];
  const today = 24;

  return (
    <div className="grid grid-cols-7 gap-1">
      {DOWS.map(d => (
        <div key={d} className="text-[10px] font-bold text-t4 text-center py-2">{d}</div>
      ))}
      {Array.from({ length: 31 }).map((_, i) => {
        const d = i + 1;
        const isToday = d === today;
        const isPast = d < today;
        const hasSess = sessDays.includes(d);

        return (
          <div 
            key={d} 
            className={cn(
              "aspect-square rounded-lg flex items-center justify-center text-[11px] font-display font-bold transition-all border",
              isToday ? "bg-ac text-black border-ac" : 
              hasSess ? "bg-ac/10 text-ac border-ac/20 hover:bg-ac/20 cursor-pointer" : 
              isPast ? "text-t4 border-transparent" : "text-t3 border-transparent hover:border-white/10 cursor-default"
            )}
          >
            {d}
          </div>
        );
      })}
    </div>
  );
}

const SessionsPane: React.FC<{ onOpenNewSession: () => void }> = ({ onOpenNewSession }) => {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'pending'>('all');

  const filteredSessions = useMemo(() => {
    if (filter === 'all') return SESSIONS;
    return SESSIONS.filter(s => s.status === filter || (filter === 'upcoming' && s.status !== 'completed'));
  }, [filter]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex bg-s1 border border-white/7 rounded-xl p-1 gap-1">
          {(['all', 'upcoming', 'completed', 'pending'] as const).map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all",
                filter === f ? "bg-ac text-black" : "text-t2 hover:text-t1"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <button 
          onClick={onOpenNewSession}
          className="px-5 py-2.5 rounded-xl bg-ac text-black text-sm font-bold hover:brightness-110 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Session
        </button>
      </div>

      <div className="bg-s1 border border-white/7 rounded-2xl p-6">
        <div className="space-y-4">
          {filteredSessions.map(session => (
            <SessionItem key={session.id} session={session} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

const ClientsPane: React.FC<{ onShowClient: (id: number) => void }> = ({ onShowClient }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-sm text-t2">Showing <strong className="text-t1">84</strong> active clients</div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-3 bg-s1 border border-white/7 rounded-xl px-4 py-2 flex-1 sm:w-[240px]">
            <Search className="w-4 h-4 text-t3" />
            <input 
              type="text" 
              placeholder="Search clients..." 
              className="bg-transparent border-none outline-none text-sm text-t1 w-full placeholder:text-t4"
            />
          </div>
          <button className="px-5 py-2.5 rounded-xl bg-ac text-black text-sm font-bold hover:brightness-110 transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Invite
          </button>
        </div>
      </div>

      <div className="bg-s1 border border-white/7 rounded-2xl p-6">
        <div className="space-y-6">
          {CLIENTS.map(client => (
            <div key={client.id} onClick={() => onShowClient(client.id)} className="pb-6 border-b border-white/7 last:border-0 last:pb-0 cursor-pointer">
              <ClientRow client={client} />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

const WorkoutPane: React.FC<{ showToast: (m: string, t: any) => void }> = ({ showToast }) => {
  const [exercises, setExercises] = useState(['Back Squat 4×5 @75%', 'Romanian Deadlift 3×8', 'Bench Press 4×6', 'Pull-ups 3×max', 'Core circuit 3 rounds']);
  const [newEx, setNewEx] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [planName, setPlanName] = useState('');
  const [assignedClientId, setAssignedClientId] = useState('');
  const [isSending, setIsSending] = useState(false);

  const addEx = () => {
    if (!newEx.trim()) return;
    setExercises([...exercises, newEx.trim()]);
    setNewEx('');
  };

  const removeEx = (idx: number) => {
    setExercises(exercises.filter((_, i) => i !== idx));
  };

  const handleSendPlan = async () => {
    if (!auth.currentUser) {
      showToast('Please sign in to send plans.', 'error');
      return;
    }
    if (!planName.trim()) {
      showToast('Please enter a plan name.', 'info');
      return;
    }
    if (!assignedClientId) {
      showToast('Please select a client.', 'info');
      return;
    }
    if (exercises.length === 0) {
      showToast('Please add at least one exercise.', 'info');
      return;
    }

    setIsSending(true);
    const path = 'workouts';
    try {
      await addDoc(collection(db, path), {
        name: planName.trim(),
        exercises,
        clientId: assignedClientId,
        coachId: auth.currentUser.uid,
        createdAt: new Date().toISOString()
      });
      showToast('Workout plan sent successfully!', 'success');
      setPlanName('');
      setExercises([]);
      setAssignedClientId('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSending(false);
    }
  };

  const generateAI = async () => {
    if (!aiPrompt.trim()) {
      showToast('Please describe the goal first.', 'info');
      return;
    }
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a list of 6 exercises for a fitness workout plan based on this goal: "${aiPrompt}". 
        Return ONLY a JSON array of strings, where each string is an exercise with sets and reps. 
        Example: ["Back Squat 3x10", "Pushups 3x15"].`,
      });
      
      const text = response.text;
      const cleaned = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        setExercises(parsed);
        showToast('AI Plan generated!', 'success');
      }
    } catch (error) {
      console.error(error);
      showToast('AI generation failed. Using fallback.', 'error');
      setExercises([
        'Warm-up: Dynamic Mobility (10 min)',
        'Deadlift 5x3 @ 80% 1RM',
        'Bulgarian Split Squats 3x10 per leg',
        'Weighted Pull-ups 4x6',
        'Face Pulls 3x15',
        'Plank with Shoulder Taps 3x45s'
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-8"
    >
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-s1 border border-white/7 rounded-2xl p-6">
          <h3 className="font-display text-base font-bold text-t1 mb-6">Build Workout Plan</h3>
          
          <div className="space-y-4 mb-8">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-t3 uppercase tracking-widest">Plan Name</label>
              <input 
                type="text" 
                placeholder="e.g. Week 6 — Strength Focus" 
                className="field-input"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
              />
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-t3 uppercase tracking-widest">Exercises</label>
              <div className="space-y-2">
                {exercises.map((ex, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-s2 border border-white/7 rounded-xl group">
                    <GripVertical className="w-4 h-4 text-t4 cursor-grab" />
                    <span className="text-sm text-t1 flex-1">{ex}</span>
                    <button onClick={() => removeEx(i)} className="text-t4 hover:text-err transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2 pt-2">
                <input 
                  type="text" 
                  value={newEx}
                  onChange={(e) => setNewEx(e.target.value)}
                  placeholder="Add exercise..." 
                  className="field-input"
                  onKeyDown={(e) => e.key === 'Enter' && addEx()}
                />
                <button 
                  onClick={addEx}
                  className="px-5 py-2.5 rounded-lg bg-ac text-black text-xs font-bold hover:brightness-110 transition-all shrink-0"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/7">
            <select 
              className="flex-1 px-4 py-2.5 bg-s2 border border-white/7 rounded-xl text-sm text-t1 outline-none focus:border-ac transition-all"
              value={assignedClientId}
              onChange={(e) => setAssignedClientId(e.target.value)}
            >
              <option value="">Assign to client...</option>
              {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button 
              onClick={handleSendPlan}
              disabled={isSending}
              className="px-6 py-2.5 rounded-xl bg-ac2 text-white text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50"
            >
              {isSending ? 'Sending...' : 'Send Plan'}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-s1 border border-white/7 rounded-2xl p-6">
          <h3 className="font-display text-base font-bold text-t1 mb-6">Quick Templates</h3>
          <div className="space-y-2">
            {['Full Body Strength 3×/wk', 'HIIT Cardio Protocol', 'Olympic Lifting Cycle', 'Mobility & Recovery'].map(t => (
              <button key={t} className="w-full flex items-center justify-between p-3.5 bg-s2 border border-white/7 rounded-xl hover:border-ac/30 hover:bg-ac/5 transition-all group text-left">
                <span className="text-sm text-t2 group-hover:text-t1">{t}</span>
                <ArrowRight className="w-4 h-4 text-t4 group-hover:text-ac" />
              </button>
            ))}
          </div>
        </div>

          <div className="bg-ac2/5 border border-ac2/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-ac2/20 flex items-center justify-center text-ac2">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-display text-sm font-bold text-ac2">AI Workout Generator</h3>
            </div>
            <p className="text-xs text-t2 leading-relaxed mb-4">
              Describe a client goal and Ahmed's AI will generate a personalised weekly programme.
            </p>
            <textarea 
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. 12-week hypertrophy for a beginner..."
              className="w-full h-24 p-3 bg-s2 border border-white/7 rounded-xl text-xs text-t1 outline-none focus:border-ac2 transition-all resize-none mb-4 placeholder:text-t4"
            />
            <button 
              onClick={generateAI}
              disabled={isGenerating}
              className="w-full py-3 rounded-xl bg-ac2 text-white text-xs font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate with AI
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

const ProgressPane: React.FC<{ showToast: (m: string, t: any) => void }> = ({ showToast }) => {
  const [selectedClient, setSelectedClient] = useState(CLIENTS[0]);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [aiInsight, setAiInsight] = useState(`${selectedClient.name} — Week 14 Insight: Progress velocity is 18% above her peer cohort. Current plateau risk: low. Recommend introducing tempo training in weeks 15–16 to continue neural adaptation without increasing load prematurely.`);
  const [noteContent, setNoteContent] = useState(`${selectedClient.name.split(' ')[0]} showed marked improvement in hip hinge mechanics today. Deadlift locked in at 60kg for 4×6. Recommend progressing to 65kg next session. Energy levels excellent — sleep quality improving per her report.`);
  const [isSavingNote, setIsSavingNote] = useState(false);

  const saveNote = async () => {
    if (!auth.currentUser) {
      showToast('Please sign in to save notes.', 'error');
      return;
    }
    if (!noteContent.trim()) {
      showToast('Note content cannot be empty.', 'info');
      return;
    }

    setIsSavingNote(true);
    const path = 'notes';
    try {
      await addDoc(collection(db, path), {
        clientId: selectedClient.id.toString(),
        content: noteContent.trim(),
        createdAt: new Date().toISOString(),
        coachId: auth.currentUser.uid
      });
      showToast('Note saved successfully!', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSavingNote(false);
    }
  };

  const generateInsight = async () => {
    setIsGeneratingInsight(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Provide a short, professional AI insight for a fitness coach about their client ${selectedClient.name}. 
        The client's goal is ${selectedClient.goal}. They have completed ${selectedClient.sessions} sessions.
        Mention progress velocity, plateau risk, and a specific training recommendation. Keep it under 60 words.`,
      });
      setAiInsight(response.text);
    } catch (error) {
      console.error(error);
      setAiInsight("Unable to generate real-time insight. Based on historical data, client is performing well and should continue current progression model.");
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  useEffect(() => {
    // Reset insight when client changes
    setAiInsight(`${selectedClient.name} — Week 14 Insight: Progress velocity is 18% above her peer cohort. Current plateau risk: low. Recommend introducing tempo training in weeks 15–16 to continue neural adaptation without increasing load prematurely.`);
    setNoteContent(`${selectedClient.name.split(' ')[0]} showed marked improvement in hip hinge mechanics today. Deadlift locked in at 60kg for 4×6. Recommend progressing to 65kg next session. Energy levels excellent — sleep quality improving per her report.`);
  }, [selectedClient]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      <div className="bg-s1 border border-white/7 rounded-2xl p-6">
        <h3 className="font-display text-base font-bold text-t1 mb-6">Select Client</h3>
        <div className="flex flex-wrap gap-2">
          {CLIENTS.map(c => (
            <button 
              key={c.id}
              onClick={() => setSelectedClient(c)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold border transition-all",
                selectedClient.id === c.id ? "bg-ac/10 border-ac text-ac" : "bg-s2 border-white/7 text-t2 hover:border-white/20"
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-s1 border border-white/7 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-display text-base font-bold text-t1">
                Metrics <span className="text-ac font-normal ml-2">— {selectedClient.name}</span>
              </h3>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-8">
              <MetricCell val="72.1 kg" label="Body Weight" delta="-3.9 kg" trend="down" />
              <MetricCell val="22.4%" label="Body Fat" delta="-2.1%" trend="down" />
              <MetricCell val="+18%" label="Strength Index" delta="vs baseline" trend="up" />
            </div>

            <div className="h-[240px] w-full mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={PROGRESS_DATA}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00e5a0" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#00e5a0" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#565670', fontSize: 10 }} 
                    dy={10}
                  />
                  <YAxis 
                    domain={['dataMin - 2', 'dataMax + 2']}
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#565670', fontSize: 10 }} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1c1c2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#00e5a0" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorWeight)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-t3 uppercase tracking-widest">Session Notes</label>
              <textarea 
                className="w-full h-32 p-4 bg-s2 border border-white/7 rounded-xl text-sm text-t1 outline-none focus:border-ac transition-all resize-none"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
              />
              <button 
                onClick={saveNote}
                disabled={isSavingNote}
                className="px-6 py-2.5 rounded-xl bg-ac text-black text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50"
              >
                {isSavingNote ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-ac2/5 border border-ac2/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-ac2" />
                <h3 className="font-display text-sm font-bold text-ac2">AI Insight</h3>
              </div>
              <button 
                onClick={generateInsight}
                disabled={isGeneratingInsight}
                className="p-1.5 rounded-lg bg-ac2/10 text-ac2 hover:bg-ac2/20 transition-all"
              >
                {isGeneratingInsight ? <div className="w-3 h-3 border-2 border-ac2/20 border-t-ac2 rounded-full animate-spin" /> : <Sparkles className="w-3 h-3" />}
              </button>
            </div>
            <p className="text-xs text-t2 leading-relaxed">
              {aiInsight}
            </p>
          </div>

          <div className="bg-s1 border border-white/7 rounded-2xl p-6">
            <h3 className="font-display text-xs font-bold text-t1 mb-6 uppercase tracking-widest">Goal Tracker</h3>
            <div className="space-y-6">
              <GoalItem label="Body Weight Target" cur={72.1} tar={65} unit="kg" />
              <GoalItem label="Deadlift 1RM" cur={85} tar={100} unit="kg" />
              <GoalItem label="Body Fat %" cur={22.4} tar={18} unit="%" />
            </div>
          </div>

          <div className="bg-s1 border border-white/7 rounded-2xl p-6">
            <h3 className="font-display text-xs font-bold text-t1 mb-6 uppercase tracking-widest">Milestones</h3>
            <div className="space-y-4">
              {['First 60kg Deadlift — Week 8', 'Completed 10-session pack — Week 12', 'Hit -5kg body weight milestone'].map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-ac/10 border border-ac/20 flex items-center justify-center text-ac shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="text-xs text-t2">{m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MetricCell({ val, label, delta, trend }: { val: string; label: string; delta: string; trend: 'up' | 'down' }) {
  return (
    <div className="bg-s2 border border-white/7 rounded-xl p-4 text-center">
      <div className="font-display text-xl font-extrabold text-t1">{val}</div>
      <div className="text-[10px] text-t3 uppercase tracking-widest mt-1">{label}</div>
      <div className={cn("text-[10px] font-bold mt-2", trend === 'up' ? "text-ac" : "text-ac")}>
        {delta}
      </div>
    </div>
  );
}

function GoalItem({ label, cur, tar, unit }: { label: string; cur: number; tar: number; unit: string }) {
  const isDescending = tar < cur;
  const totalDiff = Math.abs(cur - tar);
  // Mock progress for demo
  const progress = 65; 

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold text-t3 uppercase tracking-widest">{label}</span>
        <span className="text-[10px] font-bold text-t1">{cur}{unit} → {tar}{unit}</span>
      </div>
      <div className="h-1.5 bg-s3 rounded-full overflow-hidden">
        <div className="h-full bg-ac" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

const EarningsPane: React.FC = () => {
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-s1 border border-white/7 rounded-2xl p-6">
          <div className="text-[10px] font-bold text-t3 uppercase tracking-widest mb-2">Available Balance</div>
          <div className="font-display text-3xl font-extrabold text-ac">AED 14,280</div>
          <div className="text-[10px] text-t3 mt-2">Ready to withdraw</div>
        </div>
        <div className="bg-s1 border border-white/7 rounded-2xl p-6">
          <div className="text-[10px] font-bold text-t3 uppercase tracking-widest mb-2">Pending (Escrow)</div>
          <div className="font-display text-3xl font-extrabold text-t1">AED 8,750</div>
          <div className="text-[10px] text-t3 mt-2">Releases after sessions</div>
        </div>
        <div className="bg-s1 border border-white/7 rounded-2xl p-6">
          <div className="text-[10px] font-bold text-t3 uppercase tracking-widest mb-2">Total Earned</div>
          <div className="font-display text-3xl font-extrabold text-t1">AED 312,400</div>
          <div className="text-[10px] text-t3 mt-2">Since joining Coachly Fitness</div>
        </div>
      </div>

      <div className="bg-s1 border border-white/7 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-display text-base font-bold text-t1">Monthly Earnings</h3>
          <div className="flex bg-s2 border border-white/7 rounded-lg p-1 gap-1">
            <button className="px-3 py-1.5 rounded-md text-[10px] font-bold bg-ac text-black">6M</button>
            <button className="px-3 py-1.5 rounded-md text-[10px] font-bold text-t3 hover:text-t1">1Y</button>
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={EARNINGS_DATA}>
              <defs>
                <linearGradient id="colorEarn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00e5a0" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#00e5a0" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#565670', fontSize: 10 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#565670', fontSize: 10 }} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1c1c2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
              />
              <Area 
                type="monotone" 
                dataKey="rev" 
                stroke="#00e5a0" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorEarn)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-s2 border border-white/7 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-14 h-14 rounded-2xl bg-ac/10 border border-ac/20 flex items-center justify-center text-ac shrink-0">
          <Wallet className="w-7 h-7" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="font-display text-base font-bold text-t1">Withdraw to Bank Account</h3>
          <p className="text-xs text-t3 mt-1">ENBD ···· 4821 · Instant transfer · No fees</p>
        </div>
        <button 
          onClick={() => setIsWithdrawModalOpen(true)}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-ac text-black font-bold hover:brightness-110 transition-all"
        >
          Withdraw AED 14,280
        </button>
      </div>

      <div className="bg-s1 border border-white/7 rounded-2xl p-6">
        <h3 className="font-display text-base font-bold text-t1 mb-6">Recent Transactions</h3>
        <div className="space-y-4">
          {TXNS.map((t, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-s2 border border-white/7 rounded-xl">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                t.dir === 'in' ? "bg-ac/10 text-ac" : "bg-err/10 text-err"
              )}>
                {t.dir === 'in' ? <TrendingUp className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-t1 truncate">{t.name}</div>
                <div className="text-[10px] text-t3 mt-0.5">{t.date}</div>
              </div>
              <div className={cn("font-display text-sm font-bold", t.dir === 'in' ? "text-ac" : "text-err")}>
                {t.amt}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {isWithdrawModalOpen && (
          <WithdrawModal onClose={() => setIsWithdrawModalOpen(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const MessagesPane: React.FC = () => {
  const [selectedMsg, setSelectedMsg] = useState<typeof MSGS[0] | null>(null);
  const [reply, setReply] = useState("");

  if (selectedMsg) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="h-full flex flex-col bg-s1 border border-white/7 rounded-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-white/7 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSelectedMsg(null)}
              className="p-2 rounded-lg hover:bg-white/5 text-t3 hover:text-t1 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-ac/20 flex items-center justify-center font-display text-sm font-bold text-ac">
              {selectedMsg.name[0]}
            </div>
            <div>
              <div className="text-sm font-bold text-t1">{selectedMsg.name}</div>
              <div className="text-[10px] text-ok flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-ok" />
                Online
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-white/5 text-t3 hover:text-t1 transition-all">
              <Phone className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-white/5 text-t3 hover:text-t1 transition-all">
              <Video className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-white/5 text-t3 hover:text-t1 transition-all">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex justify-center">
            <span className="px-3 py-1 rounded-full bg-white/5 text-[10px] text-t4 font-bold uppercase tracking-widest">Today</span>
          </div>
          
          <div className="flex gap-3 max-w-[80%]">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-display text-[10px] font-bold text-white shrink-0 bg-gradient-to-br", selectedMsg.grad)}>
              {selectedMsg.name[0]}
            </div>
            <div className="space-y-2">
              <div className="p-4 rounded-2xl rounded-tl-none bg-s2 border border-white/7 text-sm text-t2 leading-relaxed">
                {selectedMsg.preview}
              </div>
              <div className="text-[10px] text-t4">{selectedMsg.time}</div>
            </div>
          </div>

          <div className="flex gap-3 max-w-[80%] ml-auto flex-row-reverse">
            <div className="w-8 h-8 rounded-full bg-ac2/20 flex items-center justify-center font-display text-[10px] font-bold text-ac2 shrink-0">
              A
            </div>
            <div className="space-y-2 text-right">
              <div className="p-4 rounded-2xl rounded-tr-none bg-ac/10 border border-ac/20 text-sm text-t1 leading-relaxed">
                Hey! I've reviewed your progress. You're doing great. Let's focus on increasing the intensity of your compound lifts this week.
              </div>
              <div className="text-[10px] text-t4">10:45 AM</div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/7 bg-s1">
          <div className="flex items-center gap-3 p-2 bg-s2 border border-white/7 rounded-xl">
            <button className="p-2 text-t3 hover:text-t1 transition-all">
              <Plus className="w-5 h-5" />
            </button>
            <input 
              type="text"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-sm text-t1 outline-none"
            />
            <button className="p-2 text-ac hover:scale-110 transition-all">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-s1 border border-white/7 rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-display text-base font-bold text-t1">Inbox</h3>
        <div className="px-3 py-1 rounded-full bg-err/10 border border-err/20 text-[10px] font-bold text-err uppercase tracking-widest">
          5 Unread
        </div>
      </div>
      <div className="space-y-4">
        {MSGS.map((msg, i) => (
          <div key={i} onClick={() => setSelectedMsg(msg)}>
            <MessageItem msg={msg} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

const AIAssistantPane: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "Hello Ahmed! I'm your AI Coaching Copilot. I can help you design workouts, analyze client progress, or give you advice on training techniques. How can I assist you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: [
          { role: 'user', parts: [{ text: `You are an AI Coaching Assistant for a professional fitness coach named Ahmed. Help him with his coaching tasks. Context: He has clients like Rania K. (strength/fat loss), Marcus T. (Olympic lifting), etc. User message: ${userMsg}` }] }
        ]
      });

      const aiText = response.text || "I'm sorry, I couldn't process that request.";
      setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full flex flex-col bg-s1 border border-white/7 rounded-2xl overflow-hidden"
    >
      <div className="p-6 border-b border-white/7 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-ac/10 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-ac" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-t1">AI Coaching Copilot</h3>
          <p className="text-xs text-t3">Powered by Gemini · Always ready to help</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={cn(
            "flex gap-4 max-w-[85%]",
            msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
          )}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              msg.role === 'assistant' ? "bg-ac/20 text-ac" : "bg-ac2/20 text-ac2"
            )}>
              {msg.role === 'assistant' ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div className="space-y-1">
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed",
                msg.role === 'assistant' 
                  ? "bg-s2 border border-white/7 text-t2 rounded-tl-none" 
                  : "bg-ac/10 border border-ac/20 text-t1 rounded-tr-none"
              )}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4 max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-ac/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-ac animate-pulse" />
            </div>
            <div className="p-4 rounded-2xl bg-s2 border border-white/7 flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-ac animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-ac animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-ac animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-white/7 bg-s1/50">
        <div className="flex items-center gap-3 p-2 bg-s2 border border-white/7 rounded-2xl">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything... (e.g. 'Generate a mobility routine for Marcus')"
            className="flex-1 bg-transparent px-4 py-2 text-sm text-t1 outline-none placeholder:text-t4"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-xl bg-ac text-black hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            "Generate 4-week strength plan",
            "Analyze Rania's progress",
            "Nutrition tips for fat loss",
            "Explain RPE scale"
          ].map((suggestion, i) => (
            <button 
              key={i}
              onClick={() => setInput(suggestion)}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-t3 hover:text-ac hover:border-ac/30 hover:bg-ac/5 transition-all"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
