import math
import os
import re
import json
import subprocess
import sys

KIT_DIR = 'assets/branding/kit'
MASTERS_DIR = f'{KIT_DIR}/svg/masters'
VARIANTS_DIR = f'{KIT_DIR}/svg/variants'

os.makedirs(MASTERS_DIR, exist_ok=True)
os.makedirs(VARIANTS_DIR, exist_ok=True)

def rot(x, y, cx, cy, angle_deg):
    rad = math.radians(angle_deg)
    cos_a = math.cos(rad)
    sin_a = math.sin(rad)
    nx = cos_a * (x - cx) - sin_a * (y - cy) + cx
    ny = sin_a * (x - cx) + cos_a * (y - cy) + cy
    return round(nx, 2), round(ny, 2)

# =============================================================================
# 1. MASTER SYMBOL (Concept A: The Sovereign Conclave)
# =============================================================================
def get_symbol_path(is_small=False, is_reversed=False):
    # Ring
    r_out = 114
    r_in = 104 if is_small else (105.5 if is_reversed else 104)
    ring = f"M128,14 A{r_out},{r_out} 0 1,0 128,242 A{r_out},{r_out} 0 1,0 128,14 Z M128,{128 - r_in} A{r_in},{r_in} 0 1,1 128,{128 + r_in} A{r_in},{r_in} 0 1,1 128,{128 - r_in} Z"
    
    # Central 8-Point Star Pavilion
    star_pts = []
    r_star_out = 32
    r_star_in = 13.5
    for i in range(8):
        ang = i * 45
        p_out = rot(128, 128 - r_star_out, 128, 128, ang)
        star_pts.append(f"{p_out[0]},{p_out[1]}")
        
        mid_ang = ang + 22.5
        p_in = rot(128, 128 - r_star_in, 128, 128, mid_ang)
        star_pts.append(f"{p_in[0]},{p_in[1]}")
    star = "M" + " L".join(star_pts) + " Z"
    
    # 4 Gathering Arches
    arch_paths = []
    for deg in [0, 90, 180, 270]:
        p1 = rot(106, 26, 128, 128, deg)
        p2 = rot(150, 26, 128, 128, deg)
        p3 = rot(150, 36, 128, 128, deg)
        p4 = rot(142, 44, 128, 128, deg)
        p5 = rot(136, 76, 128, 128, deg)
        p6 = rot(128, 86, 128, 128, deg)
        p7 = rot(120, 76, 128, 128, deg)
        p8 = rot(114, 44, 128, 128, deg)
        p9 = rot(106, 36, 128, 128, deg)
        
        c1 = rot(128, 72 if not is_small else 70, 128, 128, deg)
        c2 = rot(132, 54, 128, 128, deg)
        c3 = rot(134, 36, 128, 128, deg)
        c4 = rot(122, 36, 128, 128, deg)
        c5 = rot(124, 54, 128, 128, deg)
        
        d = f"M{p1[0]},{p1[1]} L{p2[0]},{p2[1]} L{p3[0]},{p3[1]} L{p4[0]},{p4[1]} Q{p5[0]},{p5[1]} {p6[0]},{p6[1]} Q{p7[0]},{p7[1]} {p8[0]},{p8[1]} L{p9[0]},{p9[1]} Z M{c3[0]},{c3[1]} L{c2[0]},{c2[1]} Q{c1[0]},{c1[1]} {c5[0]},{c5[1]} L{c4[0]},{c4[1]} Z"
        arch_paths.append(d)

    # 4 Diagonal Royal Medallions
    diag_paths = []
    for deg in [45, 135, 225, 315]:
        d1 = rot(128, 48, 128, 128, deg)
        d2 = rot(136, 60, 128, 128, deg)
        d3 = rot(128, 72, 128, 128, deg)
        d4 = rot(120, 60, 128, 128, deg)
        diag_paths.append(f"M{d1[0]},{d1[1]} L{d2[0]},{d2[1]} L{d3[0]},{d3[1]} L{d4[0]},{d4[1]} Z")

    return f"{ring} {star} {' '.join(arch_paths)} {' '.join(diag_paths)}"

# Write Master Symbol
symbol_path = get_symbol_path()
with open(f'{MASTERS_DIR}/etlamo-symbol.svg', 'w', encoding='utf-8') as f:
    f.write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-symbol">
  <title id="title-symbol">Etlamo (اتلموا) — Sovereign Conclave Master Symbol</title>
  <path fill="currentColor" fill-rule="evenodd" d="{symbol_path}"/>
</svg>''')

# Write Small-Size Cut (for 16-32px)
symbol_small = get_symbol_path(is_small=True)
with open(f'{MASTERS_DIR}/etlamo-symbol-small.svg', 'w', encoding='utf-8') as f:
    f.write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-small">
  <title id="title-small">Etlamo — Small-Size Favicon Cut</title>
  <path fill="currentColor" fill-rule="evenodd" d="{symbol_small}"/>
</svg>''')

# Write Thinned Reversed Master
symbol_rev = get_symbol_path(is_reversed=True)
with open(f'{MASTERS_DIR}/etlamo-symbol-reversed.svg', 'w', encoding='utf-8') as f:
    f.write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-rev">
  <title id="title-rev">Etlamo — Thinned Reversed Master (White on Dark)</title>
  <path fill="currentColor" fill-rule="evenodd" d="{symbol_rev}"/>
</svg>''')

# =============================================================================
# 2. WORDMARK & LOCKUPS
# =============================================================================
def get_wordmark_paths(start_x=0, baseline_y=140, scale=1.0):
    def s(val):
        return round(val * scale, 2)
    
    # E
    ex = start_x
    E = f"""
    M{ex},{baseline_y - s(64)} L{ex + s(44)},{baseline_y - s(64)} L{ex + s(44)},{baseline_y - s(52)} L{ex + s(14)},{baseline_y - s(52)}
    L{ex + s(14)},{baseline_y - s(38)} L{ex + s(38)},{baseline_y - s(38)} L{ex + s(38)},{baseline_y - s(26)} L{ex + s(14)},{baseline_y - s(26)}
    L{ex + s(14)},{baseline_y - s(12)} L{ex + s(44)},{baseline_y - s(12)} L{ex + s(44)},{baseline_y} L{ex},{baseline_y} Z
    """
    
    # T
    tx = ex + s(52)
    T = f"""
    M{tx},{baseline_y - s(64)} L{tx + s(48)},{baseline_y - s(64)} L{tx + s(48)},{baseline_y - s(52)} L{tx + s(31)},{baseline_y - s(52)}
    L{tx + s(31)},{baseline_y} L{tx + s(17)},{baseline_y} L{tx + s(17)},{baseline_y - s(52)} L{tx},{baseline_y - s(52)} Z
    """
    
    # L
    lx = ex + s(108)
    L = f"""
    M{lx},{baseline_y - s(64)} L{lx + s(14)},{baseline_y - s(64)} L{lx + s(14)},{baseline_y - s(12)} L{lx + s(42)},{baseline_y - s(12)}
    L{lx + s(42)},{baseline_y} L{lx},{baseline_y} Z
    """
    
    # A
    ax = ex + s(158)
    A = f"""
    M{ax + s(17)},{baseline_y - s(64)} L{ax + s(33)},{baseline_y - s(64)} L{ax + s(50)},{baseline_y} L{ax + s(35)},{baseline_y}
    L{ax + s(29)},{baseline_y - s(20)} L{ax + s(21)},{baseline_y - s(20)} L{ax + s(15)},{baseline_y} L{ax},{baseline_y} Z
    M{ax + s(23)},{baseline_y - s(32)} L{ax + s(27)},{baseline_y - s(32)} L{ax + s(31)},{baseline_y - s(46)} L{ax + s(19)},{baseline_y - s(46)} Z
    """
    
    # M
    mx = ex + s(216)
    M = f"""
    M{mx},{baseline_y - s(64)} L{mx + s(14)},{baseline_y - s(64)} L{mx + s(27)},{baseline_y - s(24)} L{mx + s(40)},{baseline_y - s(64)}
    L{mx + s(54)},{baseline_y - s(64)} L{mx + s(54)},{baseline_y} L{mx + s(40)},{baseline_y} L{mx + s(40)},{baseline_y - s(40)}
    L{mx + s(29)},{baseline_y - s(6)} L{mx + s(25)},{baseline_y - s(6)} L{mx + s(14)},{baseline_y - s(40)} L{mx + s(14)},{baseline_y}
    L{mx},{baseline_y} Z
    """
    
    # O
    ox = ex + s(278)
    O = f"""
    M{ox + s(26)},{baseline_y - s(64)} A{s(26)},{s(32)} 0 1,1 {ox + s(25.9)},{baseline_y - s(64)} Z
    M{ox + s(26)},{baseline_y - s(52)} A{s(14)},{s(20)} 0 1,0 {ox + s(26.1)},{baseline_y - s(52)} Z
    """
    
    return f"{E} {T} {L} {A} {M} {O}"

# Wordmark Master SVG
standalone_wm = get_wordmark_paths(start_x=30, baseline_y=95, scale=1.0)
with open(f'{MASTERS_DIR}/etlamo-wordmark.svg', 'w', encoding='utf-8') as f:
    f.write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 130" width="390" height="130" role="img" aria-labelledby="title-wm">
  <title id="title-wm">ETLAMO — Sovereign Wordmark Master</title>
  <path fill="currentColor" fill-rule="evenodd" d="{standalone_wm}"/>
  <text x="32" y="118" font-family="'Cinzel', 'Trajan Pro', 'Cormorant Garamond', serif" font-size="10.5" font-weight="600" letter-spacing="3" fill="currentColor" opacity="0.85">SOVEREIGN ESTATES &amp; VENUES</text>
</svg>''')

# Horizontal Master Lockup SVG (viewBox 0 0 760 256)
horiz_wm = get_wordmark_paths(start_x=224, baseline_y=138, scale=1.0)
with open(f'{MASTERS_DIR}/etlamo-horizontal.svg', 'w', encoding='utf-8') as f:
    f.write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 256" width="760" height="256" role="img" aria-labelledby="title-horiz">
  <title id="title-horiz">Etlamo (اتلموا) — Sovereign Horizontal Lockup Master</title>
  <!-- Symbol scaled at x=20..200, y=38..218 -->
  <g transform="translate(20, 38) scale(0.703)">
    <path fill="currentColor" fill-rule="evenodd" d="{symbol_path}"/>
  </g>
  <!-- Wordmark -->
  <path fill="currentColor" fill-rule="evenodd" d="{horiz_wm}"/>
  <g fill="currentColor">
    <text x="226" y="172" font-family="'Cinzel', 'Trajan Pro', 'Cormorant Garamond', serif" font-size="13" font-weight="600" letter-spacing="3" opacity="0.85">SOVEREIGN ESTATES &amp; VENUES</text>
    <text x="560" y="140" font-family="'Amiri', 'Traditional Arabic', serif" font-size="34" font-weight="700">اتلموا</text>
    <text x="560" y="170" font-family="'Amiri', 'Traditional Arabic', serif" font-size="12.5" opacity="0.75">قصور وقاعات مصر</text>
  </g>
</svg>''')

# Stacked Master Lockup SVG (viewBox 0 0 384 384)
# Symbol centered at x=112..272 (y=32..192, box 160x160)
# Wordmark width = 330 * 0.62 = 205, centered at x=90, baseline y=254
stacked_wm = get_wordmark_paths(start_x=88, baseline_y=256, scale=0.63)
with open(f'{MASTERS_DIR}/etlamo-stacked.svg', 'w', encoding='utf-8') as f:
    f.write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 384" width="384" height="384" role="img" aria-labelledby="title-stacked">
  <title id="title-stacked">Etlamo (اتلموا) — Sovereign Stacked Lockup Master</title>
  <!-- Symbol centered at x=112, y=34, size 160x160 -->
  <g transform="translate(112, 34) scale(0.625)">
    <path fill="currentColor" fill-rule="evenodd" d="{symbol_path}"/>
  </g>
  <!-- Stacked Wordmark -->
  <path fill="currentColor" fill-rule="evenodd" d="{stacked_wm}"/>
  <!-- Bilingual Subtitles -->
  <g fill="currentColor" text-anchor="middle">
    <text x="192" y="304" font-family="'Amiri', 'Traditional Arabic', serif" font-size="30" font-weight="700">اتلموا</text>
    <text x="192" y="330" font-family="'Amiri', 'Traditional Arabic', serif" font-size="13" opacity="0.85">قصور وقاعات مصر</text>
    <text x="192" y="356" font-family="'Cinzel', 'Trajan Pro', 'Cormorant Garamond', serif" font-size="9.5" font-weight="600" letter-spacing="2.5" opacity="0.75">SOVEREIGN ESTATES &amp; SUMMITS</text>
  </g>
</svg>''')

print("All Masters successfully created.")

# =============================================================================
# 3. COLOR VARIANTS (Black, White, Terracotta #C85A32, Gold #D4AF37)
# =============================================================================
PALETTE = {
    'black': '#000000',
    'white': '#FFFFFF',
    'terracotta': '#C85A32',
    'gold': '#D4AF37'
}

# Generate Symbol Variants
for name, color in PALETTE.items():
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-sym-{name}">
  <title id="title-sym-{name}">Etlamo Symbol ({name.title()})</title>
  <path fill="{color}" fill-rule="evenodd" d="{symbol_path if name != 'white' else symbol_rev}"/>
</svg>'''
    with open(f'{VARIANTS_DIR}/etlamo-symbol-{name}.svg', 'w', encoding='utf-8') as f:
        f.write(svg_content)

# App Icon Tile (Terracotta background with white symbol, 22% radius squircle)
with open(f'{VARIANTS_DIR}/etlamo-symbol-app-icon.svg', 'w', encoding='utf-8') as f:
    f.write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-app">
  <title id="title-app">Etlamo App Icon</title>
  <rect width="256" height="256" rx="56" fill="#C85A32"/>
  <g fill="#FFFFFF" fill-rule="evenodd" transform="translate(38, 38) scale(0.703)">
    <path d="{symbol_rev}"/>
  </g>
</svg>''')

# Square Avatar Tile (Onyx #1C1814 background with Gold #D4AF37 symbol)
with open(f'{VARIANTS_DIR}/etlamo-symbol-avatar.svg', 'w', encoding='utf-8') as f:
    f.write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-avatar">
  <title id="title-avatar">Etlamo Sovereign Avatar</title>
  <rect width="256" height="256" fill="#1C1814"/>
  <g fill="#D4AF37" fill-rule="evenodd" transform="translate(32, 32) scale(0.75)">
    <path d="{symbol_path}"/>
  </g>
</svg>''')

# Favicon SVG (Tight, high contrast)
with open(f'{VARIANTS_DIR}/etlamo-symbol-favicon.svg', 'w', encoding='utf-8') as f:
    f.write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-fav">
  <title id="title-fav">Etlamo Favicon</title>
  <rect width="256" height="256" rx="48" fill="#1C1814"/>
  <g fill="#C85A32" fill-rule="evenodd" transform="translate(20, 20) scale(0.843)">
    <path d="{symbol_small}"/>
  </g>
</svg>''')

# Horizontal Lockup Color Variants
for name, color in PALETTE.items():
    cur_sym = symbol_rev if name == 'white' else symbol_path
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 256" width="760" height="256" role="img" aria-labelledby="title-h-{name}">
  <title id="title-h-{name}">Etlamo Horizontal Lockup ({name.title()})</title>
  <g transform="translate(20, 38) scale(0.703)">
    <path fill="{color}" fill-rule="evenodd" d="{cur_sym}"/>
  </g>
  <path fill="{color}" fill-rule="evenodd" d="{horiz_wm}"/>
  <g fill="{color}">
    <text x="226" y="172" font-family="'Cinzel', 'Trajan Pro', 'Cormorant Garamond', serif" font-size="13" font-weight="600" letter-spacing="3" opacity="0.85">SOVEREIGN ESTATES &amp; VENUES</text>
    <text x="560" y="140" font-family="'Amiri', 'Traditional Arabic', serif" font-size="34" font-weight="700">اتلموا</text>
    <text x="560" y="170" font-family="'Amiri', 'Traditional Arabic', serif" font-size="12.5" opacity="0.75">قصور وقاعات مصر</text>
  </g>
</svg>'''
    with open(f'{VARIANTS_DIR}/etlamo-horizontal-{name}.svg', 'w', encoding='utf-8') as f:
        f.write(svg_content)

# Stacked Lockup Color Variants
for name, color in PALETTE.items():
    cur_sym = symbol_rev if name == 'white' else symbol_path
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 384" width="384" height="384" role="img" aria-labelledby="title-s-{name}">
  <title id="title-s-{name}">Etlamo Stacked Lockup ({name.title()})</title>
  <g transform="translate(112, 34) scale(0.625)">
    <path fill="{color}" fill-rule="evenodd" d="{cur_sym}"/>
  </g>
  <path fill="{color}" fill-rule="evenodd" d="{stacked_wm}"/>
  <g fill="{color}" text-anchor="middle">
    <text x="192" y="304" font-family="'Amiri', 'Traditional Arabic', serif" font-size="30" font-weight="700">اتلموا</text>
    <text x="192" y="330" font-family="'Amiri', 'Traditional Arabic', serif" font-size="13" opacity="0.85">قصور وقاعات مصر</text>
    <text x="192" y="356" font-family="'Cinzel', 'Trajan Pro', 'Cormorant Garamond', serif" font-size="9.5" font-weight="600" letter-spacing="2.5" opacity="0.75">SOVEREIGN ESTATES &amp; SUMMITS</text>
  </g>
</svg>'''
    with open(f'{VARIANTS_DIR}/etlamo-stacked-{name}.svg', 'w', encoding='utf-8') as f:
        f.write(svg_content)

print("All Variants successfully created.")
