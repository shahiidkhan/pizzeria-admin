import { onAuthStateChanged } from 'firebase/auth';
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { app, auth, storage } from '../firebase/firebase';

function extensionFromFile(file) {
  const namePart = file?.name?.split('.').pop();
  return namePart ? `.${namePart.toLowerCase()}` : '';
}

const MENU_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

function sanitizeFileName(name = 'upload') {
  return name.replace(/[^\w.-]+/g, '-');
}

function logAuthStatus() {
  console.log('Firebase projectId:', app.options.projectId);
  console.log('Firebase storageBucket:', app.options.storageBucket);
  console.log('Firebase upload auth uid:', auth.currentUser?.uid || null);
  console.log('Firebase upload auth email:', auth.currentUser?.email || null);
}

function logUploadError(error) {
  console.error('Upload failed:', error?.code, error?.message, error);
}

function waitForCurrentUser(timeoutMs = 1500) {
  if (auth.currentUser) return Promise.resolve(auth.currentUser);

  return new Promise(resolve => {
    const timeoutId = setTimeout(() => {
      unsubscribe();
      resolve(auth.currentUser);
    }, timeoutMs);

    const unsubscribe = onAuthStateChanged(auth, user => {
      clearTimeout(timeoutId);
      unsubscribe();
      resolve(user);
    });
  });
}

async function requireUploadUser() {
  const user = await waitForCurrentUser();
  logAuthStatus();
  if (!user) throw new Error('Admin must be logged in to upload');
  return user;
}

async function uploadFile(file, folder = 'uploads', onProgress, allowedTypes, options = {}) {
    if (!file) return Promise.reject(new Error('No file selected'));
    if (typeof file === 'string') return Promise.resolve(file);
    if (allowedTypes?.length && !allowedTypes.includes(file.type)) {
      return Promise.reject(new Error('This file type is not supported.'));
    }
    await requireUploadUser();

    const path = `${folder}/${Date.now()}-${crypto.randomUUID()}${extensionFromFile(file)}`;
    console.log('Firebase operation:', 'uploadBytesResumable');
    console.log('Target storage path:', path);
    const uploadRef = ref(storage, path);
    const task = uploadBytesResumable(uploadRef, file, { contentType: file.type });

    return new Promise((resolve, reject) => {
      task.on(
        'state_changed',
        snapshot => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress?.(progress);
        },
        error => {
          logUploadError(error);
          reject(error);
        },
        async () => {
          try {
            const url = await getDownloadURL(task.snapshot.ref);
            resolve(options.includePath ? { url, path } : url);
          } catch (error) {
            logUploadError(error);
            reject(error);
          }
        },
      );
    });
}

async function uploadMenuFile(file, onProgress) {
  if (!file) throw new Error('No file selected');
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('Menu file must be 20MB or smaller.');
  }
  if (!MENU_TYPES.includes(file.type)) {
    throw new Error('This file type is not supported.');
  }

  await requireUploadUser();

  const fileName = `${Date.now()}-${sanitizeFileName(file.name)}`;
  const storagePath = `menuUploads/${fileName}`;
  console.log('Firebase operation:', 'uploadBytesResumable menu upload');
  console.log('Target storage path:', storagePath);
  const storageRef = ref(storage, storagePath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      snapshot => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload progress:', progress);
        onProgress?.(Math.round(progress));
      },
      error => {
        logUploadError(error);
        reject(error);
      },
      async () => {
        try {
          console.log('Firebase operation:', 'getDownloadURL menu upload');
          console.log('Target storage path:', storagePath);
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            downloadURL,
            storagePath,
            url: downloadURL,
            path: storagePath,
          });
        } catch (error) {
          logUploadError(error);
          reject(error);
        }
      },
    );
  });
}

export const storageService = {
  uploadFile,

  uploadImage(file, folder = 'uploads', onProgress) {
    if (file && typeof file !== 'string' && !file.type?.startsWith('image/')) {
      return Promise.reject(new Error('Please select a valid image file.'));
    }
    return uploadFile(file, folder, onProgress);
  },

  uploadMenuFile,

  async deleteFile(path) {
    if (!path) return;
    await deleteObject(ref(storage, path));
  },
};
