// src/services/reviewService.js
import {
  collection, doc, getDocs, getDoc, deleteDoc, query,
  orderBy, serverTimestamp, addDoc, onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

const COL = 'reviews';
const ref = () => collection(db, COL);
const usersRef = () => collection(db, 'users');
const productsRef = () => collection(db, 'products');

function fallbackName(value, fallback) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function getImage(data = {}) {
  return data.image || data.imageUrl || data.photo || data.photoUrl || data.avatar || '';
}

function mapCustomer(id, data) {
  if (!id && !data) return null;
  return {
    id,
    name: fallbackName(data?.name || data?.displayName || data?.fullName, data?.email || data?.phone || 'Customer'),
    email: data?.email || '',
    phone: data?.phone || '',
    avatar: getImage(data),
  };
}

function mapProduct(id, data) {
  if (!id && !data) return null;
  return {
    id,
    name: fallbackName(data?.name || data?.title || data?.productName, 'Product'),
    image: getImage(data),
  };
}

async function readByIds(collectionRef, ids, mapper) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  const entries = await Promise.all(
    uniqueIds.map(async id => {
      const snap = await getDoc(doc(collectionRef(), id));
      return [id, snap.exists() ? mapper(snap.id, snap.data()) : null];
    }),
  );
  return new Map(entries);
}

function getReviewCustomer(review, usersById) {
  return (
    review.customer ||
    review.user ||
    usersById.get(review.userId) ||
    mapCustomer(review.userId, {
      name: review.userName || review.customerName || review.name,
      email: review.userEmail || review.customerEmail,
      phone: review.userPhone || review.customerPhone,
      image: review.userImage || review.customerImage,
    })
  );
}

function getReviewProduct(review, productsById) {
  return (
    review.product ||
    productsById.get(review.productId) ||
    mapProduct(review.productId, {
      name: review.productName || review.productTitle || review.itemName,
      image: review.productImage,
    })
  );
}

async function enrichReviews(reviews) {
  const [usersById, productsById] = await Promise.all([
    readByIds(usersRef, reviews.map(review => review.userId), mapCustomer),
    readByIds(productsRef, reviews.map(review => review.productId), mapProduct),
  ]);

  return reviews.map(review => {
    const customer = getReviewCustomer(review, usersById);
    const product = getReviewProduct(review, productsById);

    return {
      ...review,
      customer,
      customerName: customer?.name || 'Customer',
      product,
      productName: product?.name || 'Product',
    };
  });
}

export const reviewService = {
  async getAll() {
    const snap = await getDocs(query(ref(), orderBy('createdAt', 'desc')));
    const reviews = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return enrichReviews(reviews);
  },

  subscribe(callback, onError) {
    const q = query(ref(), orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      async snap => {
        try {
          const reviews = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          callback(await enrichReviews(reviews));
        } catch (error) {
          onError?.(error);
        }
      },
      onError,
    );
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
