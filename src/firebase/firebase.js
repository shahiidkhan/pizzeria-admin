import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";

export const firebaseConfig = {
    apiKey: "AIzaSyArv4A5Lim9V8OeOCrRpu72ofAGCwRba-4",
    authDomain: "pizzeria-baa36.firebaseapp.com",
    databaseURL: "https://pizzeria-baa36-default-rtdb.firebaseio.com",
    projectId: "pizzeria-baa36",
    storageBucket: "pizzeria-baa36.firebasestorage.app",
    messagingSenderId: "139623834248",
    appId: "1:139623834248:web:be790941dcdab30db9353d"
};

export const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const messagingPromise = isSupported().then(supported => (
    supported ? getMessaging(app) : null
));

export default app;
