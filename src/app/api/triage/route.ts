import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 })
    }

    // 1. Fallback Simulation Mode if Groq API key is missing
    if (!process.env.GROQ_API_KEY) {
      const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || ''
      
      let recommendedSpecialty = 'General Medicine'
      let explanation = 'Based on your symptoms, a primary care physician (General Medicine) can perform an initial evaluation and guide you on next steps.'
      let isEmergency = false
      let urgency = 'MEDIUM'

      if (lastMessage.includes('chest') || lastMessage.includes('heart') || lastMessage.includes('cardio') || lastMessage.includes('palpitation')) {
        recommendedSpecialty = 'Cardiology'
        explanation = 'Your symptoms indicate potential cardiovascular concerns. We recommend consulting a Cardiologist for an ECG and specialized heart checkup.'
        urgency = 'HIGH'
      } else if (lastMessage.includes('skin') || lastMessage.includes('rash') || lastMessage.includes('itch') || lastMessage.includes('spots') || lastMessage.includes('acne')) {
        recommendedSpecialty = 'Dermatology'
        explanation = 'Dermatological symptoms like rashes, hives, or lesions are best evaluated by a dermatologist for targeted skin diagnostics.'
        urgency = 'LOW'
      } else if (lastMessage.includes('child') || lastMessage.includes('baby') || lastMessage.includes('kid') || lastMessage.includes('pediatr')) {
        recommendedSpecialty = 'Pediatrics'
        explanation = 'For health concerns regarding infants, children, or adolescents, consulting a specialized Pediatrician is recommended.'
        urgency = 'MEDIUM'
      } else if (lastMessage.includes('stomach') || lastMessage.includes('abdominal') || lastMessage.includes('vomit') || lastMessage.includes('diarrhea') || lastMessage.includes('nausea') || lastMessage.includes('digestion')) {
        recommendedSpecialty = 'Gastroenterology'
        explanation = 'Digestive tract symptoms, including persistent stomach discomfort, are best diagnosed by a Gastroenterologist.'
        urgency = 'MEDIUM'
      } else if (lastMessage.includes('bone') || lastMessage.includes('joint') || lastMessage.includes('muscle') || lastMessage.includes('fracture') || lastMessage.includes('sprain') || lastMessage.includes('back pain')) {
        recommendedSpecialty = 'Orthopedics'
        explanation = 'Musculoskeletal injuries, joint pains, or skeletal concerns fall under the scope of Orthopedic specialists.'
        urgency = 'MEDIUM'
      } else if (lastMessage.includes('headache') || lastMessage.includes('seizure') || lastMessage.includes('numb') || lastMessage.includes('migraine') || lastMessage.includes('dizzy')) {
        recommendedSpecialty = 'Neurology'
        explanation = 'Neurological symptoms such as chronic migraines, sensory numbness, or coordination concerns require consultation with a Neurologist.'
        urgency = 'HIGH'
      } else if (lastMessage.includes('depress') || lastMessage.includes('anxiety') || lastMessage.includes('stress') || lastMessage.includes('panic') || lastMessage.includes('mental')) {
        recommendedSpecialty = 'Psychiatry'
        explanation = 'Mental health concerns, mood variations, or severe anxiety symptoms are best discussed with a Psychiatrist for diagnostic support.'
        urgency = 'MEDIUM'
      }

      // Check for life-threatening emergency conditions
      if (
        lastMessage.includes('breath') || 
        lastMessage.includes('suffocat') || 
        (lastMessage.includes('chest') && lastMessage.includes('pain') && lastMessage.includes('severe')) || 
        lastMessage.includes('stroke') || 
        lastMessage.includes('unconscious') || 
        lastMessage.includes('bleed') && lastMessage.includes('severe')
      ) {
        isEmergency = true
        urgency = 'EMERGENCY'
        explanation = '🚨 CRITICAL: Your symptoms may indicate a life-threatening medical emergency. Please contact emergency services (like 911) or proceed immediately to the nearest Emergency Room.'
      }

      return NextResponse.json({
        analysis: `[Simulation Mode] Analyzed symptoms: "${lastMessage.substring(0, 80)}..."`,
        isEmergency,
        recommendedSpecialty,
        explanation,
        urgency,
      })
    }

    // 2. Active AI mode calling Groq Llama 3 70B
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    })

    const systemPrompt = `
You are a highly capable clinical triage assistant. Your job is to analyze the patient's symptoms, check for life-threatening emergency red flags, recommend the correct medical specialty, and suggest a patient-friendly explanation.

You must respond with a JSON object containing the following structure:
{
  "analysis": "A concise summary of the symptoms described by the patient.",
  "isEmergency": true or false,
  "recommendedSpecialty": "One of: General Medicine, Cardiology, Dermatology, Pediatrics, Neurology, Gastroenterology, Orthopedics, Psychiatry",
  "explanation": "A friendly explanation of why this specialty was recommended and what to prepare.",
  "urgency": "EMERGENCY" or "HIGH" or "MEDIUM" or "LOW"
}

Critical guidelines:
1. "isEmergency" MUST be true if symptoms represent life-threatening emergencies (e.g., severe chest pain, sudden numbness/paralysis, severe breathing difficulties, sudden vision loss, anaphylaxis, severe head trauma).
2. Choose "recommendedSpecialty" strictly from: General Medicine, Cardiology, Dermatology, Pediatrics, Neurology, Gastroenterology, Orthopedics, Psychiatry.
3. Be professional, clinical, yet patient-friendly.
`

    const response = await groq.chat.completions.create({
      model: 'llama3-70b-8192',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    })

    const result = response.choices[0]?.message?.content
    if (!result) {
      throw new Error('Empty response from AI engine')
    }

    return NextResponse.json(JSON.parse(result))
  } catch (err: any) {
    console.error('Triage AI error:', err)
    return NextResponse.json(
      { error: 'An error occurred during symptom triage analysis.' },
      { status: 500 }
    )
  }
}
