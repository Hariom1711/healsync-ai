'use server'

import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendBookingEmails } from '@/lib/mail'

export async function getDoctorsBySpecialty(specialty: string) {
  try {
    const doctors = await prisma.doctorProfile.findMany({
      where: {
        specialty,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
    return { success: true, doctors }
  } catch (err: any) {
    console.error('Fetch doctors error:', err)
    return { success: false, message: 'Failed to retrieve doctors list.', doctors: [] }
  }
}

export async function createAppointment(data: {
  doctorId: string
  date: string | Date
  triageSummary?: string
}) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'PATIENT') {
    return { success: false, message: 'Unauthorized. Only patients can book appointments.' }
  }

  try {
    // Find the patient profile matching the active session userId
    const patientProfile = await prisma.patientProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!patientProfile) {
      return { success: false, message: 'Patient profile not found.' }
    }

    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patientProfile.id,
        doctorId: data.doctorId,
        date: new Date(data.date),
        triageSummary: data.triageSummary || null,
        status: 'SCHEDULED',
      },
    })

    // Fetch doctor information to send notification emails
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: data.doctorId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (doctor) {
      sendBookingEmails({
        patientEmail: session.user.email || '',
        patientName: session.user.name || 'Patient',
        doctorEmail: doctor.user.email,
        doctorName: doctor.user.name,
        specialty: doctor.specialty,
        date: new Date(data.date),
        triageSummary: data.triageSummary || null,
      }).catch((mailErr) => {
        console.error('Failed to trigger booking emails:', mailErr)
      })
    }

    return { success: true, appointment, message: 'Appointment booked successfully!' }
  } catch (err: any) {
    console.error('Create appointment error:', err)
    return { success: false, message: 'Failed to book appointment. Please try again.' }
  }
}

export async function getPatientAppointments() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'PATIENT') {
    return { success: false, appointments: [] }
  }

  try {
    const patientProfile = await prisma.patientProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!patientProfile) {
      return { success: false, appointments: [] }
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: patientProfile.id,
      },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        medicalRecord: true,
        queue: true,
      },
      orderBy: {
        date: 'asc',
      },
    })

    return { success: true, appointments }
  } catch (err: any) {
    console.error('Fetch patient appointments error:', err)
    return { success: false, appointments: [] }
  }
}
