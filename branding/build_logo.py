"""
Builds the Locker logo as pure SVG: a hand-authored geometric icon (rounded
square "workspace" with an L-shaped doorway cut through it and an accent
"node" plugged into the aperture) plus a wordmark whose letterforms are
pre-converted to vector outlines (see build_wordmark.py) so nothing at
render time depends on a font being installed.

Produces, all transparent-background except the presentation sheet:
  icon-color.svg / icon-mono.svg
  horizontal-color.svg / horizontal-mono.svg
  sheet.svg (white-background presentation composite)
"""
import subprocess

NAVY = "#101F3D"
ACCENT = "#3E6BE0"

WORDMARK_SCRIPT = "build_wordmark.py"
FONT_PATH = (
    r"C:\Users\GG\AppData\Roaming\Claude\local-agent-mode-sessions\skills-plugin"
    r"\31eba2a0-be14-4055-a479-972556f5c0cb\ac9214c0-6d3e-4fab-8634-15fb41c5af1c"
    r"\skills\canvas-design\canvas-fonts\Outfit-Bold.ttf"
)

# ---- pull wordmark glyph paths (font-space, y-up, unitsPerEm=1000) --------
raw = subprocess.check_output(["python", WORDMARK_SCRIPT, FONT_PATH], text=True)
lines = [l for l in raw.splitlines() if l.strip().startswith("<path")]
UPM = 1000
TOTAL_ADVANCE = float(raw.split("totalAdvance=")[1].split(" ")[0])


def icon_defs(hole_extra=0.0):
    """The mask that cuts the L-shaped doorway through the navy square."""
    return f'''
    <mask id="doorway">
      <rect x="10" y="10" width="80" height="80" rx="20" fill="#fff"/>
      <rect x="38" y="26" width="14" height="36" rx="4" fill="#000"/>
      <rect x="38" y="48" width="52" height="14" rx="3" fill="#000"/>
      <circle cx="45" cy="26" r="11" fill="#000"/>
    </mask>'''


def icon_group(color, with_accent=True):
    accent = f'<circle cx="45" cy="26" r="9" fill="{ACCENT if with_accent else color}"/>' if True else ""
    return f'''
    <rect x="10" y="10" width="80" height="80" rx="20" fill="{color}" mask="url(#doorway)"/>
    {accent}'''


def wordmark_group(color, s, tx, ty):
    paths = "\n    ".join(lines)
    return f'''
    <g transform="translate({tx:.3f},{ty:.3f}) scale({s:.6f},{-s:.6f})" fill="{color}">
    {paths}
    </g>'''


def svg(width, height, body, bg=None):
    bgrect = f'<rect x="0" y="0" width="{width}" height="{height}" fill="{bg}"/>' if bg else ""
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">
  <defs>{icon_defs()}</defs>
  {bgrect}
  {body}
</svg>'''


# ---- icon-only (100x100) ---------------------------------------------------
icon_color = svg(100, 100, f'<g>{icon_group(NAVY)}</g>')
icon_mono = svg(100, 100, f'<g>{icon_group("#000000", with_accent=False)}</g>')

# ---- horizontal lockup ------------------------------------------------------
CAP_HEIGHT = 706.0  # from the "L" glyph's bounding box, font units
S = 46.0 / CAP_HEIGHT  # target cap height = 46 icon-units (~57% of the icon's 80-unit body)
GAP = 26.0
TX = 100 + GAP
MID_FONT_Y = (706.0 + (-11.0)) / 2.0
TY = 50 + S * MID_FONT_Y
WORD_WIDTH = TOTAL_ADVANCE * S
TOTAL_W = TX + WORD_WIDTH + 15

horizontal_color = svg(
    TOTAL_W, 100,
    f'<g>{icon_group(NAVY)}</g>' + wordmark_group(NAVY, S, TX, TY),
)
horizontal_mono = svg(
    TOTAL_W, 100,
    f'<g>{icon_group("#000000", with_accent=False)}</g>' + wordmark_group("#000000", S, TX, TY),
)

with open("icon-color.svg", "w") as f:
    f.write(icon_color)
with open("icon-mono.svg", "w") as f:
    f.write(icon_mono)
with open("horizontal-color.svg", "w") as f:
    f.write(horizontal_color)
with open("horizontal-mono.svg", "w") as f:
    f.write(horizontal_mono)

print("TOTAL_W", TOTAL_W, "S", S, "TY", TY)

# ---- presentation sheet (white bg, all three variants) ---------------------
sheet_w = 1100
scale = 2.2
margin, gap, label_gap = 70, 60, 34
row_h = 100 * scale

icon_x = (sheet_w - 100 * scale) / 2
horiz_x = (sheet_w - TOTAL_W * scale) / 2

y1 = margin
y2 = y1 + row_h + label_gap + gap
y3 = y2 + row_h + label_gap + gap
sheet_h = y3 + row_h + label_gap + margin


def label(y, text):
    return (
        f'<text x="{sheet_w/2}" y="{y:.2f}" font-family="Arial" font-size="14" '
        f'fill="#98A2B8" text-anchor="middle" letter-spacing="3">{text}</text>'
    )


sheet_body = f'''
  <g transform="translate({icon_x:.2f},{y1:.2f}) scale({scale})">{icon_group(NAVY)}</g>
  {label(y1 + row_h + label_gap, "ICON")}

  <g transform="translate({horiz_x:.2f},{y2:.2f}) scale({scale})">
    {icon_group(NAVY)}{wordmark_group(NAVY, S, TX, TY)}
  </g>
  {label(y2 + row_h + label_gap, "PRIMARY LOCKUP")}

  <g transform="translate({horiz_x:.2f},{y3:.2f}) scale({scale})">
    {icon_group("#0C0C0C", with_accent=False)}{wordmark_group("#0C0C0C", S, TX, TY)}
  </g>
  {label(y3 + row_h + label_gap, "MONOCHROME")}
'''
sheet = svg(sheet_w, sheet_h, sheet_body, bg="#FFFFFF")
with open("sheet.svg", "w") as f:
    f.write(sheet)

print("done")
