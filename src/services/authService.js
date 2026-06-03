import {
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';

const ADMINS_COL = 'admins';

async function getAdminByUidOrEmail(user) {
  if (!user) return null;

  const byUidSnap = await getDocs(
    query(collection(db, ADMINS_COL), where('uid', '==', user.uid), limit(1))
  );
  if (!byUidSnap.empty) {
    const doc = byUidSnap.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  const byEmailSnap = await getDocs(
    query(collection(db, ADMINS_COL), where('email', '==', user.email || ''), limit(1))
  );
  if (byEmailSnap.empty) return null;
  const doc = byEmailSnap.docs[0];
  return { id: doc.id, ...doc.data() };
}

export const authService = {
  subscribe(callback) {
    return onAuthStateChanged(auth, callback);
  },

  async login(email, password, remember = true) {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    const credentials = await signInWithEmailAndPassword(auth, email, password);
    const admin = await getAdminByUidOrEmail(credentials.user);

    if (!admin) {
      await signOut(auth);
      throw new Error('Access denied. This account is not registered as an admin.');
    }

    return { user: credentials.user, admin };
  },

  async resolveAdmin(user) {
    return getAdminByUidOrEmail(user);
  },

  async logout() {
    await signOut(auth);
  },
};

