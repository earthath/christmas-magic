# Security Information

## Firebase API Key in Repository

This repository contains a Firebase API key in `firebase-config.js`. **This is safe and intentional.**

### Why is it safe?

Firebase web API keys are **designed to be public**. They are not secrets. Security is enforced by:

1. **Firestore Security Rules** - Set in Firebase Console → Firestore Database → Rules
2. **Domain Restrictions** - Can be configured in Firebase Console → Project Settings
3. **API Key Restrictions** - Can be configured in Google Cloud Console

### How to add extra security:

#### 1. Domain Restrictions (Optional - via Google Cloud Console)
**Note:** Firebase web apps don't have a built-in "Authorized domains" setting in App Settings. 
Domain restrictions are set through Google Cloud Console API key restrictions:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project (`christmas-web-1bec9`)
3. Go to **APIs & Services** → **Credentials**
4. Find your API key (starts with `AIza...`)
5. Click on the API key to edit it
6. Under **Application restrictions**, select **HTTP referrers (web sites)**
7. Click **Add an item** and add:
   - `https://yourusername.github.io/*` (your GitHub Pages URL)
   - `http://localhost:*` (for local development)
   - `https://localhost:*` (for local HTTPS)
8. Click **Save**

**Alternative:** For Authentication domains (if you use Firebase Auth):
1. Go to Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Add your domains there

#### 2. API Key Restrictions (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **APIs & Services** → **Credentials**
4. Find your API key
5. Click **Edit**
6. Under **Application restrictions**, select **HTTP referrers**
7. Add your domains:
   - `https://yourusername.github.io/*`
   - `http://localhost:*`

#### 3. Firestore Security Rules
Make sure your Firestore security rules are properly configured (see `firestore-rules.txt`).

### What if someone uses my API key?

Even if someone copies your API key:
- They can only do what your Firestore security rules allow
- They can only access from authorized domains (if you set restrictions)
- They cannot access your Firebase project settings or billing
- They cannot modify security rules

### Best Practices

1. ✅ Keep Firestore security rules strict
2. ✅ Add domain restrictions
3. ✅ Monitor usage in Firebase Console
4. ✅ Set up billing alerts
5. ✅ Regularly review Firestore rules

### Need Help?

- [Firebase Security Documentation](https://firebase.google.com/docs/rules)
- [API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)

