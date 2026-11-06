// src/services/menuService.js
import {
  collection, getDocs, query, orderBy, serverTimestamp, addDoc,
  onSnapshot, where, limit, writeBatch, doc, deleteDoc, getDoc,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { storageService } from './storageService';

const COL = 'menu';
const UPLOADS_COL = 'menuUploads';
const ref = () => collection(db, COL);
const uploadRef = () => collection(db, UPLOADS_COL);

const MENU_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
const MAX_MENU_SIZE = 20 * 1024 * 1024;

function validateMenuFile(file) {
  if (!file) throw new Error('Please choose a menu file.');
  if (!MENU_TYPES.includes(file.type)) {
    throw new Error('Unsupported file type. Please upload PNG, JPG, WEBP, or PDF.');
  }
  if (file.size > MAX_MENU_SIZE) {
    throw new Error('Menu file must be 20MB or smaller.');
  }
}

function fileKind(fileType) {
  return fileType === 'application/pdf' ? 'pdf' : 'image';
}

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
    validateMenuFile(file);

    const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
    const duplicateQuery = query(uploadRef(), where('fileKey', '==', fileKey), limit(1));
    console.log('Firebase operation:', 'getDocs duplicate menu upload check');
    console.log('Target collection:', UPLOADS_COL);
    console.log('Target doc path:', `${UPLOADS_COL}/* where fileKey == ${fileKey}`);
    const duplicateSnap = await getDocs(duplicateQuery);
    if (!duplicateSnap.empty) throw new Error('This menu file has already been uploaded.');

    const uploadedFile = await storageService.uploadMenuFile(file, onProgress);
    console.log('Firebase operation:', 'getDocs active menu uploads');
    console.log('Target collection:', UPLOADS_COL);
    console.log('Target doc path:', `${UPLOADS_COL}/* where isActive == true`);
    const activeSnap = await getDocs(query(uploadRef(), where('isActive', '==', true)));
    const uploadDoc = doc(uploadRef());
    const batch = writeBatch(db);

    activeSnap.docs.forEach(activeDoc => {
      batch.update(activeDoc.ref, {
        isActive: false,
        deactivatedAt: serverTimestamp(),
      });
    });

    const uploadPayload = {
      fileName: file.name,
      fileUrl: uploadedFile.url,
      imageUrl: uploadedFile.url,
      image: uploadedFile.url,
      storagePath: uploadedFile.path,
      fileType: file.type,
      fileKind: fileKind(file.type),
      fileSize: file.size,
      fileKey,
      isActive: true,
      uploadedAt: serverTimestamp(),
      activatedAt: serverTimestamp(),
      uploadedBy: uploadedBy || null,
    };

    console.log('Firebase operation:', 'writeBatch set active menu upload and current menu');
    console.log('Target collection:', UPLOADS_COL);
    console.log('Target doc path:', uploadDoc.path);
    console.log('Payload:', uploadPayload);
    batch.set(uploadDoc, uploadPayload);

    await batch.commit();
    return uploadDoc.id;
  },

  async setActiveUpload(id) {
    console.log('Firebase operation:', 'getDoc selected menu upload');
    console.log('Target doc path:', `${UPLOADS_COL}/${id}`);
    const selectedSnap = await getDoc(doc(db, UPLOADS_COL, id));
    if (!selectedSnap.exists()) throw new Error('Menu upload not found.');

    console.log('Firebase operation:', 'getDocs active menu uploads');
    console.log('Target collection:', UPLOADS_COL);
    console.log('Target doc path:', `${UPLOADS_COL}/* where isActive == true`);
    const activeSnap = await getDocs(query(uploadRef(), where('isActive', '==', true)));
    const batch = writeBatch(db);

    activeSnap.docs.forEach(uploadDoc => {
      if (uploadDoc.id === id) return;
      batch.update(uploadDoc.ref, {
        isActive: false,
        deactivatedAt: serverTimestamp(),
      });
    });

    batch.update(doc(db, UPLOADS_COL, id), {
      isActive: true,
      activatedAt: serverTimestamp(),
    });

    await batch.commit();
  },

  async removeUpload(upload) {
    if (!upload?.id) return;
    if (upload.storagePath) {
      await storageService.deleteFile(upload.storagePath);
    }
    console.log('Firebase operation:', 'deleteDoc menu upload');
    console.log('Target doc path:', `${UPLOADS_COL}/${upload.id}`);
    await deleteDoc(doc(db, UPLOADS_COL, upload.id));

    if (!upload.isActive) return;
    console.log('Firebase operation:', 'getDocs next active menu upload');
    console.log('Target collection:', UPLOADS_COL);
    console.log('Target doc path:', `${UPLOADS_COL}/* ordered by uploadedAt`);
    const nextSnap = await getDocs(query(uploadRef(), orderBy('uploadedAt', 'desc'), limit(10)));
    const nextUpload = nextSnap.docs[0];
    if (nextUpload) {
      await this.setActiveUpload(nextUpload.id);
    }
  },
};
