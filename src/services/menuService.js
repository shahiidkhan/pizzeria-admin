// src/services/menuService.js
import {
  collection, getDocs, query, orderBy, serverTimestamp, addDoc,
  onSnapshot, where, limit,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { storageService } from './storageService';

const COL = 'menu';
const UPLOADS_COL = 'menuUploads';
const ref = () => collection(db, COL);
const uploadRef = () => collection(db, UPLOADS_COL);

export const menuService = {
  async getAll() {
    const snap = await getDocs(query(ref(), orderBy('order', 'asc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async add(data) {
    const docRef = await addDoc(ref(), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  subscribeUploads(callback, onError) {
    const q = query(uploadRef(), orderBy('uploadedAt', 'desc'));
    return onSnapshot(
      q,
      snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      onError,
    );
  },

  async uploadMenu(file, uploadedBy, onProgress) {
    if (!file) throw new Error('Please choose a menu file.');
    const fileKey = `${file.name}-${file.size}`;
    const duplicateSnap = await getDocs(
      query(uploadRef(), where('fileKey', '==', fileKey), limit(1)),
    );
    if (!duplicateSnap.empty) throw new Error('This menu file has already been uploaded.');

    const fileUrl = await storageService.uploadMenuFile(file, onProgress);
    const docRef = await addDoc(uploadRef(), {
      fileName: file.name,
      fileUrl,
      fileType: file.type,
      fileSize: file.size,
      fileKey,
      uploadedAt: serverTimestamp(),
      uploadedBy: uploadedBy || null,
    });
    return docRef.id;
  },
};
