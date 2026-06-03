// src/services/adminService.js
import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc,
  deleteDoc, onSnapshot, query, where, limit, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';
import { deleteApp, getApps, initializeApp } from 'firebase/app';
import { db, firebaseConfig } from '../firebase/firebase';

const COL = 'admins';
const ref = () => collection(db, COL);

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

async function assertUniqueEmail(email) {
  const snap = await getDocs(query(ref(), where('email', '==', normalizeEmail(email)), limit(1)));
  if (!snap.empty) throw new Error('An admin with this email already exists.');
}

function getSecondaryAuth() {
  const name = 'adminCreation';
  const app = getApps().find(existing => existing.name === name) ?? initializeApp(firebaseConfig, name);
  return { app, auth: getAuth(app) };
}

export const adminService = {
  async getAll() {
    const snap = await getDocs(query(ref(), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getById(id) {
    const snap = await getDoc(doc(db, COL, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async add(data) {
    await assertUniqueEmail(data.email);
    const { app, auth } = getSecondaryAuth();
    const email = normalizeEmail(data.email);

    try {
      const credentials = await createUserWithEmailAndPassword(auth, email, data.password);
      await setDoc(doc(db, COL, credentials.user.uid), {
        uid: credentials.user.uid,
        name: data.name.trim(),
        email,
        branchId: data.branchId || '',
        image: data.image || '',
        role: data.role || 'Branch Manager',
      isActive: true,
      createdAt: serverTimestamp(),
      lastLogin: null,
      });
      await signOut(auth);
      await deleteApp(app);
      return credentials.user.uid;
    } catch (error) {
      await signOut(auth).catch(() => {});
      await deleteApp(app).catch(() => {});
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered in Firebase Authentication.', { cause: error });
      }
      throw error;
    }
  },

  async update(id, data) {
    await updateDoc(doc(db, COL, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async remove(id) {
    await deleteDoc(doc(db, COL, id));
  },

  subscribe(callback, onError) {
    const q = query(ref(), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      onError,
    );
  },
};
