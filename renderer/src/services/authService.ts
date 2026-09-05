import { User, LoginCredentials, AuthState, UnitSettings, defaultUsers, defaultPasswords } from '../types/auth';
import { SimpleDatabase, getDb } from '../lib/database-simple';
import { hashPassword, isPasswordHash, verifyPassword } from '../lib/password';
import { validatePasswordPolicy } from '../lib/password-policy';
import { recordAudit } from '../lib/audit-client';

const LOCKOUT_KEY = 'unitview_auth_lockouts';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

interface LockoutState {
  count: number;
  lockedUntil?: number;
}

function readLockouts(): Record<string, LockoutState> {
  try {
    const raw = localStorage.getItem(LOCKOUT_KEY);
    return raw ? (JSON.parse(raw) as Record<string, LockoutState>) : {};
  } catch {
    return {};
  }
}

function writeLockouts(lockouts: Record<string, LockoutState>): void {
  localStorage.setItem(LOCKOUT_KEY, JSON.stringify(lockouts));
}

function lockoutMessage(lockedUntil: number): string {
  const minutes = Math.max(1, Math.ceil((lockedUntil - Date.now()) / 60000));
  return `Account locked after too many failed sign-ins. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`;
}

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

    const existingEmployeeNumbers = new Set(
      database.getUsers().map((user) => user.employeeNumber),
    );
    defaultUsers.forEach((user) => {
      if (!existingEmployeeNumbers.has(user.employeeNumber)) {
        database.saveUser(user);
      }
    });

    for (const [employeeNumber, password] of Object.entries(defaultPasswords)) {
      const stored = database.getPassword(employeeNumber);
      if (!stored) {
        database.savePassword(employeeNumber, await hashPassword(password));
      } else if (!isPasswordHash(stored)) {
        database.savePassword(employeeNumber, await hashPassword(stored));
      }
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthState> {
    try {
      const database = this.requireDb();
      const lockouts = readLockouts();
      const lock = lockouts[credentials.employeeNumber];
      if (lock?.lockedUntil && lock.lockedUntil > Date.now()) {
        await recordAudit({
          action: 'LOGIN_FAILURE',
          actorEmployeeNumber: credentials.employeeNumber,
          success: false,
          detail: 'locked',
        });
        return {
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: lockoutMessage(lock.lockedUntil),
        };
      }

      const user = database.getUserByEmployeeNumber(credentials.employeeNumber);

      if (!user || !user.isActive) {
        await recordAudit({
          action: 'LOGIN_FAILURE',
          actorEmployeeNumber: credentials.employeeNumber,
          success: false,
          detail: user ? 'inactive' : 'unknown_user',
        });
        return {
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: 'Invalid credentials',
        };
      }

      const storedPassword = database.getPassword(credentials.employeeNumber);
      let matches = false;
      if (storedPassword && isPasswordHash(storedPassword)) {
        matches = await verifyPassword(credentials.password, storedPassword);
      } else if (storedPassword) {
        matches = storedPassword === credentials.password;
        if (matches) {
          database.savePassword(credentials.employeeNumber, await hashPassword(credentials.password));
        }
      }

      if (!matches) {
        const nextCount = (lock?.count ?? 0) + 1;
        const next: LockoutState = { count: nextCount };
        if (nextCount >= MAX_FAILED_ATTEMPTS) {
          next.lockedUntil = Date.now() + LOCKOUT_MS;
        }
        lockouts[credentials.employeeNumber] = next;
        writeLockouts(lockouts);
        await recordAudit({
          action: 'LOGIN_FAILURE',
          actorEmployeeNumber: credentials.employeeNumber,
          success: false,
          detail: `attempts=${nextCount}`,
        });
        return {
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: next.lockedUntil
            ? lockoutMessage(next.lockedUntil)
            : 'Invalid credentials',
        };
      }

      delete lockouts[credentials.employeeNumber];
      writeLockouts(lockouts);

      user.lastLogin = new Date();
      database.saveUser(user);
      await recordAudit({
        action: 'LOGIN_SUCCESS',
        actorEmployeeNumber: user.employeeNumber,
        success: true,
      });

      return {
        isAuthenticated: true,
        user,
        isLoading: false,
        error: null,
      };
    } catch {
      return {
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: 'Login failed. Please try again.',
      };
    }
  }

  async logout(actorEmployeeNumber?: string): Promise<void> {
    await recordAudit({
      action: 'LOGOUT',
      actorEmployeeNumber,
      success: true,
    });
  }

  getCurrentUser(): User | null {
    const sessionData = sessionStorage.getItem('currentUser');
    return sessionData ? JSON.parse(sessionData) : null;
  }

  setCurrentUser(user: User): void {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
  }

  clearCurrentUser(): void {
    sessionStorage.removeItem('currentUser');
  }

  getAllUsers(): User[] {
    return this.requireDb().getUsers();
  }

  async addUser(user: Omit<User, 'id' | 'createdAt'>, password: string): Promise<boolean> {
    try {
      const policy = validatePasswordPolicy(password, user.employeeNumber);
      if (!policy.ok) {
        return false;
      }
      const database = this.requireDb();
      const existingUser = database.getUserByEmployeeNumber(user.employeeNumber);
      if (existingUser) {
        return false;
      }

      const newUser: User = {
        ...user,
        id: `user-${Date.now()}`,
        createdAt: new Date(),
        mustChangePassword: user.mustChangePassword ?? true,
      };

      database.saveUser(newUser);
      database.savePassword(user.employeeNumber, await hashPassword(password));
      await recordAudit({
        action: 'USER_CREATE',
        actorEmployeeNumber: user.employeeNumber,
        resourceType: 'User',
        resourceId: newUser.id,
        success: true,
      });
      return true;
    } catch {
      return false;
    }
  }

  updateUser(user: User): boolean {
    try {
      this.requireDb().saveUser(user);
      void recordAudit({
        action: 'USER_UPDATE',
        actorEmployeeNumber: user.employeeNumber,
        resourceType: 'User',
        resourceId: user.id,
        success: true,
      });
      return true;
    } catch {
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
        void recordAudit({
          action: 'USER_DEACTIVATE',
          actorEmployeeNumber: user.employeeNumber,
          resourceType: 'User',
          resourceId: user.id,
          success: true,
        });
        return true;
      }
      return false;
    } catch {
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
        void recordAudit({
          action: 'USER_ACTIVATE',
          actorEmployeeNumber: user.employeeNumber,
          resourceType: 'User',
          resourceId: user.id,
          success: true,
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async changePassword(
    employeeNumber: string,
    newPassword: string
  ): Promise<{ ok: boolean; error?: string }> {
    const policy = validatePasswordPolicy(newPassword, employeeNumber);
    if (!policy.ok) {
      return { ok: false, error: policy.errors[0] };
    }
    try {
      const database = this.requireDb();
      database.savePassword(employeeNumber, await hashPassword(newPassword));
      const user = database.getUserByEmployeeNumber(employeeNumber);
      if (user) {
        user.mustChangePassword = false;
        database.saveUser(user);
      }
      await recordAudit({
        action: 'PASSWORD_CHANGE',
        actorEmployeeNumber: employeeNumber,
        resourceType: 'User',
        success: true,
      });
      return { ok: true };
    } catch {
      return { ok: false, error: 'Failed to change password' };
    }
  }

  getUnitSettings(): UnitSettings[] {
    return this.requireDb().getUnitSettings();
  }

  saveUnitSettings(settings: UnitSettings): boolean {
    try {
      settings.lastModified = new Date();
      this.requireDb().saveUnitSettings(settings);
      return true;
    } catch {
      return false;
    }
  }

  deleteUnitSettings(settingsId: string): boolean {
    try {
      this.requireDb().deleteUnitSettings(settingsId);
      return true;
    } catch {
      return false;
    }
  }
}

export const authService = new AuthService();
