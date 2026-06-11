import MarkdownIt from 'markdown-it';

// The forgesteel content is GitHub-flavoured markdown (bold, lists, tables) and
// occasionally embeds raw inline HTML such as <code>A &lt; 0</code>. forgesteel
// itself renders with showdown configured `{ simpleLineBreaks: true, tables: true }`,
// which passes HTML through, so we enable `html: true` to match (the data is
// trusted, first-party content). `breaks: true` mirrors showdown's simpleLineBreaks.
const md = new MarkdownIt({
	html: true,
	linkify: true,
	typographer: true,
	breaks: true
});

// forgesteel authors some markdown tables with a non-standard delimiter row that
// uses '=' (and ':') instead of '-', e.g. `|:============|:========|`. markdown-it
// (CommonMark/GFM) only recognises '-' delimiters, so such tables fall back to
// plain text with literal pipes. Normalise those delimiter rows to dashes.
// A delimiter row is a line made up solely of pipes, colons, equals, dashes and
// whitespace — and must contain at least one pipe and one equals to qualify.
function normalizeTableDelimiters(text: string): string {
	return text
		.split('\n')
		.map(line =>
			/^[\s|:=-]+$/.test(line) && line.includes('|') && line.includes('=')
				? line.replace(/=/g, '-')
				: line
		)
		.join('\n');
}

/** Render a markdown block to HTML. */
export function renderMarkdown(text: string | null | undefined): string {
	if (!text) return '';
	return md.render(normalizeTableDelimiters(String(text).trim()));
}

/** Render markdown without the wrapping <p> (for inline contexts). */
export function renderInline(text: string | null | undefined): string {
	if (!text) return '';
	return md.renderInline(String(text).trim());
}
