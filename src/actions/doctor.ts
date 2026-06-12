'use server'

import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import eventEmitter from '@/lib/events'
import { sendCarePlanEmail } from '@/lib/mail'

// Helper to verify doctor authentication
async function getDoctorProfile() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'DOCTOR') {
    throw new Error('Unauthorized. Only doctors can perform this action.')
  }

  const doctorProfile = await prisma.doctorProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  })

  if (!doctorProfile) {
    throw new Error('Doctor profile not found.')
  }

  return doctorProfile
}

export async function getDoctorDashboardData() {
  try {
    const doctor = await getDoctorProfile()

    // 1. Fetch scheduled appointments
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: 'SCHEDULED',
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        queue: true,
      },
      orderBy: {
        date: 'asc',
      },
    })

    // 2. Fetch active waiting room queue (waiting or currently in consultation)
    const activeQueue = await prisma.queue.findMany({
      where: {
        doctorId: doctor.id,
        status: {
          in: ['WAITING', 'IN_CONSULTATION'],
        },
      },
      include: {
        appointment: {
          include: {
            patient: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        checkInTime: 'asc',
      },
    })

    return {
      success: true,
      doctorName: doctor.user.name,
      appointments,
      activeQueue,
    }
  } catch (err: any) {
    console.error('Fetch doctor dashboard data error:', err)
    return {
      success: false,
      message: err.message || 'Failed to retrieve dashboard data.',
      appointments: [],
      activeQueue: [],
    }
  }
}

export async function checkInPatient(appointmentId: string) {
  try {
    const doctor = await getDoctorProfile()

    // Create queue entry
    const queueEntry = await prisma.queue.create({
      data: {
        doctorId: doctor.id,
        appointmentId,
        status: 'WAITING',
      },
    })

    eventEmitter.emit('queue-update', { doctorId: doctor.id })

    return { success: true, message: 'Patient checked in to the waiting room queue.', queueEntry }
  } catch (err: any) {
    console.error('Check-in error:', err)
    return { success: false, message: err.message || 'Failed to check in patient.' }
  }
}

export async function startConsultation(queueId: string) {
  try {
    await getDoctorProfile()

    // Update queue status
    const queueEntry = await prisma.queue.update({
      where: { id: queueId },
      data: {
        status: 'IN_CONSULTATION',
      },
    })

    const doctor = await getDoctorProfile()
    eventEmitter.emit('queue-update', { doctorId: doctor.id })

    return { success: true, queueEntry }
  } catch (err: any) {
    console.error('Start consultation error:', err)
    return { success: false, message: err.message || 'Failed to start consultation.' }
  }
}

export async function getAppointmentDetails(appointmentId: string) {
  try {
    await getDoctorProfile()

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        medicalRecord: true,
      },
    })

    if (!appointment) {
      throw new Error('Appointment not found.')
    }

    return { success: true, appointment }
  } catch (err: any) {
    console.error('Fetch appointment details error:', err)
    return { success: false, message: err.message || 'Failed to load appointment details.' }
  }
}

export async function saveMedicalRecord(data: {
  appointmentId: string
  transcript: string
  soapNotes: any
  prescriptions: any
  approved: boolean
}) {
  try {
    const doctor = await getDoctorProfile()

    const appointment = await prisma.appointment.findUnique({
      where: { id: data.appointmentId },
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!appointment) {
      throw new Error('Appointment not found.')
    }

    // Update or create MedicalRecord
    const record = await prisma.medicalRecord.upsert({
      where: { appointmentId: data.appointmentId },
      update: {
        transcript: data.transcript,
        soapNotes: data.soapNotes,
        prescriptions: data.prescriptions,
        approved: data.approved,
      },
      create: {
        appointmentId: data.appointmentId,
        doctorId: doctor.id,
        patientId: appointment.patientId,
        transcript: data.transcript,
        soapNotes: data.soapNotes,
        prescriptions: data.prescriptions,
        approved: data.approved,
      },
    })

    // If approved, complete appointment and update queue status
    if (data.approved) {
      await prisma.appointment.update({
        where: { id: data.appointmentId },
        data: { status: 'COMPLETED' },
      })

      // Update queue status if it exists
      await prisma.queue.updateMany({
        where: { appointmentId: data.appointmentId },
        data: { status: 'COMPLETED' },
      })

      // Trigger email with the finalized SOAP plan and prescriptions list to the patient
      sendCarePlanEmail({
        patientEmail: appointment.patient.user.email,
        patientName: appointment.patient.user.name,
        doctorName: doctor.user.name,
        plan: data.soapNotes?.plan || '',
        prescriptions: data.prescriptions || [],
      }).catch((mailErr) => {
        console.error('Failed to trigger care plan email:', mailErr)
      })
    }

    eventEmitter.emit('queue-update', { doctorId: doctor.id })

    return { success: true, record, message: data.approved ? 'Record approved and saved!' : 'Draft saved successfully.' }
  } catch (err: any) {
    console.error('Save medical record error:', err)
    return { success: false, message: err.message || 'Failed to save medical record.' }
  }
}
