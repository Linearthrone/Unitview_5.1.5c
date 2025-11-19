export interface User {
  id: string;
  employeeNumber: string;
  username: string;
  role: 'user' | 'admin';
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
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: 'user-1',
    employeeNumber: '1001',
    username: 'John Nurse',
    role: 'user',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: 'user-2',
    employeeNumber: '1002',
    username: 'Jane Tech',
    role: 'user',
    isActive: true,
    createdAt: new Date(),
  }
];

export const defaultPasswords: Record<string, string> = {
  'admin': 'password',
  '1001': 'nurse123',
  '1002': 'tech123',
};