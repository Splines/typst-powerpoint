import { createTypstCompiler, createTypstRenderer } from "@myriaddreamin/typst.ts";
import { disableDefaultFontAssets, loadFonts } from "@myriaddreamin/typst.ts/dist/esm/options.init.mjs";
import typstCompilerWasm from "@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm?url";
import typstRendererWasm from "@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm?url";

let compiler;
let renderer;

/**
 * Initializes the Typst compiler.
 *
 * See also https://myriad-dreamin.github.io/typst.ts/cookery/guide/all-in-one.html#label-Initializing%20using%20the%20low-level%20API
 */
export async function initCompiler() {
  compiler = createTypstCompiler();
  await compiler.init({
    getModule: () => typstCompilerWasm,
    beforeBuild: [
      disableDefaultFontAssets(),
      loadFonts([
        "assets/math-font.ttf",
      ]),
    ],
  });
  console.log("Typst compiler initialized");
}

/**
 * Initializes the Typst renderer.
 *
 * See also https://myriad-dreamin.github.io/typst.ts/cookery/guide/all-in-one.html#label-Initializing%20using%20the%20low-level%20API
 */
export async function initRenderer() {
  renderer = createTypstRenderer();
  await renderer.init({
    getModule: () => typstRendererWasm,
  });
  console.log("Typst renderer initialized");
}

/**
 * Compiles the given Typst source to SVG.
 */
export async function compile(source) {
  const mainFilePath = "/main.typ";
  compiler.addSource(mainFilePath, source);
  const response = await compiler.compile({ mainFilePath });

  if (!Object.prototype.hasOwnProperty.call(response, "result")) {
    if (response.diagnostics) {
      console.error("Compilation diagnostics:", response.diagnostics);
    }
    throw new Error("Compilation failed");
  }

  const artifactContent = new Uint8Array(response["result"]);
  const svg = await renderer.renderSvg({
    format: "vector",
    artifactContent: artifactContent,
    data_selection: {
      body: true,
      defs: true,
      css: true,
      js: false,
    },
  });

  return svg;
}
