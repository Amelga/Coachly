import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Star, 
  Check, 
  MapPin, 
  Globe, 
  Calendar, 
  MessageSquare, 
  ShieldCheck, 
  Clock, 
  Award, 
  BookOpen,
  ChevronRight,
  Play,
  Share2,
  Heart,
  X,
  CreditCard,
  ChevronLeft,
  ChevronDown,
  Sparkles,
  Info
} from 'lucide-react';
import { LogoIcon, BrandName } from './Brand';
import { Coach } from '../types';

interface CoachProfilePageProps {
  coach: Coach;
  onBack: () => void;
}

type BookingStep = 0 | 1 | 2 | 3;

export default function CoachProfilePage({ coach, onBack }: CoachProfilePageProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  
  // Booking State
  const [bookingStep, setBookingStep] = useState<BookingStep>(0);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<'In-Person' | 'Online'>('In-Person');
  const [selectedPackage, setSelectedPackage] = useState({ n: 1, price: coach.price, label: 'Single session' });
  const [payMethod, setPayMethod] = useState<'card' | 'paypal' | 'apple'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showToast, setShowToast] = useState<{ msg: string; type: 'success' | 'info' } | null>(null);

  const [currentMonth, setCurrentMonth] = useState(2); // March
  const [currentYear, setCurrentYear] = useState(2026);

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DOWS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const TIMES = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
  const TAKEN = ['09:00', '14:00', '17:00'];
  const AVAIL_DAYS = [1, 2, 3, 4, 5]; // Mon-Fri

  const handleDateClick = (day: number) => {
    setSelectedDate(day);
    setSelectedTime(null);
  };

  const handleTimeClick = (time: string) => {
    setSelectedTime(time);
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleNextStep = () => {
    if (bookingStep === 0 && selectedDate && selectedTime) setBookingStep(1);
    else if (bookingStep === 1) setBookingStep(2);
    else if (bookingStep === 2) {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setBookingStep(3);
      }, 2000);
    }
  };

  const resetBooking = () => {
    setBookingStep(0);
    setSelectedDate(null);
    setSelectedTime(null);
    setSessionType('In-Person');
    setSelectedPackage({ n: 1, price: coach.price, label: 'Single session' });
  };

  const renderCalendar = () => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(currentYear, currentMonth, d);
      const dow = date.getDay();
      const isPast = isCurrentMonth && d < today.getDate();
      const isAvailable = AVAIL_DAYS.includes(dow) && !isPast;
      const isSelected = selectedDate === d;

      days.push(
        <button
          key={d}
          disabled={!isAvailable}
          onClick={() => handleDateClick(d)}
          className={`aspect-square rounded-lg flex items-center justify-center text-xs font-display font-bold transition-all border ${
            isSelected 
              ? 'bg-ac text-black border-ac' 
              : isAvailable 
                ? 'bg-s2 text-t1 border-white/7 hover:border-ac hover:text-ac hover:bg-ac/10' 
                : 'text-t4 border-transparent cursor-default'
          } ${isCurrentMonth && d === today.getDate() && !isSelected ? 'border-ac/40 text-ac' : ''}`}
        >
          {d}
        </button>
      );
    }
    return days;
  };

  const PACKAGES = [
    { n: 1, label: 'Single session', price: coach.price, saving: 0 },
    { n: 5, label: '5-pack', price: coach.price * 5 * 0.85, saving: Math.round(coach.price * 5 * 0.15) },
    { n: 10, label: '10-pack', price: coach.price * 10 * 0.8, saving: Math.round(coach.price * 10 * 0.2) }
  ];

  return (
    <div className="min-h-screen bg-bg text-t1 font-sans">
      {/* NAV */}
      <nav className="h-[52px] bg-s1 border-b border-white/7 flex items-center px-6 gap-3 sticky top-0 z-[100]">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-t2 hover:text-t1 px-2.5 py-1.5 rounded-lg border border-white/7 hover:border-white/13 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to search
        </button>
        <div className="flex items-center gap-3 ml-4 shrink-0">
          <LogoIcon className="w-[30px] h-[30px] text-ac" />
          <BrandName className="text-lg" />
        </div>
      </nav>

      <div className="max-w-[1100px] mx-auto px-6 py-8 flex flex-col lg:flex-row gap-0 lg:gap-8">
        
        {/* LEFT COLUMN: PROFILE CONTENT */}
        <div className="flex-1 min-w-0 lg:pr-8">
          
          {/* HERO */}
          <div className="relative rounded-2xl overflow-hidden mb-6 border border-white/7 bg-s1">
            <div className={`h-36 relative overflow-hidden ${coach.avClass || 'bg-gradient-to-br from-ac2/20 to-ac/20'}`}>
              <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 140" preserveAspectRatio="xMidYMid slice">
                <circle cx="50" cy="30" r="60" fill="currentColor" className="text-ac2" />
                <circle cx="340" cy="110" r="80" fill="currentColor" className="text-ac" />
                <circle cx="200" cy="20" r="40" fill="currentColor" className="text-ac2" />
              </svg>
            </div>
            
            <div className="px-6 pb-6">
              <div className="flex items-end gap-4 -mt-9 relative z-10 mb-4">
                <div className={`w-20 h-20 rounded-full border-[3px] border-s1 flex items-center justify-center font-display text-2xl font-bold text-white shrink-0 shadow-xl overflow-hidden ${coach.avClass || 'bg-gradient-to-br from-ac2 to-ac'}`}>
                  {coach.photoURL ? (
                    <img src={coach.photoURL} alt={coach.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    coach.initials
                  )}
                </div>
                <div className="flex-1 pt-10">
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-2xl font-extrabold text-t1 tracking-tight">{coach.name}</h1>
                    {coach.verified && <ShieldCheck className="w-5 h-5 text-ac" />}
                  </div>
                  <p className="text-xs text-t2 mt-0.5">{coach.specialty} · {coach.location || 'Dubai, UAE'}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-ac/10 border border-ac/20 text-[10px] font-bold text-ac uppercase tracking-wider">
                  <Check className="w-3 h-3" /> Verified Coach
                </span>
                {coach.free && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-warn/10 border border-warn/20 text-[10px] font-bold text-warn uppercase tracking-wider">
                    Free 1st Session · 45m
                  </span>
                )}
                <span className="inline-flex items-center px-2.5 py-1 rounded bg-s2 border border-white/7 text-[10px] font-bold text-t2 uppercase tracking-wider">
                  {coach.sport}
                </span>
                {coach.skills.slice(0, 2).map(skill => (
                  <span key={skill} className="inline-flex items-center px-2.5 py-1 rounded bg-s2 border border-white/7 text-[10px] font-bold text-t2 uppercase tracking-wider">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => document.getElementById('booking-widget')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-5 py-2.5 rounded-lg bg-ac text-black text-xs font-bold font-display hover:brightness-110 transition-all"
                >
                  Book a session
                </button>
                <button 
                  onClick={() => setShowToast({ msg: `Messaging ${coach.name.split(' ')[0]}...`, type: 'info' })}
                  className="px-4 py-2.5 rounded-lg border border-white/10 text-t2 text-xs font-bold flex items-center gap-2 hover:text-t1 hover:border-white/20 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  Send message
                </button>
                <button 
                  onClick={() => setIsLiked(!isLiked)}
                  className={`px-4 py-2.5 rounded-lg border border-white/10 text-xs font-bold flex items-center gap-2 transition-all ${isLiked ? 'text-err border-err/30 bg-err/5' : 'text-t2 hover:text-t1 hover:border-white/20'}`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  {isLiked ? 'Saved' : 'Save'}
                </button>
                <button 
                  onClick={() => {
                    setShowToast({ msg: 'Profile link copied to clipboard!', type: 'success' });
                    navigator.clipboard.writeText(window.location.href);
                  }}
                  className="px-3 py-2.5 rounded-lg border border-white/10 text-t3 hover:text-t2 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-4 gap-px bg-white/7 rounded-xl overflow-hidden mb-6 border border-white/7">
            <StatCell val={coach.rating.toFixed(1)} label="Rating" color="text-ac" />
            <StatCell val={coach.reviews.toString()} label="Reviews" />
            <StatCell val={coach.clients.toString()} label="Clients" />
            <StatCell val={coach.experience || '8 yrs'} label="Experience" />
          </div>

          {/* ABOUT */}
          <div className="bg-s1 border border-white/7 rounded-2xl p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-ac" />
              <h3 className="text-[11px] font-bold text-t1 uppercase tracking-widest">About {coach.name.split(' ')[0]}</h3>
            </div>
            <div className={`text-sm text-t2 leading-relaxed ${isBioExpanded ? '' : 'line-clamp-4'}`}>
              {coach.bio || 'With over 8 years of professional coaching experience across Dubai\'s leading fitness facilities, Ahmed Al-Rashidi brings a precision-engineered approach to strength, conditioning, and human performance. Certified by NASM, ACE, and holding a Level 3 Strength & Conditioning qualification, Ahmed has worked with elite athletes, corporate professionals, and complete beginners — guiding each client toward measurable, lasting transformation.'}
            </div>
            <button 
              onClick={() => setIsBioExpanded(!isBioExpanded)}
              className="text-ac text-xs font-bold mt-3 hover:underline"
            >
              {isBioExpanded ? 'Read less' : 'Read more'}
            </button>
          </div>

          {/* SKILLS */}
          <div className="bg-s1 border border-white/7 rounded-2xl p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-ac" />
              <h3 className="text-[11px] font-bold text-t1 uppercase tracking-widest">Skills & Specialisations</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {coach.skills.map((skill, i) => (
                <span key={skill} className={`px-3 py-1.5 rounded-full text-xs border transition-all ${i < 3 ? 'bg-ac/10 border-ac/30 text-ac font-bold' : 'bg-s2 border-white/7 text-t2'}`}>
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* CERTIFICATIONS */}
          <div className="bg-s1 border border-white/7 rounded-2xl p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-ac" />
              <h3 className="text-[11px] font-bold text-t1 uppercase tracking-widest">Certifications</h3>
            </div>
            <div className="space-y-2.5">
              {[
                { name: 'NASM Certified Personal Trainer', issuer: 'National Academy of Sports Medicine', year: '2018' },
                { name: 'ACE Strength & Conditioning Specialist', issuer: 'American Council on Exercise', year: '2020' },
                { name: 'First Aid & CPR Certified', issuer: 'Dubai Red Crescent', year: '2023' }
              ].map((cert, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-s2 border border-white/7 rounded-xl">
                  <div className="w-9 h-9 rounded-lg bg-ac/10 border border-ac/20 flex items-center justify-center text-ac shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-t1 truncate">{cert.name}</div>
                    <div className="text-[10px] text-t3 truncate">{cert.issuer}</div>
                  </div>
                  <div className="text-[10px] text-t3 bg-s3 px-2 py-1 rounded font-bold">{cert.year}</div>
                </div>
              ))}
            </div>
          </div>

          {/* PACKAGES */}
          <div className="bg-s1 border border-white/7 rounded-2xl p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-ac" />
              <h3 className="text-[11px] font-bold text-t1 uppercase tracking-widest">Session Packages</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {PACKAGES.map((pkg) => (
                <button 
                  key={pkg.n}
                  onClick={() => {
                    setSelectedPackage({ n: pkg.n, price: pkg.price, label: pkg.label });
                    setBookingStep(1);
                    document.getElementById('booking-widget')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`p-4 rounded-xl border text-center transition-all relative group ${pkg.n === 5 ? 'border-ac/40 bg-ac/5' : 'border-white/7 bg-s2 hover:border-white/20'}`}
                >
                  {pkg.n === 5 && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-ac text-black text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                      Most Popular
                    </div>
                  )}
                  <div className="font-display text-2xl font-extrabold text-t1">{pkg.n}</div>
                  <div className="text-[10px] text-t3 uppercase tracking-widest mt-0.5">{pkg.n === 1 ? 'Session' : 'Sessions'}</div>
                  <div className="text-sm font-bold text-ac mt-2">AED {pkg.price.toLocaleString()}</div>
                  {pkg.saving > 0 && (
                    <div className="text-[9px] text-warn font-bold mt-1">Save AED {pkg.saving}</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* REVIEWS */}
          <div className="bg-s1 border border-white/7 rounded-2xl p-6 mb-4">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-ac" />
              <h3 className="text-[11px] font-bold text-t1 uppercase tracking-widest">Client Reviews</h3>
            </div>
            
            <div className="flex items-center gap-8 mb-8 pb-8 border-b border-white/7">
              <div className="text-center">
                <div className="font-display text-5xl font-extrabold text-t1 leading-none">{coach.rating.toFixed(1)}</div>
                <div className="flex gap-0.5 justify-center mt-2">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3 h-3 fill-warn text-warn" />)}
                </div>
                <div className="text-[10px] text-t3 uppercase tracking-widest mt-2">{coach.reviews} Reviews</div>
              </div>
              <div className="flex-1 space-y-1.5">
                {[
                  { label: '5', val: 78 },
                  { label: '4', val: 16 },
                  { label: '3', val: 4 },
                  { label: '2', val: 1 },
                  { label: '1', val: 0 }
                ].map(r => (
                  <div key={r.label} className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-t3 w-2">{r.label}</span>
                    <div className="flex-1 h-1 bg-s3 rounded-full overflow-hidden">
                      <div className="h-full bg-warn" style={{ width: `${r.val}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-t3 w-4 text-right">{r.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {[
                { name: 'Rania K.', initials: 'RK', date: 'Mar 2026', body: 'Ahmed completely transformed how I approach training. The first session set the tone — methodical, science-backed, and genuinely motivating.', tags: ['Results-driven', 'Great communication'], color: 'from-warn to-err' },
                { name: 'Marcus T.', initials: 'MT', date: 'Feb 2026', body: 'I\'ve worked with 3 trainers in Dubai before Ahmed. None came close to his level of technical knowledge, especially around Olympic lifting.', tags: ['Expert technique', 'Punctual'], color: 'from-info to-ac2' }
              ].map((rev, i) => (
                <div key={i} className="p-4 bg-s2 border border-white/7 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${rev.color} flex items-center justify-center text-[10px] font-bold text-white`}>{rev.initials}</div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-t1">{rev.name}</div>
                      <div className="flex gap-0.5 mt-0.5">
                        {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-2 h-2 fill-warn text-warn" />)}
                      </div>
                    </div>
                    <div className="text-[10px] text-t3">{rev.date}</div>
                  </div>
                  <p className="text-xs text-t2 leading-relaxed mb-3 italic">"{rev.body}"</p>
                  <div className="flex flex-wrap gap-1.5">
                    {rev.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded bg-ac/10 text-[9px] font-bold text-ac uppercase tracking-wider">{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: BOOKING WIDGET */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="sticky top-20 bg-s1 border border-white/10 rounded-2xl overflow-hidden shadow-2xl" id="booking-widget">
            <div className="p-5 border-b border-white/7">
              <div className="flex items-baseline gap-1.5">
                <div className="font-display text-2xl font-extrabold text-t1">AED {selectedPackage.price.toLocaleString()}</div>
                <div className="text-t3 text-xs font-medium">/ {selectedPackage.n === 1 ? 'session' : `${selectedPackage.n} sessions`}</div>
              </div>
              {coach.free && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warn/10 border border-warn/25 text-warn text-[10px] font-bold mt-3">
                  <Clock className="w-3 h-3" />
                  Free first session available · 45m
                </div>
              )}
              
              <div className="flex gap-1.5 mt-4">
                {bookingStep > 0 && bookingStep < 3 && (
                  <button 
                    onClick={() => setBookingStep(s => (s - 1) as BookingStep)}
                    className="p-1.5 rounded-lg border border-white/7 text-t3 hover:text-t1 mr-1 transition-all"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                )}
                {[0, 1, 2, 3].map(i => (
                  <div 
                    key={i} 
                    className={`h-1 flex-1 rounded-full transition-all duration-500 ${i < bookingStep ? 'bg-ac/40' : i === bookingStep ? 'bg-ac' : 'bg-s3'}`} 
                  />
                ))}
              </div>
            </div>

            <div className="p-5">
              <AnimatePresence mode="wait">
                {bookingStep === 0 && (
                  <motion.div 
                    key="step0"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <div>
                      <div className="text-[10px] font-bold text-t3 uppercase tracking-widest mb-3">Choose a date</div>
                      <div className="flex items-center justify-between mb-3">
                        <button onClick={() => setCurrentMonth(m => m - 1)} className="p-1.5 rounded-lg border border-white/7 text-t2 hover:text-t1"><ChevronLeft className="w-4 h-4" /></button>
                        <div className="text-xs font-bold text-t1 font-display">{MONTHS[currentMonth]} {currentYear}</div>
                        <button onClick={() => setCurrentMonth(m => m + 1)} className="p-1.5 rounded-lg border border-white/7 text-t2 hover:text-t1"><ChevronRight className="w-4 h-4" /></button>
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {DOWS.map(d => <div key={d} className="text-[9px] font-bold text-t4 text-center py-1">{d}</div>)}
                        {renderCalendar()}
                      </div>
                    </div>

                    {selectedDate && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="text-[10px] font-bold text-t3 uppercase tracking-widest mb-3">Available times</div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {TIMES.map(t => {
                            const isTaken = TAKEN.includes(t);
                            const isSelected = selectedTime === t;
                            return (
                              <button
                                key={t}
                                disabled={isTaken}
                                onClick={() => handleTimeClick(t)}
                                className={`py-2 rounded-lg text-[10px] font-bold font-display border transition-all ${
                                  isSelected 
                                    ? 'bg-ac text-black border-ac' 
                                    : isTaken 
                                      ? 'text-t4 border-transparent line-through' 
                                      : 'bg-s2 text-t2 border-white/7 hover:border-ac hover:text-ac'
                                }`}
                              >
                                {t}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {bookingStep === 1 && (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-5"
                  >
                    <div>
                      <div className="text-[10px] font-bold text-t3 uppercase tracking-widest mb-3">Session Type</div>
                      <div className="flex gap-2">
                        {(['In-Person', 'Online'] as const).map(type => (
                          <button
                            key={type}
                            onClick={() => setSessionType(type)}
                            className={`flex-1 py-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${sessionType === type ? 'bg-ac/10 border-ac text-ac' : 'bg-s2 border-white/7 text-t2 hover:border-white/20'}`}
                          >
                            {type === 'In-Person' ? <MapPin className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                            <span className="text-[10px] font-bold uppercase tracking-wider">{type}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-t3 uppercase tracking-widest mb-3">Select Package</div>
                      <div className="space-y-2">
                        {PACKAGES.map(pkg => (
                          <button
                            key={pkg.n}
                            onClick={() => setSelectedPackage({ n: pkg.n, price: pkg.price, label: pkg.label })}
                            className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${selectedPackage.n === pkg.n ? 'bg-ac/10 border-ac text-ac' : 'bg-s2 border-white/7 text-t2 hover:border-white/20'}`}
                          >
                            <div className="text-left">
                              <div className="text-xs font-bold text-t1">{pkg.n} {pkg.n === 1 ? 'Session' : 'Sessions'}</div>
                              {pkg.saving > 0 && <div className="text-[9px] text-warn font-bold">Save AED {pkg.saving}</div>}
                            </div>
                            <div className="text-sm font-bold">AED {pkg.price.toLocaleString()}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {bookingStep === 2 && (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-5"
                  >
                    <div className="p-4 bg-s2 border border-white/7 rounded-xl space-y-2">
                      <div className="text-[10px] font-bold text-t3 uppercase tracking-widest mb-1">Order Summary</div>
                      <div className="flex justify-between text-xs"><span className="text-t3">Coach</span><span className="text-t1 font-bold">{coach.name}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-t3">Date & Time</span><span className="text-t1 font-bold">{selectedDate} {MONTHS[currentMonth]}, {selectedTime}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-t3">Format</span><span className="text-t1 font-bold">{sessionType}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-t3">Package</span><span className="text-t1 font-bold">{selectedPackage.label}</span></div>
                      <div className="pt-2 mt-2 border-t border-white/7 flex justify-between items-center">
                        <span className="text-xs font-bold text-t1">Total</span>
                        <span className="text-lg font-extrabold text-ac">AED {selectedPackage.price.toLocaleString()}</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-t3 uppercase tracking-widest mb-3">Pay with</div>
                      <div className="flex gap-2 mb-4">
                        {(['card', 'paypal', 'apple'] as const).map(method => (
                          <button
                            key={method}
                            onClick={() => setPayMethod(method)}
                            className={`flex-1 py-2.5 rounded-lg border flex items-center justify-center transition-all ${payMethod === method ? 'bg-ac/10 border-ac text-ac' : 'bg-s2 border-white/7 text-t3 hover:text-t2'}`}
                          >
                            {method === 'card' ? <CreditCard className="w-4 h-4" /> : method === 'paypal' ? <span className="text-[10px] font-bold italic">PP</span> : <span className="text-[10px] font-bold"> Pay</span>}
                          </button>
                        ))}
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-t3 uppercase tracking-widest">Card Number</label>
                          <input type="text" placeholder="1234 5678 9012 3456" className="w-full px-4 py-2.5 bg-s2 border border-white/7 rounded-xl text-sm text-t1 outline-none focus:border-ac transition-all" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-t3 uppercase tracking-widest">Expiry</label>
                            <input type="text" placeholder="MM / YY" className="w-full px-4 py-2.5 bg-s2 border border-white/7 rounded-xl text-sm text-t1 outline-none focus:border-ac transition-all" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-t3 uppercase tracking-widest">CVC</label>
                            <input type="text" placeholder="123" className="w-full px-4 py-2.5 bg-s2 border border-white/7 rounded-xl text-sm text-t1 outline-none focus:border-ac transition-all" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 p-3 bg-ac/5 border border-ac/15 rounded-xl">
                      <ShieldCheck className="w-5 h-5 text-ac shrink-0 mt-0.5" />
                      <p className="text-[10px] text-t2 leading-relaxed">
                        <span className="font-bold text-ac">Escrow protected.</span> Payment is held securely and only released to {coach.name.split(' ')[0]} after your session is completed.
                      </p>
                    </div>
                  </motion.div>
                )}

                {bookingStep === 3 && (
                  <motion.div 
                    key="step3"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-ac/10 border-2 border-ac flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-ac" />
                    </div>
                    <h3 className="font-display text-xl font-extrabold text-t1 mb-2">Session booked!</h3>
                    <p className="text-xs text-t2 leading-relaxed mb-6">A confirmation and calendar invite has been sent to your email.</p>
                    
                    <div className="p-4 bg-s2 border border-white/7 rounded-xl text-left space-y-2 mb-6">
                      <div className="flex justify-between text-[10px]"><span className="text-t3">Date & Time</span><span className="text-t1 font-bold">{selectedDate} {MONTHS[currentMonth]}, {selectedTime}</span></div>
                      <div className="flex justify-between text-[10px]"><span className="text-t3">Format</span><span className="text-t1 font-bold">{sessionType}</span></div>
                      <div className="flex justify-between text-[10px]"><span className="text-t3">Paid</span><span className="text-ac font-bold">AED {selectedPackage.price.toLocaleString()}</span></div>
                    </div>

                    <div className="space-y-2">
                      <button className="btn-primary w-full">View in dashboard ↗</button>
                      <button onClick={resetBooking} className="w-full py-2.5 text-xs text-t3 hover:text-t2 font-bold transition-all">Book another session</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {bookingStep < 3 && (
              <div className="p-5 pt-0">
                <button 
                  disabled={bookingStep === 0 && (!selectedDate || !selectedTime) || isProcessing}
                  onClick={handleNextStep}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    bookingStep === 0 ? 'Choose a date & time' : 
                    bookingStep === 1 ? 'Confirm details' : 
                    `Pay AED ${selectedPackage.price.toLocaleString()}`
                  )}
                </button>
                <div className="flex items-center justify-center gap-1.5 mt-4 text-[10px] text-t4">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Secure & escrow-protected payment
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TOAST */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className={`fixed bottom-6 left-1/2 px-4.5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap z-[200] border ${
              showToast.type === 'success' ? 'bg-ac/12 border-ac/30 text-ac' : 'bg-s3 border-white/13 text-t2'
            }`}
          >
            {showToast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCell({ val, label, color = 'text-t1' }: { val: string; label: string; color?: string }) {
  return (
    <div className="bg-s1 p-4 text-center">
      <div className={`font-display text-xl font-extrabold ${color}`}>{val}</div>
      <div className="text-[10px] text-t3 uppercase tracking-widest mt-1">{label}</div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-4 rounded-2xl bg-s1 border border-white/5 flex flex-col items-center text-center">
      <div className="text-t3 mb-2">{icon}</div>
      <div className="text-[10px] font-bold text-t4 uppercase tracking-widest mb-1">{label}</div>
      <div className="text-sm font-bold text-t1">{value}</div>
    </div>
  );
}
