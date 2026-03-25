import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { User, UserRole } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export const userService = {
  async getUser(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as User;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${userId}`);
      return null; // Should not reach here
    }
  },

  async createUser(userId: string, email: string, role: UserRole, firstName: string, lastName: string, photoURL?: string): Promise<User> {
    const newUser: Omit<User, 'id'> = {
      email,
      role,
      firstName,
      lastName,
      photoURL,
      points: 500, // Initial welcome points
      createdAt: new Date().toISOString(),
      verified: false
    };

    try {
      await setDoc(doc(db, 'users', userId), {
        ...newUser,
        createdAt: serverTimestamp() // Use server timestamp for accuracy
      });

      return { id: userId, ...newUser };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${userId}`);
      throw error;
    }
  },

  async updateUser(userId: string, data: Partial<User>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  }
};
