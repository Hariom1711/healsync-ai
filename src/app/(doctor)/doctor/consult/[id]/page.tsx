'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getAppointmentDetails, saveMedicalRecord } from '@/actions/doctor'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Activity, Mic, Square, Save, CheckCircle, RefreshCw, Plus, Trash2, ArrowLeft, FileText, ListTodo } from 'lucide-react'
import Link from 'next/link'

interface PrescriptionItem {
  medication: string
  dosage: string
  frequency: string
  duration: string
}

export default function ConsultPage() {
  const params = useParams()
  const router = useRouter()
  const appointmentId = params.id as string

  // Vitals & Details
  const [patientName, setPatientName] = useState('')
  const [triageSummary, setTriageSummary] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Recording State
  const [isRecording, setIsRecording] = useState(false)
  const [recordDuration, setRecordDuration] = useState(0)
  const [processingAudio, setProcessingAudio] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Scribe outputs
  const [transcript, setTranscript] = useState('')
  const [subjective, setSubjective] = useState('')
  const [objective, setObjective] = useState('')
  const [assessment, setAssessment] = useState('')
  const [plan, setPlan] = useState('')
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([])

  // Load appointment on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const res = await getAppointmentDetails(appointmentId)
      if (res.success && res.appointment) {
        setPatientName(res.appointment.patient.user.name)
        setTriageSummary(res.appointment.triageSummary || 'No symptom summary provided by the patient.')
        
        // Load existing record if available
        if (res.appointment.medicalRecord) {
          const record = res.appointment.medicalRecord
          setTranscript(record.transcript || '')
          
          const soap = record.soapNotes as any
          setSubjective(soap?.subjective || '')
          setObjective(soap?.objective || '')
          setAssessment(soap?.assessment || '')
          setPlan(soap?.plan || '')
          
          setPrescriptions((record.prescriptions as unknown as PrescriptionItem[]) || [])
        }
      } else {
        setError(res.message || 'Failed to load appointment details.')
      }
      setLoading(false)
    }

    loadData()
  }, [appointmentId])

  // Recording Timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      setRecordDuration(0)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRecording])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Audio Recording Handlers
  const startRecording = async () => {
    setError(null)
    audioChunksRef.current = []
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        // Process audio
        await uploadAudio(audioBlob)
        
        // Stop all tracks in stream
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error(err)
      setError('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const uploadAudio = async (audioBlob: Blob) => {
    setProcessingAudio(true)
    setError(null)

    const formData = new FormData()
    formData.append('audio', audioBlob, 'consult.wav')

    try {
      const res = await fetch('/api/scribe', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        setTranscript(data.transcript)
        setSubjective(data.soapNotes?.subjective || '')
        setObjective(data.soapNotes?.objective || '')
        setAssessment(data.soapNotes?.assessment || '')
        setPlan(data.soapNotes?.plan || '')
        setPrescriptions(data.prescriptions || [])
      } else {
        setError(data.error || 'Failed to process audio.')
      }
    } catch (err) {
      console.error(err)
      setError('An error occurred while communicating with the transcription service.')
    } finally {
      setProcessingAudio(false)
    }
  }

  // Prescription list managers
  const addPrescription = () => {
    setPrescriptions((prev) => [
      ...prev,
      { medication: '', dosage: '', frequency: '', duration: '' },
    ])
  }

  const removePrescription = (idx: number) => {
    setPrescriptions((prev) => prev.filter((_, i) => i !== idx))
  }

  const updatePrescription = (idx: number, field: keyof PrescriptionItem, value: string) => {
    setPrescriptions((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    )
  }

  // Save Record
  const handleSave = async (approved: boolean) => {
    setSaving(true)
    setError(null)

    const soapNotes = {
      subjective,
      objective,
      assessment,
      plan,
    }

    try {
      const res = await saveMedicalRecord({
        appointmentId,
        transcript,
        soapNotes,
        prescriptions,
        approved,
      })

      if (res.success) {
        if (approved) {
          router.push('/doctor/dashboard')
        } else {
          alert('Draft saved successfully!')
        }
      } else {
        setError(res.message || 'Failed to save record.')
      }
    } catch (err) {
      console.error(err)
      setError('An unexpected error occurred while saving.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Activity className="h-8 w-8 text-emerald-500 animate-spin mr-2" />
        <span className="text-white font-medium">Loading Scribe Workspace...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/doctor/dashboard" className="text-slate-400 hover:text-white transition-colors">
              <Button variant="ghost" size="sm" className="px-2">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Dashboard
              </Button>
            </Link>
            <div className="h-4 w-[1px] bg-slate-800" />
            <span className="font-bold text-white text-base">Consultation Room</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-800 hover:bg-slate-900"
              disabled={saving}
              onClick={() => handleSave(false)}
            >
              <Save className="h-4 w-4 mr-1.5" />
              Save Draft
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/10"
              disabled={saving}
              onClick={() => handleSave(true)}
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Approve & Finalize
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Scribe Panel & Vitals */}
        <div className="lg:col-span-4 space-y-6">
          {/* Patient Details Card */}
          <Card className="border-slate-800/80 bg-slate-900/40">
            <CardHeader className="p-5">
              <CardTitle className="text-lg">Patient Information</CardTitle>
              <CardDescription className="text-sm font-medium text-emerald-400 mt-1">
                Name: {patientName}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0 space-y-3">
              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-850 text-xs text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300 block">AI Patient Triage Summary:</span>
                <p className="leading-relaxed">{triageSummary}</p>
              </div>
            </CardContent>
          </Card>

          {/* Scribe Audio Recorder Card */}
          <Card className="border-slate-800/80 bg-slate-900/40">
            <CardHeader className="p-5">
              <CardTitle className="text-lg">Ambient Recorder</CardTitle>
              <CardDescription>Record consultation details to generate documentation.</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0 flex flex-col items-center justify-center py-8 space-y-6">
              {isRecording ? (
                <div className="flex flex-col items-center space-y-3">
                  <div className="relative flex items-center justify-center">
                    <span className="absolute inline-flex h-16 w-16 rounded-full bg-red-500/30 animate-ping" />
                    <button
                      onClick={stopRecording}
                      className="relative z-10 w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white transition-all shadow-lg shadow-red-500/20 active:scale-95"
                    >
                      <Square className="h-6 w-6" />
                    </button>
                  </div>
                  <span className="font-mono text-xl font-semibold text-white tracking-widest">
                    {formatDuration(recordDuration)}
                  </span>
                  <span className="text-xs text-red-400 font-medium animate-pulse">
                    Recording consult audio...
                  </span>
                </div>
              ) : processingAudio ? (
                <div className="flex flex-col items-center py-4 space-y-3">
                  <RefreshCw className="h-10 w-10 text-emerald-400 animate-spin" />
                  <span className="text-sm text-slate-400">Whisper & Llama 3 are scribing...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-3">
                  <button
                    onClick={startRecording}
                    className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 hover:border-emerald-500 hover:bg-slate-750 flex items-center justify-center text-emerald-400 transition-all shadow-md active:scale-95 group"
                  >
                    <Mic className="h-6 w-6 group-hover:scale-110 transition-transform" />
                  </button>
                  <span className="text-xs text-slate-400 font-medium">
                    Click to start ambient voice scribe
                  </span>
                </div>
              )}

              {error && (
                <div className="w-full p-3 text-xs rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-center">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Record Workspace (Transcript, SOAP, Prescriptions) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Transcript section */}
          <Card className="border-slate-800 bg-slate-900/30">
            <CardHeader className="p-5 flex flex-row items-center justify-between border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-emerald-400" />
                <CardTitle className="text-base">Consultation Transcript</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <textarea
                rows={5}
                className="w-full rounded-lg bg-slate-950/60 border border-slate-800 px-4 py-2.5 text-sm text-slate-300 placeholder-slate-600 transition-all duration-200 focus:outline-none focus:border-emerald-500"
                placeholder="The raw audio transcription will appear here. You can manually edit or type notes here..."
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* SOAP Notes Section */}
          <Card className="border-slate-800 bg-slate-900/30">
            <CardHeader className="p-5 flex flex-row items-center justify-between border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-emerald-400" />
                <CardTitle className="text-base">AI Generated SOAP Note</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="subjective">Subjective (S)</Label>
                <textarea
                  id="subjective"
                  rows={3}
                  className="w-full rounded-lg bg-slate-950/60 border border-slate-800 px-4 py-2.5 text-xs text-slate-300 placeholder-slate-650 focus:outline-none focus:border-emerald-500"
                  placeholder="Patient history, symptoms, onset..."
                  value={subjective}
                  onChange={(e) => setSubjective(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="objective">Objective (O)</Label>
                <textarea
                  id="objective"
                  rows={3}
                  className="w-full rounded-lg bg-slate-950/60 border border-slate-800 px-4 py-2.5 text-xs text-slate-300 placeholder-slate-650 focus:outline-none focus:border-emerald-500"
                  placeholder="Vital signs, physical examinations..."
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="assessment">Assessment (A)</Label>
                <textarea
                  id="assessment"
                  rows={3}
                  className="w-full rounded-lg bg-slate-950/60 border border-slate-800 px-4 py-2.5 text-xs text-slate-300 placeholder-slate-650 focus:outline-none focus:border-emerald-500"
                  placeholder="Working diagnosis, medical assessments..."
                  value={assessment}
                  onChange={(e) => setAssessment(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="plan">Plan (P)</Label>
                <textarea
                  id="plan"
                  rows={3}
                  className="w-full rounded-lg bg-slate-950/60 border border-slate-800 px-4 py-2.5 text-xs text-slate-300 placeholder-slate-650 focus:outline-none focus:border-emerald-500"
                  placeholder="Treatments, follow ups, test orders..."
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Prescriptions Section */}
          <Card className="border-slate-800 bg-slate-900/30">
            <CardHeader className="p-5 flex flex-row items-center justify-between border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <ListTodo className="h-5 w-5 text-emerald-400" />
                <CardTitle className="text-base">Prescribed Medications</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 hover:bg-slate-800 text-slate-200 text-xs px-2.5 h-8 flex items-center gap-1"
                onClick={addPrescription}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Drug
              </Button>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {prescriptions.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  No medications prescribed. Click "Add Drug" above to prescribe medications.
                </p>
              ) : (
                <div className="space-y-3">
                  {prescriptions.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                      <div className="col-span-4">
                        <Input
                          placeholder="Drug Name (e.g., Amoxicillin)"
                          value={item.medication}
                          onChange={(e) => updatePrescription(idx, 'medication', e.target.value)}
                          className="bg-slate-900/60 border-slate-800 text-xs py-1.5 h-9"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          placeholder="Dosage (500mg)"
                          value={item.dosage}
                          onChange={(e) => updatePrescription(idx, 'dosage', e.target.value)}
                          className="bg-slate-900/60 border-slate-800 text-xs py-1.5 h-9"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          placeholder="Frequency (TID)"
                          value={item.frequency}
                          onChange={(e) => updatePrescription(idx, 'frequency', e.target.value)}
                          className="bg-slate-900/60 border-slate-800 text-xs py-1.5 h-9"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          placeholder="Duration (7d)"
                          value={item.duration}
                          onChange={(e) => updatePrescription(idx, 'duration', e.target.value)}
                          className="bg-slate-900/60 border-slate-800 text-xs py-1.5 h-9"
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                          onClick={() => removePrescription(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  )
}
