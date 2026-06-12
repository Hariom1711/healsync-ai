import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDoctorAnalyticsData } from '@/actions/analytics'
import Groq from 'groq-sdk'

export async function POST(req: Request) {
  try {
    // 1. Authenticate doctor
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Unauthorized. Doctor access required.' }, { status: 401 })
    }

    // 2. Fetch the aggregate statistics
    const analyticsRes = await getDoctorAnalyticsData()
    if (!analyticsRes.success) {
      return NextResponse.json({ error: 'Failed to retrieve analytics context.' }, { status: 500 })
    }

    const { messages } = await req.json()
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid message payload.' }, { status: 400 })
    }

    // Format metrics into a readable block for the system prompt
    const metricsBlock = `
Clinic Analytics Data:
- Total Completed Consultations: ${analyticsRes.metrics.totalCompleted}
- Current Waiting Queue Size: ${analyticsRes.metrics.queueSize}
- Unique Patients Treated: ${analyticsRes.metrics.uniquePatients}
- Target Consultation Speed: ${analyticsRes.metrics.avgCheckupSpeed} minutes per patient

Demographics:
- Genders: Male (${analyticsRes.demographics.gender.Male}), Female (${analyticsRes.demographics.gender.Female}), Other (${analyticsRes.demographics.gender.Other}), Unknown (${analyticsRes.demographics.gender.Unknown})
- Age Groups: Pediatric (0-17): ${analyticsRes.demographics.age.Pediatric}, Adult (18-64): ${analyticsRes.demographics.age.Adult}, Senior (65+): ${analyticsRes.demographics.age.Senior}, Unknown: ${analyticsRes.demographics.age.Unknown}

Top Diagnoses & Assessment Trends:
${analyticsRes.trends.diagnoses.map((d: any) => `* ${d.name}: seen ${d.count} times`).join('\n') || 'None recorded yet.'}

Top Prescribed Medications:
${analyticsRes.trends.prescriptions.map((p: any) => `* ${p.name}: prescribed ${p.count} times`).join('\n') || 'None recorded yet.'}
`

    const systemPrompt = `
You are the HealSync AI Clinical Analytics Assistant.
You have access to the doctor's aggregate clinic history and performance statistics. Here is the active dataset:
${metricsBlock}

Instructions:
1. Help the doctor answer clinical operational queries, analyze trends, summarize patient demographics, or query medication suggestions.
2. Rely strictly on the aggregated clinic data provided above when answering questions about stats.
3. Be professional, highly clinical, concise, and structured (use bullet points where appropriate).
4. If the data shows no records, note that this is because they have not completed or approved consultations yet.
`

    // 3. Fallback Simulation Mode if Groq API key is missing
    if (!process.env.GROQ_API_KEY) {
      console.log('🧪 Analytics Chat API: Running in simulation mode.')
      await new Promise((resolve) => setTimeout(resolve, 1500))
      
      const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || ''
      let responseText = "As your AI clinical assistant, I've analyzed your clinic metrics. Let me know if you want a detailed breakdown of diagnoses, medications, or demographics."
      
      if (lastMessage.includes('age') || lastMessage.includes('demographic') || lastMessage.includes('gender')) {
        responseText = `Based on your clinic demographics:
- You have treated **${analyticsRes.metrics.uniquePatients} unique patients**.
- Gender Split: Male (${analyticsRes.demographics.gender.Male}), Female (${analyticsRes.demographics.gender.Female}), Other/Unknown (${analyticsRes.demographics.gender.Other + analyticsRes.demographics.gender.Unknown}).
- Age Profile: Pediatric (${analyticsRes.demographics.age.Pediatric}), Adult (${analyticsRes.demographics.age.Adult}), Senior (${analyticsRes.demographics.age.Senior}).`
      } else if (lastMessage.includes('diagnos') || lastMessage.includes('condition') || lastMessage.includes('illness')) {
        responseText = `Here are the top diagnoses recorded in your consultations:
${analyticsRes.trends.diagnoses.map((d: any) => `- **${d.name}** (seen ${d.count} times)`).join('\n') || 'No diagnoses have been finalized yet. Complete consultations with approved SOAP notes to see trends.'}`
      } else if (lastMessage.includes('medication') || lastMessage.includes('prescription') || lastMessage.includes('drug')) {
        responseText = `Here are the top medications you have prescribed to date:
${analyticsRes.trends.prescriptions.map((p: any) => `- **${p.name}** (prescribed ${p.count} times)`).join('\n') || 'No prescriptions have been finalized yet.'}`
      }

      return NextResponse.json({ content: responseText })
    }

    // 4. Live Llama 3 70B Call
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const chatResponse = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
      ],
      temperature: 0.3,
    })

    const reply = chatResponse.choices[0]?.message?.content || 'Sorry, I failed to process that request.'
    return NextResponse.json({ content: reply })

  } catch (err: any) {
    console.error('Analytics chatbot API error:', err)
    return NextResponse.json({ error: 'An error occurred while compiling clinical responses.' }, { status: 500 })
  }
}
