// SPDX-License-Identifier: AGPL-3.0-or-later

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * How much bigger the clickable area is than the glyph, relative to the
 * smaller side of the glyph's bounding box.
 */
const HITBOX_PADDING = 0.45;

/**
 * Only roughly square shapes (noteheads, rests, accidentals) get a bigger
 * hitbox. Stems, beams and slurs are long and thin, and a padded box around
 * them would steal clicks from the notes.
 */
const MIN_ASPECT_RATIO = 0.6;
const MAX_ASPECT_RATIO = 2.5;

/**
 * Anything much bigger than the typical glyph is not a notehead.
 */
const MAX_AREA_VS_MEDIAN = 2.5;

interface LinkBox {
  link: Element;
  box: DOMRect;
}

function measureLinks(root: ParentNode): LinkBox[] {
  const boxes: LinkBox[] = [];

  for (const link of Array.from(root.querySelectorAll("a"))) {
    const href = link.getAttribute("xlink:href") || "";
    if (!href.startsWith("textedit:")) {
      continue;
    }

    try {
      const box = (link as unknown as SVGGraphicsElement).getBBox();
      if (box.width > 0 && box.height > 0) {
        boxes.push({ link, box });
      }
    } catch (_err) {
      // The preview is not rendered (e.g. hidden), so it has no size yet.
    }
  }

  return boxes;
}

/**
 * Adds an invisible rectangle around every clickable notehead of the preview,
 * so that it is easier to hit. The rectangle lives inside the same link, so
 * clicking it behaves exactly like clicking the glyph.
 */
export function enlargeNoteHitboxes(root: ParentNode): void {
  const compact = measureLinks(root).filter(({ box }) => {
    const ratio = box.width / box.height;

    return ratio >= MIN_ASPECT_RATIO && ratio <= MAX_ASPECT_RATIO;
  });
  if (compact.length === 0) {
    return;
  }

  const areas = compact
    .map(({ box }) => box.width * box.height)
    .sort((a, b) => a - b);
  const median = areas[Math.floor(areas.length / 2)];

  for (const { link, box } of compact) {
    if (box.width * box.height > median * MAX_AREA_VS_MEDIAN) {
      continue;
    }

    const padding = Math.min(box.width, box.height) * HITBOX_PADDING;
    const rect = link.ownerDocument.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", String(box.x - padding));
    rect.setAttribute("y", String(box.y - padding));
    rect.setAttribute("width", String(box.width + padding * 2));
    rect.setAttribute("height", String(box.height + padding * 2));
    rect.setAttribute("fill", "#000");
    rect.setAttribute("fill-opacity", "0");
    rect.setAttribute("pointer-events", "all");
    rect.setAttribute("style", "cursor: pointer");
    rect.setAttribute("data-hitbox", "true");

    link.insertBefore(rect, link.firstChild);
  }
}
