'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { completeOnboarding } from '@/actions/onboarding'
import { Activity, User, HeartPulse, Stethoscope, ChevronRight, Loader2 } from 'lucide-react'

export default function OnboardingPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR' | null>(null)
  const [specialty, setSpecialty] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('')
  const [medicalHistory, setMedicalHistory] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && session?.user && !session.user.needsOnboarding) {
      if (session.user.role === 'DOCTOR') {
        router.push('/doctor/dashboard')
      } else if (session.user.role === 'ORG_ADMIN') {
        router.push('/admin')
      } else {
        router.push('/patient/dashboard')
      }
    }
  }, [status, session, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Activity className="h-8 w-8 text-violet-500 animate-spin" />
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) return
    setError(null)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('role', role)
      formData.append('specialty', specialty)
      formData.append('dateOfBirth', dateOfBirth)
      formData.append('gender', gender)
      formData.append('medicalHistory', medicalHistory)

      const res = await completeOnboarding(formData)

      if (res.success) {
        // Trigger NextAuth update to fetch the fresh database session role & profiles status
        await update()
        
        // Direct redirect based on the role selected
        if (role === 'DOCTOR') {
          router.push('/doctor/dashboard')
        } else {
          router.push('/patient/dashboard')
        }
      } else {
        setError(res.message || 'Failed to complete onboarding. Please try again.')
        setLoading(false)
      }
    } catch (err) {
      console.error(err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 overflow-hidden">
      {/* Premium Background Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl z-10 animate-scaleIn">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-md shadow-violet-500/20 mb-3">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white text-center">Setup Your HealSync Profile</h1>
          <p className="text-sm text-slate-400 mt-2 text-center max-w-md">
            Welcome, {session?.user?.name}! Choose your account role and fill in your details to get started.
          </p>
        </div>

        <Card className="border-slate-800/80 bg-slate-900/40 backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleSubmit}>
            <CardContent className="p-6 sm:p-8 space-y-6">
              {error && (
                <div className="p-4 text-sm rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                  {error}
                </div>
              )}

              {/* Role Selection cards */}
              <div className="space-y-3">
                <Label className="text-base text-slate-200">I am joining as a...</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Patient Card */}
                  <div
                    onClick={() => setRole('PATIENT')}
                    className={`relative p-5 rounded-xl border cursor-pointer flex flex-col justify-between h-40 transition-all select-none hover:scale-[1.02] ${
                      role === 'PATIENT'
                        ? 'bg-violet-950/20 border-violet-500 shadow-lg shadow-violet-500/10'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className={`p-2.5 rounded-lg ${role === 'PATIENT' ? 'bg-violet-500/20 text-violet-400' : 'bg-slate-800 text-slate-400'}`}>
                        <HeartPulse className="h-6 w-6" />
                      </div>
                      {role === 'PATIENT' && (
                        <span className="w-3.5 h-3.5 rounded-full bg-violet-500 border border-slate-950 flex items-center justify-center" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">Patient</h4>
                      <p className="text-xs text-slate-400 mt-1">Book consultations, triage symptoms, and view prescriptions.</p>
                    </div>
                  </div>

                  {/* Doctor Card */}
                  <div
                    onClick={() => setRole('DOCTOR')}
                    className={`relative p-5 rounded-xl border cursor-pointer flex flex-col justify-between h-40 transition-all select-none hover:scale-[1.02] ${
                      role === 'DOCTOR'
                        ? 'bg-emerald-950/20 border-emerald-500 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className={`p-2.5 rounded-lg ${role === 'DOCTOR' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                        <Stethoscope className="h-6 w-6" />
                      </div>
                      {role === 'DOCTOR' && (
                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-slate-950 flex items-center justify-center" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">Medical Doctor</h4>
                      <p className="text-xs text-slate-400 mt-1">Manage waitlists, check-in patients, and use AI audio scribe.</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Patient Fields Form */}
              {role === 'PATIENT' && (
                <div className="space-y-4 pt-4 border-t border-slate-800/80 animate-fadeIn">
                  <h3 className="font-semibold text-white text-base">Patient Information</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        disabled={loading}
                        className="bg-slate-950 border-slate-800 text-slate-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="gender">Gender</Label>
                      <select
                        id="gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        disabled={loading}
                        className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="history">Pre-existing Medical Conditions / History</Label>
                    <textarea
                      id="history"
                      rows={3}
                      placeholder="e.g. Hypertension, penicillin allergy, asthma..."
                      value={medicalHistory}
                      onChange={(e) => setMedicalHistory(e.target.value)}
                      disabled={loading}
                      className="flex min-h-[80px] w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
              )}

              {/* Doctor Fields Form */}
              {role === 'DOCTOR' && (
                <div className="space-y-4 pt-4 border-t border-slate-800/80 animate-fadeIn">
                  <h3 className="font-semibold text-white text-base">Doctor Profile Details</h3>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="specialty">Medical Specialty</Label>
                    <select
                      id="specialty"
                      required
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      disabled={loading}
                      className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select Specialty</option>
                      <option value="General Medicine">General Medicine</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Dermatology">Dermatology</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Gastroenterology">Gastroenterology</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="Psychiatry">Psychiatry</option>
                    </select>
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="p-6 sm:p-8 border-t border-slate-800/80 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                disabled={loading || !role}
                className="flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Completing Setup...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Onboarding</span>
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
