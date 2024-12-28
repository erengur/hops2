import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAbVcuDKYIg8DwkbZ6FK9NHWYOvGBFBoDs",
  authDomain: "myapplication10-9933c.firebaseapp.com",
  projectId: "myapplication10-9933c",
  storageBucket: "myapplication10-9933c.appspot.com",
  messagingSenderId: "611076150897",
  appId: "1:611076150897:web:ba0692d1e30687eec36dd0",
  measurementId: "G-3CZWK85GKH"
};

// Firebase uygulamasını başlat
const app = initializeApp(firebaseConfig);

// Auth, Firestore ve Storage servislerini başlat
const auth = getAuth(app);
const database = getFirestore(app);
const storage = getStorage(app);

export { auth, database, storage }; 