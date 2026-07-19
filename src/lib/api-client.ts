export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function apiRequest<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiClientError(
      "Network request failed",
      0,
      "NETWORK_ERROR",
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await response.json()) as Record<string, unknown>)
    : null;
  if (!response.ok) {
    throw new ApiClientError(
      typeof payload?.error === "string" ? payload.error : "Request failed",
      response.status,
      typeof payload?.code === "string" ? payload.code : "REQUEST_FAILED",
      response.headers.get("x-request-id") ?? undefined,
    );
  }
  return payload as T;
}
