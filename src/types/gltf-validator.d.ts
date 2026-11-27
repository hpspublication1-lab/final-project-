declare module 'gltf-validator' {
  export function version(): string;
  export function validateBytes(data: Uint8Array, options?: Record<string, unknown>): Promise<unknown>;
  export function validateString(json: string, options?: Record<string, unknown>): Promise<unknown>;
}
