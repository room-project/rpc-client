import { Effect } from 'effector'

import {
  IRpcService,
  IRpcRequest,
  IRpcResponse,
  RpcMessageParams,
  createUUIDv4,
} from '@room-project/rpc-core'

import { IRpcClientTransport } from './transport'

export interface IRpcClient<S extends IRpcService, T extends IRpcClientTransport> {
  readonly service: S
  readonly transport: T
}

export interface IRpcClientFactoryOptions<S extends IRpcService, T extends IRpcClientTransport> {
  service: S
  transport: T
}

export interface IRpcClientFactory {
  <S extends IRpcService, T extends IRpcClientTransport>(
    options: IRpcClientFactoryOptions<S, T>
  ): IRpcClient<S, T>
  of: IRpcClientFactory
}

const parseResponse = (data: string): IRpcResponse => {
  try {
    return JSON.parse(data)
  } catch (error) {
    throw new Error(`Invalid response format`)
  }
}

export const RpcClientFactory: IRpcClientFactory = ({ service, transport }) => {
  Object.keys(service.methods).forEach((methodName) => {
    const method = service.methods[methodName]
    method.shortName = methodName
  })

  service.domain.onCreateEffect((effect: Effect<any, any, any>) => {
    const handler = async (params: RpcMessageParams) => {
      const request: IRpcRequest = {
        id: createUUIDv4().toString(),
        name: effect.shortName,
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

RpcClientFactory.of = RpcClientFactory
