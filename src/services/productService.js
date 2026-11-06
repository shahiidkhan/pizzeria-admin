// src/services/productService.js
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc,
  deleteDoc, onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

const COL = 'products';
const ref = () => collection(db, COL);

function normalizeProductPayload(data) {
  const imageUrl = data.imageUrl ?? data.image ?? '';
  const availability = data.availability ?? data.isAvailable ?? true;

  return {
    ...data,
    imageUrl,
    image: imageUrl,
    availability,
    isAvailable: availability,
  };
}

async function verifyProductImageUrl(id) {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) throw new Error('Product was not found after saving.');

  const data = snap.data();
  if (!Object.prototype.hasOwnProperty.call(data, 'imageUrl')) {
    throw new Error('Product saved, but Firestore document is missing imageUrl.');
  }
  return { id: snap.id, ...data };
}

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
    const product = normalizeProductPayload(data);
    const docRef = await addDoc(ref(), {
      ...product,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await verifyProductImageUrl(docRef.id);
    return docRef.id;
  },

  /** Update an existing product */
  async update(id, data) {
    const product = normalizeProductPayload(data);
    const payload = {
      ...product,
      updatedAt: serverTimestamp(),
    };
    await updateDoc(doc(db, COL, id), payload);
    await verifyProductImageUrl(id);
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
