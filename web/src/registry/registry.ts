interface RegistryResponse {
  statusCode: number;
  getBody: (_encoding?: unknown) => Uint8Array;
}

/**
 * Performs a synchronous HTTP request to the given URL and returns the response as a Uint8Array.
 *
 * Note: This function uses XMLHttpRequest in synchronous mode, which is generally
 * discouraged in web development due to potential UI blocking. However, it is
 * used here to meet the requirements of the Typst package registry interface,
 * which expects a synchronous response.
 */
export function registryRequest(method: string, url: string): RegistryResponse {
  const request = new XMLHttpRequest();
  request.open(method, url, false);
  // Sync XHR from a document cannot use non-text responseType
  request.overrideMimeType("text/plain; charset=x-user-defined");
  request.send();

  const response = request.response as unknown;
  const responseText = typeof response === "string" ? response : "";
  const body = Uint8Array.from(responseText, char => char.charCodeAt(0) & 0xff);

  return {
    statusCode: request.status,
    getBody: () => body,
  };
}
