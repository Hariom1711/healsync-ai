import prisma from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear existing data in reverse order of dependencies
  console.log('🧹 Clearing old records...')
  await prisma.medicalRecord.deleteMany()
  await prisma.queue.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.doctorProfile.deleteMany()
  await prisma.patientProfile.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()

  // Standard hashed password for all mock accounts
  const hashedPassword = await bcrypt.hash('Password123', 10)

  // 1. Create Platform Master Admin
  console.log('👑 Seeding platform master admin...')
  await prisma.user.create({
    data: {
      email: 'admin@healsync.ai',
      name: 'Platform Master Admin',
      password: hashedPassword,
      role: 'MASTER_ADMIN',
    },
  })

  // 2. Create default Organization
  console.log('🏢 Seeding default hospital organization...')
  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1)

  const defaultOrg = await prisma.organization.create({
    data: {
      name: 'General Hospital',
      subdomain: 'general',
      subscriptionStatus: 'ACTIVE',
      subscriptionExpiresAt: nextMonth,
      payments: {
        create: {
          amount: 999,
          status: 'PAID',
        },
      },
    },
  })

  // 3. Create Tenant Organization Admin
  console.log('💼 Seeding organization admin...')
  await prisma.user.create({
    data: {
      email: 'manager@general.com',
      name: 'General Hospital Manager',
      password: hashedPassword,
      role: 'ORG_ADMIN',
      organizationId: defaultOrg.id,
    },
  })

  // 4. Create Patient Users under Default Org
  console.log('👤 Seeding patients...')
  
  await prisma.user.create({
    data: {
      email: 'patient.jane@gmail.com',
      name: 'Jane Doe',
      password: hashedPassword,
      role: 'PATIENT',
      organizationId: defaultOrg.id,
      patientProfile: {
        create: {
          dateOfBirth: new Date('1995-05-15'),
          gender: 'Female',
          medicalHistory: 'Mild asthma, allergy to penicillin.'
        }
      }
    }
  })

  await prisma.user.create({
    data: {
      email: 'patient.john@gmail.com',
      name: 'John Smith',
      password: hashedPassword,
      role: 'PATIENT',
      organizationId: defaultOrg.id,
      patientProfile: {
        create: {
          dateOfBirth: new Date('1988-11-23'),
          gender: 'Male',
          medicalHistory: 'Hypertension controlled with medication.'
        }
      }
    }
  })

  // 5. Create Doctor Users under Default Org
  console.log('🥼 Seeding doctors...')

  await prisma.user.create({
    data: {
      email: 'dr.alice@healsync.com',
      name: 'Dr. Alice Smith',
      password: hashedPassword,
      role: 'DOCTOR',
      organizationId: defaultOrg.id,
      doctorProfile: {
        create: {
          specialty: 'General Medicine',
          bio: 'Experienced primary care physician specializing in comprehensive family health and preventive medicine.',
          avgCheckupSpeed: 15,
          consultationFee: 400,
          availability: {
            monday: ["09:00-13:00", "14:00-17:00"],
            tuesday: ["09:00-13:00", "14:00-17:00"],
            wednesday: ["09:00-13:00", "14:00-17:00"],
            thursday: ["09:00-13:00", "14:00-17:00"],
            friday: ["09:00-13:00", "14:00-17:00"]
          }
        }
      }
    }
  })

  await prisma.user.create({
    data: {
      email: 'dr.bob@healsync.com',
      name: 'Dr. Bob Johnson',
      password: hashedPassword,
      role: 'DOCTOR',
      organizationId: defaultOrg.id,
      doctorProfile: {
        create: {
          specialty: 'Cardiology',
          bio: 'Board-certified cardiologist focusing on non-invasive cardiology, heart failure management, and preventive care.',
          avgCheckupSpeed: 20,
          consultationFee: 700,
          availability: {
            monday: ["10:00-12:00", "14:00-16:00"],
            wednesday: ["10:00-12:00", "14:00-16:00"],
            friday: ["10:00-12:00"]
          }
        }
      }
    }
  })

  await prisma.user.create({
    data: {
      email: 'dr.charlie@healsync.com',
      name: 'Dr. Charlie Brown',
      password: hashedPassword,
      role: 'DOCTOR',
      organizationId: defaultOrg.id,
      doctorProfile: {
        create: {
          specialty: 'Pediatrics',
          bio: 'Compassionate pediatrician dedicated to providing high-quality care to infants, children, and adolescents.',
          avgCheckupSpeed: 15,
          consultationFee: 500,
          availability: {
            tuesday: ["09:00-13:00", "14:00-17:00"],
            thursday: ["09:00-13:00", "14:00-17:00"]
          }
        }
      }
    }
  })

  console.log('✅ Database seeding finished successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
