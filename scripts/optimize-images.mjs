// 포스트 이미지를 URL은 그대로 두고 용량만 줄인다.
// 사용법: node scripts/optimize-images.mjs [디렉터리]
import { readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// 본문 폭 680px의 2배 밀도 화면까지 선명하게 보이는 크기다.
const MAX_WIDTH = 1400;
const WEBP_QUALITY = 80;
// 화면 녹화 GIF는 원본 폭이 3000px에 달해 크기를 함께 줄여야 webp가 더 작아진다.
const ANIMATED_MAX_WIDTH = 1000;
const ANIMATED_WEBP_QUALITY = 60;
const LARGE_GIF_BYTES = 1024 * 1024;

const targetDir = process.argv[2] ?? "public/images";

sharp.cache(false);

/** 재인코딩 손실을 피하려고 기준 폭을 넘는 정지 이미지만 처리한다. */
async function resizeWideWebp(file) {
  const { width, pages = 1 } = await sharp(file).metadata();
  if (pages > 1 || width <= MAX_WIDTH) return null;

  const resized = await sharp(file)
    .resize({ width: MAX_WIDTH })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
  return { outputFile: file, buffer: resized };
}

async function convertLargeGif(file) {
  const { size } = await stat(file);
  if (size <= LARGE_GIF_BYTES) return null;

  // GIF는 모든 프레임의 픽셀을 합산하므로 기본 제한을 넘는다. 저장소 안의 파일만 다룬다.
  const converted = await sharp(file, { animated: true, limitInputPixels: false })
    .resize({ width: ANIMATED_MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: ANIMATED_WEBP_QUALITY })
    .toBuffer();
  return { outputFile: file.replace(/\.gif$/, ".webp"), buffer: converted };
}

const OPTIMIZERS = { ".webp": resizeWideWebp, ".gif": convertLargeGif };

const entries = await readdir(targetDir, { recursive: true, withFileTypes: true });
const files = entries
  .filter((entry) => entry.isFile() && path.extname(entry.name) in OPTIMIZERS)
  .map((entry) => path.join(entry.parentPath, entry.name));

let savedBytes = 0;

for (const file of files) {
  const result = await OPTIMIZERS[path.extname(file)](file);
  if (!result) continue;

  const { size } = await stat(file);
  if (result.buffer.length >= size) continue;

  await writeFile(result.outputFile, result.buffer);
  savedBytes += size - result.buffer.length;

  if (result.outputFile !== file) {
    await rm(file);
    console.log(`${file} → ${result.outputFile} (본문의 이미지 경로도 바꿔 주세요)`);
  }
}

console.log(`절약한 용량: ${(savedBytes / 1024 / 1024).toFixed(1)}MB`);
