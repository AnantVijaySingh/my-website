/**
 * WCAG 2.1 relative luminance and contrast ratio.
 * See design.md §1.1 — the cream canvas forces a two-tier orange, and these
 * numbers are what enforce it.
 */

function channelToLinear(value8bit) {
    const c = value8bit / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function parseHex(hex) {
    const h = String(hex).trim().replace(/^#/, '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    if (!/^[0-9a-fA-F]{6}$/.test(full)) {
        throw new Error(`Not a 6-digit hex color: ${hex}`);
    }
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
function luminance(hex) {
    const [r, g, b] = parseHex(hex).map(channelToLinear);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two colors, 1:1 to 21:1. Order-independent. */
function contrastRatio(a, b) {
    const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (lighter + 0.05) / (darker + 0.05);
}

/** Rounded to 2dp, so assertion failure messages read like the design doc. */
function ratio(a, b) {
    return Math.round(contrastRatio(a, b) * 100) / 100;
}

// WCAG 2.1 thresholds.
const AA_NORMAL_TEXT = 4.5;
const AA_LARGE_TEXT = 3.0;
const AA_NON_TEXT = 3.0;

module.exports = {
    luminance,
    contrastRatio,
    ratio,
    AA_NORMAL_TEXT,
    AA_LARGE_TEXT,
    AA_NON_TEXT,
};
