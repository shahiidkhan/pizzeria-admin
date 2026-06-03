import { doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const COL = 'settings';
const DOC_ID = 'admin';

const defaults = {
  restaurantName: '',
  contactEmail: '',
  contactPhone: '',
  branchStatus: 'open',
  deliveryFee: 0,
  currency: 'PKR',
  taxPercentage: 0,
  openingTime: '09:00',
  closingTime: '23:00',
  updatedAt: null,
};

const settingsRef = () => doc(db, COL, DOC_ID);

export const settingsService = {
  defaults,

  subscribe(callback, onError) {
    return onSnapshot(
      settingsRef(),
      snap => callback({ ...defaults, ...(snap.exists() ? snap.data() : {}) }),
      onError
    );
  },

  async upsert(data) {
    await setDoc(
      settingsRef(),
      { ...data, updatedAt: serverTimestamp() },
      { merge: true }
    );
  },

  async update(data) {
    await updateDoc(settingsRef(), { ...data, updatedAt: serverTimestamp() });
  },
};
