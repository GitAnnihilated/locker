"""
Extracts vector outlines for the word "Locker" from Outfit-Bold, positions
glyphs with a light negative tracking (standard for wordmarks) plus a couple
of manual pair-kerning nudges, and prints an SVG <path> group scaled to a
1000-unit em box (y-down, baseline at y=0) so it can be dropped straight
into the hand-built icon SVG without any font dependency at render time.
"""
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen

FONT_PATH = sys.argv[1] if len(sys.argv) > 1 else (
    r"C:\Users\GG\AppData\Roaming\Claude\local-agent-mode-sessions\skills-plugin"
    r"\31eba2a0-be14-4055-a479-972556f5c0cb\ac9214c0-6d3e-4fab-8634-15fb41c5af1c"
    r"\skills\canvas-design\canvas-fonts\Outfit-Bold.ttf"
)
WORD = "Locker"

# Uniform tracking (negative = tighter) as a fraction of unitsPerEm, plus
# targeted pair kerning for the couple of combinations that read loose in
# most geometric sans fonts at display size.
TRACKING = -0.006
PAIR_KERN = {
    ("L", "o"): -0.010,
    ("c", "k"): -0.006,
    ("k", "e"): -0.004,
}

font = TTFont(FONT_PATH)
upm = font["head"].unitsPerEm
cmap = font.getBestCmap()
glyf_set = font.getGlyphSet()
hmtx = font["hmtx"]

x = 0.0
parts = []
prev_char = None
for ch in WORD:
    glyph_name = cmap[ord(ch)]
    advance, lsb = hmtx[glyph_name]
    pen = SVGPathPen(glyf_set)
    glyf_set[glyph_name].draw(pen)
    d = pen.getCommands()
    if d:
        parts.append(f'<path d="{d}" transform="translate({x:.2f},0)"/>')
    kern = PAIR_KERN.get((prev_char, ch), 0.0) * upm
    x += advance + TRACKING * upm + kern
    prev_char = ch

total_width = x
print(f"<!-- unitsPerEm={upm} totalAdvance={total_width:.2f} -->")
print(f'<g id="wordmark">')
for p in parts:
    print("  " + p)
print("</g>")
