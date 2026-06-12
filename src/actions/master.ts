'use server'

import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function verifyMasterAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'MASTER_ADMIN') {
    throw new Error('Unauthorized. Platform admin access required.')
  }
}

export async function getMasterDashboardData() {
  await verifyMasterAdmin()

  try {
    const totalOrgs = await prisma.organization.count()
    const activeOrgs = await prisma.organization.count({ where: { subscriptionStatus: 'ACTIVE' } })
    const suspendedOrgs = await prisma.organization.count({ where: { subscriptionStatus: 'SUSPENDED' } })

    const payments = await prisma.payment.findMany({
      include: { organization: { select: { name: true, subdomain: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const totalRevenue = payments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0)

    const organizations = await prisma.organization.findMany({
      include: {
        users: {
          where: { role: 'ORG_ADMIN' },
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return {
      success: true,
      stats: {
        totalOrgs,
        activeOrgs,
        suspendedOrgs,
        totalRevenue,
      },
      organizations,
      payments,
    }
  } catch (err: any) {
    console.error('Fetch master stats error:', err)
    return {
      success: false,
      message: err.message || 'Failed to fetch platform metrics.',
      stats: { totalOrgs: 0, activeOrgs: 0, suspendedOrgs: 0, totalRevenue: 0 },
      organizations: [],
      payments: [],
    }
  }
}

export async function toggleOrganizationStatus(orgId: string) {
  await verifyMasterAdmin()

  try {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    })

    if (!org) {
      return { success: false, message: 'Organization not found' }
    }

    const nextStatus = org.subscriptionStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'

    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: { subscriptionStatus: nextStatus },
    })

    return { success: true, status: updated.subscriptionStatus }
  } catch (err: any) {
    console.error('Toggle status error:', err)
    return { success: false, message: err.message || 'Failed to toggle organization subscription status.' }
  }
}
