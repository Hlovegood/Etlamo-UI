import math
import os

os.makedirs('assets/branding', exist_ok=True)

# -----------------------------------------------------------------------------
# HELPER: Rotational transform for 2D points
# -----------------------------------------------------------------------------
def rot(x, y, cx, cy, angle_deg):
    rad = math.radians(angle_deg)
    cos_a = math.cos(rad)
    sin_a = math.sin(rad)
    nx = cos_a * (x - cx) - sin_a * (y - cy) + cx
    ny = sin_a * (x - cx) + cos_a * (y - cy) + cy
    return round(nx, 2), round(ny, 2)

# -----------------------------------------------------------------------------
# CONCEPT A: The Sovereign Conclave (المجلس الملكي)
# 4 Arches gathering inward around central 8-point royal star + archival ring
# -----------------------------------------------------------------------------
def build_concept_a():
    # Center (128, 128)
    # 1. Outer Archival Ring (R_out=116, R_in=106, stroke width 10)
    ring = "M128,12 A116,116 0 1,0 128,244 A116,116 0 1,0 128,12 Z M128,22 A106,106 0 1,1 128,234 A106,106 0 1,1 128,22 Z"
    
    # 2. Central 8-Point Royal Star Pavilion
    star = "M128,98 L135,121 L158,128 L135,135 L128,158 L121,135 L98,128 L121,121 Z"
    
    # 3. 4 Gathering Arches (Each sweeping from outer perimeter toward center)
    # Base arch facing north:
    # Anchor at ring (x=104..152, y=26), columns at x=108 and x=148, arch head at y=64, inner keystone at y=90
    arch_paths = []
    for deg in [0, 90, 180, 270]:
        # Arch pillar left, arch pillar right, sweeping vault curve
        # Plinth top
        p1 = rot(106, 26, 128, 128, deg)
        p2 = rot(150, 26, 128, 128, deg)
        p3 = rot(150, 36, 128, 128, deg)
        p4 = rot(142, 42, 128, 128, deg)
        # Inward arch sweep right
        p5 = rot(136, 78, 128, 128, deg)
        p6 = rot(128, 88, 128, 128, deg) # Apex pointing to center
        # Inward arch sweep left
        p7 = rot(120, 78, 128, 128, deg)
        p8 = rot(114, 42, 128, 128, deg)
        p9 = rot(106, 36, 128, 128, deg)
        
        # Inner cutout of arch
        c1 = rot(128, 74, 128, 128, deg)
        c2 = rot(132, 54, 128, 128, deg)
        c3 = rot(134, 36, 128, 128, deg)
        c4 = rot(122, 36, 128, 128, deg)
        c5 = rot(124, 54, 128, 128, deg)
        
        d = f"M{p1[0]},{p1[1]} L{p2[0]},{p2[1]} L{p3[0]},{p3[1]} L{p4[0]},{p4[1]} Q{p5[0]},{p5[1]} {p6[0]},{p6[1]} Q{p7[0]},{p7[1]} {p8[0]},{p8[1]} L{p9[0]},{p9[1]} Z M{c3[0]},{c3[1]} L{c2[0]},{c2[1]} Q{c1[0]},{c1[1]} {c5[0]},{c5[1]} L{c4[0]},{c4[1]} Z"
        arch_paths.append(d)

    # 4. Diagonal Royal Medallions (45°, 135°, 225°, 315°) connecting the community
    diag_paths = []
    for deg in [45, 135, 225, 315]:
        d1 = rot(128, 48, 128, 128, deg)
        d2 = rot(134, 60, 128, 128, deg)
        d3 = rot(128, 72, 128, 128, deg)
        d4 = rot(122, 60, 128, 128, deg)
        diag_paths.append(f"M{d1[0]},{d1[1]} L{d2[0]},{d2[1]} L{d3[0]},{d3[1]} L{d4[0]},{d4[1]} Z")

    all_d = f"{ring} {star} {' '.join(arch_paths)} {' '.join(diag_paths)}"
    
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-a">
  <title id="title-a">Etlamo — The Sovereign Conclave Symbol</title>
  <path fill="currentColor" fill-rule="evenodd" d="{all_d}"/>
</svg>"""
    with open('assets/branding/concept-a-symbol.svg', 'w', encoding='utf-8') as f:
        f.write(svg)

build_concept_a()
print("Concept A built.")
