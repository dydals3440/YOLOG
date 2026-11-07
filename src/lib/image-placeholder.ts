import sharp from "sharp";

const SAMPLE_WIDTH = 32;

/** 이미지가 로드되기 전 보여 줄 대표 색을 고른다. 투명한 이미지는 배경을 칠하지 않는다. */
export async function getPlaceholderColor(image: Buffer) {
  const sample = await sharp(image).resize({ width: SAMPLE_WIDTH }).toBuffer();
  const { isOpaque, dominant } = await sharp(sample).stats();

  return isOpaque ? `rgb(${dominant.r} ${dominant.g} ${dominant.b})` : undefined;
}
