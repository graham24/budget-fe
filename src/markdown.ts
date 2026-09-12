// Minimal markdown → HTML for the AI-generated analysis text.
// Handles headings, bullet lists, dividers, bold/italic, and paragraphs.
export function analysisToHtml(markdown: string): string {
  const escaped = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const inline = (text: string) =>
    text
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>");

  const lines = escaped.split("\n");
  const html: string[] = [];
  let listOpen = false;
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${paragraph.map(inline).join("<br>")}</p>`);
      paragraph = [];
    }
  };
  const closeList = () => {
    if (listOpen) {
      html.push("</ul>");
      listOpen = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (!line) {
      flushParagraph();
      closeList();
    } else if (heading) {
      flushParagraph();
      closeList();
      // # → h4, ## → h5, deeper → h6, sized for card scale
      const level = Math.min(heading[1].length + 3, 6);
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
    } else if (/^-{3,}$/.test(line)) {
      flushParagraph();
      closeList();
      html.push("<hr>");
    } else if (line.startsWith("- ")) {
      flushParagraph();
      if (!listOpen) {
        html.push("<ul>");
        listOpen = true;
      }
      html.push(`<li>${inline(line.slice(2))}</li>`);
    } else {
      closeList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  closeList();
  return html.join("\n");
}

// Drops one `#`-headed section (the heading and everything under it, up to
// the next heading at the same or a higher level) from an analysis body.
// Overview renders targets as their own card, so the AI's prose version of
// that section would otherwise repeat it on the same tab with different
// numbers, the prose reads the whole analysis window, the card reads the
// focus month.
export function dropSection(markdown: string, headingPattern: RegExp): string {
  const lines = markdown.split("\n");
  const out: string[] = [];
  let skippingAtLevel: number | null = null;

  for (const line of lines) {
    const heading = line.trim().match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      if (skippingAtLevel !== null && level <= skippingAtLevel) {
        skippingAtLevel = null;
      }
      if (skippingAtLevel === null && headingPattern.test(heading[2].trim())) {
        skippingAtLevel = level;
        continue;
      }
    }
    if (skippingAtLevel === null) out.push(line);
  }

  return out.join("\n").trim();
}
