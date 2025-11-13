// Firebase Configuration
// Replace these values with your Firebase project credentials
// Get them from: https://console.firebase.google.com/
//
// ⚠️ GITHUB SECRET SCANNER NOTE:
// This API key is SAFE to commit publicly. Firebase web API keys are designed to be public.
// Security is enforced by:
// 1. Firestore Security Rules (set in Firebase Console)
// 2. Domain restrictions (can be set in Firebase Console → Project Settings → General)
// 3. API key restrictions (can be set in Google Cloud Console)
//
// To add domain restrictions for extra security (optional):
// 1. Go to Google Cloud Console → APIs & Services → Credentials
// 2. Find your API key and click to edit
// 3. Under "Application restrictions", select "HTTP referrers"
// 4. Add your domains (GitHub Pages URL, localhost, etc.)

const firebaseConfig = {
    apiKey: "AIzaSyCNgnVQ5MIlTw02NE2eJC2xO4y1Cc6woRc",
    authDomain: "christmas-web-1bec9.firebaseapp.com",
    projectId: "christmas-web-1bec9",
    storageBucket: "christmas-web-1bec9.firebasestorage.app",
    messagingSenderId: "207841253083",
    appId: "1:207841253083:web:94a516889457f25ab5defe",
    measurementId: "G-9RJQ74GYT4"
  };


// Initialize Firebase
// Make these global so they can be accessed from script.js
window.db = null;
window.firebaseInitialized = false;

function initFirebase() {
    if (typeof firebase === 'undefined') {
        console.warn('Firebase SDK not loaded. Make sure to include Firebase scripts in index.html');
        return false;
    }

    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        window.db = firebase.firestore();
        window.firebaseInitialized = true;
        console.log('Firebase initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        return false;
    }
}

// Check if Firebase is available and initialize
// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof firebase !== 'undefined') {
            initFirebase();
        }
    });
} else {
    // DOM already loaded
    if (typeof firebase !== 'undefined') {
        initFirebase();
    }
}

