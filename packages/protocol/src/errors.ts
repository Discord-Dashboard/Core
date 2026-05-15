// JSON-RPC standard codes plus domain codes used by the gateway.
export const ProtocolErrorCode = {
  ParseError: -32700,
  InvalidRequest: -32600,
  MethodNotFound: -32601,
  InvalidParams: -32602,
  InternalError: -32603,
  VersionMismatch: 4400,
  Unauthorized: 4401,
  Forbidden: 4403,
  GuildNotFound: 4404,
  RateLimited: 4429,
} as const

export type ProtocolErrorCode =
  (typeof ProtocolErrorCode)[keyof typeof ProtocolErrorCode]
