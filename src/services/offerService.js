// src/services/offerService.js
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc,
  deleteDoc, query, orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

const COL = 'offers';
const ref = () => collection(db, COL);

function normalizeImagePayload(data) {
  const imageUrl = data.imageUrl ?? data.image ?? data.productImage ?? '';
  return {
    ...data,
    imageUrl,
    image: imageUrl,
  };
}

export const offerService = {
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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
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

  async remove(id) {
    await deleteDoc(doc(db, COL, id));
  },

  subscribe(callback, onError) {
    const q = query(ref(), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      onError
    );
  },
};
