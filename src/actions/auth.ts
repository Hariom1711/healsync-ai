'use server'

import prisma from '@/lib/prisma'
import { RegisterSchema } from '@/lib/validations'
import bcrypt from 'bcryptjs'

export async function registerUser(prevState: any, formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string
  const specialty = formData.get('specialty') as string

  // Run Zod schema validation
  const validatedFields = RegisterSchema.safeParse({
    name,
    email,
    password,
    role,
    specialty: role === 'DOCTOR' ? specialty : undefined,
  })

  if (!validatedFields.success) {
    return {
      success: false,
      error: validatedFields.error.flatten().fieldErrors,
    }
  }

  const data = validatedFields.data

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return {
        success: false,
        message: 'A user with this email address already exists.',
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Insert user and relation tables based on role
    if (data.role === 'PATIENT') {
      await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: 'PATIENT',
          patientProfile: {
            create: {},
          },
        },
      })
    } else if (data.role === 'DOCTOR') {
      await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: 'DOCTOR',
          doctorProfile: {
            create: {
              specialty: data.specialty || 'General Medicine',
            },
          },
        },
      })
    }

    return {
      success: true,
      message: 'Account created successfully! You can now log in.',
    }
  } catch (err: any) {
    console.error('Registration error:', err)
    return {
      success: false,
      message: 'An error occurred while creating your account. Please try again.',
    }
  }
}
