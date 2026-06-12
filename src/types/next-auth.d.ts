import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'PATIENT' | 'DOCTOR'
      needsOnboarding: boolean
    } & DefaultSession['user']
  }

  interface User {
    id: string
    role: 'PATIENT' | 'DOCTOR'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'PATIENT' | 'DOCTOR'
    needsOnboarding?: boolean
  }
}
