// src/services/reviewService.js
import {
  collection, doc, getDocs, deleteDoc, query,
  orderBy, serverTimestamp, addDoc,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

const COL = 'reviews';
const ref = () => collection(db, COL);

export const reviewService = {
  async getAll() {
    const snap = await getDocs(query(ref(), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async add(data) {
    const docRef = await addDoc(ref(), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async remove(id) {
    await deleteDoc(doc(db, COL, id));
  },
};
