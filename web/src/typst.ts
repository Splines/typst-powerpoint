import type * as typstWeb from "@myriaddreamin/typst.ts";
import { createTypstCompiler, createTypstRenderer } from "@myriaddreamin/typst.ts";
import { disableDefaultFontAssets, loadFonts } from "@myriaddreamin/typst.ts/dist/esm/options.init.mjs";

// @ts-ignore
import typstCompilerWasm from "@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm?url";
// @ts-ignore
import typstRendererWasm from "@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm?url";

let compiler: typstWeb.TypstCompiler;
let renderer: typstWeb.TypstRenderer;

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
 * Builds the complete Typst code with page setup and font size
 * @param {string} rawCode - The user's Typst code
 * @param {string} fontSize - Font size in points
 * @returns {string} Complete Typst code ready for compilation
 */
export function buildRawTypstString(rawCode, fontSize) {
  return "#set page(margin: 3pt, background: none, width: auto, fill: none, height: auto)"
    + `\n#set text(size: ${fontSize}pt)\n${rawCode}`;
}

/**
 * Compiles the given Typst source to SVG.
 */
export async function typst(source, fontSize) {
  const mainFilePath = "/main.typ";
  const typstCode = buildRawTypstString(source, fontSize);
  compiler.addSource(mainFilePath, typstCode);
  const response = await compiler.compile({ mainFilePath });

  if (!Object.prototype.hasOwnProperty.call(response, "result")) {
    if (response.diagnostics) {
      console.error("Compilation diagnostics:", response.diagnostics);
    }
    throw new Error("Compilation failed");
  }

  const artifactContent = response["result"] as Uint8Array<ArrayBuffer>;
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
