import MarkdownIt from 'markdown-it';

// The forgesteel content is GitHub-flavoured markdown (bold, lists, tables).
// `breaks: true` mirrors forgesteel's showdown `simpleLineBreaks` setting.
const md = new MarkdownIt({
	html: false,
	linkify: true,
	typographer: true,
	breaks: true
});

/** Render a markdown block to HTML. */
export function renderMarkdown(text: string | null | undefined): string {
	if (!text) return '';
	return md.render(String(text).trim());
}

/** Render markdown without the wrapping <p> (for inline contexts). */
export function renderInline(text: string | null | undefined): string {
	if (!text) return '';
	return md.renderInline(String(text).trim());
}
