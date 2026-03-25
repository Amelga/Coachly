import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, storage } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Search, 
  User, 
  Star, 
  Check, 
  MessageSquare, 
  LayoutGrid, 
  List, 
  X, 
  Filter,
  ArrowRight,
  MapPin,
  Laptop,
  Repeat,
  Columns,
  LogOut,
  Settings,
  CreditCard,
  ChevronDown,
  Sparkles,
  ShieldOff
} from 'lucide-react';
import { LogoIcon, BrandName } from './Brand';

import { Coach, COACHES, CoachProfile, User as AppUser } from '../types';
import { coachService } from '../services/coachService';
import { userService } from '../services/userService';

interface DiscoveryPageProps {
  onNavigateToProfile: (coach: Coach) => void;
  role: 'coach' | 'client';
  onToggleRole: () => void;
  user: { firstName: string; lastName: string; initials: string; isPro: boolean; photoURL?: string | null };
  onSignOut: () => void;
  onTogglePro: () => void;
  onUpdateUser: (data: { firstName?: string; lastName?: string; photoURL?: string | null }) => void;
  appUser: AppUser | null;
}

export default function DiscoveryPage({ 
  onNavigateToProfile, 
  role, 
  onToggleRole, 
  user, 
  onSignOut, 
  onTogglePro, 
  onUpdateUser,
  appUser
}: DiscoveryPageProps) {
  const [coaches, setCoaches] = useState<Coach[]>(COACHES);
  const [isLoadingCoaches, setIsLoadingCoaches] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [editFirstName, setEditFirstName] = useState(user.firstName);
  const [editLastName, setEditLastName] = useState(user.lastName);
  const [editPhotoURL, setEditPhotoURL] = useState(user.photoURL);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
  };

  // Sync edit states when user prop changes (e.g. after save)
  useEffect(() => {
    setEditFirstName(user.firstName);
    setEditLastName(user.lastName);
    setEditPhotoURL(user.photoURL);
    setSelectedFile(null);
  }, [user.firstName, user.lastName, user.photoURL]);

  useEffect(() => {
    const fetchCoaches = async () => {
      setIsLoadingCoaches(true);
      try {
        const firestoreCoaches = await coachService.getAllCoaches();
        
        if (firestoreCoaches.length > 0) {
          // Map Firestore CoachProfile to UI Coach interface
          const mappedCoaches: Coach[] = await Promise.all(firestoreCoaches.map(async (cp) => {
            const coachUser = await userService.getUser(cp.userId);
            return {
              id: parseInt(cp.id.slice(-5), 16) || Math.random(), // Temporary ID mapping
              name: cp.displayName,
              initials: cp.displayName.split(' ').map(n => n[0]).join(''),
              avClass: '',
              sport: cp.coachingSkills[0] || 'Fitness',
              specialty: cp.coachingSkills[1] || 'General',
              rating: cp.rating || 5.0,
              reviews: cp.totalReviews || 0,
              price: cp.hourlyRate || 0,
              currency: cp.currency || 'AED',
              clients: 0,
              verified: coachUser?.verified || false,
              free: cp.offersFreeSession || false,
              female: false, // Would need to be in User doc
              session: 'In-Person',
              skills: cp.coachingSkills,
              rankScore: (cp.rating || 5) * 20,
              bio: cp.description,
              location: 'Dubai',
              photoURL: coachUser?.photoURL
            } as Coach;
          }));
          setCoaches(mappedCoaches);
        } else {
          // Fallback to mock data if Firestore is empty for now
          setCoaches(COACHES);
        }
      } catch (error) {
        console.error("Error fetching coaches:", error);
        setCoaches(COACHES);
      } finally {
        setIsLoadingCoaches(false);
      }
    };

    fetchCoaches();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPhotoURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      let finalPhotoURL = editPhotoURL;
      
      if (selectedFile && auth.currentUser) {
        const storageRef = ref(storage, `avatars/${auth.currentUser.uid}`);
        await uploadBytes(storageRef, selectedFile);
        finalPhotoURL = await getDownloadURL(storageRef);
      }

      if (auth.currentUser) {
        // Update Firebase Auth Profile
        await updateProfile(auth.currentUser, {
          displayName: `${editFirstName} ${editLastName}`,
          photoURL: finalPhotoURL
        });

        // Update Firestore User Document
        await userService.updateUser(auth.currentUser.uid, {
          firstName: editFirstName,
          lastName: editLastName,
          photoURL: finalPhotoURL || undefined
        });

        // If user is a coach, also update their coachProfile displayName
        if (appUser?.role === 'coach') {
          await coachService.createOrUpdateCoachProfile(auth.currentUser.uid, {
            displayName: `${editFirstName} ${editLastName}`
          });
        }

        await auth.currentUser.reload();
      }
      // Add a timestamp to the URL to force a refresh if it's the same path
      const displayPhotoURL = finalPhotoURL ? `${finalPhotoURL}${finalPhotoURL.includes('?') ? '&' : '?'}t=${Date.now()}` : finalPhotoURL;
      onUpdateUser({ firstName: editFirstName, lastName: editLastName, photoURL: displayPhotoURL });
      showToast('Profile updated successfully!', 'success');
      setIsSettingsModalOpen(false);
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Failed to update profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };
  const [sportFilter, setSportFilter] = useState('All');
  const [sessionFilter, setSessionFilter] = useState('All');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [minRating, setMinRating] = useState(4);
  const [freeFirst, setFreeFirst] = useState(true);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [femaleOnly, setFemaleOnly] = useState(false);
  const [availableToday, setAvailableToday] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('recommended');
  const [compareList, setCompareList] = useState<number[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const filteredCoaches = useMemo(() => {
    let list = coaches.filter(c => {
      const q = searchQuery.toLowerCase();
      if (q && !c.name.toLowerCase().includes(q) && !c.sport.toLowerCase().includes(q) && !c.specialty.toLowerCase().includes(q) && !c.skills.some(s => s.toLowerCase().includes(q))) return false;
      if (sportFilter !== 'All' && c.sport !== sportFilter) return false;
      if (sessionFilter !== 'All' && c.session !== sessionFilter) return false;
      if (c.price < priceRange[0] || c.price > priceRange[1]) return false;
      if (c.rating < minRating) return false;
      if (freeFirst && !c.free) return false;
      if (verifiedOnly && !c.verified) return false;
      if (femaleOnly && !c.female) return false;
      return true;
    });

    if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'price-low') list.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') list.sort((a, b) => b.price - a.price);
    else if (sortBy === 'reviews') list.sort((a, b) => b.reviews - a.reviews);
    else list.sort((a, b) => b.rankScore - a.rankScore);

    return list;
  }, [searchQuery, sportFilter, sessionFilter, priceRange, minRating, freeFirst, verifiedOnly, femaleOnly, sortBy]);

  const toggleCompare = (id: number) => {
    setCompareList(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const clearCompare = () => setCompareList([]);

  const resetFilters = () => {
    setSportFilter('All');
    setSessionFilter('All');
    setPriceRange([0, 2000]);
    setMinRating(4);
    setFreeFirst(true);
    setVerifiedOnly(true);
    setFemaleOnly(false);
    setAvailableToday(false);
    setSearchQuery('');
  };

  const activeChips = useMemo(() => {
    const chips = [];
    if (sportFilter !== 'All') chips.push({ label: sportFilter, onRemove: () => setSportFilter('All') });
    if (sessionFilter !== 'All') chips.push({ label: sessionFilter, onRemove: () => setSessionFilter('All') });
    if (priceRange[1] < 2000) chips.push({ label: `≤ AED ${priceRange[1].toLocaleString()}`, onRemove: () => setPriceRange([priceRange[0], 2000]) });
    if (freeFirst) chips.push({ label: 'Free 1st session', onRemove: () => setFreeFirst(false) });
    if (femaleOnly) chips.push({ label: 'Female coaches', onRemove: () => setFemaleOnly(false) });
    return chips;
  }, [sportFilter, sessionFilter, priceRange, freeFirst, femaleOnly]);

  return (
    <div className="flex flex-col min-h-screen bg-bg text-t1 font-sans">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 right-8 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md ${
              toast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
              toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
              'bg-blue-500/10 border-blue-500/20 text-blue-400'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${
              toast.type === 'success' ? 'bg-green-500' :
              toast.type === 'error' ? 'bg-red-500' :
              'bg-blue-500'
            }`} />
            <span className="font-medium">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP NAV */}
      <nav className="flex items-center bg-s1 border-b border-white/7 px-6 h-14 sticky top-0 z-50">
        <div className="flex items-center gap-3 mr-6 shrink-0">
          <LogoIcon className="w-[30px] h-[30px] text-ac" />
          <BrandName className="text-lg" />
        </div>

        <button 
          onClick={onToggleRole}
          className="mr-6 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-ac/30 bg-ac/5 text-ac hover:bg-ac/10 transition-all shrink-0"
        >
          {role === 'client' ? 'Switch to PT' : 'Switch to Client'}
        </button>
        
        <div className="flex-1 max-w-[400px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-t3" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search coaches, sports, skills..."
            className="w-full pl-9 pr-3.5 py-2 bg-s2 border border-white/7 rounded-lg text-xs text-t1 outline-none focus:border-ac focus:ring-2 focus:ring-ac/10 transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 ml-auto">
          {compareList.length > 0 && (
            <button 
              onClick={() => setIsCompareModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-ac2 text-white text-xs font-semibold hover:brightness-110 transition-all"
            >
              <Columns className="w-3.5 h-3.5" />
              Compare
              <div className="w-4.5 h-4.5 rounded-full bg-ac text-black text-[10px] font-bold flex items-center justify-center">
                {compareList.length}
              </div>
            </button>
          )}
          
          <div className="relative">
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-white/5 transition-all"
            >
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${user.isPro ? 'from-ac to-ac2' : 'from-ac2 to-ac'} flex items-center justify-center font-display text-xs font-bold text-white shrink-0 relative overflow-hidden`}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  user.initials
                )}
                {user.isPro && (
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-ac flex items-center justify-center border-2 border-s1">
                    <Sparkles className="w-2 h-2 text-black" />
                  </div>
                )}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-t3 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isUserMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsUserMenuOpen(false)} 
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-s1 border border-white/7 rounded-xl shadow-2xl py-2 z-50"
                  >
                    <div className="px-4 py-2 border-b border-white/7 mb-1">
                      <div className="text-xs font-bold text-t1">{user.firstName} {user.lastName}</div>
                      <div className="text-[10px] text-t3 uppercase tracking-wider mt-0.5">{user.isPro ? 'Pro Member' : 'Free Plan'}</div>
                    </div>

                    <button 
                      onClick={() => { setIsSettingsModalOpen(true); setIsUserMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-xs text-t2 hover:bg-white/5 hover:text-t1 transition-all"
                    >
                      <Settings className="w-4 h-4" />
                      Account Settings
                    </button>

                    <button 
                      onClick={() => { onTogglePro(); setIsUserMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-xs text-t2 hover:bg-white/5 hover:text-t1 transition-all"
                    >
                      {user.isPro ? <ShieldOff className="w-4 h-4 text-err" /> : <Sparkles className="w-4 h-4 text-ac" />}
                      {user.isPro ? 'Cancel Subscription' : 'Upgrade to Pro'}
                    </button>

                    <div className="h-px bg-white/7 my-1" />

                    <button 
                      onClick={onSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2 text-xs text-err hover:bg-err/10 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {isSettingsModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-s1 border border-white/7 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-5 border-b border-white/7 flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-t1">Account Settings</h3>
                <button onClick={() => setIsSettingsModalOpen(false)} className="w-8 h-8 rounded-lg bg-s2 border border-white/7 flex items-center justify-center text-t2 hover:text-t1 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex flex-col items-center mb-6">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-ac2 to-ac flex items-center justify-center font-display text-2xl font-bold text-white mb-3 relative group cursor-pointer overflow-hidden"
                  >
                    {editPhotoURL ? (
                      <img src={editPhotoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      user.initials
                    )}
                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Change</span>
                    </div>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                  />
                  <div className="text-xs text-t3">Click to update profile picture</div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-t3 uppercase tracking-widest px-1">First Name</label>
                  <input 
                    type="text" 
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-s2 border border-white/7 rounded-xl text-sm text-t1 outline-none focus:border-ac transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-t3 uppercase tracking-widest px-1">Last Name (Nick Name)</label>
                  <input 
                    type="text" 
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-s2 border border-white/7 rounded-xl text-sm text-t1 outline-none focus:border-ac transition-all"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-white/7 flex justify-end gap-3">
                <button onClick={() => setIsSettingsModalOpen(false)} className="px-4.5 py-2 rounded-lg border border-white/7 text-t2 text-sm hover:text-t1 transition-all">Cancel</button>
                <button 
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="px-4.5 py-2 rounded-lg bg-ac text-black text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-64 min-w-[256px] bg-s1 border-r border-white/7 py-5 overflow-y-auto hidden lg:block">
          <div className="px-4.5 pb-5">
            <div className="text-[10px] font-bold text-t3 tracking-widest uppercase mb-3 px-1">Sport / Category</div>
            <div className="flex flex-wrap gap-1.5">
              {['All', 'Personal Training', 'Tennis', 'Swimming', 'Football', 'Kickboxing', 'Yoga', 'CrossFit', 'Nutrition'].map(sport => (
                <button 
                  key={sport}
                  onClick={() => setSportFilter(sport)}
                  className={`px-2.5 py-1 rounded-full border text-xs transition-all ${sportFilter === sport ? 'border-ac text-ac bg-ac/10' : 'border-white/7 bg-s2 text-t2 hover:text-t1'}`}
                >
                  {sport === 'Personal Training' ? 'Training' : sport}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-px bg-white/7 mx-4.5 mb-5" />

          <div className="px-4.5 pb-5">
            <div className="text-[10px] font-bold text-t3 tracking-widest uppercase mb-3 px-1">Price range (AED/hr)</div>
            <div className="flex justify-between text-xs text-t2 mb-2">
              <span>{priceRange[0]}</span>
              <span>{priceRange[1].toLocaleString()}</span>
            </div>
            <div className="relative h-5 mt-1">
              <input 
                type="range" 
                min="0" 
                max="2000" 
                step="50"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="absolute w-full h-1 bg-s3 rounded-full appearance-none cursor-pointer accent-ac z-10"
              />
              <div 
                className="absolute top-0 h-1 bg-ac rounded-full pointer-events-none" 
                style={{ left: '0%', width: `${(priceRange[1] / 2000) * 100}%` }}
              />
            </div>
          </div>

          <div className="h-px bg-white/7 mx-4.5 mb-5" />

          <div className="px-4.5 pb-5">
            <div className="text-[10px] font-bold text-t3 tracking-widest uppercase mb-3 px-1">Minimum rating</div>
            <div className="space-y-2">
              {[5, 4, 3].map(rating => (
                <button 
                  key={rating}
                  onClick={() => setMinRating(rating)}
                  className="flex items-center gap-2 w-full py-1 text-left group"
                >
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={`w-3 h-3 ${i <= rating ? 'fill-warn text-warn' : 'text-t4'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-t3 group-hover:text-t2 transition-colors">{rating}.0{rating === 5 ? ' only' : '+'}</span>
                  <div className={`ml-auto w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] ${minRating === rating ? 'bg-ac border-ac text-black' : 'border-white/13'}`}>
                    {minRating === rating && <Check className="w-2.5 h-2.5" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-white/7 mx-4.5 mb-5" />

          <div className="px-4.5 pb-5">
            <div className="text-[10px] font-bold text-t3 tracking-widest uppercase mb-3 px-1">Session type</div>
            <div className="flex flex-wrap gap-1.5">
              {['All', 'In-Person', 'Online', 'Hybrid'].map(type => (
                <button 
                  key={type}
                  onClick={() => setSessionFilter(type)}
                  className={`px-2.5 py-1 rounded-full border text-xs transition-all ${sessionFilter === type ? 'border-ac text-ac bg-ac/10' : 'border-white/7 bg-s2 text-t2 hover:text-t1'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-white/7 mx-4.5 mb-5" />

          <div className="px-4.5 pb-5 space-y-3">
            <div className="text-[10px] font-bold text-t3 tracking-widest uppercase mb-1 px-1">More filters</div>
            <ToggleRow label="Free first session" active={freeFirst} onToggle={() => setFreeFirst(!freeFirst)} />
            <ToggleRow label="Verified only" active={verifiedOnly} onToggle={() => setVerifiedOnly(!verifiedOnly)} />
            <ToggleRow label="Female coaches" active={femaleOnly} onToggle={() => setFemaleOnly(!femaleOnly)} />
            <ToggleRow label="Available today" active={availableToday} onToggle={() => setAvailableToday(!availableToday)} />
          </div>

          <div className="px-4.5 pb-5">
            <button 
              onClick={resetFilters}
              className="w-full py-2 rounded-lg border border-white/7 text-t3 text-xs font-medium hover:border-white/22 hover:text-t1 transition-all"
            >
              Reset all filters
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-6 pt-5 flex items-center justify-between gap-4">
            <div className="text-sm text-t2">
              {isLoadingCoaches ? (
                <span className="animate-pulse">Loading coaches...</span>
              ) : (
                <>
                  <strong className="text-t1 font-semibold">{filteredCoaches.length}</strong> coach{filteredCoaches.length !== 1 ? 'es' : ''} found in Dubai
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-t3">Sort by</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-s2 border border-white/7 rounded-lg px-2.5 py-1.5 text-xs text-t1 outline-none cursor-pointer"
              >
                <option value="recommended">Recommended</option>
                <option value="rating">Highest rated</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="reviews">Most reviewed</option>
              </select>
              <div className="flex bg-s2 border border-white/7 rounded-lg p-0.5 ml-1">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-ac/10 text-ac' : 'text-t3 hover:text-t2'}`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-ac/10 text-ac' : 'text-t3 hover:text-t2'}`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {activeChips.length > 0 && (
            <div className="px-6 mt-3 flex flex-wrap gap-1.5 items-center">
              {activeChips.map((chip, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ac/10 border border-ac/20 text-[11px] text-ac">
                  {chip.label}
                  <button onClick={chip.onRemove} className="hover:text-white transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button onClick={resetFilters} className="text-[11px] text-t3 hover:text-err transition-colors px-2 py-1">Clear all</button>
            </div>
          )}

          <div className={`px-6 py-4 pb-8 ${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4' : 'flex flex-col gap-4'}`}>
            <AnimatePresence mode="popLayout">
              {filteredCoaches.map(coach => (
                <CoachCard 
                  key={coach.id} 
                  coach={coach} 
                  viewMode={viewMode} 
                  isCompared={compareList.includes(coach.id)}
                  onToggleCompare={() => toggleCompare(coach.id)}
                  onClick={() => onNavigateToProfile(coach)}
                />
              ))}
            </AnimatePresence>
          </div>

          {filteredCoaches.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-s2 border border-white/7 flex items-center justify-center mb-4">
                <Search className="w-7 h-7 text-t3" />
              </div>
              <h3 className="font-display text-lg font-bold text-t1 mb-2">No coaches found</h3>
              <p className="text-sm text-t2 leading-relaxed max-w-[300px] mb-6">Try adjusting your filters or search for a different sport or location.</p>
              <button 
                onClick={resetFilters}
                className="px-5 py-2.5 rounded-lg bg-ac text-black text-sm font-bold transition-all"
              >
                Clear all filters
              </button>
            </div>
          )}
        </main>
      </div>

      {/* COMPARE TRAY */}
      <AnimatePresence>
        {compareList.length > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 bg-s1 border-t border-white/7 px-6 py-3 flex items-center gap-4 z-40"
          >
            <span className="text-xs text-t2 shrink-0">Compare:</span>
            <div className="flex gap-2 flex-1">
              {[0, 1, 2, 3].map(i => {
                const coachId = compareList[i];
                const coach = coaches.find(c => c.id === coachId);
                return (
                  <div key={i} className={`w-12 h-12 rounded-full border-1.5 border-dashed flex items-center justify-center relative transition-all ${coach ? 'border-ac border-solid' : 'border-white/13'}`}>
                    {coach ? (
                      <>
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center font-display text-sm font-bold text-white ${coach.avClass || 'bg-gradient-to-br from-ac2 to-ac'}`}>
                          {coach.initials}
                        </div>
                        <button 
                          onClick={() => toggleCompare(coach.id)}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-err text-white flex items-center justify-center text-[10px] hover:scale-110 transition-transform"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </>
                    ) : (
                      <span className="text-t4 text-lg">+</span>
                    )}
                  </div>
                );
              })}
            </div>
            <button 
              onClick={() => setIsCompareModalOpen(true)}
              disabled={compareList.length < 2}
              className="px-5 py-2.5 rounded-lg bg-ac2 text-white text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-35 disabled:cursor-not-allowed shrink-0"
            >
              Compare now
            </button>
            <button onClick={clearCompare} className="text-xs text-t3 hover:text-err transition-colors px-2 py-1 shrink-0">Clear</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COMPARE MODAL */}
      <AnimatePresence>
        {isCompareModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 md:p-10 bg-black/70 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-s1 border border-white/7 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-5 border-b border-white/7 flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-t1">Side-by-side comparison</h3>
                <button onClick={() => setIsCompareModalOpen(false)} className="w-8 h-8 rounded-lg bg-s2 border border-white/7 flex items-center justify-center text-t2 hover:text-t1 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-s2/50">
                      <th className="p-4 text-left font-display text-[10px] font-bold text-t3 tracking-widest uppercase border-b border-white/7">Feature</th>
                      {compareList.map(id => {
                        const coach = coaches.find(c => c.id === id)!;
                        return (
                          <th key={id} className="p-4 border-b border-white/7 min-w-[160px]">
                            <div className="flex flex-col items-center gap-2">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-display text-sm font-bold text-white ${coach.avClass || 'bg-gradient-to-br from-ac2 to-ac'}`}>
                                {coach.initials}
                              </div>
                              <div className="text-center">
                                <div className="font-display text-xs font-bold text-t1">{coach.name}</div>
                                <div className="text-[10px] text-t2">{coach.sport}</div>
                              </div>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/7">
                    <CompareRow label="Rating" values={compareList.map(id => coaches.find(c => c.id === id)!.rating)} isRating />
                    <CompareRow label="Reviews" values={compareList.map(id => coaches.find(c => c.id === id)!.reviews)} />
                    <CompareRow label="Hourly rate" values={compareList.map(id => coaches.find(c => c.id === id)!.price)} isPrice />
                    <CompareRow label="Clients" values={compareList.map(id => coaches.find(c => c.id === id)!.clients)} />
                    <CompareRow label="Free session" values={compareList.map(id => coaches.find(c => c.id === id)!.free)} isBoolean />
                    <CompareRow label="Verified" values={compareList.map(id => coaches.find(c => c.id === id)!.verified)} isBoolean />
                    <CompareRow label="Format" values={compareList.map(id => coaches.find(c => c.id === id)!.session)} />
                    <CompareRow label="Specialty" values={compareList.map(id => coaches.find(c => c.id === id)!.specialty)} />
                    <tr>
                      <td className="p-4 text-t3 font-medium uppercase tracking-wider text-[10px]">Action</td>
                      {compareList.map(id => {
                        const coach = coaches.find(c => c.id === id)!;
                        return (
                          <td key={id} className="p-4 text-center">
                            <button 
                              onClick={() => {
                                onNavigateToProfile(coach);
                                setIsCompareModalOpen(false);
                              }}
                              className="px-3.5 py-1.5 rounded-lg bg-ac text-black text-[11px] font-bold hover:brightness-110 transition-all"
                            >
                              Book
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 border-t border-white/7 flex justify-end gap-2.5">
                <button onClick={() => setIsCompareModalOpen(false)} className="px-4.5 py-2 rounded-lg border border-white/7 text-t2 text-sm hover:text-t1 transition-all">Close</button>
                <button 
                  onClick={() => {
                    if (compareList.length > 0) {
                      onNavigateToProfile(compareList[0]);
                      setIsCompareModalOpen(false);
                    }
                  }}
                  className="px-4.5 py-2 rounded-lg bg-ac text-black text-sm font-bold transition-all"
                >
                  Proceed to booking
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToggleRow({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-t2">{label}</span>
      <button 
        onClick={onToggle}
        className={`w-9.5 h-5 rounded-full border transition-all relative ${active ? 'bg-ac border-ac' : 'bg-s3 border-white/7'}`}
      >
        <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all ${active ? 'left-5 bg-black' : 'left-0.5 bg-t3'}`} />
      </button>
    </div>
  );
}

interface CoachCardProps {
  key?: React.Key;
  coach: Coach;
  viewMode: 'grid' | 'list';
  isCompared: boolean;
  onToggleCompare: () => void;
  onClick: () => void;
}

function CoachCard({ coach, viewMode, isCompared, onToggleCompare, onClick }: CoachCardProps) {
  const isGrid = viewMode === 'grid';
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={onClick}
      className={`bg-s1 border rounded-xl overflow-hidden cursor-pointer transition-all hover:border-white/22 group ${isCompared ? 'border-ac border-[1.5px]' : 'border-white/7'} ${isGrid ? 'flex flex-col' : 'flex items-stretch'}`}
    >
      <div className={`${isGrid ? 'h-18' : 'w-30 min-w-[120px]'} relative overflow-hidden`}>
        <div className={`w-full h-full ${coach.avClass === 'av2' ? 'bg-gradient-to-br from-warn/15 to-err/15' : coach.avClass === 'av3' ? 'bg-gradient-to-br from-info/12 to-ac2/12' : coach.avClass === 'av4' ? 'bg-gradient-to-br from-ac/10 to-info/12' : coach.avClass === 'av5' ? 'bg-gradient-to-br from-pink-400/12 to-purple-400/12' : coach.avClass === 'av6' ? 'bg-gradient-to-br from-emerald-400/12 to-warn/10' : 'bg-gradient-to-br from-ac2/12 to-ac/12'}`}>
          {coach.photoURL && (
            <img src={coach.photoURL} alt={coach.name} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" referrerPolicy="no-referrer" />
          )}
        </div>
        {coach.free && <div className="absolute top-2.5 left-2.5 bg-warn/15 border border-warn/30 rounded px-1.5 py-0.5 text-[10px] font-bold text-warn">Free 1st</div>}
        {coach.verified && (
          <div className="absolute top-2.5 right-2.5 bg-ac/15 border border-ac/30 rounded px-1.5 py-0.5 text-[10px] font-bold text-ac flex items-center gap-1">
            <Check className="w-2 h-2" /> Verified
          </div>
        )}
      </div>

      <div className={`flex-1 p-3 px-4 flex flex-col ${isGrid ? '' : 'pt-3.5'}`}>
        <div className={`flex items-start gap-2.5 ${isGrid ? '-mt-5.5 relative z-10' : ''}`}>
          <div className={`w-12 h-12 rounded-full border-2 border-s1 flex items-center justify-center font-display text-base font-bold text-white shrink-0 overflow-hidden ${coach.avClass || 'bg-gradient-to-br from-ac2 to-ac'}`}>
            {coach.photoURL ? (
              <img src={coach.photoURL} alt={coach.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              coach.initials
            )}
          </div>
          <div className={`flex-1 ${isGrid ? 'pt-6' : ''}`}>
            <div className="font-display text-sm font-bold text-t1 leading-tight group-hover:text-ac transition-colors">{coach.name}</div>
            <div className="text-[11px] text-t2 mt-0.5">{coach.sport} · {coach.specialty}</div>
            <div className="flex items-center gap-1 mt-1.5">
              <div className="flex gap-0.25">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} className={`w-2.5 h-2.5 ${i <= coach.rating ? 'fill-warn text-warn' : 'text-t4'}`} />)}
              </div>
              <span className="text-xs font-semibold text-warn">{coach.rating.toFixed(1)}</span>
              <span className="text-[11px] text-t3">({coach.reviews})</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {coach.skills.slice(0, 3).map(s => <div key={s} className="px-2 py-0.5 rounded bg-s2 border border-white/7 text-[10px] font-semibold text-t3">{s}</div>)}
        </div>

        <div className={`grid grid-cols-3 border-t border-white/7 mt-3 ${isGrid ? '' : 'border-t-0 border-l ml-auto w-30 shrink-0'}`}>
          <div className="py-2.5 text-center border-r border-white/7">
            <div className="font-display text-sm font-bold text-t1">{coach.currency} {coach.price}</div>
            <div className="text-[10px] text-t4 uppercase tracking-wider mt-0.5">Per Hour</div>
          </div>
          <div className="py-2.5 text-center border-r border-white/7">
            <div className="font-display text-sm font-bold text-t1">{coach.clients}</div>
            <div className="text-[10px] text-t4 uppercase tracking-wider mt-0.5">Clients</div>
          </div>
          <div className="py-2.5 text-center">
            <div className="font-display text-sm font-bold text-t1">{coach.session === 'In-Person' ? '📍' : coach.session === 'Online' ? '💻' : '🔀'}</div>
            <div className="text-[10px] text-t4 uppercase tracking-wider mt-0.5">{coach.session}</div>
          </div>
        </div>
      </div>

      <div className={`p-3 px-4 pt-2.5 flex gap-2 items-center ${isGrid ? '' : 'border-l border-white/7'}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className="flex-1 py-2 rounded-lg bg-ac text-black text-xs font-bold hover:brightness-110 transition-all"
        >
          Book Session
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleCompare(); }}
          className={`px-3 py-2 rounded-lg border text-[11px] font-medium transition-all whitespace-nowrap ${isCompared ? 'bg-ac/10 border-ac text-ac' : 'bg-s2 border-white/7 text-t2 hover:border-ac hover:text-ac'}`}
        >
          {isCompared ? '✓ Added' : '+ Compare'}
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); /* handle message */ }}
          className="p-2 rounded-lg bg-s2 border border-white/7 text-t2 hover:border-white/22 hover:text-t1 transition-all"
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

function CompareRow({ label, values, isRating = false, isPrice = false, isBoolean = false }: { label: string; values: any[]; isRating?: boolean; isPrice?: boolean; isBoolean?: boolean }) {
  const getBestIndex = () => {
    if (isBoolean || typeof values[0] === 'string') return -1;
    if (isPrice) {
      const min = Math.min(...values);
      return values.indexOf(min);
    }
    const max = Math.max(...values);
    return values.indexOf(max);
  };

  const bestIdx = getBestIndex();

  return (
    <tr>
      <td className="p-4 text-t3 font-medium uppercase tracking-wider text-[10px]">{label}</td>
      {values.map((v, i) => (
        <td key={i} className={`p-4 text-center text-sm ${i === bestIdx ? 'text-ac font-bold' : 'text-t1'}`}>
          {isRating ? (
            <div className="flex flex-col items-center gap-1">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(star => <Star key={star} className={`w-2.5 h-2.5 ${star <= v ? 'fill-warn text-warn' : 'text-t4'}`} />)}
              </div>
              <span>{v.toFixed(1)}</span>
            </div>
          ) : isPrice ? (
            `AED ${v.toLocaleString()}`
          ) : isBoolean ? (
            <div className="flex justify-center">
              <div className={`w-2 h-2 rounded-full ${v ? 'bg-ac shadow-[0_0_8px_rgba(0,229,160,0.5)]' : 'bg-err'}`} />
            </div>
          ) : (
            v
          )}
        </td>
      ))}
    </tr>
  );
}
