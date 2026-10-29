// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCwHSSU0aPXU5FBKV_hSJ0VORaZJ4V3xzg",
  authDomain: "riskatlas-843df.firebaseapp.com",
  projectId: "riskatlas-843df",
  storageBucket: "riskatlas-843df.firebasestorage.app",
  messagingSenderId: "207948286612",
  appId: "1:207948286612:web:10a0b75ca634d6d6b00281",
  measurementId: "G-JWLGZL3VCK",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
