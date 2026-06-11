/*
 * Stub for browser/PDF-only packages that forgesteel's `utils.ts` imports at the
 * top level (showdown, modern-screenshot, html2canvas, jspdf). None of their
 * functionality is exercised while we construct the static rules data, so we
 * alias all of them to this no-op module (see tsconfig.extract.json `paths`).
 */

// showdown
export class Converter {
	makeHtml(text: string): string {
		return text;
	}
}

// modern-screenshot
export const domToImage = async (): Promise<string> => '';
export const domToPng = async (): Promise<string> => '';

// html2canvas / jspdf (default imports)
export default function stub(): unknown {
	return {};
}
