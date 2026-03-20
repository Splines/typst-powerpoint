import { SVG_CONFIG } from "./constants.js";

/**
 * Parses SVG string and extracts dimensions, ensuring content isn't clipped.
 *
 * @param svg SVG content as string
 * @returns SVG element and computed size
 */
export function parseAndApplySize(svg: string):
{ svgElement: SVGElement; size: { width: number; height: number } } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, "image/svg+xml");
  const svgElement = doc.documentElement as unknown as SVGGraphicsElement;

  // Temporarily insert into DOM to measure actual content bounds
  const tempContainer = document.createElement("div");
  tempContainer.style.position = "absolute";
  tempContainer.style.visibility = "hidden";
  tempContainer.style.pointerEvents = "none";
  document.body.appendChild(tempContainer);
  tempContainer.appendChild(svgElement);

  let bbox;
  try {
    bbox = svgElement.getBBox();
  } catch {
    document.body.removeChild(tempContainer);
    return {
      svgElement,
      size: {
        width: parseFloat(svgElement.getAttribute("width") || String(SVG_CONFIG.FALLBACK_WIDTH)),
        height: parseFloat(svgElement.getAttribute("height") || String(SVG_CONFIG.FALLBACK_HEIGHT)),
      },
    };
  }

  document.body.removeChild(tempContainer);

  // Add some minor padding to avoid clipping
  const padding = Math.max(bbox.width, bbox.height) * SVG_CONFIG.PADDING_RATIO;
  const x = bbox.x - padding;
  const y = bbox.y - padding;
  const width = bbox.width + 2 * padding;
  const height = bbox.height + 2 * padding;

  // Set viewBox to actual content bounds with padding
  svgElement.setAttribute("viewBox", `${x.toString()} ${y.toString()} ${width.toString()} ${height.toString()}`);
  svgElement.setAttribute("width", width.toString());
  svgElement.setAttribute("height", height.toString());

  return { svgElement, size: { width, height } };
}

/**
 * Applies fill color to all elements in an SVG element.
 */
export function applyFillColor(svg: SVGElement, fillColor: string) {
  const elements = svg.querySelectorAll("*");
  elements.forEach((el) => {
    const fill = el.getAttribute("fill");
    if (fill && fill.toLowerCase() !== "none") {
      el.setAttribute("fill", fillColor);
    }
    const stroke = el.getAttribute("stroke");
    if (stroke && stroke.toLowerCase() !== "none") {
      el.setAttribute("stroke", fillColor);
    }
  });
}

type ParsedHexAlpha = {
  rgbHex: string;
  alpha: number;
};

/**
 * Parses #RGBA or #RRGGBBAA colors into RGB + alpha.
 */
function parseHexWithAlpha(value: string): ParsedHexAlpha | null {
  const color = value.trim();
  if (!color.startsWith("#")) {
    return null;
  }

  const hex = color.slice(1);
  if (hex.length === 8) {
    const rgbHex = `#${hex.slice(0, 6)}`;
    const alpha = parseInt(hex.slice(6, 8), 16) / 255;
    return { rgbHex, alpha };
  }

  if (hex.length === 4) {
    const rgbHex = `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
    const alpha = parseInt(`${hex[3]}${hex[3]}`, 16) / 255;
    return { rgbHex, alpha };
  }

  return null;
}

/**
 * Converts alpha hex colors to RGB + explicit opacity attributes.
 *
 * PowerPoint's SVG import can fail on #RRGGBBAA colors, so we normalize
 * these to maximize compatibility when inserting shapes.
 */
export function normalizeAlphaHexColors(svg: SVGElement) {
  const colorToOpacityAttr: Record<string, string> = {
    "fill": "fill-opacity",
    "stroke": "stroke-opacity",
    "stop-color": "stop-opacity",
  };

  const elements = svg.querySelectorAll("*");
  elements.forEach((el) => {
    Object.entries(colorToOpacityAttr).forEach(([colorAttr, opacityAttr]) => {
      const value = el.getAttribute(colorAttr);
      if (!value) {
        return;
      }

      const parsed = parseHexWithAlpha(value);
      if (!parsed) {
        return;
      }

      el.setAttribute(colorAttr, parsed.rgbHex);

      const existingOpacity = parseFloat(el.getAttribute(opacityAttr) || "1");
      const safeOpacity = Number.isFinite(existingOpacity) ? existingOpacity : 1;
      const combinedOpacity = Math.max(0, Math.min(1, safeOpacity * parsed.alpha));
      el.setAttribute(opacityAttr, combinedOpacity.toString());
    });
  });
}
