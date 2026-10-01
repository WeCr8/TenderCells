// connector.ts - entry point of the hosted connector bundle that the `mcp` Firebase
// Function serves at tendercells.com (functions/scripts/build-connector.mjs bundles this
// file into functions/lib/connector/). The function passes in its already-initialised
// Admin SDK, so this bundle never imports firebase-admin itself.
import { createHostedApp } from "./hosted.js";
import { firestoreHub, type FirestoreLike } from "./firestoreHub.js";
import { firestoreOAuthStore, type FirestoreDocs } from "./oauth.js";

export interface AdminLike {
  firestore(): unknown;
  auth(): { verifyIdToken(token: string, checkRevoked?: boolean): Promise<{ uid: string }> };
}

/**
 * Build the hosted connector app on top of the Firebase Admin SDK.
 *
 * @param admin  - firebase-admin (initialised)
 * @param issuer - Public origin (default https://tendercells.com)
 * @returns An Express app handling /mcp, /mcp/demo, /oauth/* and the OAuth discovery documents
 */
export function createConnectorApp(admin: AdminLike, issuer = process.env.TC_CONNECTOR_ISSUER || "https://tendercells.com") {
  const db = admin.firestore();
  return createHostedApp({
    issuer,
    store: firestoreOAuthStore(db as FirestoreDocs),
    verifyIdToken: (t) => admin.auth().verifyIdToken(t, true),
    hubFor: (uid) => firestoreHub(db as FirestoreLike, uid),
  });
}

export { MCP_VERSION } from "./server.js";
