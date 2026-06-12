import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export async function POST(req: Request) {
  try {
    // 1. Fallback Simulation Mode if Groq API key is missing
    if (!process.env.GROQ_API_KEY) {
      console.log('🧪 Scribe API: Running in simulation mode.')
      
      const mockTranscript = `Doctor: Hello Jane, how can I help you today?
Patient: Hi doctor, I have been experiencing a persistent dry cough and a mild fever for the last three days. My throat feels scratchy and I feel a bit tired, but no body aches or shortness of breath.
Doctor: I see. Let's take a look. Your lungs sound clear on auscultation. Throat is slightly red, but no tonsillar exudate. Temperature is 99.4°F. I suspect a mild viral upper respiratory tract infection.
Patient: Okay, what should I do?
Doctor: I recommend plenty of rest and hydration. I will prescribe some paracetamol for the fever and a cough syrup to help with the dry cough. Please follow up if symptoms worsen.`

      const mockSoapNotes = {
        subjective: 'Patient reports a persistent dry cough and a mild fever for 3 days. Complains of scratchy throat and mild fatigue. Denies body aches, chest pain, or shortness of breath.',
        objective: 'Temperature: 99.4°F. Throat: Mild erythema without exudate. Lungs: Clear to auscultation bilaterally. No distress.',
        assessment: 'Viral upper respiratory tract infection (common cold) with dry cough.',
        plan: '1. Rest and oral hydration.\n2. Symptomatic treatment with paracetamol and cough suppressant.\n3. Follow up if symptoms persist beyond 7-10 days or worsen.',
      }

      const mockPrescriptions = [
        {
          medication: 'Paracetamol',
          dosage: '500mg',
          frequency: 'Every 6 hours as needed for fever',
          duration: '3 days',
        },
        {
          medication: 'Dextromethorphan Syrup',
          dosage: '10ml',
          frequency: 'Three times daily',
          duration: '5 days',
        },
      ]

      // Simulate network processing lag
      await new Promise((resolve) => setTimeout(resolve, 3000))

      return NextResponse.json({
        transcript: mockTranscript,
        soapNotes: mockSoapNotes,
        prescriptions: mockPrescriptions,
      })
    }

    // 2. Active AI mode calling Groq Whisper & Llama 3
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file uploaded.' }, { status: 400 })
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    })

    // Step A: Call Whisper for Audio Transcription
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3',
    })

    const transcriptText = transcription.text

    if (!transcriptText || transcriptText.trim() === '') {
      return NextResponse.json({ error: 'Failed to transcribe audio. Transcript was empty.' }, { status: 422 })
    }

    // Step B: Call Llama 3 to format into SOAP notes
    const systemPrompt = `
You are an expert clinical scribe. Your task is to analyze the following doctor-patient consultation transcript and structure it into a standard SOAP (Subjective, Objective, Assessment, Plan) clinical report and a prescription list.

You must respond with a JSON object containing the following structure:
{
  "soapNotes": {
    "subjective": "Summary of patient complaints, history, symptoms, onset, duration.",
    "objective": "Objective findings including vitals, physical exams, or test results if mentioned (default to 'Deferred' if none mentioned).",
    "assessment": "Clinical assessment, working diagnosis, differentials, and reasoning.",
    "plan": "Treatment plan, lifestyle advice, medications, tests ordered, and follow-ups."
  },
  "prescriptions": [
    {
      "medication": "Name of drug",
      "dosage": "e.g., 500mg",
      "frequency": "e.g., Once daily",
      "duration": "e.g., 7 days"
    }
  ]
}

Instructions:
1. Ensure all information is clinically formatted.
2. If no prescriptions are mentioned, return an empty array [].
3. Ensure the output is strictly valid JSON matching the schema.
`

    const response = await groq.chat.completions.create({
      model: 'llama3-70b-8192',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Consultation Transcript:\n${transcriptText}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    })

    const result = response.choices[0]?.message?.content
    if (!result) {
      throw new Error('Empty response from AI structuring engine.')
    }

    const soapData = JSON.parse(result)

    return NextResponse.json({
      transcript: transcriptText,
      soapNotes: soapData.soapNotes,
      prescriptions: soapData.prescriptions || [],
    })
  } catch (err: any) {
    console.error('Scribe API error:', err)
    return NextResponse.json(
      { error: 'An error occurred during audio scribing processing.' },
      { status: 500 }
    )
  }
}
