'use server'

import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function registerOrganization(data: {
  name: string
  subdomain: string
  adminName: string
  adminEmail: string
  adminPasswordHash: string
  amount: number
  razorpayOrderId?: string
  razorpayPaymentId?: string
}) {
  try {
    const cleanSubdomain = data.subdomain.toLowerCase().trim()
    const cleanEmail = data.adminEmail.toLowerCase().trim()

    // 1. Verify subdomain is unique
    const existingOrg = await prisma.organization.findUnique({
      where: { subdomain: cleanSubdomain },
    })

    if (existingOrg) {
      return { success: false, message: 'Subdomain already taken. Please choose another one.' }
    }

    // 2. Verify admin email is unique
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    })

    if (existingUser) {
      return { success: false, message: 'An account with this email already exists.' }
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(data.adminPasswordHash, 10)

    // 4. Create Organization, Admin User, and Payment record atomically
    const subscriptionExpiry = new Date()
    subscriptionExpiry.setMonth(subscriptionExpiry.getMonth() + 1) // 30 days subscription

    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: data.name,
          subdomain: cleanSubdomain,
          subscriptionStatus: 'ACTIVE',
          subscriptionExpiresAt: subscriptionExpiry,
        },
      })

      const user = await tx.user.create({
        data: {
          name: data.adminName,
          email: cleanEmail,
          password: hashedPassword,
          role: 'ORG_ADMIN',
          organizationId: org.id,
        },
      })

      await tx.payment.create({
        data: {
          organizationId: org.id,
          amount: data.amount,
          status: 'PAID',
          razorpayOrderId: data.razorpayOrderId || null,
          razorpayPaymentId: data.razorpayPaymentId || null,
        },
      })

      return org
    })

    return { success: true, organization: result }

  } catch (err: any) {
    console.error('Register organization transaction error:', err)
    return { success: false, message: err.message || 'Failed to complete organization onboarding.' }
  }
}
