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
import { Calendar, User, Activity, AlertTriangle, ArrowLeft } from 'lucide-react'
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
    <div className="w-full max-w-2xl mx-auto z-10 space-y-6">
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
            Choose a specialty and doctor, select a time slot, and confirm your booking.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleBook}>
          <CardContent className="space-y-5">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="specialty">Medical Specialty</Label>
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

              <div className="space-y-1.5">
                <Label htmlFor="doctor">Select Doctor</Label>
                {loadingDoctors ? (
                  <div className="h-11 rounded-lg bg-slate-900/40 border border-slate-700/80 flex items-center px-4">
                    <Activity className="h-4 w-4 text-violet-500 animate-spin mr-2" />
                    <span className="text-sm text-slate-400">Loading doctors...</span>
                  </div>
                ) : doctors.length === 0 ? (
                  <div className="h-11 rounded-lg bg-slate-900/40 border border-yellow-500/20 text-yellow-500/80 flex items-center px-4 text-sm">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    No doctors available in this specialty.
                  </div>
                ) : (
                  <Select
                    id="doctor"
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    disabled={submitting || success}
                  >
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id} className="bg-slate-900 text-slate-100">
                        {doc.user.name}
                      </option>
                    ))}
                  </Select>
                )}
              </div>
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
                rows={4}
                className="w-full rounded-lg bg-slate-900/60 border border-slate-700/80 px-4 py-2.5 text-slate-100 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:pointer-events-none disabled:opacity-50"
                placeholder="Briefly describe your symptoms or write any notes for the doctor..."
                value={triageSummary}
                onChange={(e) => setTriageSummary(e.target.value)}
                disabled={submitting || success}
              />
              <p className="text-xs text-slate-400">
                You can carry over your AI symptom triage summary here so the doctor can review it before the visit.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              variant="primary"
              className="w-full"
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
