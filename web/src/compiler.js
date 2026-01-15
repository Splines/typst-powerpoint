import { $typst } from "@myriaddreamin/typst.ts";

import typstCompilerWasm from "@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm?url";
import typstRendererWasm from "@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm?url";

/**
 * Initializes the Typst compiler.
 *
 * https://myriad-dreamin.github.io/typst.ts/cookery/guide/all-in-one.html#label-Initializing%20using%20the%20low-level%20API
 */
export async function initCompiler() {
  $typst.setCompilerInitOptions({
    getModule: () => {
      return typstCompilerWasm;
    },
  });

  $typst.setRendererInitOptions({
    getModule: () => {
      return typstRendererWasm;
    },
  });

  console.log("Typst compiler initialized");
}

/**
 * Compiles the given Typst source to SVG in the browser without a server by
 * using typst.ts by Myriad Dreamin.
 *
 * https://myriad-dreamin.github.io/typst.ts/cookery/guide/compiler/bindings.html
 */
export async function compile(source) {
  const svg = await $typst.svg({ mainContent: source });
  console.log(svg);
  return svg;
}
