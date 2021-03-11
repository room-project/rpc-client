import fetch from 'isomorphic-fetch'
import { createEffect, Effect } from 'effector'
import { IRpcClientTransport, TransportErrorType } from '../transport'

type CredentialsOption = 'omit' | 'same-origin' | 'include'

export interface IRpcClientHttpTransportOptions {
  uri: string
  headers?: Record<string, string>
  credentials?: CredentialsOption
}

export interface IRpcClientHttpTransport extends IRpcClientTransport {
  open: Effect<void, void>
  close: Effect<void, void>
}

export interface IRpcClientHttpTransportFactory {
  (options: IRpcClientHttpTransportOptions): IRpcClientHttpTransport
  of: IRpcClientHttpTransportFactory
}

const noop = () => {}

export const RpcClientHttpTransport: IRpcClientHttpTransportFactory = (options) => {
  const send = createEffect<string, string | null>('send')
  const open = createEffect<void, void>('open')
  const close = createEffect<void, void>('close')

  send.use(async (payload: string) => {
    try {
      await open()
      const response = await fetch(options.uri, {
        method: 'POST',
        headers: {
          ...options.headers,
          'Content-Type': 'appllication/json; charset=utf8',
        },
        credentials: options.credentials,
        body: payload,
      }).catch((error) => {
        throw { message: error.message, type: TransportErrorType }
      })

      switch (response.status) {
        case 200:
          return await response.text()
        case 204:
          return null
        case 400:
          throw { message: `Invalid request`, type: TransportErrorType }
        default:
          throw { message: `Invalid response`, type: TransportErrorType }
      }
    } catch (error) {
      throw error
    } finally {
      close()
    }
  })

  open.use(noop)
  close.use(noop)

  const transport = {
    send,
    open,
    close,
  }

  return transport
}

RpcClientHttpTransport.of = RpcClientHttpTransport
