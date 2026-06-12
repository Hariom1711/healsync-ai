'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Stethoscope, Building2, ShieldAlert, ArrowRight, Activity, Search } from 'lucide-react'
import Link from 'next/link'

export default function RootLoginPage() {
  const router = useRouter()
  const [subdomain, setSubdomain] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanSubdomain = subdomain.trim().toLowerCase()
    if (!cleanSubdomain) {
      setError('Please enter your hospital subdomain prefix.')
      return
    }

    if (!/^[a-zA-Z0-9-]+$/.test(cleanSubdomain)) {
      setError('Subdomain can only contain alphanumeric characters and hyphens.')
      return
    }

    // Redirect user to subdomain login page
    const protocol = window.location.protocol
    const hostWithoutSubdomain = window.location.host.replace('www.', '')
    
    // Construct subdomain URL
    const targetUrl = `${protocol}//${cleanSubdomain}.${hostWithoutSubdomain}/login`
    window.location.href = targetUrl
  }

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Premium Backing Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        <Card className="border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl rounded-2xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-blue-500/10 p-3 rounded-full w-fit mb-3">
              <Stethoscope className="w-8 h-8 text-blue-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white tracking-tight">
              Find Your Hospital Portal
            </CardTitle>
            <CardDescription className="text-slate-400">
              Patients and Doctors: enter your clinic's subdomain prefix below to log in.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSearch}>
            <CardContent className="space-y-4 pt-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-sm p-3 rounded-lg text-center font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="subdomain" className="text-slate-300 font-medium">Hospital Subdomain</Label>
                <div className="flex rounded-lg border border-white/10 bg-white/5 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/50">
                  <span className="px-3 bg-white/5 flex items-center text-slate-400 text-sm border-r border-white/10 font-mono">
                    https://
                  </span>
                  <input
                    id="subdomain"
                    type="text"
                    required
                    placeholder="e.g. tender"
                    className="flex-1 bg-transparent border-0 py-2 px-3 text-white placeholder-slate-500 focus:outline-none text-sm font-mono"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                  />
                  <span className="px-3 bg-white/5 flex items-center text-slate-400 text-sm border-l border-white/10 font-mono">
                    .healsync...
                  </span>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="pt-2">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
              >
                Go to Workspace Portal
                <ArrowRight className="w-5 h-5" />
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Additional routes shortcuts */}
        <div className="flex justify-between items-center px-4 text-xs font-medium">
          <Link href="/onboard-org" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
            <Building2 className="w-4 h-4" />
            Register Hospital
          </Link>
          <Link href="/master/login" className="text-slate-400 hover:text-slate-300 flex items-center gap-1">
            <ShieldAlert className="w-4 h-4" />
            Platform Control
          </Link>
        </div>
      </div>
    </div>
  )
}
