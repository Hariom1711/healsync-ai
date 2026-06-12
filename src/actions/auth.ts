'use server'

import prisma from '@/lib/prisma'
import { RegisterSchema } from '@/lib/validations'
import bcrypt from 'bcryptjs'

export async function registerUser(prevState: any, formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const subdomain = formData.get('subdomain') as string

  // Run Zod schema validation
  const validatedFields = RegisterSchema.safeParse({
    name,
    email,
    password,
  })

  if (!validatedFields.success) {
    return {
      success: false,
      error: validatedFields.error.flatten().fieldErrors,
    }
  }

  const data = validatedFields.data

  try {
    // 1. Resolve organization by subdomain
    if (!subdomain) {
      return {
        success: false,
        message: 'Organization context is missing.',
      }
    }

    const org = await prisma.organization.findUnique({
      where: { subdomain: subdomain.toLowerCase().trim() },
    })

    if (!org) {
      return {
        success: false,
        message: 'This hospital organization does not exist.',
      }
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return {
        success: false,
        message: 'A user with this email address already exists.',
      }
    }

    // 3. Hash the password
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // 4. Insert user and patient profile linked to the organization
    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: 'PATIENT',
        organizationId: org.id,
        patientProfile: {
          create: {},
        },
      },
    })

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
