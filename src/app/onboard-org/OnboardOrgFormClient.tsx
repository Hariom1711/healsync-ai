'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { registerOrganization } from '@/actions/onboard-org'
import { Sparkles, Building2, User, Key, Check, Loader2, ArrowRight, ShieldCheck, CreditCard } from 'lucide-react'

interface OnboardOrgFormClientProps {
  razorpayKeyId: string
}

export default function OnboardOrgFormClient({ razorpayKeyId }: OnboardOrgFormClientProps) {
  const router = useRouter()
  
  // Step tracker: 1 = Form Details, 2 = Payment Processing, 3 = Success
  const [step, setStep] = useState<number>(1)
  
  const [name, setName] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  
  const isSimulation = razorpayKeyId === 'rzp_test_placeholder'

  const handleValidation = () => {
    if (!name.trim()) return 'Hospital/Organization Name is required'
    if (!subdomain.trim()) return 'Subdomain is required'
    if (!/^[a-zA-Z0-9-]+$/.test(subdomain)) return 'Subdomain must contain only alphanumeric characters and hyphens'
    if (!adminName.trim()) return 'Admin Name is required'
    if (!adminEmail.trim()) return 'Admin Email is required'
    if (!adminPassword || adminPassword.length < 6) return 'Password must be at least 6 characters'
    return null
  }

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    const validationError = handleValidation()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      // 1. Create order on the backend
      const res = await fetch('/api/billing/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 999 }), // 999 INR setup fee
      })

      if (!res.ok) {
        throw new Error('Failed to initiate payment gateway.')
      }

      const orderData = await res.json()
      setOrderId(orderData.id)

      if (isSimulation || orderData.notes?.simulation === 'true') {
        // Run Simulator Flow
        setStep(2)
        setTimeout(async () => {
          const simulatedPaymentId = `pay_sim_${Math.random().toString(36).substring(2, 11)}`
          setPaymentId(simulatedPaymentId)
          
          const signupRes = await registerOrganization({
            name,
            subdomain: subdomain.toLowerCase(),
            adminName,
            adminEmail,
            adminPasswordHash: adminPassword,
            amount: 999,
            razorpayOrderId: orderData.id,
            razorpayPaymentId: simulatedPaymentId,
          })

          if (signupRes.success) {
            setStep(3)
          } else {
            setError(signupRes.message || 'Onboarding failed.')
            setStep(1)
          }
          setLoading(false)
        }, 3000)

      } else {
        // Run Real Razorpay Checkout
        loadRazorpayScript((loaded) => {
          if (!loaded) {
            setError('Failed to load payment portal script. Please check your internet connection.')
            setLoading(false)
            return
          }

          const options = {
            key: razorpayKeyId,
            amount: orderData.amount,
            currency: orderData.currency,
            name: 'HealSync AI',
            description: 'SaaS Hospital Onboarding Setup Fee',
            order_id: orderData.id,
            handler: async function (response: any) {
              setLoading(true)
              setPaymentId(response.razorpay_payment_id)

              const signupRes = await registerOrganization({
                name,
                subdomain: subdomain.toLowerCase(),
                adminName,
                adminEmail,
                adminPasswordHash: adminPassword,
                amount: 999,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
              })

              if (signupRes.success) {
                setStep(3)
              } else {
                setError(signupRes.message || 'Registration failed.')
                setStep(1)
              }
              setLoading(false)
            },
            prefill: {
              name: adminName,
              email: adminEmail,
            },
            theme: {
              color: '#1e40af', // Blue theme color
            },
            modal: {
              ondismiss: function () {
                setLoading(false)
              }
            }
          }

          const rzp = new (window as any).Razorpay(options)
          rzp.open()
        })
      }

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during onboarding.')
      setLoading(false)
    }
  }

  const loadRazorpayScript = (callback: (loaded: boolean) => void) => {
    if ((window as any).Razorpay) {
      callback(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => callback(true)
    script.onerror = () => callback(false)
    document.body.appendChild(script)
  }

  // Create the URL to access their new tenant
  const tenantUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${subdomain.toLowerCase()}.${window.location.host.replace('www.', '')}/login`
    : `https://${subdomain.toLowerCase()}.healsync-ai-six.vercel.app/login`

  return (
    <>
      {step === 1 && (
        <Card className="border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl rounded-2xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-blue-500/10 p-3 rounded-full w-fit mb-3">
              <Building2 className="w-8 h-8 text-blue-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
              Onboard Your Organization <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
            </CardTitle>
            <CardDescription className="text-slate-400">
              Create your hospital workspace and setup administrative controls.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleOnboardSubmit}>
            <CardContent className="space-y-4 pt-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-sm p-3 rounded-lg text-center font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="orgName" className="text-slate-300 font-medium">Hospital / Clinic Name</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Building2 className="w-5 h-5" />
                  </span>
                  <Input
                    id="orgName"
                    type="text"
                    required
                    placeholder="e.g. City General Hospital"
                    className="pl-10"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subdomain" className="text-slate-300 font-medium">Desired Subdomain</Label>
                <div className="flex rounded-lg shadow-sm border border-white/10 bg-white/5 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/50">
                  <span className="px-3 bg-white/5 flex items-center text-slate-400 text-sm border-r border-white/10">
                    https://
                  </span>
                  <input
                    id="subdomain"
                    type="text"
                    required
                    placeholder="tender"
                    className="flex-1 bg-transparent border-0 py-2 px-3 text-white placeholder-slate-500 focus:outline-none text-sm"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                  />
                  <span className="px-3 bg-white/5 flex items-center text-slate-400 text-sm border-l border-white/10">
                    .healsync-ai...
                  </span>
                </div>
              </div>

              <div className="border-t border-white/10 my-4 pt-4" />
              <CardDescription className="text-slate-300 font-semibold mb-2">Admin Account Details</CardDescription>

              <div className="space-y-2">
                <Label htmlFor="adminName" className="text-slate-300 font-medium">Administrator Name</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <User className="w-5 h-5" />
                  </span>
                  <Input
                    id="adminName"
                    type="text"
                    required
                    placeholder="e.g. Dr. Arthur Miller"
                    className="pl-10"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail" className="text-slate-300 font-medium">Admin Email Address</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  required
                  placeholder="admin@hospital.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminPass" className="text-slate-300 font-medium">Admin Password</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Key className="w-5 h-5" />
                  </span>
                  <Input
                    id="adminPass"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="pl-10"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Initiating Payment Gateway...
                  </>
                ) : (
                  <>
                    Proceed to Onboarding Fee (₹999)
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
              {isSimulation && (
                <div className="text-[11px] text-emerald-400/80 text-center font-medium bg-emerald-500/5 py-1 px-3 border border-emerald-500/10 rounded-full w-fit mx-auto">
                  🧪 Test Mode: Form will run a zero-key Razorpay checkout simulation.
                </div>
              )}
            </CardFooter>
          </form>
        </Card>
      )}

      {step === 2 && (
        <Card className="border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl rounded-2xl py-8">
          <CardContent className="flex flex-col items-center justify-center space-y-6">
            <div className="relative flex items-center justify-center">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
              <CreditCard className="w-6 h-6 text-white absolute" />
            </div>
            <div className="text-center space-y-2">
              <CardTitle className="text-2xl font-bold text-white">Processing Transaction</CardTitle>
              <p className="text-slate-400 max-w-sm text-sm">
                Bypassing key validations and simulating transaction success with Razorpay orders...
              </p>
            </div>
            <div className="bg-white/5 px-4 py-3 border border-white/10 rounded-xl w-full text-left space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Tenant:</span>
                <span className="text-white">{subdomain}.healsync-ai-six.vercel.app</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Sponsor Order ID:</span>
                <span className="text-blue-400">{orderId}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Fee Amount:</span>
                <span className="text-emerald-400">INR 999.00</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-xl shadow-2xl rounded-2xl py-6">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-emerald-500/20 p-3 rounded-full w-fit mb-3 border border-emerald-500/30">
              <ShieldCheck className="w-10 h-10 text-emerald-400 animate-bounce" />
            </div>
            <CardTitle className="text-2xl font-bold text-emerald-400">Onboarding Successful!</CardTitle>
            <CardDescription className="text-slate-300">
              Your organization workspace has been created and initialized.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-center">
            <p className="text-slate-400 text-sm">
              Your hospital workspace has been successfully registered. You are now the master manager of this subdomain instance.
            </p>
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-left space-y-2 text-sm">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Subdomain:</span>
                <span className="text-white">{subdomain}</span>
              </div>
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Payment Reference:</span>
                <span className="text-emerald-400">{paymentId}</span>
              </div>
              <div className="border-t border-white/10 my-2 pt-2" />
              <div className="text-center">
                <Label className="text-slate-400 text-xs block mb-1">Access URL:</Label>
                <a
                  href={tenantUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline font-semibold text-xs tracking-wide break-all"
                >
                  {tenantUrl}
                </a>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-4">
            <a href={tenantUrl} className="w-full">
              <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
                Go to Subdomain Login <ArrowRight className="w-5 h-5" />
              </Button>
            </a>
          </CardFooter>
        </Card>
      )}
    </>
  )
}
