import { NextRequest } from 'next/server'
import eventEmitter from '@/lib/events'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const appointmentId = searchParams.get('appointmentId')
  const doctorId = searchParams.get('doctorId')

  if (!appointmentId || !doctorId) {
    return new Response('Missing appointmentId or doctorId parameter.', { status: 400 })
  }

  // Create stream encoder
  const encoder = new TextEncoder()

  const responseStream = new ReadableStream({
    async start(controller) {
      // Helper to calculate and send waiting info to patient
      const sendQueueUpdate = async () => {
        try {
          // Fetch active waiting list for this doctor
          const activeQueue = await prisma.queue.findMany({
            where: {
              doctorId,
              status: {
                in: ['WAITING', 'IN_CONSULTATION'],
              },
            },
            orderBy: {
              checkInTime: 'asc',
            },
          })

          const docProfile = await prisma.doctorProfile.findUnique({
            where: { id: doctorId },
            select: { avgCheckupSpeed: true },
          })
          const checkupSpeed = docProfile?.avgCheckupSpeed || 15

          // Find current patient position in line
          const positionIdx = activeQueue.findIndex((q) => q.appointmentId === appointmentId)
          
          let position = null
          let eta = null
          let currentStatus = 'WAITING'

          if (positionIdx !== -1) {
            position = positionIdx + 1
            eta = positionIdx * checkupSpeed
            currentStatus = activeQueue[positionIdx].status
          }

          const payload = {
            position,
            eta,
            status: currentStatus,
            activeCount: activeQueue.length,
          }

          // Enqueue text data stream formatted for EventSource
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
        } catch (err) {
          console.error('SSE queue update error:', err)
        }
      }

      // Send initial queue state immediately
      await sendQueueUpdate()

      // Subscribe to global process emitter events
      const onQueueChange = async (data: { doctorId: string }) => {
        if (data.doctorId === doctorId) {
          await sendQueueUpdate()
        }
      }

      eventEmitter.on('queue-update', onQueueChange)

      // Listen for socket connection close to unsubscribe
      req.signal.addEventListener('abort', () => {
        eventEmitter.off('queue-update', onQueueChange)
        controller.close()
      })
    },
  })

  return new Response(responseStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  })
}
