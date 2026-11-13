export interface Size {
  width: number;
  height: number;
}

/** 원본을 늘리지 않고 잘라 낼 수 있는 가장 큰 비율 영역의 크기를 구한다. */
export function getLargestCropSize(source: Size, aspectRatio: number): Size {
  const width = Math.min(source.width, Math.round(source.height * aspectRatio));
  return { width, height: Math.round(width / aspectRatio) };
}
