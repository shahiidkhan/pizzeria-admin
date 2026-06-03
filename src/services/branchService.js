// src/services/branchService.js
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc,
  deleteDoc, onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

const COL = 'branches';
const ref = () => collection(db, COL);

export const branchService = {
  async getAll() {
    const snap = await getDocs(query(ref(), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getById(id) {
    const snap = await getDoc(doc(db, COL, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async add(data) {
    const docRef = await addDoc(ref(), {
      location: data.location,
      status: data.status,
      contact: data.contact,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async update(id, data) {
    await updateDoc(doc(db, COL, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async toggleStatus(id, isOpen) {
    await updateDoc(doc(db, COL, id), {
      status: isOpen ? 'open' : 'closed',
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
