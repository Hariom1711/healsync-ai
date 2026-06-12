import React from 'react'
import Link from 'next/link'
import { Sparkles, Stethoscope, Mic, Brain, Clock, ShieldCheck, ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SaaSMarketingPage() {
  return (
    <div className="min-h-screen bg-[#070913] text-white overflow-hidden relative selection:bg-blue-500/30 selection:text-blue-200">
      {/* Backing glow meshes */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Navigation header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center relative z-10 border-b border-white/5 bg-[#070913]/80 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-500/20 p-2 rounded-xl border border-blue-500/30">
            <Stethoscope className="w-6 h-6 text-blue-400" />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            HealSync <span className="text-blue-500">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5 text-sm font-semibold">
              Find Portal
            </Button>
          </Link>
          <Link href="/onboard-org">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl px-4 py-2 flex items-center gap-1 shadow-lg shadow-blue-500/15">
              Launch Clinic Node
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero section */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pt-20 pb-16 text-center space-y-8">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3.5 py-1 rounded-full text-blue-400 text-xs font-semibold uppercase tracking-wider animate-pulse">
          <Sparkles className="w-4 h-4" /> Next-Generation SaaS Multi-Tenancy
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1] max-w-4xl mx-auto">
          Intelligent Clinical Workspaces <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            On-Demand for Any Hospital
          </span>
        </h1>
        
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto font-medium">
          Deploy a secure, AI-powered tenant workspace node for your clinic instantly. Featuring voice-scribe consultation structuring, real-time queues, and triage check-in.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Link href="/onboard-org" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-base px-8 py-6 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all">
              Claim Your Subdomain Now
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto border-white/10 hover:bg-white/5 text-slate-300 font-semibold text-base px-8 py-6 rounded-2xl">
              Access Existing Workspace
            </Button>
          </Link>
        </div>
      </section>

      {/* Feature grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-white/5">
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4 backdrop-blur-md hover:border-white/20 transition-all group">
          <div className="bg-blue-500/20 p-3 rounded-xl border border-blue-500/30 w-fit group-hover:scale-105 transition-all">
            <Mic className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Ambient SOAP Voice Scribe</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Record patient visits directly. Whisper AI & Llama 3 transcribe and structure notes into clinically formatted SOAP notes and prescriptions in seconds.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4 backdrop-blur-md hover:border-white/20 transition-all group">
          <div className="bg-emerald-500/20 p-3 rounded-xl border border-emerald-500/30 w-fit group-hover:scale-105 transition-all">
            <Brain className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-white">AI Symptoms Triage</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Interactive symptom assessment routing patients to correct departments, indicating urgency, and suggesting the best-matched doctor profiles.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4 backdrop-blur-md hover:border-white/20 transition-all group">
          <div className="bg-indigo-500/20 p-3 rounded-xl border border-indigo-500/30 w-fit group-hover:scale-105 transition-all">
            <Clock className="w-6 h-6 text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Live ETA Queue Stream</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Lightweight node event pub/sub streaming active queue indexes and check-in wait timers to patient browsers in real-time via Server-Sent Events (SSE).
          </p>
        </div>
      </section>

      {/* Pricing block */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 p-8 rounded-3xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-blue-600 text-[10px] uppercase font-black px-4 py-1.5 rounded-bl-2xl text-white tracking-widest">
            Simple Pricing
          </div>
          <h2 className="text-xl font-bold text-slate-300 uppercase tracking-widest text-sm mb-2">Hospital Setup Fee</h2>
          <div className="text-5xl font-black text-white flex items-center justify-center gap-1 my-4">
            ₹999 <span className="text-slate-500 text-lg font-medium">/ setup</span>
          </div>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
            Unlock your full domain node setup, complete with isolated DB schemas, admin control panel, and integration tools.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left text-sm text-slate-300 mb-6 font-medium">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Custom *.healsync-ai subdomain</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Restrictive Doctor Onboarding</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Full Triage symptoms check</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Scribing & SOAP record limits</div>
          </div>
          <Link href="/onboard-org">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20">
              Claim Your Workspace Subdomain
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto px-4 py-8 border-t border-white/5 text-center text-xs text-slate-500 flex justify-between items-center">
        <span>© {new Date().getFullYear()} HealSync AI. All rights reserved.</span>
        <Link href="/master/login" className="text-slate-400 hover:text-slate-300 flex items-center gap-1 font-semibold">
          <ShieldCheck className="w-4 h-4 text-blue-400" /> Platform Admin
        </Link>
      </footer>
    </div>
  )
}
