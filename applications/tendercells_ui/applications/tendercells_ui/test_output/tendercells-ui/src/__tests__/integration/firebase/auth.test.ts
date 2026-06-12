import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockFirebaseAuth, resetFirebaseMocks, setMockUser } from '../../../../tests/mocks/firebase';

describe('Firebase Auth Integration', () => {
  beforeEach(() => {
    resetFirebaseMocks();
  });

  describe('Authentication Flows', () => {
    it('signs in with email and password', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      const result = await mockFirebaseAuth.signInWithEmailAndPassword(email, password);

      expect(mockFirebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(email, password);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(email);
    });

    it('creates a new user account', async () => {
      const email = 'newuser@example.com';
      const password = 'password123';

      const result = await mockFirebaseAuth.createUserWithEmailAndPassword(email, password);

      expect(mockFirebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(email, password);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(email);
    });

    it('signs out user', async () => {
      setMockUser({ uid: 'test-user-id', email: 'test@example.com' });

      await mockFirebaseAuth.signOut();

      expect(mockFirebaseAuth.signOut).toHaveBeenCalled();
    });

    it('sends password reset email', async () => {
      const email = 'test@example.com';

      await mockFirebaseAuth.sendPasswordResetEmail(email);

      expect(mockFirebaseAuth.sendPasswordResetEmail).toHaveBeenCalledWith(email);
    });
  });

  describe('Session Management', () => {
    it('tracks auth state changes', () => {
      const callback = vi.fn();
      
      const unsubscribe = mockFirebaseAuth.onAuthStateChanged(callback);

      expect(mockFirebaseAuth.onAuthStateChanged).toHaveBeenCalledWith(callback);
      expect(callback).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
    });

    it('updates current user on state change', () => {
      const newUser = { uid: 'new-user-id', email: 'new@example.com' };
      setMockUser(newUser);

      const callback = vi.fn();
      mockFirebaseAuth.onAuthStateChanged(callback);

      expect(mockFirebaseAuth.currentUser).toEqual(newUser);
    });
  });
});





