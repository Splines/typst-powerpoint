import { preloadFontAssets } from "@myriaddreamin/typst.ts/dist/esm/options.init.mjs";

const FONT_CACHE_NAME = "typst-font-assets-v1";

const cachedFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const request = input instanceof Request ? input : new Request(input, init);

  if (!("caches" in globalThis) || request.method.toUpperCase() !== "GET") {
    return fetch(request);
  }

  const cache = await caches.open(FONT_CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response.ok) {
    try {
      await cache.put(request, response.clone());
    } catch {
      // Ignore cache write failures and keep network response.
    }
  }

  return response;
};

export function cachedFontInitOptions() {
  return {
    beforeBuild: [
      preloadFontAssets({
        assets: ["text", "cjk", "emoji"],
        fetcher: cachedFetch,
      }),
    ],
  };
}
