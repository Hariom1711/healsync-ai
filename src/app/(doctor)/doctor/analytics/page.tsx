'use client'

import React, { useState, useEffect } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getDoctorAnalyticsData } from '@/actions/analytics'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Activity, LogOut, User, Users, ClipboardList, Clock, 
  Send, RefreshCw, BarChart3, Pill, AlertCircle, Sparkles, BookOpen 
} from 'lucide-react'

interface MetricData {
  totalCompleted: number
  queueSize: number
  uniquePatients: number
  avgCheckupSpeed: number
}

interface TrendItem {
  name: string
  count: number
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function DoctorAnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [metrics, setMetrics] = useState<MetricData>({ totalCompleted: 0, queueSize: 0, uniquePatients: 0, avgCheckupSpeed: 15 })
  const [genders, setGenders] = useState<Record<string, number>>({ Male: 0, Female: 0, Other: 0, Unknown: 0 })
  const [ages, setAges] = useState<Record<string, number>>({ Pediatric: 0, Adult: 0, Senior: 0, Unknown: 0 })
  const [diagnoses, setDiagnoses] = useState<TrendItem[]>([])
  const [prescriptions, setPrescriptions] = useState<TrendItem[]>([])

  const [loading, setLoading] = useState(true)
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello doctor! I am your clinical analytics assistant. I have access to your clinic demographics, diagnosis aggregates, and prescription trends. Ask me anything about your practice statistics!',
    },
  ])
  const [chatInput, setChatInput] = useState('')
  const [sendingChat, setSendingChat] = useState(false)

  const fetchAnalytics = async () => {
    setLoading(true)
    const res = await getDoctorAnalyticsData()
    if (res.success) {
      setMetrics(res.metrics)
      setGenders(res.demographics.gender)
      setAges(res.demographics.age)
      setDiagnoses(res.trends.diagnoses)
      setPrescriptions(res.trends.prescriptions)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAnalytics()
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

  const handleSendChat = async (e: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault()
    
    const textToSend = customPrompt || chatInput
    if (!textToSend.trim() || sendingChat) return

    const userMessage: Message = { role: 'user', content: textToSend }
    const updatedMessages = [...chatMessages, userMessage]
    
    setChatMessages(updatedMessages)
    setChatInput('')
    setSendingChat(true)

    try {
      const res = await fetch('/api/doctor/analytics-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      })

      const data = await res.json()
      if (res.ok && data.content) {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: data.content }])
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Sorry, I had trouble analyzing that query. Please try again.' },
        ])
      }
    } catch (err) {
      console.error(err)
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'An unexpected connection error occurred.' },
      ])
    } finally {
      setSendingChat(false)
    }
  }

  // Calculate percentages for demographics UI
  const totalDemographics = genders.Male + genders.Female + genders.Other + genders.Unknown
  const malePercent = totalDemographics > 0 ? Math.round((genders.Male / totalDemographics) * 100) : 0
  const femalePercent = totalDemographics > 0 ? Math.round((genders.Female / totalDemographics) * 100) : 0
  const otherPercent = totalDemographics > 0 ? Math.round(((genders.Other + genders.Unknown) / totalDemographics) * 100) : 0

  const totalAges = ages.Pediatric + ages.Adult + ages.Senior + ages.Unknown
  const pedPercent = totalAges > 0 ? Math.round((ages.Pediatric / totalAges) * 100) : 0
  const adultPercent = totalAges > 0 ? Math.round((ages.Adult / totalAges) * 100) : 0
  const seniorPercent = totalAges > 0 ? Math.round((ages.Senior / totalAges) * 100) : 0

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
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
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white px-3">
                  Queue Manager
                </Button>
              </Link>
              <Link href="/doctor/analytics">
                <Button variant="glass" size="sm" className="text-emerald-400 bg-emerald-500/10 border-emerald-500/20 px-3">
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

      {/* Main layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Navigation / Header Title Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-emerald-400" />
              Clinic Insights & Analytics
            </h1>
            <p className="text-slate-400 text-sm">Review your consultation statistics, demographics, and ask our AI assistant for analysis.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/doctor/dashboard" className="sm:hidden">
              <Button variant="outline" size="sm">Queue Manager</Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAnalytics}
              className="border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Sync Data
            </Button>
          </div>
        </div>

        {/* Metrics Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Completed Consultations */}
          <Card className="border-slate-800/80 bg-slate-900/30">
            <CardContent className="p-5 flex items-center space-x-4">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Total Completed</p>
                <h3 className="text-2xl font-bold text-white mt-0.5">{metrics.totalCompleted}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Finalized consultations</p>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Queue Size */}
          <Card className="border-slate-800/80 bg-slate-900/30">
            <CardContent className="p-5 flex items-center space-x-4">
              <div className="p-3.5 rounded-xl bg-violet-500/10 text-violet-400">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">In Queue Today</p>
                <h3 className="text-2xl font-bold text-white mt-0.5">{metrics.queueSize}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Patients waiting in lobby</p>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Unique Patients */}
          <Card className="border-slate-800/80 bg-slate-900/30">
            <CardContent className="p-5 flex items-center space-x-4">
              <div className="p-3.5 rounded-xl bg-blue-500/10 text-blue-400">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Unique Patients</p>
                <h3 className="text-2xl font-bold text-white mt-0.5">{metrics.uniquePatients}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Registered medical files</p>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Target Consultation speed */}
          <Card className="border-slate-800/80 bg-slate-900/30">
            <CardContent className="p-5 flex items-center space-x-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 text-amber-400">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Target Checkup Speed</p>
                <h3 className="text-2xl font-bold text-white mt-0.5">{metrics.avgCheckupSpeed}m</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Assigned speed threshold</p>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Two Column details + chat block */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column (col-span-7): Analytics Demographics & Trends */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Demographics Card */}
            <Card className="border-slate-800/80 bg-slate-900/30">
              <CardHeader className="border-b border-slate-800/60 p-5">
                <CardTitle className="text-base flex items-center gap-1.5">
                  <User className="h-4 w-4 text-emerald-400" />
                  Patient Demographics
                </CardTitle>
                <CardDescription className="text-xs">Distribution profile of treated patients</CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-6">
                
                {loading ? (
                  <div className="h-40 flex items-center justify-center text-slate-400">
                    <Activity className="h-5 w-5 animate-spin mr-2 text-emerald-500" /> Calculating metrics...
                  </div>
                ) : totalDemographics === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-sm">
                    No demographic data available yet. Please complete appointments first.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Genders split */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Gender Split</h4>
                      
                      {/* Male progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium text-slate-400">
                          <span>Male</span>
                          <span>{malePercent}% ({genders.Male})</span>
                        </div>
                        <div className="w-full h-2 rounded bg-slate-950 overflow-hidden">
                          <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${malePercent}%` }} />
                        </div>
                      </div>

                      {/* Female progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium text-slate-400">
                          <span>Female</span>
                          <span>{femalePercent}% ({genders.Female})</span>
                        </div>
                        <div className="w-full h-2 rounded bg-slate-950 overflow-hidden">
                          <div className="h-full bg-violet-500 transition-all duration-500" style={{ width: `${femalePercent}%` }} />
                        </div>
                      </div>

                      {/* Other progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium text-slate-400">
                          <span>Other / Unknown</span>
                          <span>{otherPercent}% ({genders.Other + genders.Unknown})</span>
                        </div>
                        <div className="w-full h-2 rounded bg-slate-950 overflow-hidden">
                          <div className="h-full bg-slate-700 transition-all duration-500" style={{ width: `${otherPercent}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Age breakdown */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Age Profile</h4>
                      
                      {/* Pediatric progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium text-slate-400">
                          <span>Pediatric (0-17)</span>
                          <span>{pedPercent}% ({ages.Pediatric})</span>
                        </div>
                        <div className="w-full h-2 rounded bg-slate-950 overflow-hidden">
                          <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${pedPercent}%` }} />
                        </div>
                      </div>

                      {/* Adult progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium text-slate-400">
                          <span>Adult (18-64)</span>
                          <span>{adultPercent}% ({ages.Adult})</span>
                        </div>
                        <div className="w-full h-2 rounded bg-slate-950 overflow-hidden">
                          <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${adultPercent}%` }} />
                        </div>
                      </div>

                      {/* Senior progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium text-slate-400">
                          <span>Senior (65+)</span>
                          <span>{seniorPercent}% ({ages.Senior})</span>
                        </div>
                        <div className="w-full h-2 rounded bg-slate-950 overflow-hidden">
                          <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${seniorPercent}%` }} />
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trends Grid: Diagnoses and Prescriptions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Diagnoses Trends */}
              <Card className="border-slate-800/80 bg-slate-900/30">
                <CardHeader className="border-b border-slate-800/60 p-4">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-emerald-400" />
                    Top Diagnoses
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {loading ? (
                    <div className="h-32 flex items-center justify-center text-slate-500 text-xs">Loading...</div>
                  ) : diagnoses.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-6">No clinical diagnoses approved yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {diagnoses.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 rounded bg-slate-950/40 border border-slate-900">
                          <span className="text-xs font-medium text-slate-300 truncate max-w-[80%]">{item.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold shrink-0">
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Prescription Trends */}
              <Card className="border-slate-800/80 bg-slate-900/30">
                <CardHeader className="border-b border-slate-800/60 p-4">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <Pill className="h-4 w-4 text-emerald-400" />
                    Top Prescribed Drugs
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {loading ? (
                    <div className="h-32 flex items-center justify-center text-slate-500 text-xs">Loading...</div>
                  ) : prescriptions.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-6">No medication prescriptions approved yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {prescriptions.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 rounded bg-slate-950/40 border border-slate-900">
                          <span className="text-xs font-medium text-slate-300 truncate max-w-[80%]">{item.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 font-bold shrink-0">
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>

          </div>

          {/* Right Column (col-span-5): AI Clinic Analytics Assistant */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              AI Analytics Assistant
            </h2>

            <Card className="border-slate-800 bg-slate-900/30 flex flex-col h-[520px] shadow-lg">
              <CardHeader className="border-b border-slate-800/80 p-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Clinical Assistant</CardTitle>
                  <CardDescription className="text-xs">Llama 3 Clinic Queries</CardDescription>
                </div>
                {sendingChat && (
                  <Activity className="h-4 w-4 text-emerald-500 animate-spin" />
                )}
              </CardHeader>

              {/* Chat panel messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-4 py-2.5 text-xs whitespace-pre-line shadow-md leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-950 text-slate-300 border border-slate-850'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {sendingChat && (
                  <div className="flex justify-start">
                    <div className="bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-400 flex items-center space-x-2">
                      <LoaderDot />
                      <span>AI Assistant is compiling statistics...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestion Chips */}
              <div className="px-4 py-2 border-t border-slate-800/40 flex flex-wrap gap-1.5 bg-slate-900/20">
                <button
                  type="button"
                  onClick={(e) => handleSendChat(e, 'Give me a summary of patient demographics.')}
                  disabled={sendingChat}
                  className="text-[10px] bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-full px-2.5 py-1 transition-all"
                >
                  Demographics
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSendChat(e, 'What are the most common diagnoses and trends in my clinic?')}
                  disabled={sendingChat}
                  className="text-[10px] bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-full px-2.5 py-1 transition-all"
                >
                  Diagnoses
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSendChat(e, 'Summarize the prescriptions I have written recently.')}
                  disabled={sendingChat}
                  className="text-[10px] bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-full px-2.5 py-1 transition-all"
                >
                  Prescriptions
                </button>
              </div>

              {/* Chat Form */}
              <form onSubmit={(e) => handleSendChat(e)} className="p-4 border-t border-slate-800/80 flex gap-2">
                <Input
                  type="text"
                  placeholder="Ask about diagnoses, age splits, medication trends..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={sendingChat}
                  className="bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:ring-emerald-500/20"
                />
                <Button type="submit" variant="primary" disabled={sendingChat || !chatInput.trim()} className="px-3 bg-emerald-600 hover:bg-emerald-500">
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            </Card>
          </div>

        </div>

      </main>
    </div>
  )
}

function LoaderDot() {
  return (
    <span className="flex space-x-1 items-center">
      <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
      <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
      <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
    </span>
  )
}
