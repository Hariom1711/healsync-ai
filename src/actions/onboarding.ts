'use server'

import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function completeOnboarding(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, message: 'Not authenticated' }
  }

  const role = formData.get('role') as string
  const specialty = formData.get('specialty') as string
  const dateOfBirthStr = formData.get('dateOfBirth') as string
  const gender = formData.get('gender') as string
  const medicalHistory = formData.get('medicalHistory') as string

  if (role !== 'PATIENT' && role !== 'DOCTOR') {
    return { success: false, message: 'Invalid role selection' }
  }

  try {
    const userId = session.user.id

    // Update user role
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    })

    if (role === 'PATIENT') {
      const dateOfBirth = dateOfBirthStr ? new Date(dateOfBirthStr) : null
      await prisma.patientProfile.upsert({
        where: { userId },
        update: {
          dateOfBirth,
          gender,
          medicalHistory,
        },
        create: {
          userId,
          dateOfBirth,
          gender,
          medicalHistory,
        },
      })
    } else {
      await prisma.doctorProfile.upsert({
        where: { userId },
        update: {
          specialty: specialty || 'General Medicine',
        },
        create: {
          userId,
          specialty: specialty || 'General Medicine',
          availability: {},
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Onboarding action error:', error)
    return { success: false, message: 'Failed to complete onboarding. Please try again.' }
  }
}
