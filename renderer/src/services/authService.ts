import { User, LoginCredentials, AuthState, UnitSettings, defaultUsers, defaultPasswords } from '../types/auth';
import { SimpleDatabase } from '../lib/database-simple';

class AuthService {
  private db: SimpleDatabase;

  constructor() {
    this.db = new SimpleDatabase();
  }

  async initializeAuth(): Promise<void> {
    // Initialize default users if none exist
    const existingUsers = this.db.getUsers();
    if (existingUsers.length === 0) {
      defaultUsers.forEach(user => {
        this.db.saveUser(user);
      });
    }

    // Initialize default passwords
    Object.entries(defaultPasswords).forEach(([employeeNumber, password]) => {
      this.db.savePassword(employeeNumber, password);
    });

    // Initialize default unit settings if none exist
    const existingSettings = this.db.getUnitSettings();
    if (existingSettings.length === 0) {
      const defaultSettings: UnitSettings = {
        id: 'default',
        name: 'Default Unit',
        theme: 'light',
        createdAt: new Date(),
        lastModified: new Date(),
      };
      this.db.saveUnitSettings(defaultSettings);
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthState> {
    try {
      const user = this.db.getUserByEmployeeNumber(credentials.employeeNumber);
      
      if (!user) {
        return {
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: 'Employee number not found',
        };
      }

      if (!user.isActive) {
        return {
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: 'Account is deactivated',
        };
      }

      const storedPassword = this.db.getPassword(credentials.employeeNumber);
      if (storedPassword !== credentials.password) {
        return {
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: 'Invalid password',
        };
      }

      // Update last login
      user.lastLogin = new Date();
      this.db.saveUser(user);

      return {
        isAuthenticated: true,
        user,
        isLoading: false,
        error: null,
      };
    } catch (error) {
      return {
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: 'Login failed. Please try again.',
      };
    }
  }

  async logout(): Promise<void> {
    // Clear any session data if needed
    // For localStorage, we just handle this in the component
  }

  getCurrentUser(): User | null {
    // Get current user from session storage or similar
    const sessionData = sessionStorage.getItem('currentUser');
    return sessionData ? JSON.parse(sessionData) : null;
  }

  setCurrentUser(user: User): void {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
  }

  clearCurrentUser(): void {
    sessionStorage.removeItem('currentUser');
  }

  // Admin user management
  getAllUsers(): User[] {
    return this.db.getUsers();
  }

  addUser(user: Omit<User, 'id' | 'createdAt'>, password: string): boolean {
    try {
      const existingUser = this.db.getUserByEmployeeNumber(user.employeeNumber);
      if (existingUser) {
        return false; // User already exists
      }

      const newUser: User = {
        ...user,
        id: `user-${Date.now()}`,
        createdAt: new Date(),
      };

      this.db.saveUser(newUser);
      this.db.savePassword(user.employeeNumber, password);
      return true;
    } catch (error) {
      return false;
    }
  }

  updateUser(user: User): boolean {
    try {
      this.db.saveUser(user);
      return true;
    } catch (error) {
      return false;
    }
  }

  deactivateUser(userId: string): boolean {
    try {
      const user = this.db.getUser(userId);
      if (user) {
        user.isActive = false;
        this.db.saveUser(user);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  activateUser(userId: string): boolean {
    try {
      const user = this.db.getUser(userId);
      if (user) {
        user.isActive = true;
        this.db.saveUser(user);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  changePassword(employeeNumber: string, newPassword: string): boolean {
    try {
      this.db.savePassword(employeeNumber, newPassword);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Unit settings management
  getUnitSettings(): UnitSettings[] {
    return this.db.getUnitSettings();
  }

  saveUnitSettings(settings: UnitSettings): boolean {
    try {
      settings.lastModified = new Date();
      this.db.saveUnitSettings(settings);
      return true;
    } catch (error) {
      return false;
    }
  }

  deleteUnitSettings(settingsId: string): boolean {
    try {
      this.db.deleteUnitSettings(settingsId);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const authService = new AuthService();