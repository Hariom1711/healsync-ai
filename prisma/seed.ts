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
  await prisma.user.deleteMany()

  // Standard hashed password for all mock accounts
  const hashedPassword = await bcrypt.hash('Password123', 10)

  // 1. Create Patient Users
  console.log('👤 Seeding patients...')
  
  await prisma.user.create({
    data: {
      email: 'patient.jane@gmail.com',
      name: 'Jane Doe',
      password: hashedPassword,
      role: 'PATIENT',
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
      patientProfile: {
        create: {
          dateOfBirth: new Date('1988-11-23'),
          gender: 'Male',
          medicalHistory: 'Hypertension controlled with medication.'
        }
      }
    }
  })

  // 2. Create Doctor Users
  console.log('🥼 Seeding doctors...')

  await prisma.user.create({
    data: {
      email: 'dr.alice@healsync.com',
      name: 'Dr. Alice Smith',
      password: hashedPassword,
      role: 'DOCTOR',
      doctorProfile: {
        create: {
          specialty: 'General Medicine',
          bio: 'Experienced primary care physician specializing in comprehensive family health and preventive medicine.',
          avgCheckupSpeed: 15,
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
      doctorProfile: {
        create: {
          specialty: 'Cardiology',
          bio: 'Board-certified cardiologist focusing on non-invasive cardiology, heart failure management, and preventive care.',
          avgCheckupSpeed: 20,
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
      doctorProfile: {
        create: {
          specialty: 'Pediatrics',
          bio: 'Compassionate pediatrician dedicated to providing high-quality care to infants, children, and adolescents.',
          avgCheckupSpeed: 15,
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
