import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from '../firebase/firebase';

function extensionFromFile(file) {
  const namePart = file?.name?.split('.').pop();
  return namePart ? `.${namePart.toLowerCase()}` : '';
}

const MENU_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

function uploadFile(file, folder = 'uploads', onProgress, allowedTypes) {
    if (!file) return Promise.resolve('');
    if (typeof file === 'string') return Promise.resolve(file);
    if (allowedTypes?.length && !allowedTypes.includes(file.type)) {
      return Promise.reject(new Error('This file type is not supported.'));
    }

    const path = `${folder}/${Date.now()}-${crypto.randomUUID()}${extensionFromFile(file)}`;
    const uploadRef = ref(storage, path);
    const task = uploadBytesResumable(uploadRef, file, { contentType: file.type });

    return new Promise((resolve, reject) => {
      task.on(
        'state_changed',
        snapshot => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress?.(progress);
        },
        reject,
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
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

  uploadMenuFile(file, onProgress) {
    if (!file) return Promise.resolve('');
    if (file.size > 20 * 1024 * 1024) {
      return Promise.reject(new Error('Menu file must be 20MB or smaller.'));
    }
    return uploadFile(file, 'menuUploads', onProgress, MENU_TYPES);
  },
};
