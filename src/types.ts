export type UserRole = 'coach' | 'client' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  photoURL?: string;
  bio?: string;
  verified?: boolean;
  points: number;
}

export interface CoachProfile {
  id: string;
  userId: string;
  displayName: string;
  coachingSkills: string[];
  experienceYears: number;
  certifications?: string[];
  resumeUrl?: string;
  hourlyRate?: number;
  currency?: string;
  offersFreeSession?: boolean;
  freeSessionDuration?: number;
  rating?: number;
  totalReviews?: number;
  createdAt: string;
  description?: string;
}

export interface Arena {
  id: string;
  name: string;
  address: string;
  createdAt: string;
  description?: string;
  facilities?: string[];
}

export type SessionStatus = 'booked' | 'completed' | 'cancelled';

export interface Session {
  id: string;
  coachId: string;
  clientId: string;
  arenaId?: string;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  createdAt: string;
  notes?: string;
}

export interface Review {
  id: string;
  coachId: string;
  clientId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export type RewardTransactionType = 'earn' | 'redeem';

export interface RewardTransaction {
  id: string;
  userId: string;
  points: number;
  type: RewardTransactionType;
  source?: string;
  createdAt: string;
}

export interface ValueCode {
  id: string;
  userId: string;
  code: string;
  pointsUsed: number;
  valueEquivalent: number;
  maxUsagePercentage: number;
  isUsed: boolean;
  expiresAt: string;
  createdAt: string;
}

export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  description?: string;
}

export interface SponsorOffer {
  id: string;
  sponsorId: string;
  title: string;
  description?: string;
  requiredPoints: number;
  valueEquivalent: number;
  createdAt: string;
}

export type PaymentMethodType = 'card' | 'paypal';

export interface PaymentMethod {
  id: string;
  userId: string;
  type: PaymentMethodType;
  providerId?: string;
  createdAt: string;
}

// Legacy compatibility
export interface Coach {
  id: number;
  name: string;
  initials: string;
  photoURL?: string | null;
  avClass: string;
  sport: string;
  specialty: string;
  rating: number;
  reviews: number;
  price: number;
  currency: string;
  clients: number;
  verified: boolean;
  free: boolean;
  female: boolean;
  session: 'In-Person' | 'Online' | 'Hybrid';
  skills: string[];
  rankScore: number;
  bio?: string;
  location?: string;
  languages?: string[];
  experience?: string;
  education?: string;
  certifications?: string[];
}

export const COACHES: Coach[] = [
  {
    id: 1,
    name: 'Ahmed Al-Rashidi',
    initials: 'AA',
    avClass: '',
    sport: 'Personal Training',
    specialty: 'Strength & Conditioning',
    rating: 4.9,
    reviews: 127,
    price: 350,
    currency: 'AED',
    clients: 84,
    verified: true,
    free: true,
    female: false,
    session: 'In-Person',
    skills: ['HIIT', 'Weight Training', 'Functional'],
    rankScore: 98,
    bio: 'Elite strength coach with 10+ years of experience in high-performance training. Specializing in functional movements and body recomposition.',
    location: 'Downtown Dubai, UAE',
    languages: ['English', 'Arabic'],
    experience: '12 Years',
    education: 'MSc Sports Science',
    certifications: ['NASM-CPT', 'ASCA Level 2', 'Precision Nutrition']
  },
  {
    id: 2,
    name: 'Sarah Mitchell',
    initials: 'SM',
    avClass: 'av2',
    sport: 'Yoga',
    specialty: 'Vinyasa & Yin Yoga',
    rating: 5.0,
    reviews: 93,
    price: 280,
    currency: 'AED',
    clients: 61,
    verified: true,
    free: true,
    female: true,
    session: 'Hybrid',
    skills: ['Vinyasa', 'Meditation', 'Breathwork'],
    rankScore: 96,
    bio: 'Dedicated yoga practitioner focused on the intersection of physical flow and mental clarity. Helping clients find balance in a busy world.',
    location: 'Jumeirah, Dubai',
    languages: ['English', 'French'],
    experience: '8 Years',
    education: '500hr RYT',
    certifications: ['Yoga Alliance Certified', 'Mindfulness Coach']
  },
  {
    id: 3,
    name: 'Carlos Vega',
    initials: 'CV',
    avClass: 'av3',
    sport: 'CrossFit',
    specialty: 'Olympic Lifting & HIIT',
    rating: 4.8,
    reviews: 214,
    price: 420,
    currency: 'AED',
    clients: 112,
    verified: true,
    free: false,
    female: false,
    session: 'In-Person',
    skills: ['Olympic Lifting', 'HIIT', 'Endurance'],
    rankScore: 94,
    bio: 'Former competitive athlete turned CrossFit coach. Passionate about pushing limits and building a strong, supportive community.',
    location: 'Al Quoz, Dubai',
    languages: ['English', 'Spanish'],
    experience: '15 Years',
    education: 'BSc Kinesiology',
    certifications: ['CrossFit Level 3', 'USAW Sports Performance']
  },
  {
    id: 4,
    name: 'Priya Sharma',
    initials: 'PS',
    avClass: 'av4',
    sport: 'Nutrition',
    specialty: 'Sports Nutrition & Diet',
    rating: 4.7,
    reviews: 88,
    price: 220,
    currency: 'AED',
    clients: 73,
    verified: true,
    free: true,
    female: true,
    session: 'Online',
    skills: ['Meal Planning', 'Weight Loss', 'Muscle Gain'],
    rankScore: 90,
    bio: 'Registered dietitian specializing in sports performance and sustainable weight management. Science-based approach to nutrition.',
    location: 'Remote / Online',
    languages: ['English', 'Hindi'],
    experience: '6 Years',
    education: 'MSc Clinical Nutrition',
    certifications: ['RD', 'ISSN-SNS']
  },
  {
    id: 5,
    name: 'Omar Khalid',
    initials: 'OK',
    avClass: 'av5',
    sport: 'Football',
    specialty: 'Youth & Adult Coaching',
    rating: 4.6,
    reviews: 56,
    price: 300,
    currency: 'AED',
    clients: 39,
    verified: true,
    free: true,
    female: false,
    session: 'In-Person',
    skills: ['Tactics', 'Dribbling', 'Fitness'],
    rankScore: 87,
    bio: 'Professional football coach with a focus on technical development and tactical awareness for all age groups.',
    location: 'Dubai Sports City',
    languages: ['English', 'Arabic'],
    experience: '10 Years',
    education: 'UEFA B License',
    certifications: ['AFC Coaching Diploma']
  },
  {
    id: 6,
    name: 'Nina Kowalski',
    initials: 'NK',
    avClass: 'av6',
    sport: 'Swimming',
    specialty: 'Competitive & Recreational',
    rating: 4.9,
    reviews: 142,
    price: 380,
    currency: 'AED',
    clients: 97,
    verified: true,
    free: false,
    female: true,
    session: 'In-Person',
    skills: ['Freestyle', 'Butterfly', 'Endurance'],
    rankScore: 95,
    bio: 'Former national swimmer dedicated to helping others master the water, from beginners to competitive athletes.',
    location: 'Hamdan Sports Complex, Dubai',
    languages: ['English', 'Polish'],
    experience: '9 Years',
    education: 'BSc Physical Education',
    certifications: ['ASCA Level 3', 'Red Cross WSI']
  },
  {
    id: 7,
    name: 'James Okafor',
    initials: 'JO',
    avClass: 'av2',
    sport: 'Personal Training',
    specialty: 'Rehabilitation & Mobility',
    rating: 4.5,
    reviews: 71,
    price: 260,
    currency: 'AED',
    clients: 44,
    verified: false,
    free: true,
    female: false,
    session: 'Hybrid',
    skills: ['Rehab', 'Mobility', 'Pilates'],
    rankScore: 82,
    bio: 'Specializing in injury prevention and recovery. Helping clients regain strength and confidence through movement.',
    location: 'Business Bay, Dubai',
    languages: ['English', 'Igbo'],
    experience: '7 Years',
    education: 'BSc Physiotherapy',
    certifications: ['NASM-CES', 'FMS Level 2']
  },
  {
    id: 8,
    name: 'Fatima Hassan',
    initials: 'FH',
    avClass: 'av3',
    sport: 'Kickboxing',
    specialty: 'Muay Thai & Self-Defence',
    rating: 4.8,
    reviews: 103,
    price: 320,
    currency: 'AED',
    clients: 58,
    verified: true,
    free: true,
    female: true,
    session: 'In-Person',
    skills: ['Muay Thai', 'Boxing', 'Cardio'],
    rankScore: 91,
    bio: 'Martial arts expert focused on empowering women through self-defence and high-intensity combat training.',
    location: 'Mirdif, Dubai',
    languages: ['English', 'Arabic'],
    experience: '11 Years',
    education: 'Black Belt 3rd Dan',
    certifications: ['WAKO Certified Coach']
  },
  {
    id: 9,
    name: 'David Park',
    initials: 'DP',
    avClass: 'av4',
    sport: 'Tennis',
    specialty: 'ITF Certified Coach',
    rating: 5.0,
    reviews: 67,
    price: 450,
    currency: 'AED',
    clients: 31,
    verified: true,
    free: false,
    female: false,
    session: 'In-Person',
    skills: ['Serve', 'Footwork', 'Match Play'],
    rankScore: 93,
    bio: 'High-performance tennis coach with a track record of developing junior champions. Focused on technique and mental toughness.',
    location: 'Meydan, Dubai',
    languages: ['English', 'Korean'],
    experience: '14 Years',
    education: 'BSc Sports Management',
    certifications: ['ITF Level 2', 'PTR Professional']
  },
  {
    id: 10,
    name: 'Leila Mansouri',
    initials: 'LM',
    avClass: 'av5',
    sport: 'Yoga',
    specialty: 'Prenatal & Postnatal Yoga',
    rating: 4.7,
    reviews: 49,
    price: 240,
    currency: 'AED',
    clients: 28,
    verified: true,
    free: true,
    female: true,
    session: 'Online',
    skills: ['Prenatal', 'Breathing', 'Restorative'],
    rankScore: 85,
    bio: 'Supporting mothers through every stage of pregnancy and recovery with gentle, effective yoga practices.',
    location: 'Remote / Online',
    languages: ['English', 'Farsi'],
    experience: '5 Years',
    education: '200hr RYT',
    certifications: ['RPYT (Prenatal)', 'Postnatal Yoga Specialist']
  },
  {
    id: 11,
    name: 'Ravi Patel',
    initials: 'RP',
    avClass: 'av6',
    sport: 'CrossFit',
    specialty: 'Beginners to Advanced',
    rating: 4.4,
    reviews: 38,
    price: 290,
    currency: 'AED',
    clients: 22,
    verified: false,
    free: false,
    female: false,
    session: 'In-Person',
    skills: ['CrossFit', 'Mobility', 'Conditioning'],
    rankScore: 78,
    bio: 'Passionate about making CrossFit accessible to everyone. Focused on safe mechanics and consistent progress.',
    location: 'Dubai Marina',
    languages: ['English', 'Gujarati'],
    experience: '4 Years',
    education: 'BSc Exercise Science',
    certifications: ['CrossFit Level 1', 'NASM-CPT']
  },
  {
    id: 12,
    name: 'Aisha Nkosi',
    initials: 'AN',
    avClass: '',
    sport: 'Personal Training',
    specialty: "Women's Fitness Specialist",
    rating: 4.9,
    reviews: 185,
    price: 310,
    currency: 'AED',
    clients: 91,
    verified: true,
    free: true,
    female: true,
    session: 'Hybrid',
    skills: ["Women's Fitness", 'HIIT', 'Nutrition'],
    rankScore: 97,
    bio: 'Empowering women to reach their fitness goals through personalized training and holistic wellness coaching.',
    location: 'Palm Jumeirah, Dubai',
    languages: ['English', 'Zulu'],
    experience: '13 Years',
    education: 'BSc Nutrition & Health',
    certifications: ['NASM-CPT', 'Pre/Post Natal Specialist']
  }
];
