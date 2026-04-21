/** Minimal `Response` stub for mocking `globalThis.fetch` in Vitest. */
export function jsonResponse<T>(
  data: T,
  ok = true,
  status = 200
): Promise<Response> {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
  } as Response);
}
