"""Prepare the selected mower excerpt with physical manufacturer badges obscured.

Requires OpenCV, NumPy and ffmpeg. Only seconds 20-33 are used in the edit.
Coordinates are editorial tracking points measured on 640x360 review frames.
The original downloaded source is retained unchanged.
"""
import subprocess
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
STOCK = ROOT / 'applications/tendercells_ui/test_output/tendercells-ui/video-out/stock'
# (time, front badge x/y, upper label x/y). Interpolate between review frames.
TRACK = np.array([
    [20, 509, 154, 460, 121], [21, 540, 166, 492, 126],
    [22, 568, 176, 519, 133], [23, 605, 192, 545, 137],
    [24, 654, 218, 567, 149], [25, 695, 235, 598, 157],
    [26, 695, 242, 628, 162], [27, 635, 232, 593, 161],
    [28, 483, 207, 539, 154], [29, 400, 179, 485, 143],
    [30, 383, 178, 450, 147], [31, 395, 179, 478, 143],
    [32, 351, 168, 410, 149], [33, 319, 166, 388, 148],
    [34, 300, 165, 370, 148],
], dtype=float)


def main():
    source = STOCK / 'robot-mower-grass-42015.mp4'
    target = STOCK / 'robot-mower-grass-42015-prepared.mp4'
    cap = cv2.VideoCapture(str(source))
    fps = cap.get(cv2.CAP_PROP_FPS)
    width, height = int(cap.get(3)), int(cap.get(4))
    if not cap.isOpened() or fps <= 0:
        raise RuntimeError('Cannot open mower source')
    proc = subprocess.Popen([
        'ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24',
        '-s', f'{width}x{height}', '-r', str(fps), '-i', '-', '-an',
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18',
        '-pix_fmt', 'yuv420p', str(target),
    ], stdin=subprocess.PIPE)
    index = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        t = index / fps
        if 19.8 <= t <= 33.1:
            # Soft localized obscuring of physical labels; never remove watermarks.
            for column, rx, ry in [(1, 20, 24), (3, 34, 16)]:
                x = np.interp(t, TRACK[:, 0], TRACK[:, column]) * width / 640
                y = np.interp(t, TRACK[:, 0], TRACK[:, column + 1]) * height / 360
                rx, ry = round(rx*width/640), round(ry*height/360)
                pad = 24
                x0, x1 = max(0, int(x-rx-pad)), min(width, int(x+rx+pad))
                y0, y1 = max(0, int(y-ry-pad)), min(height, int(y+ry+pad))
                if x0 >= x1 or y0 >= y1:
                    continue
                patch = frame[y0:y1, x0:x1]
                mask = np.zeros(patch.shape[:2], dtype='uint8')
                cv2.ellipse(mask, (int(x-x0), int(y-y0)), (rx, ry), 0, 0, 360, 255, -1)
                frame[y0:y1, x0:x1] = cv2.inpaint(patch, mask, 5, cv2.INPAINT_TELEA)
        proc.stdin.write(frame.tobytes())
        index += 1
    cap.release()
    proc.stdin.close()
    if proc.wait():
        raise RuntimeError('Mower preparation failed')
    print(target)


if __name__ == '__main__':
    main()
