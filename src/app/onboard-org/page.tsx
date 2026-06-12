'use server'

import OnboardOrgFormClient from './OnboardOrgFormClient'

export default async function OnboardOrgPage() {
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder'

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-lg z-10">
        <OnboardOrgFormClient razorpayKeyId={razorpayKeyId} />
      </div>
    </div>
  )
}
