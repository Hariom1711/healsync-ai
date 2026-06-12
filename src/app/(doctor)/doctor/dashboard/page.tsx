'use client'

import React, { useState, useEffect } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getDoctorDashboardData, checkInPatient, startConsultation } from '@/actions/doctor'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Activity, LogOut, User, Users, ClipboardList, Calendar, Play, RefreshCw, UserCheck, Clock } from 'lucide-react'

interface Appointment {
  id: string
  date: Date
  status: string
  triageSummary: string | null
  patient: {
    id: string
    user: {
      name: string
      email: string
    }
  }
  queue: any | null
}

interface QueueEntry {
  id: string
  status: string
  checkInTime: Date
  appointment: {
    id: string
    patient: {
      user: {
        name: string
      }
    }
  }
}

export default function DoctorDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [doctorName, setDoctorName] = useState('')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [activeQueue, setActiveQueue] = useState<QueueEntry[]>([])
  
  const [loading, setLoading] = useState(true)
  const [checkingInId, setCheckingInId] = useState<string | null>(null)
  const [startingId, setStartingId] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    setLoading(true)
    const res = await getDoctorDashboardData()
    if (res.success) {
      setDoctorName(res.doctorName || '')
      setAppointments(res.appointments as unknown as Appointment[])
      setActiveQueue(res.activeQueue as unknown as QueueEntry[])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardData()
    }
  }, [status])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Activity className="h-8 w-8 text-emerald-500 animate-spin" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  if (session?.user?.needsOnboarding) {
    router.push('/onboarding')
    return null
  }

  const handleCheckIn = async (appointmentId: string) => {
    setCheckingInId(appointmentId)
    const res = await checkInPatient(appointmentId)
    if (res.success) {
      // Reload dashboard data
      await fetchDashboardData()
    } else {
      alert(res.message || 'Failed to check in patient.')
    }
    setCheckingInId(null)
  }

  const handleStartConsult = async (queueId: string, appointmentId: string) => {
    setStartingId(queueId)
    const res = await startConsultation(queueId)
    if (res.success) {
      // Redirect to the scribing consultation room page
      router.push(`/doctor/consult/${appointmentId}`)
    } else {
      alert(res.message || 'Failed to start consultation.')
      setStartingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-emerald-500" />
            <span className="font-bold text-lg text-white">HealSync AI</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
              Medical Portal
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex space-x-1 mr-4">
              <Link href="/doctor/dashboard">
                <Button variant="glass" size="sm" className="text-emerald-400 bg-emerald-500/10 border-emerald-500/20 px-3">
                  Queue Manager
                </Button>
              </Link>
              <Link href="/doctor/analytics">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white px-3">
                  Analytics & Insights
                </Button>
              </Link>
            </nav>
            <div className="flex items-center space-x-2 text-sm text-slate-300">
              <User className="h-4 w-4 text-slate-400" />
              <span>{session?.user?.name}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center space-x-1 border-slate-700 hover:bg-slate-800"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-row items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Welcome, {doctorName || session?.user?.name}</h1>
            <p className="text-slate-400 font-medium">Manage your active patient clinic queue and consultations.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            className="border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Waiting Room Queue */}
          <div className="lg:col-span-6 space-y-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-400" />
              Active Waiting Room Queue
            </h2>

            {loading ? (
              <div className="h-48 border border-slate-800 rounded-xl bg-slate-900/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-emerald-500 animate-spin mr-2" />
                <span className="text-sm text-slate-400">Loading active queue...</span>
              </div>
            ) : activeQueue.length === 0 ? (
              <Card className="border-slate-800 bg-slate-900/20 py-8 text-center">
                <CardContent className="space-y-2">
                  <Users className="h-10 w-10 text-slate-600 mx-auto" />
                  <p className="text-slate-300 font-medium">Waiting room is empty</p>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto">
                    Patients will appear here once checked-in from scheduled appointments below.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeQueue.map((entry, index) => (
                  <Card key={entry.id} className="border-slate-800/80 bg-slate-900/30">
                    <CardContent className="p-5 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          <p className="font-semibold text-white text-base">
                            {entry.appointment.patient.user.name}
                          </p>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-500" />
                          Checked-in:{' '}
                          {new Date(entry.checkInTime).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      <Button
                        variant={entry.status === 'IN_CONSULTATION' ? 'primary' : 'glass'}
                        size="sm"
                        className="flex items-center space-x-1"
                        disabled={startingId === entry.id}
                        onClick={() => handleStartConsult(entry.id, entry.appointment.id)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        <span>{entry.status === 'IN_CONSULTATION' ? 'Resume Consult' : 'Start Consult'}</span>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Scheduled Appointments */}
          <div className="lg:col-span-6 space-y-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-emerald-400" />
              Scheduled Appointments (Today)
            </h2>

            {loading ? (
              <div className="h-48 border border-slate-800 rounded-xl bg-slate-900/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-emerald-500 animate-spin mr-2" />
                <span className="text-sm text-slate-400">Loading appointments...</span>
              </div>
            ) : appointments.length === 0 ? (
              <Card className="border-slate-800 bg-slate-900/20 py-8 text-center">
                <CardContent className="space-y-2">
                  <Calendar className="h-10 w-10 text-slate-600 mx-auto" />
                  <p className="text-slate-300 font-medium">No appointments scheduled today</p>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto">
                    New appointments booked by patients will automatically load here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt) => {
                  const isCheckedIn = !!apt.queue || activeQueue.some(q => q.appointment.id === apt.id);
                  
                  return (
                    <Card key={apt.id} className="border-slate-800/80 bg-slate-900/30">
                      <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div>
                            <p className="font-semibold text-white text-base">{apt.patient.user.name}</p>
                            <p className="text-xs text-slate-400">{apt.patient.user.email}</p>
                          </div>
                          
                          <div className="flex items-center text-slate-400 text-xs gap-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-slate-500" />
                              {new Date(apt.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-slate-500" />
                              {new Date(apt.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {apt.triageSummary && (
                            <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-850 text-[11px] text-slate-400 max-w-md">
                              <span className="font-semibold text-slate-300 block">AI Triage Note:</span>
                              <p className="line-clamp-2">{apt.triageSummary}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center">
                          {isCheckedIn ? (
                            <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
                              <UserCheck className="h-3.5 w-3.5" />
                              Checked In
                            </span>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-slate-700 hover:bg-slate-800 text-slate-200"
                              disabled={checkingInId === apt.id}
                              onClick={() => handleCheckIn(apt.id)}
                            >
                              Check In
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
