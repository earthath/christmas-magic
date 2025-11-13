// Firebase Configuration Template
// Copy this file to firebase-config.js and fill in your values
// DO NOT commit firebase-config.js if you want to keep it private
// (though Firebase API keys are safe to be public)

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
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

