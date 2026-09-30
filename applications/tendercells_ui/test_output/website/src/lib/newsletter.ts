// newsletter.ts - newsletter topics + sign-up request (double opt-in; see functions/src/email.ts).
import { getDb } from "./firestore";

export const NEWSLETTER_TOPICS = [
  { id: "news", label: "Product news & launches" },
  { id: "lessons", label: "New lessons & classroom projects" },
  { id: "builds", label: "Open-source builds & firmware releases" },
];

/**
 * Save a newsletter sign-up (the confirmation email goes out from the backend).
 *
 * @param email  - Address to confirm
 * @param topics - Topic ids
 * @param source - Where the form was (for reporting)
 */
export async function requestNewsletter(email: string, topics: string[], source: string): Promise<void> {
  const [{ addDoc, collection, serverTimestamp }, db] = await Promise.all([import("firebase/firestore"), getDb()]);
  await addDoc(collection(db, "newsletterSignups"), {
    email: email.trim().toLowerCase(), topics, source, status: "pending", createdAt: serverTimestamp(),
  });
}
