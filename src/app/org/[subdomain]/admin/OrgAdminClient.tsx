'use client'

import React, { useState } from 'react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { onboardDoctor } from '@/actions/org-admin'
import {
  Building2,
  Stethoscope,
  PlusCircle,
  Clock,
  IndianRupee,
  LogOut,
  Mail,
  User,
  Key,
  ShieldCheck,
  Calendar,
  AlertCircle,
  FileText,
  UserCheck
} from 'lucide-react'

interface OrgAdminClientProps {
  initialData: any
  subdomain: string
  adminName: string
}

const SPECIALTIES = [
  'General Medicine',
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Neurology',
  'Gastroenterology',
  'Orthopedics',
  'Psychiatry'
]

export default function OrgAdminClient({ initialData, subdomain, adminName }: OrgAdminClientProps) {
  const [doctors, setDoctors] = useState<any[]>(initialData.doctors || [])
  const [org] = useState<any>(initialData.org || {})
  
  // Doctor form state
  const [docName, setDocName] = useState('')
  const [docEmail, setDocEmail] = useState('')
  const [docPassword, setDocPassword] = useState('')
  const [docSpecialty, setDocSpecialty] = useState(SPECIALTIES[0])
  const [docDegree, setDocDegree] = useState('')
  const [docExperience, setDocExperience] = useState('0')
  const [docBio, setDocBio] = useState('')
  const [docFee, setDocFee] = useState('500')
  const [docSpeed, setDocSpeed] = useState('15')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!docName.trim()) return setError('Doctor Name is required')
    if (!docEmail.trim()) return setError('Doctor Email is required')
    if (!docPassword || docPassword.length < 6) return setError('Password must be at least 6 characters')
    
    const feeNum = parseFloat(docFee)
    if (isNaN(feeNum) || feeNum < 0) return setError('Consultation Fee must be a positive number')

    const speedNum = parseInt(docSpeed)
    if (isNaN(speedNum) || speedNum <= 0) return setError('Average Checkup Speed must be positive')

    const expNum = parseInt(docExperience)
    if (isNaN(expNum) || expNum < 0) return setError('Years of Experience must be 0 or positive')

    setLoading(true)

    try {
      const res = await onboardDoctor({
        name: docName,
        email: docEmail,
        passwordHash: docPassword,
        specialty: docSpecialty,
        degree: docDegree,
        experience: expNum,
        bio: docBio,
        consultationFee: feeNum,
        avgCheckupSpeed: speedNum,
        subdomain,
      })

      if (res.success && res.doctor) {
        setSuccess(`Successfully onboarded Dr. ${docName}!`)
        
        // Add to state immediately
        const newDoctorObject = {
          id: res.doctor.id,
          name: docName,
          email: docEmail,
          role: 'DOCTOR',
          createdAt: new Date(),
          doctorProfile: {
            specialty: docSpecialty,
            degree: docDegree,
            experience: expNum,
            bio: docBio,
            consultationFee: feeNum,
            avgCheckupSpeed: speedNum,
          }
        }
        setDoctors([newDoctorObject, ...doctors])

        // Reset form inputs
        setDocName('')
        setDocEmail('')
        setDocPassword('')
        setDocDegree('')
        setDocExperience('0')
        setDocBio('')
        setDocFee('500')
        setDocSpeed('15')
      } else {
        setError(res.message || 'Failed to onboard doctor.')
      }
    } catch (err: any) {
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const renewalDate = initialData.subscriptionRenewal 
    ? new Date(initialData.subscriptionRenewal).toLocaleDateString()
    : 'N/A'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header bar */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500/20 p-2 rounded-xl border border-blue-500/30">
            <Building2 className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              {org.name} Workspace
            </h1>
            <p className="text-xs text-slate-400">
              Onboarded Subdomain: <span className="text-blue-400 font-mono font-medium">{subdomain}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs text-slate-400">Manager: <span className="text-slate-200 font-medium">{adminName}</span></span>
          <Button
            onClick={() => signOut({ callbackUrl: '/login' })}
            variant="outline"
            className="border-white/10 hover:bg-white/10 text-slate-300 gap-2 flex items-center text-sm"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </Button>
        </div>
      </header>

      {/* Subscription banner */}
      <Card className="border border-blue-500/20 bg-blue-500/5 backdrop-blur-md rounded-2xl">
        <CardContent className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span>SaaS subscription renews on: <strong className="text-white font-semibold">{renewalDate}</strong></span>
          </div>
          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Status: {org.subscriptionStatus}
          </span>
        </CardContent>
      </Card>

      {/* Main split section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Onboarding Form Column */}
        <div className="lg:col-span-1">
          <Card className="border border-white/10 bg-white/5 backdrop-blur-md rounded-2xl sticky top-8">
            <CardHeader className="pb-3 border-b border-white/10">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-400" />
                Onboard New Doctor
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Register doctors. They will be linked directly to your organization.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleOnboardSubmit}>
              <CardContent className="space-y-4 pt-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs p-3 rounded-lg text-center font-medium flex items-center gap-1.5 justify-center">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs p-3 rounded-lg text-center font-medium flex items-center gap-1.5 justify-center">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    {success}
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="docName" className="text-slate-300 text-xs">Doctor Name</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <User className="w-4 h-4" />
                    </span>
                    <Input
                      id="docName"
                      type="text"
                      required
                      placeholder="e.g. Dr. Sarah Connor"
                      className="pl-9 h-9 text-sm"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="docEmail" className="text-slate-300 text-xs">Email Address</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <Input
                      id="docEmail"
                      type="email"
                      required
                      placeholder="doctor@hospital.com"
                      className="pl-9 h-9 text-sm"
                      value={docEmail}
                      onChange={(e) => setDocEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="docPass" className="text-slate-300 text-xs">Password</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Key className="w-4 h-4" />
                    </span>
                    <Input
                      id="docPass"
                      type="password"
                      required
                      placeholder="••••••••"
                      className="pl-9 h-9 text-sm"
                      value={docPassword}
                      onChange={(e) => setDocPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="specialty" className="text-slate-300 text-xs">Department/Specialty</Label>
                  <select
                    id="specialty"
                    className="w-full rounded-lg border border-white/10 bg-white/5 py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm h-9"
                    value={docSpecialty}
                    onChange={(e) => setDocSpecialty(e.target.value)}
                  >
                    {SPECIALTIES.map((spec) => (
                      <option key={spec} value={spec} className="bg-[#090d16]">
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="degree" className="text-slate-300 text-xs">Degree / Qualifications</Label>
                    <Input
                      id="degree"
                      type="text"
                      required
                      placeholder="e.g. MBBS, MD"
                      className="h-9 text-sm"
                      value={docDegree}
                      onChange={(e) => setDocDegree(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="experience" className="text-slate-300 text-xs">Experience (years)</Label>
                    <Input
                      id="experience"
                      type="number"
                      required
                      className="h-9 text-sm"
                      value={docExperience}
                      onChange={(e) => setDocExperience(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="fee" className="text-slate-300 text-xs">Consultation Fee (₹)</Label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                        <IndianRupee className="w-4 h-4" />
                      </span>
                      <Input
                        id="fee"
                        type="number"
                        required
                        className="pl-9 h-9 text-sm"
                        value={docFee}
                        onChange={(e) => setDocFee(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="speed" className="text-slate-300 text-xs">Checkup (mins)</Label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                        <Clock className="w-4 h-4" />
                      </span>
                      <Input
                        id="speed"
                        type="number"
                        required
                        className="pl-9 h-9 text-sm"
                        value={docSpeed}
                        onChange={(e) => setDocSpeed(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="bio" className="text-slate-300 text-xs">Doctor Biography</Label>
                  <textarea
                    id="bio"
                    placeholder="Brief description of expertise, clinical background, etc."
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-xs h-20 resize-none"
                    value={docBio}
                    onChange={(e) => setDocBio(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10 text-xs active:scale-[0.98] transition-all"
                >
                  {loading ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Register Practitioner
                    </>
                  )}
                </Button>
              </CardContent>
            </form>
          </Card>
        </div>

        {/* Directory Column */}
        <div className="lg:col-span-2">
          <Card className="border border-white/10 bg-white/5 backdrop-blur-md rounded-2xl">
            <CardHeader className="pb-3 border-b border-white/10">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-blue-400" />
                Hospital Practitioner Directory ({doctors.length})
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Active doctors who can schedule consultations and check in patients.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-white/5 text-slate-400 uppercase text-xs font-semibold tracking-wider border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4 rounded-tl-xl">Practitioner Name</th>
                      <th className="py-3 px-4">Specialty</th>
                      <th className="py-3 px-4 text-center">Avg Speed</th>
                      <th className="py-3 px-4 text-right rounded-tr-xl">Consult Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {doctors.length > 0 ? (
                      doctors.map((doc) => {
                        const profile = doc.doctorProfile || { specialty: 'General', consultationFee: 500, avgCheckupSpeed: 15, bio: '' }
                        return (
                          <tr key={doc.id} className="hover:bg-white/5 transition-all">
                            <td className="py-4 px-4">
                              <div className="font-semibold text-white">
                                {doc.name}
                                {profile.degree && <span className="text-xs text-slate-400 font-medium ml-1.5">({profile.degree})</span>}
                              </div>
                              <div className="text-xs text-slate-500 font-mono">{doc.email}</div>
                              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                                <span>Exp: {profile.experience || 0} years</span>
                                {profile.bio && (
                                  <>
                                    <span className="text-slate-700">•</span>
                                    <span className="truncate max-w-[200px]" title={profile.bio}>{profile.bio}</span>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4 font-medium">
                              <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-xs border border-blue-500/20 font-semibold">
                                {profile.specialty}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center font-mono text-xs text-slate-400">
                              {profile.avgCheckupSpeed} mins
                            </td>
                            <td className="py-4 px-4 text-right font-semibold text-emerald-400 font-mono text-xs">
                              ₹{profile.consultationFee}
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-500 font-medium">
                          No doctors have been onboarded for this hospital yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
