/**
 * Template Strategy
 *
 * All agents work together to paint a shared template.
 * Agents pick unfilled pixels from the template and paint them.
 *
 * Current template: "MOLTBOLT Joins us!!" text + Galaga invader
 */

const CANVAS_SIZE = 500;

// 5x7 pixel font for uppercase letters, numbers, and punctuation
const PIXEL_FONT: Record<string, number[][]> = {
  'A': [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
  ],
  'B': [
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,0],
  ],
  'C': [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,1],
    [0,1,1,1,0],
  ],
  'D': [
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,0],
  ],
  'E': [
    [1,1,1,1,1],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,1],
  ],
  'F': [
    [1,1,1,1,1],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
  ],
  'G': [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,0],
    [1,0,1,1,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
  ],
  'H': [
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
  ],
  'I': [
    [1,1,1,1,1],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [1,1,1,1,1],
  ],
  'J': [
    [0,0,1,1,1],
    [0,0,0,1,0],
    [0,0,0,1,0],
    [0,0,0,1,0],
    [1,0,0,1,0],
    [1,0,0,1,0],
    [0,1,1,0,0],
  ],
  'K': [
    [1,0,0,0,1],
    [1,0,0,1,0],
    [1,0,1,0,0],
    [1,1,0,0,0],
    [1,0,1,0,0],
    [1,0,0,1,0],
    [1,0,0,0,1],
  ],
  'L': [
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,1],
  ],
  'M': [
    [1,0,0,0,1],
    [1,1,0,1,1],
    [1,0,1,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
  ],
  'N': [
    [1,0,0,0,1],
    [1,1,0,0,1],
    [1,0,1,0,1],
    [1,0,0,1,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
  ],
  'O': [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
  ],
  'P': [
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
  ],
  'Q': [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,1,0,1],
    [1,0,0,1,0],
    [0,1,1,0,1],
  ],
  'R': [
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,0],
    [1,0,1,0,0],
    [1,0,0,1,0],
    [1,0,0,0,1],
  ],
  'S': [
    [0,1,1,1,1],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [0,1,1,1,0],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [1,1,1,1,0],
  ],
  'T': [
    [1,1,1,1,1],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
  ],
  'U': [
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
  ],
  'V': [
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,0,1,0],
    [0,1,0,1,0],
    [0,0,1,0,0],
  ],
  'W': [
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,1,0,1],
    [1,0,1,0,1],
    [1,1,0,1,1],
    [1,0,0,0,1],
  ],
  'X': [
    [1,0,0,0,1],
    [0,1,0,1,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,1,0,1,0],
    [1,0,0,0,1],
  ],
  'Y': [
    [1,0,0,0,1],
    [0,1,0,1,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
  ],
  'Z': [
    [1,1,1,1,1],
    [0,0,0,0,1],
    [0,0,0,1,0],
    [0,0,1,0,0],
    [0,1,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,1],
  ],
  ' ': [
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
  ],
  '!': [
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,0,0,0],
    [0,0,1,0,0],
  ],
  'a': [
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,1,1,1,0],
    [0,0,0,0,1],
    [0,1,1,1,1],
    [1,0,0,0,1],
    [0,1,1,1,1],
  ],
  'e': [
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,1,1,1,1],
    [1,0,0,0,0],
    [0,1,1,1,0],
  ],
  'i': [
    [0,0,1,0,0],
    [0,0,0,0,0],
    [0,1,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,1,1,1,0],
  ],
  'n': [
    [0,0,0,0,0],
    [0,0,0,0,0],
    [1,0,1,1,0],
    [1,1,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
  ],
  'o': [
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
  ],
  's': [
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,1,1,1,1],
    [1,0,0,0,0],
    [0,1,1,1,0],
    [0,0,0,0,1],
    [1,1,1,1,0],
  ],
  'u': [
    [0,0,0,0,0],
    [0,0,0,0,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,1,1],
    [0,1,1,0,1],
  ],
};

// Text to display above the invader
const INVITATION_TEXT = "MOLTBOLT Joins us!!";

/**
 * Render text as pixel coordinates
 */
function renderText(
  text: string,
  startX: number,
  startY: number,
  scale: number = 2
): Array<{ x: number; y: number }> {
  const pixels: Array<{ x: number; y: number }> = [];
  let cursorX = startX;

  for (const char of text) {
    const glyph = PIXEL_FONT[char] || PIXEL_FONT[' '];

    for (let row = 0; row < glyph.length; row++) {
      for (let col = 0; col < glyph[row].length; col++) {
        if (glyph[row][col] === 1) {
          // Scale up each pixel
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              const x = cursorX + col * scale + sx;
              const y = startY + row * scale + sy;
              if (x >= 0 && x < CANVAS_SIZE && y >= 0 && y < CANVAS_SIZE) {
                pixels.push({ x, y });
              }
            }
          }
        }
      }
    }

    // Move cursor for next character (5 pixels wide + 1 spacing, scaled)
    cursorX += 6 * scale;
  }

  return pixels;
}

/**
 * Generate the Galaga-style space invader
 */
function generateInvaderPixels(centerX: number, centerY: number, pixelSize: number): Array<{ x: number; y: number }> {
  const pixels: Array<{ x: number; y: number }> = [];

  // Classic Galaga-style invader pattern (11x8 grid)
  const invaderPattern = [
    [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],  // Antennae
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],  // Antenna stems
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],  // Head top
    [0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0],  // Eyes row
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],  // Body full
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],  // Body with gaps
    [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],  // Legs top
    [0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0],  // Feet
  ];

  const patternHeight = invaderPattern.length;
  const patternWidth = invaderPattern[0].length;

  const startX = centerX - Math.floor((patternWidth * pixelSize) / 2);
  const startY = centerY - Math.floor((patternHeight * pixelSize) / 2);

  for (let row = 0; row < patternHeight; row++) {
    for (let col = 0; col < patternWidth; col++) {
      if (invaderPattern[row][col] === 1) {
        for (let dy = 0; dy < pixelSize; dy++) {
          for (let dx = 0; dx < pixelSize; dx++) {
            const x = startX + col * pixelSize + dx;
            const y = startY + row * pixelSize + dy;
            if (x >= 0 && x < CANVAS_SIZE && y >= 0 && y < CANVAS_SIZE) {
              pixels.push({ x, y });
            }
          }
        }
      }
    }
  }

  return pixels;
}

/**
 * Generate the complete template: text + invader
 */
function generateTemplate(): {
  textPixels: Array<{ x: number; y: number }>;
  invaderPixels: Array<{ x: number; y: number }>;
  allPixels: Set<string>;
} {
  const allPixels = new Set<string>();

  // Invader position and size
  const invaderCenterX = 375;
  const invaderCenterY = 400; // Moved down to make room for text
  const pixelSize = 10; // Slightly smaller to fit better

  // Generate invader
  const invaderPixels = generateInvaderPixels(invaderCenterX, invaderCenterY, pixelSize);

  // Calculate text position (centered above invader)
  const textScale = 2;
  const charWidth = 6 * textScale; // 5px char + 1px spacing, scaled
  const textWidth = INVITATION_TEXT.length * charWidth;
  const textX = invaderCenterX - Math.floor(textWidth / 2);
  const textY = invaderCenterY - 90; // Above the invader

  // Generate text pixels
  const textPixels = renderText(INVITATION_TEXT, textX, textY, textScale);

  // Add all to set
  for (const p of textPixels) {
    allPixels.add(`${p.x},${p.y}`);
  }
  for (const p of invaderPixels) {
    allPixels.add(`${p.x},${p.y}`);
  }

  return { textPixels, invaderPixels, allPixels };
}

export class TemplateStrategy {
  private template: Set<string>;
  private paintedPixels = new Set<string>();
  private templatePixels: Array<{ x: number; y: number; isText: boolean }> = [];

  // Color schemes
  private textColors = [5, 6, 15]; // Red, Orange, Magenta - hot colors for the call to action
  private invaderColors = [9, 10, 11, 1]; // Green, Lime, Cyan, White - arcade aesthetic

  constructor() {
    const { textPixels, invaderPixels, allPixels } = generateTemplate();
    this.template = allPixels;

    // Store with metadata for color selection
    for (const p of textPixels) {
      this.templatePixels.push({ x: p.x, y: p.y, isText: true });
    }
    for (const p of invaderPixels) {
      this.templatePixels.push({ x: p.x, y: p.y, isText: false });
    }

    console.log(`Template loaded: "${INVITATION_TEXT}" (${textPixels.length} pixels) + invader (${invaderPixels.length} pixels) = ${this.templatePixels.length} total`);
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

    // Use appropriate color based on whether it's text or invader
    const colorPalette = picked.isText ? this.textColors : this.invaderColors;
    const color = colorPalette[Math.floor(rng() * colorPalette.length)];

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
