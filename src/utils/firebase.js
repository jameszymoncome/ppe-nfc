// src/utils/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyABBQCQ9P8mvD1DXAsuY7D2a8JmzzfNBj4",
  authDomain: "nfcscan-2bea3.firebaseapp.com",
  databaseURL: "https://nfcscan-2bea3-default-rtdb.firebaseio.com/",
  projectId: "nfcscan-2bea3",
  storageBucket: "nfcscan-2bea3.firebasestorage.app",
  messagingSenderId: "430628095897",
  appId: "1:430628095897:web:1d6d97983a505ca510b508",
  measurementId: "G-FVN46ZZ702"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };
