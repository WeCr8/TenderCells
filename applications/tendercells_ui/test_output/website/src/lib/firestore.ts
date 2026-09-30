// firestore.ts - lazily loaded Firestore + Cloud Functions for the website (preferences,
// newsletter, school inquiries). Kept out of the main bundle; only pages that save
// something import these.
import { app } from "./firebase";

/** Firestore for the site's Firebase app (throws when the build has no config). */
export async function getDb() {
  if (!app) throw new Error("Sign-in is not configured on this build.");
  const { getFirestore } = await import("firebase/firestore");
  return getFirestore(app);
}

/**
 * Call a callable Cloud Function.
 *
 * @param name - Function name (e.g. "confirmNewsletter")
 * @param data - Request payload
 */
export async function callFunction<T = unknown>(name: string, data: Record<string, unknown>): Promise<T> {
  if (!app) throw new Error("This build has no backend configuration.");
  const { getFunctions, httpsCallable } = await import("firebase/functions");
  const res = await httpsCallable(getFunctions(app), name)(data);
  return res.data as T;
}
