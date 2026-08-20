export const PRECONFIGURED_ACCOUNTS = [
  {
    email: 'tanauancharles1@gmail.com',
    role: 'owner',
    name: 'Authorized Owner / Complainant',
    location: 'Tacloban City, Leyte, 6500'
  },
  {
    email: 'admin@masterkanorcase.online',
    role: 'admin',
    name: 'System Administrator',
    location: 'Tacloban City, Leyte, 6500'
  },
  {
    email: 'user@masterkanorcase.online',
    role: 'user',
    name: 'Authorized Case Viewer / User',
    location: 'Tacloban City, Leyte, 6500'
  }
];

export function checkIsOwner(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase() === 'tanauancharles1@gmail.com';
}

export function checkIsAdmin(email?: string | null): boolean {
  if (!email) return false;
  const lower = email.toLowerCase();
  return lower === 'tanauancharles1@gmail.com' || lower === 'admin@masterkanorcase.online';
}
