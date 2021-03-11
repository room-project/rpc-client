import { Effect } from 'effector'

export interface IRpcClientTransport {
  send: Effect<string, string | null>
  open: Effect<any, any>
  close: Effect<any, any>
}

export const TransportErrorType = 'TransportError'
