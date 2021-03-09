import fetch from 'isomorphic-fetch'
import { createEffect, Effect } from 'effector'
import { IRpcClientTransport } from '@room-project/rpc-core'

type CredentialsOption = 'omit' | 'same-origin' | 'include'

export interface IRpcClientHttpTransportOptions {
  uri: string
  headers?: Record<string, string>
  credentials?: CredentialsOption
}

export interface IRpcClientHttpTransportFactory {
  (options: IRpcClientHttpTransportOptions): IRpcClientTransport
  of: IRpcClientHttpTransportFactory
}

/**
 * Создаёт HTTP-транспорт
 *
 * @example
 * ```js
 * import { ClientHttpTransport } from '@room-project/rpc-client'
 *
 * const transport = ClientHttpTransport.of({
 *  uri: 'http://localhost:3030',
 *  headers: {
 *    authorization: `Bearer ${JWT}`
 *  }
 * })
 * ```
 *
 * @param options дополнительные опции
 */
export const RpcClientHttpTransport: IRpcClientHttpTransportFactory = (options) => {
  const open = createEffect<void, void>('open')
  const close = createEffect<void, void>('close')
  const send: Effect<string, string | null> = createEffect('send', {
    handler: async (payload: string) => {
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
          throw new Error(`Can't send payload to server: ${error.message}`)
        })

        if (response.status === 204) return null

        if (response.status !== 200) {
          throw new Error(`Invalid response status: ${response.status}, expected 200 or 204`)
        }

        return await response.text()
      } catch (error) {
        throw error
      } finally {
        close()
      }
    },
  })

  open.use(async () => {})
  close.use(async () => {})

  const transport: IRpcClientTransport = {
    send,
    open,
    close
  }

  return transport
}

RpcClientHttpTransport.of = RpcClientHttpTransport
