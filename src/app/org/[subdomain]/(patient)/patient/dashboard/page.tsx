'use client'

import React, { useState, useEffect } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getPatientAppointments } from '@/actions/appointments'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Activity, LogOut, User, MessageSquare, Calendar, Clock, Send, ShieldAlert, ArrowRight, RefreshCw, ClipboardList, Pill, FileText, X } from 'lucide-react'

interface PrescriptionItem {
  medication: string
  dosage: string
  frequency: string
  duration: string
}

interface Appointment {
  id: string
  doctorId: string
  patientId: string
  date: Date
  status: string
  triageSummary: string | null
  doctor: {
    specialty: string
    user: {
      name: string
    }
  }
  medicalRecord: {
    id: string
    transcript: string | null
    soapNotes: any
    prescriptions: any
    approved: boolean
  } | null
  queue: {
    id: string
    status: string
    checkInTime: Date
  } | null
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface TriageResult {
  analysis: string
  isEmergency: boolean
  recommendedSpecialty: string
  explanation: string
  urgency: 'EMERGENCY' | 'HIGH' | 'MEDIUM' | 'LOW'
}

export default function PatientDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Appointments state
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(true)

  // Selected completed appointment record to view
  const [activeRecordApt, setActiveRecordApt] = useState<Appointment | null>(null)

  // Real-time Queue Stream State
  const [activeQueueStatus, setActiveQueueStatus] = useState<any>(null)

  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I am your HealSync AI triage assistant. Please describe the symptoms you are experiencing today (e.g., 'severe headache since yesterday', 'mild skin rash'). I will analyze them and recommend the appropriate specialist.",
    },
  ])
  const [input, setInput] = useState('')
  const [sendingChat, setSendingChat] = useState(false)
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null)

  // Fetch appointments on load
  const fetchAppointments = async () => {
    setLoadingAppointments(true)
    const res = await getPatientAppointments()
    if (res.success && res.appointments) {
      setAppointments(res.appointments as unknown as Appointment[])
    }
    setLoadingAppointments(false)
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAppointments()
    }
  }, [status])

  // Identify active checked-in appointment in queue
  const activeCheckedInApt = appointments.find(
    (apt) => apt.queue && (apt.queue.status === 'WAITING' || apt.queue.status === 'IN_CONSULTATION')
  )

  // Real-time EventSource queue stream
  useEffect(() => {
    if (!activeCheckedInApt) {
      setActiveQueueStatus(null)
      return
    }

    const eventSource = new EventSource(
      `/api/queue?appointmentId=${activeCheckedInApt.id}&doctorId=${activeCheckedInApt.doctorId}`
    )

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setActiveQueueStatus(data)
      } catch (err) {
        console.error('Failed to parse SSE data:', err)
      }
    }

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err)
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [activeCheckedInApt?.id])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Activity className="h-8 w-8 text-violet-500 animate-spin" />
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

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sendingChat) return

    const userMessage: Message = { role: 'user', content: input }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setSendingChat(true)
    setTriageResult(null)

    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      })

      const data = await res.json()

      if (res.ok) {
        setTriageResult({
          analysis: data.analysis,
          isEmergency: data.isEmergency,
          recommendedSpecialty: data.recommendedSpecialty,
          explanation: data.explanation,
          urgency: data.urgency,
        })

        let assistantResponse = `**Triage Analysis Results:**\n\n`
        assistantResponse += `* **Summary:** ${data.analysis}\n`
        assistantResponse += `* **Urgency:** ${data.urgency}\n`
        assistantResponse += `* **Recommended Specialty:** ${data.recommendedSpecialty}\n\n`
        assistantResponse += `${data.explanation}`

        setMessages((prev) => [...prev, { role: 'assistant', content: assistantResponse }])
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Sorry, I encountered an error while analyzing your symptoms. Please try again.' },
        ])
      }
    } catch (err) {
      console.error(err)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'An unexpected network error occurred. Please check your connection and try again.' },
      ])
    } finally {
      setSendingChat(false)
    }
  }

  const resetChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Hello! I am your HealSync AI triage assistant. Please describe the symptoms you are experiencing today (e.g., 'severe headache since yesterday', 'mild skin rash'). I will analyze them and recommend the appropriate specialist.",
      },
    ])
    setTriageResult(null)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-violet-500" />
            <span className="font-bold text-lg text-white">HealSync AI</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 font-medium">
              Patient Portal
            </span>
          </div>
          <div className="flex items-center space-x-4">
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back, {session?.user?.name}</h1>
            <p className="text-slate-400 text-sm">Describe symptoms to our AI triage bot, or view your medical prescriptions.</p>
          </div>
          <Link href="/book">
            <Button variant="primary" className="flex items-center space-x-1">
              <Calendar className="h-4 w-4 mr-1" />
              Book Appointment
            </Button>
          </Link>
        </div>

        {/* Real-Time Waiting Room Queue Banner */}
        {activeCheckedInApt && activeQueueStatus && (
          <Card className="border-emerald-500/20 bg-emerald-950/5 backdrop-blur-xl mb-8 border border-dashed">
            <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-start space-x-4">
                <div className="relative flex items-center justify-center mt-1">
                  <span className="absolute inline-flex h-4.5 w-4.5 rounded-full bg-emerald-500/40 animate-ping" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-base">You are Checked In</h3>
                  <p className="text-slate-400 text-xs sm:text-sm">
                    Active waiting list for {activeCheckedInApt.doctor.user.name} ({activeCheckedInApt.doctor.specialty}). 
                    Status: <span className="text-emerald-400 font-semibold">{activeQueueStatus.status === 'IN_CONSULTATION' ? 'Doctor is Ready (In Consultation)' : 'Waiting in Lobby'}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex gap-8 text-center sm:text-right shrink-0">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">Position in Line</span>
                  <span className="text-2xl font-extrabold text-white">
                    {activeQueueStatus.position !== null ? `#${activeQueueStatus.position}` : '--'}
                  </span>
                </div>
                <div className="h-10 w-[1px] bg-slate-800 self-center" />
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">Estimated Wait</span>
                  <span className="text-2xl font-extrabold text-emerald-400">
                    {activeQueueStatus.eta !== null ? (activeQueueStatus.eta === 0 ? 'Next Up' : `${activeQueueStatus.eta} min`) : '--'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Appointments */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-violet-400" />
                Appointments & Records
              </h2>
              <Button variant="ghost" size="sm" onClick={fetchAppointments} className="h-8 px-2 text-slate-400 hover:text-white">
                <RefreshCw className={`h-4 w-4 ${loadingAppointments ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {loadingAppointments ? (
              <div className="h-48 border border-slate-800 rounded-xl bg-slate-900/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-violet-500 animate-spin mr-2" />
                <span className="text-sm text-slate-400">Loading appointments...</span>
              </div>
            ) : appointments.length === 0 ? (
              <Card className="border-slate-800 bg-slate-900/20 py-8 text-center">
                <CardContent className="space-y-3">
                  <Calendar className="h-10 w-10 text-slate-600 mx-auto" />
                  <p className="text-slate-300 font-medium">No appointments</p>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto">
                    Use our AI Symptom triage checker on the right to get recommended to the right specialist.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt) => (
                  <Card key={apt.id} className="border-slate-800/80 bg-slate-900/30">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-white text-base">{apt.doctor.user.name}</p>
                          <p className="text-xs text-violet-400 font-medium">{apt.doctor.specialty}</p>
                        </div>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                          apt.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-slate-400 text-sm gap-4">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-slate-500" />
                          {new Date(apt.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-slate-500" />
                          {new Date(apt.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Display View Care Plan button for completed records */}
                      {apt.status === 'COMPLETED' && apt.medicalRecord && (
                        <div className="pt-2">
                          <Button
                            variant="glass"
                            size="sm"
                            className="w-full text-xs flex items-center justify-center space-x-1"
                            onClick={() => setActiveRecordApt(apt)}
                          >
                            <FileText className="h-3.5 w-3.5 mr-1" />
                            <span>View Care Plan & Rx</span>
                          </Button>
                        </div>
                      )}

                      {apt.triageSummary && apt.status !== 'COMPLETED' && (
                        <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-880 text-xs text-slate-400 space-y-1">
                          <span className="font-medium text-slate-300 block">Triage Note:</span>
                          <p className="line-clamp-2">{apt.triageSummary}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: AI Triage Assistant */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-violet-400" />
              AI Symptom Triage Checker
            </h2>

            <Card className="border-slate-800 bg-slate-900/30 flex flex-col h-[500px]">
              <CardHeader className="border-b border-slate-800/80 p-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Triage Assistant</CardTitle>
                  <CardDescription className="text-xs">Llama 3 70B Symptom Analysis</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={resetChat} className="text-xs text-slate-400 hover:text-white">
                  Reset Chat
                </Button>
              </CardHeader>
              
              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-line shadow ${
                        msg.role === 'user'
                          ? 'bg-violet-600 text-white'
                          : 'bg-slate-950 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {sendingChat && (
                  <div className="flex justify-start">
                    <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-400 flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-violet-500 animate-spin" />
                      <span>AI is analyzing symptoms...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChat} className="p-4 border-t border-slate-800/80 flex gap-2">
                <Input
                  type="text"
                  placeholder="Describe how you feel (e.g., severe belly pain after eating)..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={sendingChat}
                  className="bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:ring-violet-500/20"
                />
                <Button type="submit" variant="primary" disabled={sendingChat || !input.trim()} className="px-3.5">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </Card>

            {/* AI analysis dynamic recommendation helper panel */}
            {triageResult && (
              <Card className={`border-slate-800/80 animate-fadeIn ${
                triageResult.isEmergency 
                  ? 'bg-red-950/20 border-red-500/30' 
                  : 'bg-slate-900/40'
              }`}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start space-x-3">
                    {triageResult.isEmergency ? (
                      <ShieldAlert className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
                    ) : (
                      <Activity className="h-6 w-6 text-violet-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <h4 className="font-semibold text-white text-base">
                        {triageResult.isEmergency ? 'Critical Assessment Alert' : 'Triage Assessment Result'}
                      </h4>
                      <p className="text-sm text-slate-300">
                        {triageResult.explanation}
                      </p>
                    </div>
                  </div>

                  {!triageResult.isEmergency && (
                    <div className="flex flex-col sm:flex-row items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-880 gap-3">
                      <div>
                        <span className="text-xs text-slate-500">Suggested Action</span>
                        <p className="text-sm font-semibold text-white">Book a {triageResult.recommendedSpecialty} slot</p>
                      </div>
                      <Link
                        href={`/book?specialty=${encodeURIComponent(triageResult.recommendedSpecialty)}&triageSummary=${encodeURIComponent(
                          triageResult.analysis
                        )}`}
                        className="w-full sm:w-auto"
                      >
                        <Button variant="primary" size="sm" className="w-full sm:w-auto flex items-center space-x-1">
                          <span>Proceed to Book</span>
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          </div>

        </div>
      </main>

      {/* Modern Overlay Modal: Care Plan & Prescription Details */}
      {activeRecordApt && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <Card className="w-full max-w-xl border-slate-800 bg-slate-900/90 shadow-2xl relative animate-scaleIn">
            <button
              onClick={() => setActiveRecordApt(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white rounded-lg p-1 hover:bg-slate-800 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
            <CardHeader className="p-6 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-emerald-400" />
                <CardTitle>Medical Care Plan & Prescription</CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-400 mt-1">
                Consultation with {activeRecordApt.doctor.user.name} ({activeRecordApt.doctor.specialty}) on{' '}
                {new Date(activeRecordApt.date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              
              {/* Doctor Plan Notes */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  Doctor Recommendation & Plan
                </h4>
                <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-850 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {(activeRecordApt.medicalRecord?.soapNotes as any)?.plan || 'No plan notes available.'}
                </div>
              </div>

              {/* Prescriptions List */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Pill className="h-4 w-4 text-emerald-500" />
                  Prescribed Medications
                </h4>
                {(!activeRecordApt.medicalRecord?.prescriptions || 
                  (activeRecordApt.medicalRecord.prescriptions as any).length === 0) ? (
                  <p className="text-xs text-slate-500 italic p-3 text-center border border-slate-850 rounded-lg bg-slate-950/30">
                    No medications prescribed during this visit.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {(activeRecordApt.medicalRecord.prescriptions as PrescriptionItem[]).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-row items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-850 gap-4"
                      >
                        <div className="space-y-0.5">
                          <p className="font-semibold text-white text-sm">{item.medication}</p>
                          <p className="text-xs text-slate-400">
                            Dosage: {item.dosage} | Frequency: {item.frequency}
                          </p>
                        </div>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                          Duration: {item.duration}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="p-6 border-t border-slate-800 flex justify-end">
              <Button variant="ghost" onClick={() => setActiveRecordApt(null)} className="text-sm">
                Close Viewer
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}
