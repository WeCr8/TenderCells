"""Render the stock-inclusive anthem edit without overwriting the original film.

Run from any directory: python scripts/video/render-story.py
Requires ffmpeg/ffprobe on PATH and the previously captured video-out/segments.
"""
import json
import shutil
import subprocess
from pathlib import Path
try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError as exc:
    raise SystemExit('Pillow is required: python -m pip install Pillow') from exc

ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / 'docs/video'
MEDIA = ROOT / 'applications/tendercells_ui/test_output/tendercells-ui/video-out'
OUT = MEDIA / 'story-v3'
FF = shutil.which('ffmpeg')
PROBE = shutil.which('ffprobe')
LOGO = ROOT / 'applications/tendercells_ui/test_output/website/public/assets/images/tender_cells_logo.png'


def run(args):
    subprocess.run([FF, '-hide_banner', '-loglevel', 'error', '-y', *args], cwd=OUT, check=True)


def duration(path):
    return float(subprocess.check_output([PROBE, '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)], text=True).strip())


def font(name, size):
    return ImageFont.truetype(str(Path('C:/Windows/Fonts') / name), size)


def centered(draw, text, y, face, fill, canvas_width=1920):
    box = draw.textbbox((0, 0), text, font=face)
    draw.text(((canvas_width - (box[2] - box[0])) / 2, y), text, font=face, fill=fill)


def make_brand_cards():
    """Create full-frame cards from the project's official logo asset."""
    cream, navy, green = '#F7F4EE', '#061D2E', '#147C38'
    source = Image.open(LOGO).convert('RGB')
    for name, ending in [('opening-card.png', False), ('ending-card.png', True)]:
        card = Image.new('RGB', (1920, 1080), cream)
        logo_size = 570 if not ending else 440
        logo = source.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
        card.paste(logo, ((1920 - logo_size) // 2, 68 if not ending else 18))
        draw = ImageDraw.Draw(card)
        if ending:
            centered(draw, 'BUILDING THE FUTURE, ONE FLOCK AT A TIME', 475, font('arialbd.ttf', 46), navy)
            centered(draw, 'Explore the Tender Cells application', 585, font('arial.ttf', 34), green)
            centered(draw, 'tendercells.com/app/demo', 650, font('arialbd.ttf', 54), navy)
            draw.rounded_rectangle((665, 755, 1255, 823), radius=34, fill=green)
            centered(draw, 'START EXPLORING', 769, font('arialbd.ttf', 31), '#FFFFFF')
            centered(draw, 'An open-source project by WeCr8 Solutions', 928, font('arial.ttf', 25), navy)
        else:
            centered(draw, 'BUILDING THE FUTURE OF ANIMAL CARE', 810, font('arialbd.ttf', 43), navy)
            centered(draw, 'Engineering  •  Education  •  Open Source', 884, font('arial.ttf', 29), green)
        card.save(OUT / name)


def main():
    if not FF or not PROBE:
        raise RuntimeError('ffmpeg and ffprobe must be on PATH')
    OUT.mkdir(parents=True, exist_ok=True)
    if not LOGO.exists():
        raise FileNotFoundError(LOGO)
    make_brand_cards()
    cues = json.loads((DOCS / 'anthem-cues.json').read_text(encoding='utf8'))
    edits = []
    for shot in cues['shots']:
        frames = round(shot['end'] * 30) - round(shot['start'] * 30)
        seconds = frames / 30
        stock = shot.get('stock')
        source = MEDIA / 'stock' / stock if stock else MEDIA / 'segments' / (shot.get('sourceShot', shot['id']) + '.mp4')
        if not source.exists():
            raise FileNotFoundError(source)
        offset = shot.get('stockOffset', 0) if stock else 0
        available = duration(source) - offset
        if stock and available < seconds:
            raise ValueError(f'{shot["id"]}: stock clip is too short')
        speed = max(1, seconds / available)
        filters = [f'setpts={speed:.9f}*(PTS-STARTPTS)']
        if shot.get('sourceCrop'):
            filters.append('crop=' + ':'.join(str(v) for v in shot['sourceCrop']))
        filters.extend(['scale=1920:1080:force_original_aspect_ratio=increase', 'crop=1920:1080', 'setsar=1', 'fps=30'])
        # Editorial context labels, never lyric captions. Keep source UI visible.
        label = shot.get('contextLabel', 'Illustrative stock footage' if stock else 'Application demo - simulated')
        if shot['id'] == 'S70':
            label = 'Try the application'
        (OUT / 'label.txt').write_text(label, encoding='utf8')
        filters.append("drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':textfile=label.txt:fontsize=24:fontcolor=white:box=1:boxcolor=black@0.72:boxborderw=10:x=w-tw-40:y=34")
        title = shot.get('editorialTitle') or {'S10': 'Your property. Connected.', 'S23': 'Care and robotics workflows', 'S54': 'Supported integrations | Setup required'}.get(shot['id'])
        if title:
            (OUT / 'title.txt').write_text(title, encoding='utf8')
            filters.append("drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':textfile=title.txt:fontsize=58:fontcolor=white:box=1:boxcolor=black@0.72:boxborderw=22:x=(w-tw)/2:y=h-170")
        if shot['id'] == 'S01':
            filters.append('fade=t=in:st=0:d=0.4')
        if shot['id'] == 'S70':
            filters.append(f'fade=t=out:st={seconds-0.4}:d=0.4')
        target = OUT / (shot['id'] + '.mp4')
        if shot['id'] == 'S01':
            # Begin with the official mark, then dissolve into the real-world farm image.
            stock_filters = ','.join(filters[:-1] + [filters[-1].replace("drawtext=", "drawtext=enable='gte(t,1.7)':")])
            run(['-loop', '1', '-t', '2.2', '-i', str(OUT / 'opening-card.png'), '-ss', str(offset), '-i', str(source),
                 '-filter_complex', f'[0:v]scale=1920:1080,fps=30[card];[1:v]{stock_filters}[farm];[card][farm]xfade=transition=fade:duration=0.5:offset=1.7,fade=t=out:st={seconds-0.35}:d=0.35[out]',
                 '-map', '[out]', '-frames:v', str(frames), '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p', '-threads', '4', str(target)])
        elif shot['id'] == 'S70':
            # End on a deliberate credit and invitation, with enough time to read it.
            run(['-loop', '1', '-i', str(OUT / 'ending-card.png'), '-vf', f'scale=1920:1080,fps=30,fade=t=in:st=0:d=0.35,fade=t=out:st={seconds-0.4}:d=0.4',
                 '-frames:v', str(frames), '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p', '-threads', '4', str(target)])
        else:
            run(['-ss', str(offset), '-i', str(source), '-vf', ','.join(filters), '-frames:v', str(frames), '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p', '-threads', '4', str(target)])
        edits.append({'shot': shot['id'], 'start': shot['start'], 'end': shot['end'], 'source': str(source), 'sourceOffset': offset, 'sourceCrop': shot.get('sourceCrop'), 'editorialTitle': title, 'contextLabel': label, 'speedFactor': speed, 'frames': frames, 'file': str(target)})
        print(f'{shot["id"]}: {frames} frames ({"stock" if stock else "demo"})', flush=True)
    (OUT / 'edit.json').write_text(json.dumps(edits, indent=2), encoding='utf8')
    (OUT / 'concat.txt').write_text(''.join(f"file '{e['shot']}.mp4'\n" for e in edits), encoding='utf8')
    final = MEDIA / 'tender-cells-anthem-story-v3.mp4'
    run(['-f', 'concat', '-safe', '0', '-i', 'concat.txt', '-i', str(DOCS / cues['audio']), '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-t', str(cues['durationSec']), '-movflags', '+faststart', str(final)])
    print(final, flush=True)


if __name__ == '__main__':
    main()
