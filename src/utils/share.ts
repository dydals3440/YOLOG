export type SharePlatform = "twitter" | "facebook" | "linkedin" | "native";

export interface ShareUrls {
	twitter: string;
	facebook: string;
	linkedin: string;
}

/**
 * 각 플랫폼별 공유 URL을 생성합니다
 */
export const createShareUrls = (title: string, url: string): ShareUrls => {
	const encodedTitle = encodeURIComponent(title);
	const encodedUrl = encodeURIComponent(url);

	return {
		twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
		facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
		linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}`,
	};
};

/**
 * 네이티브 공유 API를 사용하여 공유합니다
 */
export const shareNative = async (title: string, url: string): Promise<void> => {
	if (!("share" in navigator)) {
		throw new Error("Native share API is not supported");
	}

	try {
		await navigator.share({ title, url });
	} catch (err) {
		if ((err as Error).name !== "AbortError") {
			console.error("Share failed:", err);
			throw err;
		}
	}
};

/**
 * URL을 클립보드에 복사합니다
 */
export const copyToClipboard = async (text: string): Promise<void> => {
	if (!navigator.clipboard) {
		throw new Error("Clipboard API is not supported in this browser");
	}

	try {
		await navigator.clipboard.writeText(text);
	} catch (error) {
		// 권한 거부 또는 기타 에러 발생 시 재throw
		throw new Error(
			`Failed to copy to clipboard: ${error instanceof Error ? error.message : "Unknown error"}`
		);
	}
};

/**
 * 플랫폼별 공유 창을 엽니다
 */
export const openShareWindow = (
	url: string,
	windowFeatures = "width=600,height=400"
): void => {
	window.open(url, "_blank", windowFeatures);
};