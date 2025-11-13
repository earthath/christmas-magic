# Firebase Backend Setup Guide

This guide will help you set up Firebase for global sharing features in your Christmas website.

## Prerequisites

- A Google account
- Your website deployed (or ready to deploy)

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `christmas-website` (or your preferred name)
4. Click **Continue**
5. **Disable Google Analytics** (optional, not needed for this project) or enable it if you want
6. Click **Create project**
7. Wait for project creation, then click **Continue**

## Step 2: Register Your Web App

1. In your Firebase project, click the **Web icon** (`</>`) or **"Add app"** → **Web**
2. Register your app:
   - **App nickname**: `Christmas Website` (or any name)
   - **Firebase Hosting**: Check this if you want (optional)
3. Click **Register app**
4. **Copy the Firebase configuration object** - it looks like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```

## Step 3: Configure Firestore Database

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
   - ⚠️ **Important**: Test mode allows anyone to read/write. For production, you'll need to set up security rules.
4. Choose a **location** (closest to your users)
5. Click **Enable**

## Step 4: Update Firebase Configuration

1. Open `firebase-config.js` in your project
2. Replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

3. Save the file

## Step 5: Set Up Firestore Security Rules (Important!)

1. In Firebase Console, go to **Firestore Database** → **Rules**
2. Replace the default rules with these (for production):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to all collections
    match /{document=**} {
      allow read: if true;
    }
    
    // Allow write access (you can restrict this later)
    match /socks/{sockId} {
      allow create: if true;
    }
    
    match /christmasShares/{shareId} {
      allow create: if true;
    }
    
    match /leaderboards/{gameType}/scores/{scoreId} {
      allow create: if true;
    }
  }
}
```

3. Click **Publish**

⚠️ **Note**: These rules allow anyone to write. For a production app, you should:
- Add authentication
- Add rate limiting
- Validate data structure
- Consider using Firebase App Check

## Step 6: Test Your Setup

1. Open your website
2. Open browser console (F12)
3. You should see: `Firebase initialized successfully`
4. Try hanging a sock or sharing a Christmas moment
5. Check Firebase Console → Firestore Database to see if data appears

## Step 7: Deploy to GitHub Pages

1. Commit your changes:
   ```bash
   git add firebase-config.js FIREBASE_SETUP.md
   git commit -m "Add Firebase backend integration"
   git push
   ```

2. Your site should work with global sharing!

## Troubleshooting

### Firebase not initializing
- Check browser console for errors
- Verify `firebase-config.js` has correct values
- Make sure Firebase SDK scripts are loaded in `index.html`

### "Permission denied" errors
- Check Firestore security rules
- Make sure rules are published
- Verify you're using the correct project

### Data not appearing
- Check browser console for errors
- Verify Firestore database is created
- Check Firestore Console to see if data is being saved

### CORS errors
- Firebase handles CORS automatically
- If you see CORS errors, check your Firebase configuration

## Production Security (Recommended)

For production, consider:

1. **Add Firebase App Check** to prevent abuse
2. **Implement rate limiting** (use Cloud Functions)
3. **Add data validation** in security rules
4. **Monitor usage** in Firebase Console
5. **Set up alerts** for unusual activity

## Firebase Free Tier Limits

- **Firestore**: 
  - 50,000 reads/day
  - 20,000 writes/day
  - 20,000 deletes/day
  - 1 GB storage

This should be plenty for a personal/small project!

## Need Help?

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Console](https://console.firebase.google.com/)

