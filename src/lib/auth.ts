import { db } from '@/lib/db'
import { verifyToken, getSessionCookieName } from '@/lib/auth/jwt'
import { AuthenticationError, AuthorizationError } from './errors'

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'STUDENT'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
  isPremium: boolean
  classLevel: string | null
  learningMode: string | null
}

export interface AuthResult {
  user: AuthUser
  isSuperAdmin: boolean
  isAdmin: boolean
}

function parseCookie(cookie: string, name: string): string | null {
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export async function verifyAuth(request?: Request): Promise<AuthResult | null> {
  try {
    const cookieHeader = request?.headers.get('cookie') ?? ''
    const token = parseCookie(cookieHeader, getSessionCookieName())
    if (!token) return null
    const payload = await verifyToken(token)
    if (!payload) return null
    const dbUser = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, role: true, isPremium: true, classLevel: true, learningMode: true },
    })
    if (!dbUser) return null
    return {
      user: { ...dbUser, name: dbUser.name ?? '', role: dbUser.role as Role, classLevel: dbUser.classLevel ?? null, learningMode: dbUser.learningMode ?? null },
      isSuperAdmin: dbUser.role === 'SUPER_ADMIN',
      isAdmin: dbUser.role === 'ADMIN' || dbUser.role === 'SUPER_ADMIN',
    }
  } catch {
    return null
  }
}

export async function requireAuth(request?: Request): Promise<AuthResult> {
  const auth = await verifyAuth(request)
  if (!auth) throw new AuthenticationError()
  return auth
}

export async function requireRole(request: Request | undefined, ...roles: Role[]): Promise<AuthResult> {
  const auth = await requireAuth(request)
  if (!roles.includes(auth.user.role)) {
    throw new AuthorizationError('এই কাজের জন্য অনুমতি নেই।')
  }
  return auth
}

export async function requireAdmin(request?: Request): Promise<AuthResult> {
  return requireRole(request, 'ADMIN', 'SUPER_ADMIN')
}

export async function requireSuperAdmin(request?: Request): Promise<AuthResult> {
  return requireRole(request, 'SUPER_ADMIN')
}

export function hasRole(user: { role: Role }, ...roles: Role[]): boolean {
  return roles.includes(user.role)
}

export function assertRole(user: { role: Role }, ...roles: Role[]): void {
  if (!roles.includes(user.role)) {
    throw new AuthorizationError('এই কাজের জন্য অনুমতি নেই।')
  }
}

let permissionCache: Map<string, Set<string>> | null = null
let permissionCacheTime = 0
const PERMISSION_CACHE_TTL = 60_000

async function getPermissionsForRole(role: Role): Promise<Set<string>> {
  if (role === 'SUPER_ADMIN') return new Set(['*'])
  const now = Date.now()
  if (permissionCache && now - permissionCacheTime <= PERMISSION_CACHE_TTL) {
    const cached = permissionCache.get(role)
    if (cached) return cached
  }
  if (!permissionCache || now - permissionCacheTime > PERMISSION_CACHE_TTL) {
    permissionCache = new Map()
    permissionCacheTime = now
  }
  const rows = await db.rolePermission.findMany({
    where: { role },
    include: { permission: { select: { name: true } } },
  })
  const perms = new Set(rows.map(r => r.permission.name))
  permissionCache.set(role, perms)
  return perms
}

export function invalidatePermissionCache() {
  permissionCache = null
  permissionCacheTime = 0
}

export async function requirePermission(
  request: Request | undefined,
  permissionName: string,
): Promise<AuthResult> {
  const auth = await requireAuth(request)
  if (auth.user.role === 'SUPER_ADMIN') return auth
  const perms = await getPermissionsForRole(auth.user.role)
  if (!perms.has(permissionName)) {
    throw new AuthorizationError('এই কাজের জন্য অনুমতি নেই।')
  }
  return auth
}

export const RoleLabel: Record<Role, string> = {
  SUPER_ADMIN: 'সুপার অ্যাডমিন',
  ADMIN: 'অ্যাডমিন',
  STUDENT: 'শিক্ষার্থী',
}
