import { User, LoginCredentials, AuthState, UnitSettings, defaultUsers, defaultPasswords } from '../types/auth';
import { SimpleDatabase, getDb } from '../lib/database-simple';

class AuthService {
  private db: SimpleDatabase | null = null;

  private requireDb(): SimpleDatabase {
    if (!this.db) {
      throw new Error('Auth database is not initialized. Call initializeAuth() first.');
    }
    return this.db;
  }

  async initializeAuth(): Promise<void> {
    this.db = await getDb();
    const database = this.requireDb();

    // Initialize default users if none exist
    const existingUsers = database.getUsers();
    if (existingUsers.length === 0) {
      defaultUsers.forEach(user => {
        database.saveUser(user);
      });
    }

    // Initialize default passwords
    Object.entries(defaultPasswords).forEach(([employeeNumber, password]) => {
      database.savePassword(employeeNumber, password);
    });
  }

  async login(credentials: LoginCredentials): Promise<AuthState> {
    try {
      const database = this.requireDb();
      const user = database.getUserByEmployeeNumber(credentials.employeeNumber);
      
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

      const storedPassword = database.getPassword(credentials.employeeNumber);
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
      database.saveUser(user);

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
    return this.requireDb().getUsers();
  }

  addUser(user: Omit<User, 'id' | 'createdAt'>, password: string): boolean {
    try {
      const database = this.requireDb();
      const existingUser = database.getUserByEmployeeNumber(user.employeeNumber);
      if (existingUser) {
        return false; // User already exists
      }

      const newUser: User = {
        ...user,
        id: `user-${Date.now()}`,
        createdAt: new Date(),
      };

      database.saveUser(newUser);
      database.savePassword(user.employeeNumber, password);
      return true;
    } catch (error) {
      return false;
    }
  }

  updateUser(user: User): boolean {
    try {
      this.requireDb().saveUser(user);
      return true;
    } catch (error) {
      return false;
    }
  }

  deactivateUser(userId: string): boolean {
    try {
      const database = this.requireDb();
      const user = database.getUser(userId);
      if (user) {
        user.isActive = false;
        database.saveUser(user);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  activateUser(userId: string): boolean {
    try {
      const database = this.requireDb();
      const user = database.getUser(userId);
      if (user) {
        user.isActive = true;
        database.saveUser(user);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  changePassword(employeeNumber: string, newPassword: string): boolean {
    try {
      this.requireDb().savePassword(employeeNumber, newPassword);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Unit settings management
  getUnitSettings(): UnitSettings[] {
    return this.requireDb().getUnitSettings();
  }

  saveUnitSettings(settings: UnitSettings): boolean {
    try {
      settings.lastModified = new Date();
      this.requireDb().saveUnitSettings(settings);
      return true;
    } catch (error) {
      return false;
    }
  }

  deleteUnitSettings(settingsId: string): boolean {
    try {
      this.requireDb().deleteUnitSettings(settingsId);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const authService = new AuthService();