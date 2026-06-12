import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'

export async function POST(req: Request) {
  try {
    const { amount, currency = 'INR' } = await req.json()

    const keyId = process.env.RAZORPAY_KEY_ID || ''
    const keySecret = process.env.RAZORPAY_KEY_SECRET || ''

    // Fallback Simulation Mode if keys are not configured
    if (!keyId || keyId === 'rzp_test_placeholder' || !keySecret || keySecret === 'rzp_test_secret_placeholder') {
      console.log('🧪 Razorpay API: Running in simulation mode.')
      const mockOrderId = `order_mock_${Math.random().toString(36).substring(2, 11)}`
      return NextResponse.json({
        id: mockOrderId,
        amount: amount * 100,
        currency,
        notes: { simulation: 'true' }
      })
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })

    const options = {
      amount: Math.round(amount * 100), // amount in paise
      currency,
      receipt: `receipt_${Date.now()}`,
    }

    const order = await razorpay.orders.create(options)
    return NextResponse.json(order)

  } catch (err: any) {
    console.error('Razorpay Order API Error:', err)
    return NextResponse.json({ error: 'Failed to initiate Razorpay order transaction' }, { status: 500 })
  }
}
