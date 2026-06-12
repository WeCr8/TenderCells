import { vi } from 'vitest';
import type { Product, RegisterProductData } from '../../types/products';

// Mock Firebase Auth
export const mockFirebaseAuth = {
  currentUser: null,
  signInWithEmailAndPassword: vi.fn().mockResolvedValue({
    user: {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
    },
  }),
  createUserWithEmailAndPassword: vi.fn().mockResolvedValue({
    user: {
      uid: 'test-user-id',
      email: 'test@example.com',
    },
  }),
  signOut: vi.fn().mockResolvedValue(undefined),
  onAuthStateChanged: vi.fn((callback) => {
    callback(mockFirebaseAuth.currentUser);
    return vi.fn(); // unsubscribe function
  }),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
};

// Mock Firestore
const mockProducts: Product[] = [];

export const mockFirestore = {
  collection: vi.fn((path: string) => ({
    doc: vi.fn((id: string) => ({
      get: vi.fn().mockResolvedValue({
        exists: mockProducts.some((p) => p.id === id),
        data: () => mockProducts.find((p) => p.id === id),
        id,
      }),
      set: vi.fn().mockImplementation((data: Product) => {
        const index = mockProducts.findIndex((p) => p.id === id);
        if (index >= 0) {
          mockProducts[index] = { ...data, id, updated_at: new Date().toISOString() };
        } else {
          mockProducts.push({ ...data, id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        }
        return Promise.resolve();
      }),
      update: vi.fn().mockImplementation((data: Partial<Product>) => {
        const index = mockProducts.findIndex((p) => p.id === id);
        if (index >= 0) {
          mockProducts[index] = { ...mockProducts[index], ...data, updated_at: new Date().toISOString() };
        }
        return Promise.resolve();
      }),
      delete: vi.fn().mockImplementation(() => {
        const index = mockProducts.findIndex((p) => p.id === id);
        if (index >= 0) {
          mockProducts.splice(index, 1);
        }
        return Promise.resolve();
      }),
      onSnapshot: vi.fn((callback) => {
        callback({
          docs: mockProducts.map((p) => ({
            id: p.id,
            data: () => p,
            exists: true,
          })),
        });
        return vi.fn(); // unsubscribe function
      }),
    })),
    add: vi.fn().mockImplementation((data: RegisterProductData) => {
      const newProduct: Product = {
        ...data,
        id: `prod-${Date.now()}`,
        user_id: 'test-user-id',
        serial_number: data.serial_number || '',
        status: 'registered',
        connection_status: 'offline',
        network_config: {},
        metadata: data.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockProducts.push(newProduct);
      return Promise.resolve({ id: newProduct.id });
    }),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({
      docs: mockProducts.map((p) => ({
        id: p.id,
        data: () => p,
        exists: true,
      })),
    }),
  }),
};

// Mock Firebase Storage
export const mockFirebaseStorage = {
  ref: vi.fn((path: string) => ({
    put: vi.fn().mockResolvedValue({
      ref: { fullPath: path },
      metadata: {
        name: path.split('/').pop(),
        size: 1024,
        contentType: 'application/octet-stream',
      },
    }),
    getDownloadURL: vi.fn().mockResolvedValue(`https://storage.googleapis.com/test-bucket/${path}`),
    delete: vi.fn().mockResolvedValue(undefined),
    listAll: vi.fn().mockResolvedValue({
      items: [],
      prefixes: [],
    }),
  })),
};

// Mock Firebase App
export const mockFirebaseApp = {
  auth: () => mockFirebaseAuth,
  firestore: () => mockFirebaseStorage,
  storage: () => mockFirebaseStorage,
};

// Helper to reset mocks
export const resetFirebaseMocks = () => {
  mockProducts.length = 0;
  mockFirebaseAuth.currentUser = null;
  vi.clearAllMocks();
};

// Helper to set mock user
export const setMockUser = (user: any) => {
  mockFirebaseAuth.currentUser = user;
};

// Helper to add mock products
export const addMockProduct = (product: Product) => {
  mockProducts.push(product);
};

// Helper to get mock products
export const getMockProducts = () => [...mockProducts];





