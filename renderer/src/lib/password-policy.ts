export const MIN_PASSWORD_LENGTH = 12;

const COMMON_PASSWORDS = new Set([
  'password',
  'password123',
  'password1234',
  'admin123',
  'admin1234',
  'nurse123',
  'tech123',
  'wall123',
  'changeme',
  'letmein',
  'qwerty12345',
  'welcome1234',
  'unitview123',
]);

export function validatePasswordPolicy(
  password: string,
  employeeNumber?: string
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (password.length > 128) {
    errors.push('Password must be 128 characters or fewer');
  }
  if (/\s/.test(password)) {
    errors.push('Password cannot contain spaces');
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.push('Password must include at least one letter and one number');
  }
  const normalized = password.trim().toLowerCase();
  if (COMMON_PASSWORDS.has(normalized)) {
    errors.push('Password is too common');
  }
  if (employeeNumber && normalized.includes(employeeNumber.trim().toLowerCase())) {
    errors.push('Password cannot contain the employee number');
  }
  return { ok: errors.length === 0, errors };
}
