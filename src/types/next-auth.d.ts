import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'MASTER_ADMIN' | 'ORG_ADMIN' | 'DOCTOR' | 'PATIENT'
      needsOnboarding: boolean
      organizationId?: string | null
      tenantSubdomain?: string | null
    } & DefaultSession['user']
  }

  interface User {
    id: string
    role: 'MASTER_ADMIN' | 'ORG_ADMIN' | 'DOCTOR' | 'PATIENT'
    organizationId?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'MASTER_ADMIN' | 'ORG_ADMIN' | 'DOCTOR' | 'PATIENT'
    needsOnboarding?: boolean
    organizationId?: string | null
    tenantSubdomain?: string | null
  }
}

