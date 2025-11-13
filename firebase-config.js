// Firebase Configuration
// Replace these values with your Firebase project credentials
// Get them from: https://console.firebase.google.com/

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

