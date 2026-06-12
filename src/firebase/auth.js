// Firebase Authentication Services
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from './config.js';

const missingAuthConfigMessage = 'Authentication is unavailable until Firebase environment variables are configured.';

const ensureAuthConfigured = () => {
  if (!auth) {
    return { success: false, error: missingAuthConfigMessage };
  }

  return null;
};

// Sign up with email and password
export const signUp = async (email, password, displayName) => {
  const authConfigError = ensureAuthConfigured();
  if (authConfigError) {
    return authConfigError;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update user profile with display name
    if (displayName) {
      await updateProfile(user, {
        displayName: displayName
      });
    }
    
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Sign in with email and password
export const signIn = async (email, password) => {
  const authConfigError = ensureAuthConfigured();
  if (authConfigError) {
    return authConfigError;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Sign out
export const logOut = async () => {
  const authConfigError = ensureAuthConfigured();
  if (authConfigError) {
    return authConfigError;
  }

  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Reset password
export const resetPassword = async (email) => {
  const authConfigError = ensureAuthConfigured();
  if (authConfigError) {
    return authConfigError;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Auth state observer
export const onAuthStateChange = (callback) => {
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = () => {
  return auth ? auth.currentUser : null;
};