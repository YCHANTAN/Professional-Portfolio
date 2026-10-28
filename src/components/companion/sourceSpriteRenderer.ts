// Offline atlas authoring only; the website consumes the compiled PNGs.
import { CAT_FRAMES, CAT_GAIT_FRAMES, CAT_OPPOSITE } from './spriteFrames';
import { STRIDE_FRAMES, ACTIVITY_FRAMES, ACTIVITY_ANCHORS, HUMAN_OPPOSITE, HUMAN_RUN_OPPOSITE, PAINT_FINISH_FRAMES, PAINT_FINISH_ANCHORS } from './spriteFrames';

// Source rectangles are measured from alpha, rather than assuming perfect AI sheet gutters.
const FRAMES = [
  [65, 10, 131, 224], [284, 10, 134, 224], [505, 10, 133, 224], [736, 10, 142, 224], [954, 10, 142, 224], [1194, 11, 141, 223],
  [71, 244, 134, 232], [292, 243, 135, 233], [513, 243, 136, 233], [738, 244, 137, 232], [968, 243, 140, 234], [1191, 244, 138, 232],
  [30, 487, 190, 210], [256, 488, 185, 209], [484, 488, 194, 209], [726, 486, 174, 211], [946, 486, 184, 210], [1175, 490, 176, 206],
  [66, 706, 136, 214], [280, 707, 144, 213], [502, 706, 145, 214], [730, 707, 140, 213], [932, 707, 166, 213], [1167, 707, 163, 213],
  [50, 928, 160, 197], [274, 928, 151, 197], [500, 929, 167, 197], [713, 936, 163, 191], [958, 928, 127, 208], [1190, 928, 128, 208],
] as const;

type SpriteProps = {
  atlas: HTMLImageElement; strideAtlas: HTMLImageElement | null; oppositeAtlas: HTMLImageElement | null;
  runOppositeAtlas: HTMLImageElement | null; activityAtlas: HTMLImageElement | null;
  paintingFinishAtlas?: HTMLImageElement | null;
  frame: number; facing: number; lookX: number; lookY: number;
};

/** Render a complete authored pose, with one common floor and no cut-up leg rotations. */
export function drawCompanionFrame(context: CanvasRenderingContext2D, props: SpriteProps) {
    const { atlas, strideAtlas, oppositeAtlas, runOppositeAtlas, activityAtlas, paintingFinishAtlas, frame, lookX, lookY } = props;
    const stride = frame >= 30 && frame < 38 && strideAtlas;
    const activity = frame >= 38 && frame < 54 && activityAtlas;
    const finish = frame >= 54 && paintingFinishAtlas;
    const opposite = frame === 32 && oppositeAtlas;
    const oppositeRun = frame === 36 && runOppositeAtlas;
    const [sx, sy, sw, sh] = opposite ? HUMAN_OPPOSITE : oppositeRun ? HUMAN_RUN_OPPOSITE : finish ? PAINT_FINISH_FRAMES[frame - 54] : activity ? ACTIVITY_FRAMES[frame - 38] : stride ? STRIDE_FRAMES[frame - 30] : FRAMES[frame] ?? FRAMES[0];
    const scale = opposite ? 78 / HUMAN_OPPOSITE[3] : oppositeRun ? 73 / HUMAN_RUN_OPPOSITE[3] : finish ? 68 / 524 : activity ? 70 / 274 : stride ? 78 / 398 : 78 / 224;
    const width = Math.round(sw * scale), height = Math.round(sh * scale);
    const source = opposite ? oppositeAtlas : oppositeRun ? runOppositeAtlas : finish ? paintingFinishAtlas : activity ? activityAtlas : stride ? strideAtlas : atlas;
    const painting = activity && frame >= 47 && frame <= 52;
    const dx = finish ? Math.round(46 - (PAINT_FINISH_ANCHORS[frame - 54] - sx) * scale) : activity ? Math.round((painting ? 46 : 48) - (ACTIVITY_ANCHORS[frame - 38] - sx) * scale) : Math.round((96 - width) / 2), dy = 90 - height;
    context.clearRect(0, 0, 96, 96);
    context.imageSmoothingEnabled = false;
    context.drawImage(source, sx, sy, sw, sh, dx, dy, width, height);
    if (!stride && !activity && !finish && (lookX || lookY)) {
      // Articulate the head toward even distant pointers; never displace the feet.
      const headHeight = Math.round(height * .51);
      context.clearRect(0, 0, 96, dy + headHeight);
      context.save();
      context.beginPath(); context.rect(0, 0, 96, dy + headHeight); context.clip();
      context.translate(48 + lookX * 1.5, dy + headHeight + lookY);
      context.rotate(lookX * .055);
      context.drawImage(source, sx, sy, sw, sh, dx - 48, -headHeight, width, height);
      context.restore();
    }
    // Remove almost-transparent fringe from generated alpha; preserve the artwork colors.
    const pixels = context.getImageData(0, 0, 96, 96);
    for (let i = 3; i < pixels.data.length; i += 4) pixels.data[i] = pixels.data[i] < 100 ? 0 : 255;
    context.putImageData(pixels, 0, 0);
}

type CatSprites = { image: HTMLImageElement; gait: HTMLImageElement | null; opposite: HTMLImageElement | null; frame: number; facing: number };

export function drawCatFrame(context: CanvasRenderingContext2D, { image, gait, opposite, frame }: CatSprites) {
    const moving = frame >= 16 && gait;
    const oppositeContact = frame === 18 && opposite;
    const [sx, sy, sw, sh] = oppositeContact ? CAT_OPPOSITE : moving ? CAT_GAIT_FRAMES[frame - 16] : CAT_FRAMES[frame >= 16 ? 12 : frame];
    const scale = oppositeContact ? 60 / CAT_OPPOSITE[3] : moving ? 60 / CAT_GAIT_FRAMES[0][3] : 60 / CAT_FRAMES[0][3];
    const width = Math.round(sw * scale), height = Math.round(sh * scale);
    // Exactly one full clear and one sprite draw: no crossfading sit/walk canvases.
    context.clearRect(0, 0, 96, 96); context.imageSmoothingEnabled = false;
    context.drawImage(oppositeContact ? opposite : moving ? gait : image, sx, sy, sw, sh, Math.round((96 - width) / 2), 90 - height, width, height);
    const pixels = context.getImageData(0, 0, 96, 96);
    for (let i = 3; i < pixels.data.length; i += 4) pixels.data[i] = pixels.data[i] < 100 ? 0 : 255;
    context.putImageData(pixels, 0, 0);
}
