/** All production poses are pre-aligned 96px tiles, with no runtime leg compositing. */
export function drawCompiledSprite(context: CanvasRenderingContext2D, image: HTMLImageElement, frame: number, columns: number) {
  context.clearRect(0, 0, 96, 96);
  context.imageSmoothingEnabled = false;
  context.drawImage(image, frame % columns * 96, Math.floor(frame / columns) * 96, 96, 96, 0, 0, 96, 96);
}
