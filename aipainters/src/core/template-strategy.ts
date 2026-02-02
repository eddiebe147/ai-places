/**
 * Template Strategy
 *
 * All agents work together to paint a shared template (like a heart).
 * Agents pick unfilled pixels from the template and paint them.
 */

const CANVAS_SIZE = 500;

// Heart shape centered at canvas center
// Uses scanline approach for reliable filling
function generateHeartTemplate(): Set<string> {
  const template = new Set<string>();
  const centerX = 250;
  const centerY = 250;
  const scale = 40; // Heart size multiplier (bigger = bigger heart)

  // Check if point is inside heart using parametric heart equation
  function isInsideHeart(x: number, y: number): boolean {
    // Normalize coordinates relative to center
    const nx = (x - centerX) / scale;
    const ny = (centerY - y) / scale; // Flip y for correct orientation

    // Heart equation: (x^2 + y^2 - 1)^3 - x^2 * y^3 < 0
    const term1 = Math.pow(nx * nx + ny * ny - 1, 3);
    const term2 = nx * nx * ny * ny * ny;
    return term1 - term2 < 0;
  }

  // Scan every pixel in a bounding box and add if inside heart
  const padding = scale * 20; // Bounding box padding
  for (let y = centerY - padding; y <= centerY + padding; y++) {
    for (let x = centerX - padding; x <= centerX + padding; x++) {
      if (x >= 0 && x < CANVAS_SIZE && y >= 0 && y < CANVAS_SIZE) {
        if (isInsideHeart(x, y)) {
          template.add(`${x},${y}`);
        }
      }
    }
  }

  return template;
}

export class TemplateStrategy {
  private template: Set<string>;
  private paintedPixels = new Set<string>();
  private templatePixels: Array<{ x: number; y: number }> = [];

  constructor() {
    this.template = generateHeartTemplate();
    // Convert to array for random access
    for (const key of this.template) {
      const [x, y] = key.split(',').map(Number);
      this.templatePixels.push({ x, y });
    }
    console.log(`Template loaded with ${this.templatePixels.length} pixels`);
  }

  /**
   * Record a pixel we've painted
   */
  addPixel(x: number, y: number) {
    this.paintedPixels.add(`${x},${y}`);
  }

  /**
   * Get the next position to paint from the template
   */
  getNextPosition(rng: () => number): { x: number; y: number; color: number } | null {
    // Find unpainted template pixels
    const unpainted = this.templatePixels.filter(
      pos => !this.paintedPixels.has(`${pos.x},${pos.y}`)
    );

    if (unpainted.length === 0) {
      // Template complete! Restart from beginning
      this.paintedPixels.clear();
      return this.getNextPosition(rng);
    }

    // Pick a random unpainted pixel
    const picked = unpainted[Math.floor(rng() * unpainted.length)];

    // Heart colors: reds and pinks
    const heartColors = [5, 4, 15]; // Red, Pink, Magenta
    const color = heartColors[Math.floor(rng() * heartColors.length)];

    return { x: picked.x, y: picked.y, color };
  }

  /**
   * Check if position is part of template
   */
  isTemplatePosition(x: number, y: number): boolean {
    return this.template.has(`${x},${y}`);
  }

  /**
   * Get progress
   */
  getProgress(): { painted: number; total: number } {
    return {
      painted: this.paintedPixels.size,
      total: this.templatePixels.length,
    };
  }
}

// Shared instance for all agents
export const templateStrategy = new TemplateStrategy();
