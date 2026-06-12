# Firebase Setup Instructions

## Quick Fix for "Invalid API Key" Error

The error you're seeing means Firebase credentials are not configured. Follow these steps:

### Option 1: Set Up Firebase (Recommended for Production)

1. **Create a Firebase Project** (if you don't have one):
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" or select an existing project
   - Follow the setup wizard

2. **Get Your Firebase Configuration**:
   - In Firebase Console, go to Project Settings (gear icon)
   - Scroll down to "Your apps" section
   - Click the web icon `</>` to add a web app
   - Copy the configuration values

3. **Update `.env` file**:
   Open `applications/tendercells_ui/applications/tendercells_ui/test_output/tendercells-ui/.env` and uncomment/add these lines:

   ```env
   VITE_FIREBASE_API_KEY=your-api-key-here
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

4. **Enable Firebase Services**:
   - **Authentication**: Go to Authentication → Sign-in method → Enable Email/Password
   - **Firestore**: Go to Firestore Database → Create database → Start in test mode

5. **Restart your dev server**:
   ```bash
   npm run dev
   ```

### Option 2: Development Mode (Without Firebase)

If you just want to test the UI without Firebase:

1. The app will now show warnings instead of crashing
2. Firebase-dependent features will be disabled
3. You can still test the UI components

### Verify Setup

After adding your Firebase credentials, check the browser console. You should see:
- ✅ No "Invalid API Key" errors
- ✅ Firebase initialized successfully

If you still see errors, double-check:
- All environment variables are uncommented in `.env`
- No extra spaces or quotes around the values
- You've restarted the dev server after changing `.env`

## Troubleshooting

**Error: "Firebase: Error (auth/invalid-api-key)"**
- Make sure `VITE_FIREBASE_API_KEY` is set in `.env`
- Restart your dev server after changing `.env`

**Error: "Firebase configuration is missing"**
- Check that all 6 Firebase environment variables are set
- Make sure they're not commented out (no `#` at the start)

**App works but Firebase features don't**
- Check browser console for specific error messages
- Verify Firestore and Authentication are enabled in Firebase Console
