'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getOrgAdminDashboardData } from '@/actions/org-admin'
import OrgAdminClient from './OrgAdminClient'

interface PageProps {
  params: Promise<{ subdomain: string }>
}

export default async function OrgAdminDashboard({ params }: PageProps) {
  const { subdomain } = await params
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ORG_ADMIN') {
    redirect(`/login`)
  }

  // Double check that the user belongs to this subdomain
  if (session.user.tenantSubdomain !== subdomain.toLowerCase()) {
    redirect(`/login`)
  }

  const data = await getOrgAdminDashboardData(subdomain)

  return (
    <div className="min-h-screen bg-[#070913] text-white">
      <OrgAdminClient initialData={data} subdomain={subdomain} adminName={session.user.name || 'Admin'} />
    </div>
  )
}
