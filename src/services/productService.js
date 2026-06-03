// src/services/productService.js
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc,
  deleteDoc, onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

const COL = 'products';
const ref = () => collection(db, COL);

export const productService = {
  /** One-time fetch – all products ordered by createdAt desc */
  async getAll() {
    const snap = await getDocs(query(ref(), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  /** One-time fetch by ID */
  async getById(id) {
    const snap = await getDoc(doc(db, COL, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  /** Add a new product */
  async add(data) {
    const docRef = await addDoc(ref(), {
      ...data,
      availability: data.availability ?? data.isAvailable ?? true,
      isAvailable: data.isAvailable ?? data.availability ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /** Update an existing product */
  async update(id, data) {
    const payload = {
      ...data,
      updatedAt: serverTimestamp(),
    };
    const availability = data.availability ?? data.isAvailable;
    if (availability !== undefined) {
      payload.availability = availability;
      payload.isAvailable = availability;
    }
    await updateDoc(doc(db, COL, id), payload);
  },

  /** Delete a product */
  async remove(id) {
    await deleteDoc(doc(db, COL, id));
  },

  /** Toggle availability field */
  async toggleAvailability(id, value) {
    await updateDoc(doc(db, COL, id), {
      availability: value,
      isAvailable: value,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Realtime listener – calls `callback` whenever the collection changes.
   * Returns the unsubscribe function.
   */
  subscribe(callback) {
    const q = query(ref(), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  },
};
