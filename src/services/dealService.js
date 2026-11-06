// src/services/dealService.js
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc,
  deleteDoc, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

const COL = 'deals';
const ref = () => collection(db, COL);

function normalizeImagePayload(data) {
  const imageUrl = data.imageUrl ?? data.image ?? '';
  return {
    ...data,
    imageUrl,
    image: imageUrl,
  };
}

export const dealService = {
  async getAll() {
    const snap = await getDocs(query(ref(), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getById(id) {
    const snap = await getDoc(doc(db, COL, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async add(data) {
    const payload = normalizeImagePayload(data);
    const docRef = await addDoc(ref(), {
      ...payload,
      isActive: true,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async update(id, data) {
    const payload = normalizeImagePayload(data);
    await updateDoc(doc(db, COL, id), {
      ...payload,
      updatedAt: serverTimestamp(),
    });
  },

  async toggleActive(id, isActive) {
    await updateDoc(doc(db, COL, id), {
      isActive,
      updatedAt: serverTimestamp(),
    });
  },

  async remove(id) {
    await deleteDoc(doc(db, COL, id));
  },
};
