import { Resend } from 'resend'

// Instantiates Resend client if key is configured
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey.trim() === '') {
    return null
  }
  return new Resend(apiKey)
}

interface BookingEmailParams {
  patientEmail: string
  patientName: string
  doctorEmail: string
  doctorName: string
  specialty: string
  date: Date
  triageSummary?: string | null
}

interface CarePlanEmailParams {
  patientEmail: string
  patientName: string
  doctorName: string
  plan: string
  prescriptions: any[]
}

// 🏥 Helper 1: Send Booking Confirmations to Patient and Doctor
export async function sendBookingEmails(params: BookingEmailParams) {
  const { patientEmail, patientName, doctorEmail, doctorName, specialty, date, triageSummary } = params
  const formattedDate = new Date(date).toLocaleString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // Patient Email Template HTML
  const patientHtml = `
    <div style="font-family: system-ui, -apple-system, sans-serif; background-color: #090d16; color: #f1f5f9; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
      <div style="text-align: center; margin-bottom: 25px;">
        <span style="font-size: 24px; font-weight: bold; color: #10b981;">🏥 HealSync AI</span>
        <h2 style="color: #ffffff; margin-top: 10px;">Appointment Confirmed!</h2>
      </div>
      <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">Hello ${patientName},</p>
      <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">Your consultation request has been successfully scheduled. Here are the details of your visit:</p>
      
      <div style="background-color: #0f172a; padding: 20px; border-radius: 8px; border: 1px dashed #334155; margin: 20px 0;">
        <table style="width: 100%; font-size: 14px; color: #cbd5e1;">
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #94a3b8; width: 120px;">Doctor:</td>
            <td style="padding: 6px 0; color: #ffffff;">${doctorName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Specialty:</td>
            <td style="padding: 6px 0; color: #10b981; font-weight: 500;">${specialty}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Date & Time:</td>
            <td style="padding: 6px 0; color: #ffffff;">${formattedDate}</td>
          </tr>
        </table>
      </div>

      ${triageSummary ? `
      <div style="background-color: #0f172a; padding: 15px; border-radius: 8px; border: 1px solid #1e293b; margin: 20px 0;">
        <span style="font-size: 12px; font-weight: bold; color: #a78bfa; text-transform: uppercase;">AI Triage Notes Submitted:</span>
        <p style="font-size: 13px; color: #94a3b8; margin-top: 6px; font-style: italic; line-height: 1.5;">"${triageSummary}"</p>
      </div>
      ` : ''}

      <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #64748b;">
        <p>If you need to reschedule, please log in to your patient dashboard.</p>
        <p style="margin-top: 15px;">© 2026 HealSync AI. Smart Healthcare Booking.</p>
      </div>
    </div>
  `

  // Doctor Email Template HTML
  const doctorHtml = `
    <div style="font-family: system-ui, -apple-system, sans-serif; background-color: #090d16; color: #f1f5f9; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
      <div style="text-align: center; margin-bottom: 25px;">
        <span style="font-size: 24px; font-weight: bold; color: #10b981;">🏥 HealSync AI</span>
        <h2 style="color: #ffffff; margin-top: 10px;">New Scheduled Patient</h2>
      </div>
      <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">Hello ${doctorName},</p>
      <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">A new appointment has been scheduled in your clinic calendar:</p>
      
      <div style="background-color: #0f172a; padding: 20px; border-radius: 8px; border: 1px dashed #334155; margin: 20px 0;">
        <table style="width: 100%; font-size: 14px; color: #cbd5e1;">
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #94a3b8; width: 120px;">Patient Name:</td>
            <td style="padding: 6px 0; color: #ffffff;">${patientName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Scheduled For:</td>
            <td style="padding: 6px 0; color: #10b981; font-weight: 500;">${formattedDate}</td>
          </tr>
        </table>
      </div>

      ${triageSummary ? `
      <div style="background-color: #0f172a; padding: 15px; border-radius: 8px; border: 1px solid #1e293b; margin: 20px 0;">
        <span style="font-size: 12px; font-weight: bold; color: #a78bfa; text-transform: uppercase;">Patient Symptom Triage Profile:</span>
        <p style="font-size: 13px; color: #cbd5e1; margin-top: 6px; line-height: 1.5;">${triageSummary}</p>
      </div>
      ` : ''}

      <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #64748b;">
        <p>Please log in to your clinic portal to check-in this patient when they arrive.</p>
        <p style="margin-top: 15px;">© 2026 HealSync AI. Clinic Management System.</p>
      </div>
    </div>
  `

  const resend = getResendClient()

  if (resend) {
    try {
      // Send to Patient
      await resend.emails.send({
        from: 'HealSync AI <onboarding@resend.dev>',
        to: patientEmail,
        subject: '🏥 Appointment Confirmation - HealSync AI',
        html: patientHtml,
      })

      // Send to Doctor (if doctor has a real email, otherwise skip standard dummy sandbox)
      if (doctorEmail && !doctorEmail.endsWith('@healsync.com')) {
        await resend.emails.send({
          from: 'HealSync AI <onboarding@resend.dev>',
          to: doctorEmail,
          subject: '📅 New Appointment Scheduled - HealSync AI',
          html: doctorHtml,
        })
      }
      console.log(`✉️ Resend emails sent successfully for appointment with ${doctorName}.`)
    } catch (err) {
      console.error('❌ Resend API sending error:', err)
    }
  } else {
    // Graceful developer simulation logging
    console.log('\n--- ✉️ SIMULATED RESEND OUTGOING EMAIL (BOOKING CONFIRMATION) ---')
    console.log(`TO (PATIENT): ${patientEmail} (${patientName})`)
    console.log(`TO (DOCTOR): ${doctorEmail} (${doctorName})`)
    console.log(`SUBJECT: Appointment Confirmed with ${doctorName} (${specialty})`)
    console.log(`DATE: ${formattedDate}`)
    console.log(`TRIAGE SUMMARY: ${triageSummary || 'None'}`)
    console.log('-----------------------------------------------------------------\n')
  }
}

// ✉️ Helper 2: Send finalized Clinical Care Plan & Prescriptions to Patient
export async function sendCarePlanEmail(params: CarePlanEmailParams) {
  const { patientEmail, patientName, doctorName, plan, prescriptions } = params

  const prescriptionsHtml = Array.isArray(prescriptions) && prescriptions.length > 0
    ? prescriptions.map(item => `
        <div style="background-color: #0f172a; padding: 12px; border-radius: 6px; border: 1px solid #1e293b; margin-bottom: 8px;">
          <strong style="color: #ffffff; font-size: 14px;">${item.medication}</strong>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
            Dosage: ${item.dosage} | Frequency: ${item.frequency} | Duration: ${item.duration}
          </div>
        </div>
      `).join('')
    : '<p style="font-size: 13px; color: #64748b; italic;">No medications prescribed.</p>'

  const carePlanHtml = `
    <div style="font-family: system-ui, -apple-system, sans-serif; background-color: #090d16; color: #f1f5f9; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
      <div style="text-align: center; margin-bottom: 25px;">
        <span style="font-size: 24px; font-weight: bold; color: #10b981;">🏥 HealSync AI</span>
        <h2 style="color: #ffffff; margin-top: 10px;">Your Clinical Care Plan</h2>
      </div>
      <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">Hello ${patientName},</p>
      <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">Your consultation with **${doctorName}** has been completed. Below is your structured treatment guidelines and care plan:</p>
      
      <div style="margin: 25px 0;">
        <h3 style="color: #10b981; border-bottom: 1px solid #1e293b; padding-bottom: 6px; font-size: 15px;">📋 Doctor's Treatment Plan</h3>
        <div style="background-color: #0f172a; padding: 15px; border-radius: 8px; font-size: 13px; color: #cbd5e1; line-height: 1.6; white-space: pre-wrap; border: 1px solid #1e293b;">
          ${plan || 'No specific plan guidelines recorded.'}
        </div>
      </div>

      <div style="margin: 25px 0;">
        <h3 style="color: #10b981; border-bottom: 1px solid #1e293b; padding-bottom: 6px; font-size: 15px;">💊 Prescribed Medications</h3>
        <div style="margin-top: 10px;">
          ${prescriptionsHtml}
        </div>
      </div>

      <div style="text-align: center; margin-top: 35px; font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 20px;">
        <p>If you experience worsening symptoms or have questions, please follow-up or schedule a new triage check.</p>
        <p style="margin-top: 15px;">© 2026 HealSync AI. Ambient Scribing & Booking Portal.</p>
      </div>
    </div>
  `

  const resend = getResendClient()

  if (resend) {
    try {
      await resend.emails.send({
        from: 'HealSync AI <onboarding@resend.dev>',
        to: patientEmail,
        subject: `🏥 Medical Care Plan & Rx - Consult with ${doctorName}`,
        html: carePlanHtml,
      })
      console.log(`✉️ Care plan email sent successfully to ${patientName}.`)
    } catch (err) {
      console.error('❌ Resend API sending error:', err)
    }
  } else {
    // Graceful developer simulation logging
    console.log('\n--- ✉️ SIMULATED RESEND OUTGOING EMAIL (CARE PLAN & RX) ---')
    console.log(`TO: ${patientEmail} (${patientName})`)
    console.log(`SUBJECT: Medical Care Plan & Rx - Consult with ${doctorName}`)
    console.log(`TREATMENT PLAN:\n${plan}`)
    console.log(`PRESCRIPTIONS COUNT: ${prescriptions.length}`)
    console.log('-----------------------------------------------------------\n')
  }
}
