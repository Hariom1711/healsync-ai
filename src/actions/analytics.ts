'use server'

import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function getDoctorProfile() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'DOCTOR') {
    throw new Error('Unauthorized. Only doctors can perform this action.')
  }

  const doctorProfile = await prisma.doctorProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (!doctorProfile) {
    throw new Error('Doctor profile not found.')
  }

  return doctorProfile
}

export async function getDoctorAnalyticsData() {
  try {
    const doctor = await getDoctorProfile()

    // 1. Total completed appointments
    const totalCompleted = await prisma.appointment.count({
      where: {
        doctorId: doctor.id,
        status: 'COMPLETED',
      },
    })

    // 2. Active queue size
    const queueSize = await prisma.queue.count({
      where: {
        doctorId: doctor.id,
        status: { in: ['WAITING', 'IN_CONSULTATION'] },
      },
    })

    // 3. Unique patients
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: 'COMPLETED',
      },
      select: {
        patientId: true,
      },
      distinct: ['patientId'],
    })

    const patientIds = appointments.map((a) => a.patientId)

    const patients = await prisma.patientProfile.findMany({
      where: {
        id: { in: patientIds },
      },
    })

    const uniquePatientCount = patients.length

    // 4. Demographics calculation
    const genderCounts: Record<string, number> = { Male: 0, Female: 0, Other: 0, Unknown: 0 }
    const ageCounts: Record<string, number> = { Pediatric: 0, Adult: 0, Senior: 0, Unknown: 0 }

    const today = new Date()
    patients.forEach((p) => {
      // Gender split
      const gender = p.gender || 'Unknown'
      if (genderCounts[gender] !== undefined) {
        genderCounts[gender]++
      } else {
        genderCounts.Other++
      }

      // Age groups
      if (p.dateOfBirth) {
        const dob = new Date(p.dateOfBirth)
        let age = today.getFullYear() - dob.getFullYear()
        const m = today.getMonth() - dob.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
          age--
        }

        if (age < 18) {
          ageCounts.Pediatric++
        } else if (age < 65) {
          ageCounts.Adult++
        } else {
          ageCounts.Senior++
        }
      } else {
        ageCounts.Unknown++
      }
    })

    // 5. Clinical history analytics (Diagnoses & Prescriptions)
    const records = await prisma.medicalRecord.findMany({
      where: {
        doctorId: doctor.id,
        approved: true,
      },
      select: {
        soapNotes: true,
        prescriptions: true,
      },
    })

    const diagnosisMap: Record<string, number> = {}
    const prescriptionMap: Record<string, number> = {}

    records.forEach((r) => {
      // Parse SoapNotes for diagnosis (assessment)
      const soap = r.soapNotes as any
      if (soap && typeof soap.assessment === 'string') {
        const diagnosis = soap.assessment.trim()
        if (diagnosis) {
          // Normalize names a bit or group them
          const key = diagnosis.length > 65 ? diagnosis.substring(0, 62) + '...' : diagnosis
          diagnosisMap[key] = (diagnosisMap[key] || 0) + 1
        }
      }

      // Parse prescriptions list
      const rxList = r.prescriptions as any
      if (Array.isArray(rxList)) {
        rxList.forEach((item: any) => {
          if (item && typeof item.medication === 'string') {
            const med = item.medication.trim()
            if (med) {
              prescriptionMap[med] = (prescriptionMap[med] || 0) + 1
            }
          }
        })
      }
    })

    // Convert to sorted lists
    const topDiagnoses = Object.entries(diagnosisMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const topPrescriptions = Object.entries(prescriptionMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      success: true,
      metrics: {
        totalCompleted,
        queueSize,
        uniquePatients: uniquePatientCount,
        avgCheckupSpeed: doctor.avgCheckupSpeed,
      },
      demographics: {
        gender: genderCounts,
        age: ageCounts,
      },
      trends: {
        diagnoses: topDiagnoses,
        prescriptions: topPrescriptions,
      },
    }
  } catch (error: any) {
    console.error('Fetch doctor analytics error:', error)
    return {
      success: false,
      message: error.message || 'Failed to aggregate analytics data.',
      metrics: { totalCompleted: 0, queueSize: 0, uniquePatients: 0, avgCheckupSpeed: 15 },
      demographics: {
        gender: { Male: 0, Female: 0, Other: 0, Unknown: 0 },
        age: { Pediatric: 0, Adult: 0, Senior: 0, Unknown: 0 },
      },
      trends: { diagnoses: [], prescriptions: [] },
    }
  }
}
