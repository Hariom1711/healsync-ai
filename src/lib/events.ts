import { EventEmitter } from 'events'

declare global {
  var globalEventEmitter: EventEmitter | undefined
}

const eventEmitter = globalThis.globalEventEmitter ?? new EventEmitter()

if (process.env.NODE_ENV !== 'production') {
  globalThis.globalEventEmitter = eventEmitter
}

export default eventEmitter
