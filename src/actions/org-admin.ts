'use server'

import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

async function verifyOrgAdmin(subdomain: string) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ORG_ADMIN') {
    throw new Error('Unauthorized. Organization Admin access required.')
  }

  // Verify the org admin actually belongs to this subdomain
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { organization: true },
  })

  if (!user || !user.organization || user.organization.subdomain !== subdomain.toLowerCase()) {
    throw new Error('Unauthorized. You do not have access to this organization tenant.')
  }

  return user.organization
}

export async function getOrgAdminDashboardData(subdomain: string) {
  try {
    const org = await verifyOrgAdmin(subdomain)

    const doctors = await prisma.user.findMany({
      where: {
        organizationId: org.id,
        role: 'DOCTOR',
      },
      include: {
        doctorProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const subscriptionRenewal = org.subscriptionExpiresAt

    return {
      success: true,
      org,
      doctors,
      subscriptionRenewal,
    }
  } catch (err: any) {
    console.error('Org Admin data fetch error:', err)
    return {
      success: false,
      message: err.message || 'Failed to retrieve tenant directory.',
      org: null,
      doctors: [],
      subscriptionRenewal: new Date(),
    }
  }
}

export async function onboardDoctor(data: {
  name: string
  email: string
  passwordHash: string
  specialty: string
  degree: string
  experience: number
  bio?: string
  consultationFee: number
  avgCheckupSpeed: number
  subdomain: string
}) {
  try {
    const org = await verifyOrgAdmin(data.subdomain)

    // Check if email already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    })

    if (existingUser) {
      return { success: false, message: 'An account with this email already exists.' }
    }

    // Hash doctor password
    const hashedPassword = await bcrypt.hash(data.passwordHash, 10)

    // Create Doctor User and Profile atomically
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email.toLowerCase().trim(),
          password: hashedPassword,
          role: 'DOCTOR',
          organizationId: org.id,
        },
      })

      const doctorProfile = await tx.doctorProfile.create({
        data: {
          userId: user.id,
          specialty: data.specialty,
          degree: data.degree,
          experience: data.experience,
          bio: data.bio || '',
          consultationFee: data.consultationFee,
          avgCheckupSpeed: data.avgCheckupSpeed,
          availability: {
            monday: ['09:00-12:00', '14:00-17:00'],
            tuesday: ['09:00-12:00', '14:00-17:00'],
            wednesday: ['09:00-12:00', '14:00-17:00'],
            thursday: ['09:00-12:00', '14:00-17:00'],
            friday: ['09:00-12:00', '14:00-17:00'],
          },
        },
      })

      return { user, doctorProfile }
    })

    return { success: true, doctor: result.user }

  } catch (err: any) {
    console.error('Doctor onboarding action error:', err)
    return { success: false, message: err.message || 'Failed to onboard doctor.' }
  }
}
