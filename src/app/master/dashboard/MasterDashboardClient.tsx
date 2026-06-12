'use client'

import React, { useState } from 'react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { toggleOrganizationStatus } from '@/actions/master'
import { 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  IndianRupee, 
  Search, 
  Activity, 
  LogOut, 
  ExternalLink,
  History,
  Lock,
  Unlock,
  ShieldCheck,
  Calendar
} from 'lucide-react'

interface MasterDashboardClientProps {
  initialData: any
  adminName: string
}

export default function MasterDashboardClient({ initialData, adminName }: MasterDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'orgs' | 'payments'>('orgs')
  const [searchQuery, setSearchQuery] = useState('')
  const [orgs, setOrgs] = useState<any[]>(initialData.organizations || [])
  const [payments, setPayments] = useState<any[]>(initialData.payments || [])
  const [stats, setStats] = useState<any>(initialData.stats || {
    totalOrgs: 0,
    activeOrgs: 0,
    suspendedOrgs: 0,
    totalRevenue: 0
  })
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleToggleStatus = async (orgId: string) => {
    setLoadingId(orgId)
    try {
      const res = await toggleOrganizationStatus(orgId)
      if (res.success && res.status) {
        // Update local state
        const updatedOrgs = orgs.map((org) => {
          if (org.id === orgId) {
            return { ...org, subscriptionStatus: res.status }
          }
          return org
        })
        setOrgs(updatedOrgs)

        // Recalculate stats
        const activeCount = updatedOrgs.filter(o => o.subscriptionStatus === 'ACTIVE').length
        const suspendedCount = updatedOrgs.filter(o => o.subscriptionStatus === 'SUSPENDED').length
        setStats({
          ...stats,
          activeOrgs: activeCount,
          suspendedOrgs: suspendedCount
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingId(null)
    }
  }

  const filteredOrgs = orgs.filter((org) => 
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.subdomain.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredPayments = payments.filter((p) => 
    p.organization?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.razorpayPaymentId && p.razorpayPaymentId.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header bar */}
      <header className="flex justify-between items-center bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="bg-red-500/20 p-2 rounded-xl border border-red-500/30">
            <ShieldCheck className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              HealSync AI Platform Console
            </h1>
            <p className="text-xs text-slate-400">Authenticated as: <span className="text-red-400 font-medium">{adminName}</span></p>
          </div>
        </div>
        <Button 
          onClick={() => signOut({ callbackUrl: '/master/login' })}
          variant="outline" 
          className="border-white/10 hover:bg-white/10 text-slate-300 gap-2 flex items-center text-sm"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </Button>
      </header>

      {/* Metrics widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-white/10 bg-white/5 backdrop-blur-md rounded-2xl">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Tenants</p>
              <h3 className="text-3xl font-extrabold text-white">{stats.totalOrgs}</h3>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-2xl border border-blue-500/30">
              <Building2 className="w-6 h-6 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-white/10 bg-white/5 backdrop-blur-md rounded-2xl">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Active Domains</p>
              <h3 className="text-3xl font-extrabold text-emerald-400">{stats.activeOrgs}</h3>
            </div>
            <div className="bg-emerald-500/20 p-3 rounded-2xl border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-white/10 bg-white/5 backdrop-blur-md rounded-2xl">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Suspended Domains</p>
              <h3 className="text-3xl font-extrabold text-red-400">{stats.suspendedOrgs}</h3>
            </div>
            <div className="bg-red-500/20 p-3 rounded-2xl border border-red-500/30">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-white/10 bg-white/5 backdrop-blur-md rounded-2xl">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Billing Revenue</p>
              <h3 className="text-3xl font-extrabold text-indigo-400 flex items-center gap-1">
                <IndianRupee className="w-6 h-6 inline" />
                {stats.totalRevenue.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="bg-indigo-500/20 p-3 rounded-2xl border border-indigo-500/30">
              <IndianRupee className="w-6 h-6 text-indigo-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Section */}
      <Card className="border border-white/10 bg-white/5 backdrop-blur-md rounded-2xl">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-5 gap-4">
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('orgs')}
              className={`pb-2 text-sm font-semibold border-b-2 transition-all ${activeTab === 'orgs' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Organizations Directory
              </span>
            </button>
            <button 
              onClick={() => setActiveTab('payments')}
              className={`pb-2 text-sm font-semibold border-b-2 transition-all ${activeTab === 'payments' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              <span className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Billing Ledger
              </span>
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder={`Search ${activeTab === 'orgs' ? 'organizations' : 'billing logs'}...`}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          {activeTab === 'orgs' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-white/5 text-slate-400 uppercase text-xs font-semibold tracking-wider border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4 rounded-tl-xl">Hospital/Organization</th>
                    <th className="py-3 px-4">Subdomain Link</th>
                    <th className="py-3 px-4">Administrator</th>
                    <th className="py-3 px-4">Onboarding Date</th>
                    <th className="py-3 px-4">Subscription Status</th>
                    <th className="py-3 px-4 rounded-tr-xl text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredOrgs.length > 0 ? (
                    filteredOrgs.map((org) => {
                      const adminUser = org.users[0] || { name: 'N/A', email: 'N/A' }
                      const domainLink = typeof window !== 'undefined'
                        ? `${window.location.protocol}//${org.subdomain}.${window.location.host.replace('www.', '')}`
                        : `https://${org.subdomain}.healsync-ai-six.vercel.app`

                      return (
                        <tr key={org.id} className="hover:bg-white/5 transition-all">
                          <td className="py-4 px-4 font-semibold text-white">{org.name}</td>
                          <td className="py-4 px-4 font-mono text-xs">
                            <a 
                              href={domainLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                            >
                              {org.subdomain}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-medium text-white">{adminUser.name}</div>
                            <div className="text-xs text-slate-500">{adminUser.email}</div>
                          </td>
                          <td className="py-4 px-4 text-xs font-mono text-slate-400">
                            {new Date(org.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              org.subscriptionStatus === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {org.subscriptionStatus}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <Button
                              onClick={() => handleToggleStatus(org.id)}
                              disabled={loadingId === org.id}
                              variant="ghost"
                              className={`text-xs gap-1.5 h-8 font-semibold active:scale-[0.98] ${
                                org.subscriptionStatus === 'ACTIVE' 
                                  ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' 
                                  : 'text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300'
                              }`}
                            >
                              {loadingId === org.id ? (
                                <Activity className="w-3.5 h-3.5 animate-spin" />
                              ) : org.subscriptionStatus === 'ACTIVE' ? (
                                <>
                                  <Lock className="w-3.5 h-3.5" />
                                  Suspend
                                </>
                              ) : (
                                <>
                                  <Unlock className="w-3.5 h-3.5" />
                                  Activate
                                </>
                              )}
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                        No registered organizations found matching search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-white/5 text-slate-400 uppercase text-xs font-semibold tracking-wider border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4 rounded-tl-xl">Receipt ID</th>
                    <th className="py-3 px-4">Organization</th>
                    <th className="py-3 px-4">Paid Fee</th>
                    <th className="py-3 px-4">Razorpay Reference</th>
                    <th className="py-3 px-4 rounded-tr-xl">Payment Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPayments.length > 0 ? (
                    filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-white/5 transition-all">
                        <td className="py-4 px-4 font-mono text-xs text-slate-400">{p.id.substring(0, 18)}...</td>
                        <td className="py-4 px-4">
                          <div className="font-semibold text-white">{p.organization?.name}</div>
                          <div className="text-xs font-mono text-slate-500">{p.organization?.subdomain}</div>
                        </td>
                        <td className="py-4 px-4 font-semibold text-emerald-400 flex items-center gap-0.5">
                          <IndianRupee className="w-3.5 h-3.5 inline" />
                          {p.amount}
                        </td>
                        <td className="py-4 px-4 text-xs font-mono text-indigo-400">
                          {p.razorpayPaymentId || 'N/A (Simulation)'}
                        </td>
                        <td className="py-4 px-4 text-xs font-mono text-slate-400 flex items-center gap-1.5 pt-5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {new Date(p.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                        No billing transactions found matching search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
