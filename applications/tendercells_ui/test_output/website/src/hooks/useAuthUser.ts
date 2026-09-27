import { useEffect, useState } from "react";
import type { User } from "firebase/auth";

export interface AuthUserState {
  user: User | null;
  /** True until Firebase has restored (or ruled out) a persisted session. */
  loading: boolean;
}

/**
 * Current Firebase user for the marketing site.
 *
 * Loads Firebase lazily (dynamic import) so pages that only need to know
 * "signed in or not" - like the header - do not pull the Auth SDK into the
 * main bundle.
 *
 * @returns The signed-in user (or null) and whether the session is still loading
 */
export function useAuthUser(): AuthUserState {
  const [state, setState] = useState<AuthUserState>({ user: null, loading: true });

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    void Promise.all([import("../lib/firebase"), import("firebase/auth")]).then(
      ([{ auth }, { onAuthStateChanged }]) => {
        if (cancelled) return;
        if (!auth) {
          setState({ user: null, loading: false });
          return;
        }
        unsubscribe = onAuthStateChanged(auth, (user) => setState({ user, loading: false }));
      },
    );

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return state;
}
