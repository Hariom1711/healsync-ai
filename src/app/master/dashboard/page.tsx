'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getMasterDashboardData } from '@/actions/master'
import MasterDashboardClient from './MasterDashboardClient'

export default async function MasterDashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'MASTER_ADMIN') {
    redirect('/master/login')
  }

  const data = await getMasterDashboardData()

  return (
    <div className="min-h-screen bg-[#070913] text-white">
      <MasterDashboardClient initialData={data} adminName={session.user.name || 'Master Admin'} />
    </div>
  )
}
