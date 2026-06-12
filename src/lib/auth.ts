import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

function getSubdomainFromHost(host: string) {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'
  const baseDomains = [rootDomain, 'healsync-ai-six.vercel.app', 'localhost:3000']
  let subdomain = ''

  for (const base of baseDomains) {
    if (host.endsWith(base)) {
      const parts = host.replace(base, '')
      if (parts && parts !== 'www.' && parts.endsWith('.')) {
        subdomain = parts.slice(0, -1)
        break
      }
    }
  }
  return subdomain
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter an email and password')
        }

        const host = req?.headers?.host || ''
        const subdomain = getSubdomainFromHost(host)

        // Find user by email including organization
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { organization: true },
        })

        if (!user) {
          throw new Error('No user found with this email')
        }

        // 1. Master Admin verification
        if (user.role === 'MASTER_ADMIN') {
          if (subdomain) {
            throw new Error('Master Admin accounts can only log in on the main domain.')
          }
        } else {
          // 2. Tenant isolation verification
          if (!user.organization) {
            throw new Error('This account is not associated with any organization.')
          }
          if (user.organization.subdomain !== subdomain) {
            throw new Error(`This account does not belong to the ${subdomain || 'root'} tenant space.`)
          }
          if (user.organization.subscriptionStatus !== 'ACTIVE') {
            throw new Error('This organization subscription is currently suspended or unpaid.')
          }
        }

        // Verify password
        if (!user.password) {
          throw new Error('Please sign in using Google Auth.')
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) {
          throw new Error('Incorrect password')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          tenantSubdomain: user.organization?.subdomain || null,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.organizationId = (user as any).organizationId
        token.tenantSubdomain = (user as any).tenantSubdomain || null
        token.needsOnboarding = (user as any).role === 'MASTER_ADMIN' || (user as any).role === 'ORG_ADMIN' ? false : true
      }

      // Populate onboarding status and check tenant data
      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              role: true,
              organizationId: true,
              organization: { select: { subdomain: true } },
              doctorProfile: { select: { id: true } },
              patientProfile: { select: { id: true } },
            },
          })

          if (dbUser) {
            token.role = dbUser.role
            token.organizationId = dbUser.organizationId
            token.tenantSubdomain = dbUser.organization?.subdomain || null
            
            if (dbUser.role === 'MASTER_ADMIN' || dbUser.role === 'ORG_ADMIN') {
              token.needsOnboarding = false
            } else {
              token.needsOnboarding = !dbUser.doctorProfile && !dbUser.patientProfile
            }
          } else {
            token.needsOnboarding = true
          }
        } catch (dbErr) {
          console.error("JWT Callback database check error, falling back to cached token values:", dbErr)
          // If database is temporarily offline or connection times out, preserve existing token values
          if (!token.role) {
            token.role = 'PATIENT' // Safe fallback
          }
          if (token.role === 'MASTER_ADMIN' || token.role === 'ORG_ADMIN') {
            token.needsOnboarding = false
          }
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as any
        session.user.needsOnboarding = token.needsOnboarding as boolean
        session.user.organizationId = token.organizationId as string
        session.user.tenantSubdomain = token.tenantSubdomain as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
