import type { AppRole } from '../lib/roles';

export interface User {
  id: string;
  employeeNumber: string;
  username: string;
  /** Legacy coarse role — use appRole when set. */
  role: 'user' | 'admin';
  /** Fine-grained application role (TASK-20260422-013). */
  appRole?: AppRole;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface LoginCredentials {
  employeeNumber: string;
  password: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface UnitSettings {
  id: string;
  name: string;
  theme: 'light' | 'dark' | 'blue' | 'green' | 'purple';
  createdAt: Date;
  lastModified: Date;
}

export const defaultUsers: User[] = [
  {
    id: 'admin-1',
    employeeNumber: 'admin',
    username: 'Administrator',
    role: 'admin',
    appRole: 'Entity Admin',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: 'user-1',
    employeeNumber: '1001',
    username: 'John Nurse',
    role: 'user',
    appRole: 'Nurse Manager',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: 'user-2',
    employeeNumber: '1002',
    username: 'Jane Tech',
    role: 'user',
    appRole: 'Nurse',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: 'user-3',
    employeeNumber: 'wall',
    username: 'Wall Display',
    role: 'user',
    appRole: 'WALLDISPLAY',
    isActive: true,
    createdAt: new Date(),
  },
];

export const defaultPasswords: Record<string, string> = {
  'admin': 'password',
  '1001': 'nurse123',
  '1002': 'tech123',
  'wall': 'wall123',
};