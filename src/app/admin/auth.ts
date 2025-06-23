// This is a simple authentication implementation. In a production environment,
// you should use a proper authentication system with secure password hashing and storage.

interface AdminUser {
  username: string;
  password: string;
}

const ADMIN_USERS: AdminUser[] = [
  {
    username: 'admin',
    password: 'shirthappenz2024' // In production, use hashed passwords
  }
];

export function authenticate(username: string, password: string): boolean {
  const user = ADMIN_USERS.find(u => u.username === username);
  if (!user) return false;
  return user.password === password;
}

export function isAuthenticated(): boolean {
  // In a real application, verify the session/token
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return !!token;
}

export function login(username: string, password: string): boolean {
  if (authenticate(username, password)) {
    localStorage.setItem('adminToken', 'admin-session-token'); // Use proper JWT in production
    return true;
  }
  return false;
}

export function logout(): void {
  localStorage.removeItem('adminToken');
} 