import { Effect } from 'effector'
import {
  IRpcClientFactory,
  IRpcRequest,
  IRpcResponse,
  RpcMessageParams,
  createUUIDv4,
} from '@room-project/rpc-core'

export * from './transports/http-transport'

const parseResponse = (data: string): IRpcResponse => {
  try {
    const payload = JSON.parse(data)
    return payload
  } catch (error) {
    throw new Error(`Invalid response format`)
  }
}

/**
 * Подключает `транспорт` к описанному `сервису`
 *
 * @example
 *
 * ```js
 * import * as service from './my-service-definition.js'
 * import { RpcClient, RpcClientHttpTransport } from '@room-project/rpc-client'
 *
 * const transport = RpcClientHttpTransport.of({...})
 *
 * const client = RpcClient.of({ service, transport })
 *
 * client.service.methods.test({ param1: 1, ...}).then((result) => ...)
 * ```
 *
 * @param options
 * @param options.service Сервис
 * @param options.transport Транспорт
 */
export const RpcClient: IRpcClientFactory = ({ service, transport }) => {
  Object.keys(service.methods).forEach((methodName) => {
    const method = service.methods[methodName]
    method.shortName = methodName
  })

  service.domain.onCreateEffect((effect: Effect<any, any, any>) => {
    const handler = async (params: RpcMessageParams) => {
      const request: IRpcRequest = {
        id: createUUIDv4().toString(),
        name: effect.compositeName.fullName,
        params,
      }

      try {
        const data = await transport.send(JSON.stringify(request))
        if (data) {
          const response = parseResponse(data)
          if (response.error) throw response.error
          return response.result
        }
        return data
      } catch (error) {
        throw error
      }
    }

    effect.use(handler)
  })

  const client = {
    service,
    transport,
  }

  return client
}

RpcClient.of = RpcClient
