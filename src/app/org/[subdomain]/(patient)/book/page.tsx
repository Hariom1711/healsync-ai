'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { getDoctorsBySpecialty, createAppointment } from '@/actions/appointments'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar, User, Activity, AlertTriangle, ArrowLeft, Clock, IndianRupee } from 'lucide-react'
import Link from 'next/link'

const SPECIALTIES = [
  'General Medicine',
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Neurology',
  'Gastroenterology',
  'Orthopedics',
  'Psychiatry',
]

function BookingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && session?.user?.needsOnboarding) {
      router.push('/onboarding')
    }
  }, [status, session, router])
  
  const initialSpecialty = searchParams.get('specialty') || 'General Medicine'
  const initialTriage = searchParams.get('triageSummary') || ''

  const [specialty, setSpecialty] = useState(initialSpecialty)
  const [triageSummary, setTriageSummary] = useState(initialTriage)
  
  const [doctors, setDoctors] = useState<any[]>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [recommendedDocId, setRecommendedDocId] = useState<string | null>(null)

  // Fetch doctors whenever selected specialty changes
  useEffect(() => {
    async function fetchDoctors() {
      setLoadingDoctors(true)
      setError(null)
      const res = await getDoctorsBySpecialty(specialty)
      if (res.success) {
        setDoctors(res.doctors)
        if (res.doctors.length > 0) {
          setSelectedDoctorId(res.doctors[0].id)
        } else {
          setSelectedDoctorId('')
        }
      } else {
        setError(res.message || 'Failed to retrieve doctors list.')
      }
      setLoadingDoctors(false)
    }

    fetchDoctors()
  }, [specialty])

  // Calculate AI Recommendation Match
  useEffect(() => {
    if (doctors.length === 0) {
      setRecommendedDocId(null)
      return
    }

    if (!triageSummary) {
      // Default to doctor with fastest checkup speed if no symptom details
      const fastest = [...doctors].sort((a, b) => (a.avgCheckupSpeed || 15) - (b.avgCheckupSpeed || 15))[0]
      const recommendedId = fastest?.id || doctors[0].id
      setRecommendedDocId(recommendedId)
      setSelectedDoctorId(recommendedId)
      return
    }

    let bestDocId = doctors[0].id
    let maxScore = -1
    const keywords = triageSummary.toLowerCase().split(/\s+/)

    doctors.forEach((doc) => {
      let score = 0
      const bioText = (doc.bio || '').toLowerCase()
      const specialtyText = (doc.specialty || '').toLowerCase()
      const nameText = (doc.user?.name || '').toLowerCase()

      keywords.forEach((word) => {
        if (word.length > 3) {
          if (bioText.includes(word)) score += 3
          if (specialtyText.includes(word)) score += 1
          if (nameText.includes(word)) score += 1
        }
      })

      // Bias for faster speed if score is tied
      score += (100 - (doc.avgCheckupSpeed || 15)) * 0.01

      if (score > maxScore) {
        maxScore = score
        bestDocId = doc.id
      }
    })

    setRecommendedDocId(bestDocId)
    setSelectedDoctorId(bestDocId)

  }, [doctors, triageSummary])

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!selectedDoctorId) {
      setError('Please select a doctor.')
      return
    }

    if (!bookingDate) {
      setError('Please pick a date and time for your appointment.')
      return
    }

    setSubmitting(true)

    try {
      const res = await createAppointment({
        doctorId: selectedDoctorId,
        date: new Date(bookingDate),
        triageSummary,
      })

      if (res.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/patient/dashboard')
        }, 2000)
      } else {
        setError(res.message)
        setSubmitting(false)
      }
    } catch (err) {
      console.error(err)
      setError('An error occurred while booking. Please try again.')
      setSubmitting(false)
    }
  }

  if (status === 'loading' || status === 'unauthenticated' || session?.user?.needsOnboarding) {
    return (
      <div className="h-48 flex items-center justify-center text-white bg-slate-900/40 border border-slate-800 rounded-xl max-w-2xl w-full p-8">
        <Activity className="h-6 w-6 text-violet-500 animate-spin mr-2" />
        <span>Verifying authorization...</span>
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto z-10 space-y-6">
      <div className="flex items-center space-x-2">
        <Link href="/patient/dashboard" className="text-slate-400 hover:text-white transition-colors">
          <Button variant="ghost" size="sm" className="px-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <Card className="border-slate-800/80 bg-slate-900/40 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Calendar className="h-6 w-6 text-violet-400" />
            <CardTitle>Schedule an Appointment</CardTitle>
          </div>
          <CardDescription>
            Choose a specialty, review doctor profiles, select a slot, and confirm your booking.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleBook}>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 text-sm rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 text-sm rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                🎉 Appointment booked successfully! Redirecting you to your dashboard...
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="specialty">Medical Specialty Department</Label>
              <Select
                id="specialty"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                disabled={submitting || success}
              >
                {SPECIALTIES.map((spec) => (
                  <option key={spec} value={spec} className="bg-slate-900 text-slate-100">
                    {spec}
                  </option>
                ))}
              </Select>
            </div>

            {/* Doctor Selection Grid */}
            <div className="space-y-3">
              <Label>Select Your Doctor</Label>
              {loadingDoctors ? (
                <div className="h-32 rounded-xl bg-slate-900/40 border border-slate-700/80 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-violet-500 animate-spin mr-2" />
                  <span className="text-sm text-slate-400">Retrieving department specialists...</span>
                </div>
              ) : doctors.length === 0 ? (
                <div className="h-20 rounded-xl bg-slate-900/40 border border-yellow-500/20 text-yellow-500/80 flex items-center justify-center text-sm p-4">
                  <AlertTriangle className="h-5 w-5 mr-2 shrink-0" />
                  No doctors currently registered in the {specialty} department.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doctors.map((doc) => {
                    const isSelected = selectedDoctorId === doc.id
                    const isRecommended = recommendedDocId === doc.id
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDoctorId(doc.id)}
                        className={`relative rounded-xl p-4 border cursor-pointer select-none transition-all flex flex-col justify-between min-h-[160px] ${
                          isSelected
                            ? 'bg-violet-600/10 border-violet-500 shadow-lg shadow-violet-500/10 scale-[1.01]'
                            : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                        }`}
                      >
                        {isRecommended && (
                          <div className="absolute top-2.5 right-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-[10px] font-bold px-2 py-0.5 rounded-full text-white shadow-md flex items-center gap-0.5 border border-emerald-500/30">
                            <Activity className="w-3 h-3 animate-pulse" />
                            Recommended Match
                          </div>
                        )}
                        
                        <div className="space-y-2 pr-24">
                          <h4 className="font-bold text-white text-base flex flex-wrap items-center gap-1.5">
                            {doc.user?.name || 'Dr. Practitioner'}
                            {doc.degree && (
                              <span className="text-xs font-medium text-violet-300 bg-violet-500/10 px-1.5 py-0.5 rounded">
                                {doc.degree}
                              </span>
                            )}
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-semibold tracking-wide border border-slate-700 uppercase">
                              {doc.specialty}
                            </span>
                            {doc.experience > 0 && (
                              <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-semibold tracking-wide border border-slate-700 uppercase">
                                {doc.experience} Yrs Exp
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2 italic pt-1">
                            {doc.bio || 'No biography details provided.'}
                          </p>
                        </div>

                        <div className="border-t border-slate-800/80 my-3 pt-3 flex justify-between items-center text-xs font-semibold">
                          <div className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-4 h-4 text-violet-400" />
                            <span>{doc.avgCheckupSpeed || 15} mins speed</span>
                          </div>
                          <div className="text-emerald-400 font-bold flex items-center gap-0.5">
                            <IndianRupee className="w-4 h-4 text-emerald-400 inline" />
                            <span>{doc.consultationFee || 500} fee</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="date">Appointment Date & Time</Label>
              <Input
                id="date"
                type="datetime-local"
                required
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                disabled={submitting || success || doctors.length === 0}
                className="cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="triage">Triage Summary / Symptoms Description</Label>
              <textarea
                id="triage"
                rows={3}
                className="w-full rounded-lg bg-slate-900/60 border border-slate-700/80 px-4 py-2 text-slate-100 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:pointer-events-none disabled:opacity-50 text-sm"
                placeholder="Briefly describe your symptoms or write any notes for the doctor..."
                value={triageSummary}
                onChange={(e) => setTriageSummary(e.target.value)}
                disabled={submitting || success}
              />
              <p className="text-[11px] text-slate-400">
                You can carry over your AI symptom triage summary here so the doctor can review it before the visit.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              variant="primary"
              className="w-full h-11 text-sm font-semibold active:scale-[0.98]"
              disabled={submitting || success || doctors.length === 0}
            >
              {submitting ? 'Confirming Booking...' : 'Confirm Appointment'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function BookingPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 overflow-hidden">
      {/* Premium Background Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none" />

      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center text-white">
          <Activity className="h-8 w-8 text-violet-500 animate-spin mr-2" /> Loading Booking Panel...
        </div>
      }>
        <BookingContent />
      </Suspense>
    </div>
  )
}
