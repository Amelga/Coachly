import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { CoachProfile } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export const coachService = {
  async getAllCoaches(): Promise<CoachProfile[]> {
    try {
      const coachesCol = collection(db, 'coachProfiles');
      const coachSnapshot = await getDocs(coachesCol);
      return coachSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoachProfile));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'coachProfiles');
      return [];
    }
  },

  async getCoachById(coachId: string): Promise<CoachProfile | null> {
    try {
      const coachDoc = await getDoc(doc(db, 'coachProfiles', coachId));
      if (coachDoc.exists()) {
        return { id: coachDoc.id, ...coachDoc.data() } as CoachProfile;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `coachProfiles/${coachId}`);
      return null;
    }
  },

  async createOrUpdateCoachProfile(coachId: string, profile: Partial<CoachProfile>): Promise<void> {
    try {
      const coachRef = doc(db, 'coachProfiles', coachId);
      await setDoc(coachRef, {
        ...profile,
        userId: coachId,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `coachProfiles/${coachId}`);
    }
  }
};
