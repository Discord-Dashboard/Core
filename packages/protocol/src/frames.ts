// JSON-RPC 2.0 frames. Both sides may act as caller.
export interface JsonRpcRequest<P = unknown> {
  jsonrpc: "2.0"
  id: string | number
  method: string
  params?: P
}

export interface JsonRpcNotification<P = unknown> {
  jsonrpc: "2.0"
  method: string
  params?: P
}

export interface JsonRpcSuccess<R = unknown> {
  jsonrpc: "2.0"
  id: string | number
  result: R
}

export interface JsonRpcError {
  jsonrpc: "2.0"
  id: string | number | null
  error: { code: number; message: string; data?: unknown }
}

export type JsonRpcResponse<R = unknown> = JsonRpcSuccess<R> | JsonRpcError
export type JsonRpcFrame = JsonRpcRequest | JsonRpcNotification | JsonRpcResponse

// Handshake. The bot connects out to the gateway and proves identity by
// signing the server nonce with its shared secret (HMAC-SHA256).
export interface HelloParams {
  protocolVersion: string
  botId: string
  nonceSig: string
  capabilities: string[]
}

export interface ReadyResult {
  sessionId: string
  heartbeatMs: number
}
