'use client'

import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { ShieldAlert, Loader2, Key, Mail, Lock } from 'lucide-react'

export default function MasterLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (res?.error) {
        setError(res.error)
        setLoading(false)
      } else {
        router.push('/master/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      setError('An unexpected error occurred.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#060913] flex flex-col justify-center items-center py-12 px-4 relative overflow-hidden">
      {/* Visual glowing backing */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-950/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <Card className="border border-red-500/20 bg-white/5 backdrop-blur-xl shadow-2xl rounded-2xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-red-500/10 p-3 rounded-full w-fit mb-3 border border-red-500/20">
              <ShieldAlert className="w-8 h-8 text-red-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
              Master Admin Control
            </CardTitle>
            <CardDescription className="text-slate-400">
              Platform Owner access portal. Unauthorized access is restricted.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-sm p-3 rounded-lg text-center font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300 font-medium">Platform Admin Email</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Mail className="w-5 h-5" />
                  </span>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="admin@healsync.ai"
                    className="pl-10 border-red-500/10 focus-visible:ring-red-500/50"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 font-medium">Security Password</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Lock className="w-5 h-5" />
                  </span>
                  <Input
                    id="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="pl-10 border-red-500/10 focus-visible:ring-red-500/50"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-red-950/40 hover:bg-red-900/40 text-red-200 border border-red-500/30 hover:border-red-500/50 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-950/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying Credentials...
                  </>
                ) : (
                  <>
                    Authenticate Console
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
