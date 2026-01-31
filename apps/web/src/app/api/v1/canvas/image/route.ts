import { NextRequest, NextResponse } from 'next/server';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLOR_PALETTE } from '@aiplaces/shared';

/**
 * GET /api/v1/canvas/image - Returns the canvas as a PNG image
 *
 * Useful for:
 * - Vision-based AI agents that analyze screenshots
 * - Embedding canvas previews
 * - Quick visual inspection
 *
 * Query params:
 * - scale: Integer multiplier (1-10, default 1). scale=2 returns 1000x1000 image
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const scale = Math.min(10, Math.max(1, parseInt(searchParams.get('scale') || '1')));

    // For now, create a demo canvas (in production, fetch from Redis)
    const colorIndices = new Uint8Array(CANVAS_WIDTH * CANVAS_HEIGHT);
    colorIndices.fill(0); // White background

    // Add demo pixels
    for (let i = 0; i < 1000; i++) {
      const x = Math.floor(Math.random() * CANVAS_WIDTH);
      const y = Math.floor(Math.random() * CANVAS_HEIGHT);
      const color = Math.floor(Math.random() * 16);
      colorIndices[y * CANVAS_WIDTH + x] = color;
    }

    // Convert color palette hex to RGB
    const rgbPalette = Object.values(COLOR_PALETTE).map((hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
    });

    // Create raw pixel data (RGBA)
    const width = CANVAS_WIDTH * scale;
    const height = CANVAS_HEIGHT * scale;
    const pixels = new Uint8Array(width * height * 4);

    for (let y = 0; y < CANVAS_HEIGHT; y++) {
      for (let x = 0; x < CANVAS_WIDTH; x++) {
        const colorIndex = colorIndices[y * CANVAS_WIDTH + x];
        const [r, g, b] = rgbPalette[colorIndex] || [255, 255, 255];

        // Fill scaled pixels
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            const px = x * scale + sx;
            const py = y * scale + sy;
            const offset = (py * width + px) * 4;
            pixels[offset] = r;
            pixels[offset + 1] = g;
            pixels[offset + 2] = b;
            pixels[offset + 3] = 255; // Alpha
          }
        }
      }
    }

    // Create PNG using simple encoding (no external libs needed)
    const png = createSimplePNG(width, height, pixels);

    return new NextResponse(png, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=5', // Cache for 5 seconds
        'X-Canvas-Width': CANVAS_WIDTH.toString(),
        'X-Canvas-Height': CANVAS_HEIGHT.toString(),
        'X-Scale': scale.toString(),
      },
    });
  } catch (error) {
    console.error('Canvas image error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate image' } },
      { status: 500 }
    );
  }
}

/**
 * Creates a simple PNG from raw RGBA pixel data
 * Minimal implementation without external dependencies
 */
function createSimplePNG(width: number, height: number, pixels: Uint8Array): Uint8Array {
  // PNG signature
  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = createIHDRChunk(width, height);

  // IDAT chunk (image data)
  const idat = createIDATChunk(width, height, pixels);

  // IEND chunk
  const iend = createIENDChunk();

  // Combine all chunks
  const png = new Uint8Array(signature.length + ihdr.length + idat.length + iend.length);
  let offset = 0;
  png.set(signature, offset);
  offset += signature.length;
  png.set(ihdr, offset);
  offset += ihdr.length;
  png.set(idat, offset);
  offset += idat.length;
  png.set(iend, offset);

  return png;
}

function createIHDRChunk(width: number, height: number): Uint8Array {
  const data = new Uint8Array(13);
  const view = new DataView(data.buffer);
  view.setUint32(0, width, false);
  view.setUint32(4, height, false);
  data[8] = 8; // Bit depth
  data[9] = 6; // Color type (RGBA)
  data[10] = 0; // Compression
  data[11] = 0; // Filter
  data[12] = 0; // Interlace

  return createChunk('IHDR', data);
}

function createIDATChunk(width: number, height: number, pixels: Uint8Array): Uint8Array {
  // Add filter byte (0 = no filter) to each row
  const rowSize = width * 4 + 1;
  const filtered = new Uint8Array(height * rowSize);

  for (let y = 0; y < height; y++) {
    filtered[y * rowSize] = 0; // Filter type: none
    for (let x = 0; x < width * 4; x++) {
      filtered[y * rowSize + 1 + x] = pixels[y * width * 4 + x];
    }
  }

  // Compress with deflate (using simple store-only compression for simplicity)
  const compressed = deflateStore(filtered);

  return createChunk('IDAT', compressed);
}

function createIENDChunk(): Uint8Array {
  return createChunk('IEND', new Uint8Array(0));
}

function createChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(4 + 4 + data.length + 4);
  const view = new DataView(chunk.buffer);

  // Length
  view.setUint32(0, data.length, false);

  // Type
  for (let i = 0; i < 4; i++) {
    chunk[4 + i] = type.charCodeAt(i);
  }

  // Data
  chunk.set(data, 8);

  // CRC32
  const crcData = new Uint8Array(4 + data.length);
  crcData.set(chunk.subarray(4, 8), 0);
  crcData.set(data, 4);
  view.setUint32(8 + data.length, crc32(crcData), false);

  return chunk;
}

/**
 * Simple deflate store (no actual compression, just wrapping)
 * For a production system, use a proper zlib library
 */
function deflateStore(data: Uint8Array): Uint8Array {
  const maxBlockSize = 65535;
  const numBlocks = Math.ceil(data.length / maxBlockSize);
  const output = new Uint8Array(2 + data.length + numBlocks * 5 + 4);

  let outPos = 0;

  // Zlib header
  output[outPos++] = 0x78; // CMF
  output[outPos++] = 0x01; // FLG

  let remaining = data.length;
  let dataPos = 0;

  while (remaining > 0) {
    const blockSize = Math.min(remaining, maxBlockSize);
    const isLast = remaining <= maxBlockSize;

    output[outPos++] = isLast ? 1 : 0; // BFINAL + BTYPE=00
    output[outPos++] = blockSize & 0xff;
    output[outPos++] = (blockSize >> 8) & 0xff;
    output[outPos++] = ~blockSize & 0xff;
    output[outPos++] = (~blockSize >> 8) & 0xff;

    output.set(data.subarray(dataPos, dataPos + blockSize), outPos);
    outPos += blockSize;
    dataPos += blockSize;
    remaining -= blockSize;
  }

  // Adler-32 checksum
  const adler = adler32(data);
  output[outPos++] = (adler >> 24) & 0xff;
  output[outPos++] = (adler >> 16) & 0xff;
  output[outPos++] = (adler >> 8) & 0xff;
  output[outPos++] = adler & 0xff;

  return output.subarray(0, outPos);
}

function adler32(data: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % 65521;
    b = (b + a) % 65521;
  }
  return (b << 16) | a;
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return crc ^ 0xffffffff;
}
