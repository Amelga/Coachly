import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dumbbell, 
  User, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Check, 
  Star,
  Activity,
  ShieldCheck,
  Zap,
  Gift
} from 'lucide-react';
import { LogoIcon, BrandName } from './components/Brand';
import DiscoveryPage from './components/DiscoveryPage';
import CoachProfilePage from './components/CoachProfilePage';
import CoachDashboard from './components/CoachDashboard';
import { COACHES, User as AppUser, UserRole, Coach } from './types';
import { auth } from './firebase';
import { userService } from './services/userService';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';

type Page = 'auth' | 'discovery' | 'profile' | 'dashboard';
type AuthMode = 'login' | 'signup' | 'forgot';
type Role = 'coach' | 'client';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('auth');
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [mode, setMode] = useState<AuthMode>('login');
  const [role, setRole] = useState<Role>('coach');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [points, setPoints] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [pwStrength, setPwStrength] = useState(0);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);

  const userInitials = currentUser 
    ? (currentUser.displayName?.split(' ').map(n => n[0]).join('') || 'U')
    : (firstName[0] || '') + (lastName[0] || '');

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentPage('auth');
      setMode('login');
      showToast('Signed out successfully.', 'info');
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setPhotoURL(user.photoURL);
        
        // Fetch production-grade user data from Firestore
        try {
          let userData = await userService.getUser(user.uid);
          
          // If no Firestore doc exists (e.g. first time SSO), create one
          if (!userData) {
            userData = await userService.createUser(
              user.uid, 
              user.email || '', 
              role as UserRole, 
              firstName || user.displayName?.split(' ')[0] || 'User',
              lastName || user.displayName?.split(' ').slice(1).join(' ') || '',
              user.photoURL || undefined
            );
          }
          
          setAppUser(userData);
          setRole(userData.role as Role);
          setPoints(userData.points);
          setIsVerified(userData.verified || false);
          setFirstName(userData.firstName || '');
          setLastName(userData.lastName || '');
          if (userData.photoURL) setPhotoURL(userData.photoURL);

          if (currentPage === 'auth') {
            if (userData.role === 'coach') {
              setCurrentPage('dashboard');
            } else {
              setCurrentPage('discovery');
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          showToast("Failed to load profile data.", "error");
        }
      } else {
        setAppUser(null);
        setCurrentPage('auth');
      }
    });
    return () => unsubscribe();
  }, [currentPage]); // Removed role from dependencies to avoid loops

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3200);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
  };

  const checkStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    setPwStrength(score);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showToast('Please fill in all fields.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showToast('Welcome back! Redirecting...', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!firstName || !email || password.length < 8) {
      showToast('Please complete all required fields.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create Firestore document for the new user
      await userService.createUser(
        userCredential.user.uid,
        email,
        role as UserRole,
        firstName,
        lastName
      );

      showToast(`Account created! Welcome, ${firstName} 🎉`, 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email) {
      showToast('Please enter your email address.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      showToast(`Reset link sent to ${email}`, 'success');
      setTimeout(() => setMode('login'), 2500);
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSO = async (providerName: string) => {
    setIsLoading(true);
    try {
      let provider;
      if (providerName === 'Google') {
        provider = new GoogleAuthProvider();
      } else {
        showToast(`${providerName} login is not implemented yet.`, 'info');
        setIsLoading(false);
        return;
      }
      
      await signInWithPopup(auth, provider);
      showToast(`Signed in with ${providerName}!`, 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getPwStrengthLabel = () => {
    if (!password) return 'Enter a password';
    const labels = ['', 'Weak — add length and variety', 'Fair — try a number or symbol', 'Good — almost there', 'Strong password'];
    return labels[pwStrength];
  };

  const getPwStrengthColor = () => {
    if (pwStrength >= 3) return 'text-ac';
    if (pwStrength === 2) return 'text-warn';
    if (pwStrength === 1) return 'text-err';
    return 'text-t3';
  };

  return (
    <AnimatePresence mode="wait">
      {currentPage === 'auth' ? (
        <motion.div 
          key="auth-page"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex min-h-screen bg-bg text-t1 font-sans overflow-x-hidden"
        >
          {/* LEFT PANEL */}
          <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-10 md:p-12 bg-s1 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute w-[500px] h-[500px] rounded-full bg-ac2/10 -top-[200px] -right-[200px] pointer-events-none" />
            <div className="absolute w-[300px] h-[300px] rounded-full bg-ac/10 -bottom-[120px] -left-[80px] pointer-events-none" />

            <AnimatePresence mode="wait">
              <motion.div 
                key={role}
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: -90, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="w-full max-w-[400px] relative z-10"
                style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
              >
                <div className="flex items-center justify-between mb-9">
                  <div className="flex items-center gap-3.5">
                    <LogoIcon className="w-9 h-9 text-ac" />
                    <BrandName className="text-xl" />
                  </div>
                  <button 
                    onClick={() => setRole(role === 'coach' ? 'client' : 'coach')}
                    className="px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/13 text-t2 hover:text-t1 hover:border-white/22 transition-all"
                  >
                    {role === 'client' ? 'Switch to PT' : 'Switch to Client'}
                  </button>
                </div>

              {/* MODE TABS */}
              <div className="flex bg-s2 border border-white/7 rounded-xl p-1 mb-7 gap-1">
                <button 
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${mode === 'login' ? 'bg-ac text-black font-semibold' : 'text-t2 hover:text-t1'}`}
                >
                  Log in
                </button>
                <button 
                  onClick={() => setMode('signup')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${mode === 'signup' ? 'bg-ac text-black font-semibold' : 'text-t2 hover:text-t1'}`}
                >
                  Sign up
                </button>
              </div>

              <AnimatePresence mode="wait">
                {mode === 'login' && (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h1 className="font-display text-2xl font-extrabold text-t1 mb-1.5 tracking-tight leading-tight">Welcome back</h1>
                    <p className="text-sm text-t2 mb-7 leading-relaxed">Log in to your Coachly Fitness account to continue your journey.</p>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-semibold text-t2 uppercase tracking-wider">Email address</label>
                        <div className="relative">
                          <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="field-input"
                          />
                          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-t3">
                            <Mail className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-semibold text-t2 uppercase tracking-wider">Password</label>
                        <div className="relative">
                          <input 
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Your password"
                            className="field-input"
                          />
                          <button 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-t3 hover:text-t1 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-2 mb-4">
                      <button onClick={() => setMode('forgot')} className="text-xs text-ac hover:opacity-75 transition-opacity">Forgot password?</button>
                    </div>

                    <button 
                      onClick={handleLogin}
                      disabled={isLoading}
                      className="btn-primary mb-5"
                    >
                      {isLoading ? <div className="w-4.5 h-4.5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : 'Log in to Coachly Fitness'}
                    </button>

                    <SSOSection onSSO={handleSSO} isLoading={isLoading} />

                    <div className="text-center text-sm text-t3">
                      New to Coachly Fitness? <button onClick={() => setMode('signup')} className="text-ac font-medium hover:underline">Sign up for free</button>
                    </div>
                  </motion.div>
                )}

                {mode === 'signup' && (
                  <motion.div
                    key="signup"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h1 className="font-display text-2xl font-extrabold text-t1 mb-1.5 tracking-tight leading-tight">Create your account</h1>
                    <p className="text-sm text-t2 mb-7 leading-relaxed">Join Coachly Fitness — choose how you want to get started.</p>

                    <div className="grid grid-cols-2 gap-2.5 mb-5.5">
                      <button 
                        onClick={() => setRole('coach')}
                        className={`p-3.5 rounded-xl border-1.5 transition-all text-center ${role === 'coach' ? 'border-ac bg-ac/10' : 'border-white/7 bg-s2 hover:border-white/13'}`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-2 ${role === 'coach' ? 'bg-ac/20' : 'bg-s3'}`}>
                          <Dumbbell className={`w-4.5 h-4.5 ${role === 'coach' ? 'text-ac' : 'text-t2'}`} />
                        </div>
                        <div className="text-sm font-semibold text-t1 font-display">Join as Coach</div>
                        <div className="text-[11px] text-t3 mt-0.5">Build your client base</div>
                      </button>
                      <button 
                        onClick={() => setRole('client')}
                        className={`p-3.5 rounded-xl border-1.5 transition-all text-center ${role === 'client' ? 'border-ac bg-ac/10' : 'border-white/7 bg-s2 hover:border-white/13'}`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-2 ${role === 'client' ? 'bg-ac/20' : 'bg-s3'}`}>
                          <User className={`w-4.5 h-4.5 ${role === 'client' ? 'text-ac' : 'text-t2'}`} />
                        </div>
                        <div className="text-sm font-semibold text-t1 font-display">Join as Client</div>
                        <div className="text-[11px] text-t3 mt-0.5">Find your ideal coach</div>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3.5">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-semibold text-t2 uppercase tracking-wider">First name</label>
                        <input 
                          type="text" 
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Alex"
                          className="field-input"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-semibold text-t2 uppercase tracking-wider">Last name</label>
                        <input 
                          type="text" 
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Johnson"
                          className="field-input"
                        />
                      </div>
                    </div>

                    <div className="space-y-3.5 mb-4.5">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-semibold text-t2 uppercase tracking-wider">Email address</label>
                        <div className="relative">
                          <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="field-input"
                          />
                          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-t3">
                            <Mail className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-semibold text-t2 uppercase tracking-wider">Password</label>
                        <div className="relative">
                          <input 
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              checkStrength(e.target.value);
                            }}
                            placeholder="Min 8 characters"
                            className="field-input"
                          />
                          <button 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-t3 hover:text-t1 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <div className="mt-1.5">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4].map((i) => (
                              <div 
                                key={i}
                                className={`flex-1 h-0.75 rounded-full transition-all duration-300 ${i <= pwStrength ? (pwStrength >= 3 ? 'bg-ac' : pwStrength === 2 ? 'bg-warn' : 'bg-err') : 'bg-s3'}`}
                              />
                            ))}
                          </div>
                          <div className={`text-[11px] mt-1 ${getPwStrengthColor()}`}>{getPwStrengthLabel()}</div>
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-t3 mb-4.5 leading-relaxed">
                      By creating an account you agree to Coachly Fitness's <button className="text-ac hover:underline">Terms of Service</button> and <button className="text-ac hover:underline">Privacy Policy</button>.
                    </div>

                    <button 
                      onClick={handleSignup}
                      disabled={isLoading}
                      className="btn-primary mb-5"
                    >
                      {isLoading ? <div className="w-4.5 h-4.5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : 'Create my account'}
                    </button>

                    <SSOSection onSSO={handleSSO} isSignup isLoading={isLoading} />

                    <div className="text-center text-sm text-t3">
                      Already have an account? <button onClick={() => setMode('login')} className="text-ac font-medium hover:underline">Log in</button>
                    </div>
                  </motion.div>
                )}

                {mode === 'forgot' && (
                  <motion.div
                    key="forgot"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h1 className="font-display text-2xl font-extrabold text-t1 mb-1.5 tracking-tight leading-tight">Reset your password</h1>
                    <p className="text-sm text-t2 mb-7 leading-relaxed">Enter your email and we'll send a secure reset link within 60 seconds.</p>

                    <div className="space-y-1.5 mb-5">
                      <label className="block text-[11px] font-semibold text-t2 uppercase tracking-wider">Email address</label>
                      <div className="relative">
                        <input 
                          type="email" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="field-input"
                        />
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-t3">
                          <Mail className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={handleForgot}
                      disabled={isLoading}
                      className="btn-primary mb-5"
                    >
                      {isLoading ? <div className="w-4.5 h-4.5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : 'Send reset link'}
                    </button>

                    <div className="text-center">
                      <button 
                        onClick={() => setMode('login')} 
                        className="text-sm text-ac font-medium hover:underline flex items-center justify-center gap-1.5 mx-auto"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to log in
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>

            {/* TOAST */}
            <AnimatePresence>
              {toast && (
                <motion.div
                  initial={{ opacity: 0, y: 20, x: '-50%' }}
                  animate={{ opacity: 1, y: 0, x: '-50%' }}
                  exit={{ opacity: 0, y: 20, x: '-50%' }}
                  className={`absolute bottom-6 left-1/2 px-4.5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap z-50 border ${
                    toast.type === 'success' ? 'bg-ac/12 border-ac/30 text-ac' : 
                    toast.type === 'error' ? 'bg-err/10 border-err/25 text-err' : 
                    'bg-s3 border-white/13 text-t2'
                  }`}
                >
                  {toast.msg}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT PANEL */}
          <div className="hidden md:flex w-1/2 relative overflow-hidden flex-col justify-end">
            <div className="absolute inset-0 bg-[#060b12]">
              {/* GEOMETRIC FITNESS ILLUSTRATION (SVG) */}
              <svg className="w-full h-full object-cover opacity-80" viewBox="0 0 600 800" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <radialGradient id="glow1" cx="50%" cy="40%" r="50%">
                    <stop offset="0%" stopColor="#00e5a0" stopOpacity="0.15"/>
                    <stop offset="100%" stopColor="#00e5a0" stopOpacity="0"/>
                  </radialGradient>
                  <radialGradient id="glow2" cx="80%" cy="20%" r="40%">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.18"/>
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/>
                  </radialGradient>
                </defs>
                <rect width="600" height="800" fill="url(#glow1)"/>
                <rect width="600" height="800" fill="url(#glow2)"/>
                
                {/* GRID LINES */}
                <g stroke="rgba(255,255,255,0.04)" strokeWidth="1">
                  {[100, 200, 300, 400, 500, 600].map(y => <line key={`h${y}`} x1="0" y1={y} x2="600" y2={y}/>)}
                  {[100, 200, 300, 400, 500].map(x => <line key={`v${x}`} x1={x} y1="0" x2={x} y2="800"/>)}
                </g>

                {/* BARBELL */}
                <g transform="translate(80, 220)">
                  <rect x="0" y="26" width="440" height="8" rx="4" fill="rgba(255,255,255,0.12)"/>
                  <rect x="10" y="8" width="28" height="44" rx="5" fill="rgba(0,229,160,0.25)" stroke="rgba(0,229,160,0.5)" strokeWidth="1"/>
                  <rect x="44" y="14" width="22" height="32" rx="4" fill="rgba(0,229,160,0.18)" stroke="rgba(0,229,160,0.35)" strokeWidth="1"/>
                  <rect x="402" y="8" width="28" height="44" rx="5" fill="rgba(0,229,160,0.25)" stroke="rgba(0,229,160,0.5)" strokeWidth="1"/>
                  <rect x="374" y="14" width="22" height="32" rx="4" fill="rgba(0,229,160,0.18)" stroke="rgba(0,229,160,0.35)" strokeWidth="1"/>
                </g>

                {/* ATHLETE SILHOUETTE */}
                <g transform="translate(240, 120)">
                  <circle cx="60" cy="45" r="22" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
                  <path d="M55 68 L45 130 L75 138 L80 72" fill="rgba(0,229,160,0.15)" stroke="rgba(0,229,160,0.4)" strokeWidth="1.5"/>
                  <path d="M48 80 Q20 110 18 138" stroke="rgba(255,255,255,0.35)" strokeWidth="8" strokeLinecap="round" fill="none"/>
                  <path d="M78 82 Q100 112 102 138" stroke="rgba(255,255,255,0.35)" strokeWidth="8" strokeLinecap="round" fill="none"/>
                  <path d="M50 138 L36 200 L42 202 L58 145" fill="rgba(124,58,237,0.2)" stroke="rgba(124,58,237,0.5)" strokeWidth="1.5"/>
                  <path d="M72 138 L88 200 L82 202 L66 145" fill="rgba(124,58,237,0.2)" stroke="rgba(124,58,237,0.5)" strokeWidth="1.5"/>
                </g>

                {/* HEART RATE LINE */}
                <g transform="translate(0, 480)">
                  <polyline points="0,40 60,40 90,40 110,10 130,70 150,40 190,40 210,20 230,60 250,40 300,40 340,40 360,15 380,65 400,40 440,40 460,25 480,55 500,40 600,40" stroke="rgba(0,229,160,0.5)" strokeWidth="2" fill="none"/>
                  <circle cx="380" cy="15" r="4" fill="#00e5a0" opacity="0.8"/>
                </g>
              </svg>
              <div className="absolute inset-0 bg-gradient-to-t from-[#060b12]/95 via-[#060b12]/50 to-[#060b12]/20" />
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="relative z-10 p-10 md:p-11"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-ac/12 border border-ac/25 mb-4.5">
                <div className="w-1.5 h-1.5 rounded-full bg-ac" />
                <div className="text-[11px] font-semibold text-ac tracking-widest uppercase">Health Innovation · Fitness App</div>
              </div>

              <h2 className="font-display text-3xl font-extrabold text-white leading-[1.15] mb-3.5 tracking-tight">
                Train smarter.<br />
                Grow <span className="text-ac">faster</span>.<br />
                Coach better.
              </h2>

              <p className="text-sm text-white/55 leading-relaxed max-w-[340px] mb-7">
                Coachly Fitness connects elite coaches with motivated clients — verified, data-driven, and built for results that last beyond the gym.
              </p>

              <div className="flex flex-wrap gap-2 mb-5.5">
                <FeaturePill text="Verified coaches" />
                <FeaturePill text="Escrow-protected booking" />
                <FeaturePill text="AI progress tracking" />
                <FeaturePill text="Free first session" />
              </div>

              <div className="flex gap-6 mb-8">
                <Stat val="12k+" keyName="Active clients" />
                <Stat val="840+" keyName="Verified coaches" />
                <Stat val="4.9" keyName="Platform rating" />
              </div>

              <div className="bg-white/5 border border-white/8 rounded-xl p-4.5 max-w-[380px]">
                <div className="flex gap-0.75 mb-2">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3 h-3 fill-warn text-warn" />)}
                </div>
                <p className="text-sm text-white/70 leading-relaxed italic mb-2.5">
                  "Coachly Fitness completely transformed how I run my coaching business. My client roster grew from 12 to 84 in under a year — I couldn't have scaled without this platform."
                </p>
                <div className="flex items-center gap-2.5">
                  <div className="w-7.5 h-7.5 rounded-full bg-gradient-to-br from-ac2 to-ac flex items-center justify-center font-display text-[11px] font-bold text-white">JD</div>
                  <div>
                    <div className="text-xs font-medium text-white/85">Jérôme Dupont</div>
                    <div className="text-[11px] text-white/35">Elite Performance Coach, Paris</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : currentPage === 'discovery' ? (
        <motion.div
          key="discovery-page"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full"
        >
          <DiscoveryPage 
            role={role}
            user={{ firstName, lastName, initials: userInitials, isPro, photoURL }}
            appUser={appUser}
            onToggleRole={() => {
              const newRole = role === 'coach' ? 'client' : 'coach';
              setRole(newRole);
              setCurrentPage(newRole === 'coach' ? 'dashboard' : 'discovery');
            }}
            onSignOut={handleSignOut}
            onTogglePro={() => setIsPro(!isPro)}
            onUpdateUser={(data) => {
              if (data.firstName !== undefined) setFirstName(data.firstName);
              if (data.lastName !== undefined) setLastName(data.lastName);
              if (data.photoURL !== undefined) setPhotoURL(data.photoURL);
              if (appUser) setAppUser({ ...appUser, ...data } as AppUser);
            }}
            onNavigateToProfile={(coach) => {
              setSelectedCoach(coach);
              setCurrentPage('profile');
            }} 
          />
        </motion.div>
      ) : currentPage === 'dashboard' ? (
        <motion.div
          key="dashboard-page"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full"
        >
          <CoachDashboard 
            user={{ firstName, lastName, initials: userInitials, photoURL }}
            appUser={appUser}
            onSignOut={handleSignOut}
            onUpdateUser={(data) => {
              if (data.firstName !== undefined) setFirstName(data.firstName);
              if (data.lastName !== undefined) setLastName(data.lastName);
              if (data.photoURL !== undefined) setPhotoURL(data.photoURL);
              if (appUser) setAppUser({ ...appUser, ...data } as AppUser);
            }}
            onToggleRole={() => {
              setRole('client');
              setCurrentPage('discovery');
            }}
          />
        </motion.div>
      ) : (
        <motion.div
          key="profile-page"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="w-full"
        >
          {selectedCoach && (
            <CoachProfilePage 
              coach={selectedCoach} 
              onBack={() => setCurrentPage('discovery')} 
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FeaturePill({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/6 border border-white/10 text-[11px] text-white/60">
      <Check className="w-3 h-3 text-ac/70" />
      {text}
    </div>
  );
}

function Stat({ val, keyName }: { val: string; keyName: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-extrabold text-white">
        {val.includes('+') ? <>{val.replace('+', '')}<span className="text-ac">+</span></> : val}
      </div>
      <div className="text-[11px] text-white/40 uppercase tracking-widest mt-0.5">{keyName}</div>
    </div>
  );
}

function SSOSection({ onSSO, isSignup = false, isLoading = false }: { onSSO: (p: string) => void; isSignup?: boolean; isLoading?: boolean }) {
  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-white/13" />
        <div className="text-xs text-t3">{isSignup ? 'or sign up with' : 'or continue with'}</div>
        <div className="flex-1 h-px bg-white/13" />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-5.5">
        <button 
          onClick={() => onSSO('Google')} 
          disabled={isLoading}
          className="sso-btn disabled:opacity-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Google
        </button>
        <button 
          onClick={() => onSSO('Apple')} 
          disabled={isLoading}
          className="sso-btn disabled:opacity-50"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
          Apple
        </button>
        <button 
          onClick={() => onSSO('Facebook')} 
          disabled={isLoading}
          className="sso-btn disabled:opacity-50"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          Facebook
        </button>
        <button 
          onClick={() => onSSO('X')} 
          disabled={isLoading}
          className="sso-btn disabled:opacity-50"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          Sign in with X
        </button>
      </div>
    </>
  );
}
