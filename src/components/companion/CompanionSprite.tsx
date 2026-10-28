import { useLayoutEffect, useRef } from 'react';
import { drawCompiledSprite } from './compiledSprite';

type SpriteProps = { atlas: HTMLImageElement; frame: number; facing: number; lookX: number; lookY: number };

export function drawCompanionFrame(context: CanvasRenderingContext2D, { atlas, frame, lookX, lookY }: SpriteProps) {
  drawCompiledSprite(context, atlas, frame, 8);
  if ((lookX || lookY) && frame < 30) {
    const headBottom = frame >= 24 ? 56 : 52;
    context.clearRect(0, 0, 96, headBottom);
    context.save();
    context.beginPath(); context.rect(0, 0, 96, headBottom); context.clip();
    context.translate(48 + lookX * 1.5, headBottom + lookY);
    context.rotate(lookX * .055);
    context.drawImage(atlas, frame % 8 * 96, Math.floor(frame / 8) * 96, 96, 96, -48, -headBottom, 96, 96);
    context.restore();
  }
}

export function CompanionSprite({ atlas, frame, facing, lookX, lookY }: SpriteProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const context = ref.current?.getContext('2d');
    if (context) drawCompanionFrame(context, { atlas, frame, facing, lookX, lookY });
  }, [atlas, frame, facing, lookX, lookY]);
  return <canvas ref={ref} width={96} height={96} className="companion-sprite" style={{ transform: `scaleX(${facing})` }} aria-hidden="true" />;
}
