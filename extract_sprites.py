#!/usr/bin/env python3
"""
Extract NPC sprites from a FRLG overworld sprite sheet.
Produces 64x51 PNG sprite sheets (4 cols x 3 rows of 16x17 frames)
plus JSON atlas files for each NPC.
"""

import json
import os
import sys

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow not installed. Install with: pip3 install Pillow")
    sys.exit(1)

# --- Configuration ---

SOURCE_PATH = "/tmp/frlg_overworld_npcs.png"
OUTPUT_DIR = "/Users/cody/projects/Pokemon-Web/frontend/public/assets/sprites/npcs"

# FRLG sheet grid column left-edge borders
COL_BORDERS = [0, 25, 42, 59, 76, 93, 110, 127, 144, 161, 178, 195, 212]
ROW_STRIDE = 25
FRAME_W = 16
FRAME_H = 17
OUT_W = 64   # 4 columns * 16px
OUT_H = 51   # 3 rows * 17px

BG_TOLERANCE = 10

# Characters to extract: name -> row index (0-based)
CHARACTERS = {
    "npc-oak": 27,
    "npc-bug-catcher": 7,
    "npc-scientist": 29,
    "npc-hiker": 35,
    "npc-sailor": 52,
    "npc-swimmer": 55,
    "npc-oldman": 34,
}

NURSE_ROW = 14


def is_background(r, g, b):
    """Check if a pixel color matches any known background color."""
    # Orange background (255, 127, 39) +/- tolerance
    if (abs(r - 255) <= BG_TOLERANCE and
        abs(g - 127) <= BG_TOLERANCE and
        abs(b - 39) <= BG_TOLERANCE):
        return True
    # Green background (34, 177, 76) +/- tolerance
    if (abs(r - 34) <= BG_TOLERANCE and
        abs(g - 177) <= BG_TOLERANCE and
        abs(b - 76) <= BG_TOLERANCE):
        return True
    # White background (>245 on all channels)
    if r > 245 and g > 245 and b > 245:
        return True
    return False


def make_transparent(img):
    """Convert background colors to transparent."""
    img = img.convert("RGBA")
    pixels = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if is_background(r, g, b):
                pixels[x, y] = (0, 0, 0, 0)
    return img


def extract_cell(sheet, row, col_idx):
    """
    Extract a cell from the sprite sheet using full cell width.
    Cell 0 starts at x=5; cells 1-11 start at COL_BORDERS[col_idx]+1.
    Cell width extends to the next column border (or sheet edge).
    """
    y_top = row * ROW_STRIDE + 1
    y_bottom = y_top + ROW_STRIDE - 1

    if col_idx == 0:
        x_left = 5
    else:
        x_left = COL_BORDERS[col_idx] + 1

    if col_idx < len(COL_BORDERS) - 1:
        x_right = COL_BORDERS[col_idx + 1]
    else:
        x_right = 238  # sheet width

    cell = sheet.crop((x_left, y_top, x_right, y_bottom))
    cell = make_transparent(cell)
    return cell


def fit_frame(cell):
    """
    Fit a cell into a 16x17 frame.
    - Find content bounding box (non-transparent pixels)
    - If content taller than 17px, crop from top (preserve feet)
    - If shorter, bottom-align
    - If wider than 16px, center-crop horizontally
    - If narrower, center horizontally
    """
    w, h = cell.size
    pixels = cell.load()

    # Find content bounding box
    first_row = None
    last_row = None
    first_col = None
    last_col = None
    for y in range(h):
        for x in range(w):
            if pixels[x, y][3] > 0:
                if first_row is None:
                    first_row = y
                last_row = y
                if first_col is None or x < first_col:
                    first_col = x
                if last_col is None or x > last_col:
                    last_col = x

    if first_row is None:
        # Completely empty cell
        return Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))

    # Crop to content bounding box
    content = cell.crop((first_col, first_row, last_col + 1, last_row + 1))
    content_w, content_h = content.size

    # If wider than FRAME_W, center crop
    if content_w > FRAME_W:
        x_offset = (content_w - FRAME_W) // 2
        content = content.crop((x_offset, 0, x_offset + FRAME_W, content_h))
        content_w = FRAME_W

    # If taller than FRAME_H, crop from top (keep bottom / feet)
    if content_h > FRAME_H:
        content = content.crop((0, content_h - FRAME_H, content_w, content_h))
        content_h = FRAME_H

    # Place into output frame: bottom-aligned vertically, centered horizontally
    frame = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    x_offset = (FRAME_W - content_w) // 2
    y_offset = FRAME_H - content_h
    frame.paste(content, (x_offset, y_offset))

    return frame


def extract_npc(sheet, row, is_nurse=False):
    """
    Extract a full NPC sprite sheet from the given row.

    Output layout (64x51):
      Row 0 (y=0):  walk-down
      Row 1 (y=17): walk-right (left cells mirrored)
      Row 2 (y=34): walk-up

    Source cell mapping:
      Down:  output cols 0-3 <- cells 1, 2, 3, 2
      Right: output cols 0-3 <- cells 9, 10, 11, 10 (mirrored)
      Up:    output cols 0-3 <- cells 5, 4, 7, 6
    """
    output = Image.new("RGBA", (OUT_W, OUT_H), (0, 0, 0, 0))

    if is_nurse:
        # Nurse: only down-facing frames; duplicate to all 3 rows
        down_cells = [1, 2, 3, 2]
        frames = []
        for cell_idx in down_cells:
            cell = extract_cell(sheet, row, cell_idx)
            frame = fit_frame(cell)
            frames.append(frame)

        for out_row in range(3):
            for col, frame in enumerate(frames):
                x = col * FRAME_W
                y = out_row * FRAME_H
                output.paste(frame, (x, y))
        return output

    # --- Down (output row 0) ---
    # Source cells: 1 (stand), 2 (walk-A), 3 (stand-var), 2 (walk-B)
    for col, cell_idx in enumerate([1, 2, 3, 2]):
        cell = extract_cell(sheet, row, cell_idx)
        frame = fit_frame(cell)
        output.paste(frame, (col * FRAME_W, 0))

    # --- Right (output row 1) ---
    # Source cells: 9 (stand), 10 (walk-A), 11 (stand-var), 10 (walk-B)
    # These are left-facing; mirror horizontally for right
    for col, cell_idx in enumerate([9, 10, 11, 10]):
        cell = extract_cell(sheet, row, cell_idx)
        frame = fit_frame(cell)
        frame = frame.transpose(Image.FLIP_LEFT_RIGHT)
        output.paste(frame, (col * FRAME_W, FRAME_H))

    # --- Up (output row 2) ---
    # Source cells: 5 (stand), 4 (walk-A), 7 (stand-var), 6 (walk-B)
    for col, cell_idx in enumerate([5, 4, 7, 6]):
        cell = extract_cell(sheet, row, cell_idx)
        frame = fit_frame(cell)
        output.paste(frame, (col * FRAME_W, 2 * FRAME_H))

    return output


def generate_atlas(name):
    """
    Generate a JSON atlas for the sprite.
    Frame names: walk-{down,right,up,left}-{0..3}
    walk-left reuses the walk-right row (y=17).
    """
    frames = {}
    directions = [
        ("walk-down", 0),
        ("walk-right", 17),
        ("walk-up", 34),
        ("walk-left", 17),
    ]

    for direction, y in directions:
        for i in range(4):
            frame_name = "%s-%d" % (direction, i)
            frames[frame_name] = {
                "frame": {
                    "x": i * FRAME_W,
                    "y": y,
                    "w": FRAME_W,
                    "h": FRAME_H,
                },
                "rotated": False,
                "trimmed": False,
                "spriteSourceSize": {
                    "x": 0,
                    "y": 0,
                    "w": FRAME_W,
                    "h": FRAME_H,
                },
                "sourceSize": {
                    "w": FRAME_W,
                    "h": FRAME_H,
                },
            }

    atlas = {
        "frames": frames,
        "meta": {
            "image": "%s.png" % name,
        },
    }
    return atlas


def main():
    if not os.path.exists(SOURCE_PATH):
        print("ERROR: Source file not found: %s" % SOURCE_PATH)
        sys.exit(1)

    sheet = Image.open(SOURCE_PATH).convert("RGBA")
    print("Loaded sprite sheet: %dx%d, mode=%s" % (
        sheet.size[0], sheet.size[1], sheet.mode))

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Extract regular NPCs
    for name, row in CHARACTERS.items():
        print("Extracting %s (row %d)..." % (name, row))
        sprite = extract_npc(sheet, row)

        png_path = os.path.join(OUTPUT_DIR, "%s.png" % name)
        json_path = os.path.join(OUTPUT_DIR, "%s.json" % name)

        sprite.save(png_path, "PNG")
        print("  Saved PNG: %s" % png_path)

        atlas_data = generate_atlas(name)
        with open(json_path, "w") as f:
            json.dump(atlas_data, f, indent=2)
        print("  Saved JSON: %s" % json_path)

    # Extract nurse (special case: down-only, reused for all directions)
    name = "npc-nurse"
    print("Extracting %s (row %d, down-only special case)..." % (
        name, NURSE_ROW))
    sprite = extract_npc(sheet, NURSE_ROW, is_nurse=True)

    png_path = os.path.join(OUTPUT_DIR, "%s.png" % name)
    json_path = os.path.join(OUTPUT_DIR, "%s.json" % name)

    sprite.save(png_path, "PNG")
    print("  Saved PNG: %s" % png_path)

    atlas_data = generate_atlas(name)
    with open(json_path, "w") as f:
        json.dump(atlas_data, f, indent=2)
    print("  Saved JSON: %s" % json_path)

    print("")
    print("Done! All %d sprites extracted successfully." % (
        len(CHARACTERS) + 1))


if __name__ == "__main__":
    main()
