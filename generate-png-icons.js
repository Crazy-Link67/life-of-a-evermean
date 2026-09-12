import fs from 'fs';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcPayload = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcPayload);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generateEvermeanPNG(size, outputPath) {
  const width = size;
  const height = size;

  // Raw uncompressed scanlines: each row has 1 filter byte (0) + width * 4 bytes RGBA
  const rawRowLength = 1 + width * 4;
  const rawData = Buffer.alloc(rawRowLength * height);

  const cx = width / 2;
  const cy = height / 2;
  const rMax = width * 0.46;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rawRowLength;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default cosmic dark background with rounded corners
      let r = 18, g = 14, b = 35, a = 255;

      if (dist > rMax) {
        // Transparent outside circular badge
        a = 0;
      } else if (dist > rMax - 4) {
        // Glowing purple border
        r = 168; g = 85; b = 247;
      } else {
        // Tree Canopy (top center)
        const canopyDist = Math.hypot(x - cx, y - (height * 0.3));
        const trunkDistX = Math.abs(x - cx);

        if (canopyDist < width * 0.22) {
          // Lush Cosmic Violet / Magenta Foliage
          r = 192; g = 132; b = 252;
        } else if (y >= height * 0.35 && y <= height * 0.72 && trunkDistX < width * 0.09) {
          // Gnarled Wooden Tree Trunk
          r = 107; g = 76; b = 53;
          if (trunkDistX < width * 0.02) {
            // Glowing cyan sap line
            r = 56; g = 189; b = 248;
          }
        } else if (y > height * 0.65 && y < height * 0.92) {
          // Pointy Root Legs angling down to ground
          const legSlope1 = Math.abs((x - (cx - width * 0.15)) - (y - height * 0.65) * 0.4);
          const legSlope2 = Math.abs((x - (cx + width * 0.15)) + (y - height * 0.65) * 0.4);
          if (legSlope1 < width * 0.04 || legSlope2 < width * 0.04) {
            r = 92; g = 64; b = 45;
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // color type RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  const pngBuffer = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
  fs.writeFileSync(outputPath, pngBuffer);
  console.log(`Created ${outputPath} (${size}x${size})`);
}

generateEvermeanPNG(192, 'public/icon-192.png');
generateEvermeanPNG(512, 'public/icon-512.png');

