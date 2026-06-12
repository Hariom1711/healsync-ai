'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { registerUser } from '@/actions/auth'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Activity } from 'lucide-react'

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

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT')
  const [specialty, setSpecialty] = useState('General Medicine')
  
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setMessage(null)
    setLoading(true)

    const formData = new FormData()
    formData.append('name', name)
    formData.append('email', email)
    formData.append('password', password)
    formData.append('role', role)
    if (role === 'DOCTOR') {
      formData.append('specialty', specialty)
    }

    try {
      const res = await registerUser(null, formData)

      if (res.success) {
        setSuccess(true)
        setMessage(res.message || 'Account created successfully!')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        if (res.error) {
          setErrors(res.error)
        } else if (res.message) {
          setMessage(res.message)
        }
        setLoading(false)
      }
    } catch (err) {
      console.error(err)
      setMessage('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 overflow-hidden">
      {/* Premium Background Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] rounded-full bg-emerald-600/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-md shadow-violet-500/20 mb-3">
            <Activity className="h-6 w-6 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">HealSync AI</h1>
          <p className="text-sm text-slate-400 mt-1">Smart Healthcare Booking & Scribing</p>
        </div>

        <Card className="border-slate-800/80 bg-slate-900/40 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Create an Account</CardTitle>
            <CardDescription>Join our platform as a patient or medical professional</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {message && (
                <div
                  className={`p-3 text-sm rounded-lg border ${
                    success
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}
                >
                  {message}
                </div>
              )}
              
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading || success}
                  error={!!errors.name}
                />
                {errors.name && <p className="text-xs text-red-400">{errors.name[0]}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || success}
                  error={!!errors.email}
                />
                {errors.email && <p className="text-xs text-red-400">{errors.email[0]}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || success}
                  error={!!errors.password}
                />
                {errors.password && <p className="text-xs text-red-400">{errors.password[0]}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <Label htmlFor="role">I am a...</Label>
                  <Select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'PATIENT' | 'DOCTOR')}
                    disabled={loading || success}
                  >
                    <option value="PATIENT" className="bg-slate-900 text-slate-100">Patient</option>
                    <option value="DOCTOR" className="bg-slate-900 text-slate-100">Doctor</option>
                  </Select>
                </div>

                {role === 'DOCTOR' && (
                  <div className="space-y-1.5 col-span-2 sm:col-span-1 animate-fadeIn">
                    <Label htmlFor="specialty">Medical Specialty</Label>
                    <Select
                      id="specialty"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      disabled={loading || success}
                    >
                      {SPECIALTIES.map((spec) => (
                        <option key={spec} value={spec} className="bg-slate-900 text-slate-100">
                          {spec}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" variant="primary" className="w-full" disabled={loading || success}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>

              <div className="relative w-full flex items-center justify-center py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <span className="relative bg-[#0d1527] px-3 text-xs text-slate-500 uppercase">Or continue with</span>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center border-slate-800 hover:bg-slate-900 text-slate-200"
                onClick={() => signIn('google')}
                disabled={loading || success}
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.137 4.114-3.465 0-6.285-2.82-6.285-6.285 0-3.465 2.82-6.285 6.285-6.285 1.493 0 2.861.523 3.937 1.411L20.89 3.49C18.66 1.416 15.65.114 12.24.114 5.714.114.4 5.428.4 11.954s5.314 11.84 11.84 11.84c6.82 0 11.36-4.793 11.36-11.554 0-.78-.07-1.531-.2-2.257H12.24z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </Button>

              <div className="text-center text-sm text-slate-400">
                Already have an account?{' '}
                <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                  Log in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
