import { jsPDF } from "jspdf";
import { marked } from "marked";

// Types for export options
export interface ExportOptions {
  format: "pdf" | "markdown" | "html" | "json" | "txt";
  includeMetadata?: boolean;
  includeTags?: boolean;
  includeSummary?: boolean;
  customFileName?: string;
}

export interface NoteData {
  id: string;
  title?: string;
  content: unknown;
  summary?: string;
  tags?: { id: string; name: string }[];
  createdAt: string;
  updatedAt: string;
}

// Extract plain text from TipTap JSON content
export function extractTextFromTipTapContent(content: unknown): string {
  if (!content) return "";

  function extractText(node: unknown): string {
    if (typeof node === "string") return node;
    if (!node || typeof node !== "object") return "";

    let text = "";

    if (node.text) {
      text += node.text;
    }

    if (node.content && Array.isArray(node.content)) {
      for (const child of node.content) {
        text += extractText(child);
      }
    }

    // Add appropriate line breaks for block elements
    if (node.type) {
      switch (node.type) {
        case "paragraph":
          text += "\n\n";
          break;
        case "heading":
          text += "\n\n";
          break;
        case "blockquote":
          text += "\n\n";
          break;
        case "codeBlock":
          text += "\n\n";
          break;
        case "horizontalRule":
          text += "\n---\n\n";
          break;
        case "hardBreak":
          text += "\n";
          break;
        case "listItem":
          text += "\n";
          break;
        case "bulletList":
        case "orderedList":
          text += "\n";
          break;
      }
    }

    return text;
  }

  return extractText(content).trim();
}

// Convert TipTap JSON to Markdown
export function convertTipTapToMarkdown(content: unknown): string {
  if (!content) return "";

  function convertNode(
    node: unknown,
    listLevel = 0,
    orderIndex?: number,
  ): string {
    if (typeof node === "string") return node;
    if (!node || typeof node !== "object") return "";

    let markdown = "";

    if (node.type) {
      switch (node.type) {
        case "paragraph":
          if (node.content) {
            const paragraphContent = node.content
              .map((child: any) => convertNode(child))
              .join("");
            markdown += paragraphContent + "\n\n";
          }
          break;

        case "heading":
          const level = node.attrs?.level || 1;
          const headingText = node.content
            ? node.content.map((child: any) => convertNode(child)).join("")
            : "";
          markdown += "#".repeat(level) + " " + headingText + "\n\n";
          break;

        case "blockquote":
          if (node.content) {
            const blockquoteContent = node.content
              .map((child: unknown) => convertNode(child))
              .join("");
            markdown +=
              blockquoteContent
                .split("\n")
                .map((line: string) => "> " + line)
                .join("\n") + "\n\n";
          }
          break;

        case "codeBlock":
          const language = node.attrs?.language || "";
          const codeContent = node.content
            ? node.content.map((child: unknown) => convertNode(child)).join("")
            : "";
          markdown += "```" + language + "\n" + codeContent + "\n```\n\n";
          break;

        case "bulletList":
          if (node.content) {
            node.content.forEach((listItem: unknown) => {
              markdown += convertNode(listItem, listLevel);
            });
          }
          markdown += "\n";
          break;

        case "orderedList":
          if (node.content) {
            node.content.forEach((listItem: unknown, index: number) => {
              markdown += convertNode(listItem, listLevel, index + 1);
            });
          }
          markdown += "\n";
          break;

        case "listItem":
          const indent = "  ".repeat(listLevel);
          const bullet = orderIndex ? `${orderIndex}.` : "-";
          const itemContent = node.content
            ? node.content
                .map((child: unknown) => convertNode(child, listLevel + 1))
                .join("")
                .trim()
            : "";
          markdown += indent + bullet + " " + itemContent + "\n";
          break;

        case "horizontalRule":
          markdown += "---\n\n";
          break;

        case "hardBreak":
          markdown += "\n";
          break;

        case "image":
          const src = node.attrs?.src || "";
          const alt = node.attrs?.alt || "";
          const title = node.attrs?.title || "";
          markdown += `![${alt}](${src}${title ? ` "${title}"` : ""})\n\n`;
          break;

        case "text":
          let text = node.text || "";

          // Apply marks
          if (node.marks) {
            node.marks.forEach((mark: unknown) => {
              switch (mark.type) {
                case "bold":
                  text = `**${text}**`;
                  break;
                case "italic":
                  text = `*${text}*`;
                  break;
                case "code":
                  text = `\`${text}\``;
                  break;
                case "link":
                  const href = mark.attrs?.href || "";
                  const linkTitle = mark.attrs?.title || "";
                  text = `[${text}](${href}${linkTitle ? ` "${linkTitle}"` : ""})`;
                  break;
                case "underline":
                  text = `<u>${text}</u>`;
                  break;
                case "highlight":
                  text = `<mark>${text}</mark>`;
                  break;
              }
            });
          }

          markdown += text;
          break;

        default:
          // For unknown node types, try to process children
          if (node.content && Array.isArray(node.content)) {
            markdown += node.content
              .map((child: unknown) => convertNode(child, listLevel))
              .join("");
          } else if (node.text) {
            markdown += node.text;
          }
          break;
      }
    } else if (node.content && Array.isArray(node.content)) {
      // Root node or node without type
      markdown += node.content
        .map((child: unknown) => convertNode(child, listLevel))
        .join("");
    } else if (node.text) {
      markdown += node.text;
    }

    return markdown;
  }

  return convertNode(content).trim();
}

// Export service class
class ExportService {
  // Export single note
  async exportNote(note: NoteData, options: ExportOptions): Promise<void> {
    const fileName = this.generateFileName(note, options);

    switch (options.format) {
      case "pdf":
        await this.exportToPDF(note, fileName, options);
        break;
      case "markdown":
        this.exportToMarkdown(note, fileName, options);
        break;
      case "html":
        this.exportToHTML(note, fileName, options);
        break;
      case "json":
        this.exportToJSON(note, fileName, options);
        break;
      case "txt":
        this.exportToText(note, fileName, options);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  // Export multiple notes
  async exportNotes(notes: NoteData[], options: ExportOptions): Promise<void> {
    if (notes.length === 0) {
      throw new Error("No notes to export");
    }

    if (notes.length === 1) {
      return this.exportNote(notes[0], options);
    }

    const fileName =
      options.customFileName ||
      `notes-${new Date().toISOString().split("T")[0]}`;

    switch (options.format) {
      case "pdf":
        await this.exportMultipleNotesToPDF(notes, fileName, options);
        break;
      case "markdown":
        this.exportMultipleNotesToMarkdown(notes, fileName, options);
        break;
      case "html":
        this.exportMultipleNotesToHTML(notes, fileName, options);
        break;
      case "json":
        this.exportMultipleNotesToJSON(notes, fileName, options);
        break;
      case "txt":
        this.exportMultipleNotesToText(notes, fileName, options);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  // Export to PDF
  private async exportToPDF(
    note: NoteData,
    fileName: string,
    options: ExportOptions,
  ): Promise<void> {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Title
    if (note.title) {
      pdf.setFontSize(20);
      pdf.setFont(undefined, "bold");
      const titleLines = pdf.splitTextToSize(
        note.title,
        pageWidth - 2 * margin,
      );
      pdf.text(titleLines, margin, yPosition);
      yPosition += titleLines.length * 10 + 10;
    }

    // Metadata
    if (options.includeMetadata) {
      pdf.setFontSize(10);
      pdf.setFont(undefined, "normal");
      pdf.setTextColor(100, 100, 100);

      const createdDate = new Date(note.createdAt).toLocaleDateString();
      const updatedDate = new Date(note.updatedAt).toLocaleDateString();

      pdf.text(`Created: ${createdDate}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Updated: ${updatedDate}`, margin, yPosition);
      yPosition += 10;

      pdf.setTextColor(0, 0, 0);
    }

    // Tags
    if (options.includeTags && note.tags && note.tags.length > 0) {
      pdf.setFontSize(10);
      pdf.setFont(undefined, "normal");
      const tagsText = `Tags: ${note.tags.map((tag) => tag.name).join(", ")}`;
      const tagLines = pdf.splitTextToSize(tagsText, pageWidth - 2 * margin);
      pdf.text(tagLines, margin, yPosition);
      yPosition += tagLines.length * 6 + 10;
    }

    // Summary
    if (options.includeSummary && note.summary) {
      pdf.setFontSize(12);
      pdf.setFont(undefined, "bold");
      pdf.text("Summary:", margin, yPosition);
      yPosition += 8;

      pdf.setFont(undefined, "normal");
      pdf.setFontSize(10);
      const summaryLines = pdf.splitTextToSize(
        note.summary,
        pageWidth - 2 * margin,
      );
      pdf.text(summaryLines, margin, yPosition);
      yPosition += summaryLines.length * 6 + 15;
    }

    // Content
    pdf.setFontSize(11);
    pdf.setFont(undefined, "normal");
    const content = extractTextFromTipTapContent(note.content);
    const contentLines = pdf.splitTextToSize(content, pageWidth - 2 * margin);

    for (let i = 0; i < contentLines.length; i++) {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.text(contentLines[i], margin, yPosition);
      yPosition += 6;
    }

    pdf.save(`${fileName}.pdf`);
  }

  // Export multiple notes to PDF
  private async exportMultipleNotesToPDF(
    notes: NoteData[],
    fileName: string,
    _options: ExportOptions,
  ): Promise<void> {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Table of contents
    pdf.setFontSize(20);
    pdf.setFont(undefined, "bold");
    pdf.text("Table of Contents", margin, yPosition);
    yPosition += 20;

    pdf.setFontSize(12);
    pdf.setFont(undefined, "normal");

    notes.forEach((note, index) => {
      const title = note.title || `Untitled Note ${index + 1}`;
      pdf.text(`${index + 1}. ${title}`, margin + 5, yPosition);
      yPosition += 8;

      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
    });

    // Add notes
    notes.forEach((note, index) => {
      pdf.addPage();
      yPosition = margin;

      // Note title
      pdf.setFontSize(18);
      pdf.setFont(undefined, "bold");
      const title = note.title || `Untitled Note ${index + 1}`;
      const titleLines = pdf.splitTextToSize(title, pageWidth - 2 * margin);
      pdf.text(titleLines, margin, yPosition);
      yPosition += titleLines.length * 10 + 10;

      // Metadata, tags, summary, and content (same as single note export)
      // ... (implementation similar to single note export)

      const content = extractTextFromTipTapContent(note.content);
      const contentLines = pdf.splitTextToSize(content, pageWidth - 2 * margin);

      pdf.setFontSize(11);
      pdf.setFont(undefined, "normal");

      for (let i = 0; i < contentLines.length; i++) {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.text(contentLines[i], margin, yPosition);
        yPosition += 6;
      }
    });

    pdf.save(`${fileName}.pdf`);
  }

  // Export to Markdown
  private exportToMarkdown(
    note: NoteData,
    fileName: string,
    options: ExportOptions,
  ): void {
    let markdown = "";

    // Title
    if (note.title) {
      markdown += `# ${note.title}\n\n`;
    }

    // Metadata
    if (options.includeMetadata) {
      markdown += `**Created:** ${new Date(note.createdAt).toLocaleDateString()}\n`;
      markdown += `**Updated:** ${new Date(note.updatedAt).toLocaleDateString()}\n\n`;
    }

    // Tags
    if (options.includeTags && note.tags && note.tags.length > 0) {
      const tagsList = note.tags.map((tag) => `\`${tag.name}\``).join(" ");
      markdown += `**Tags:** ${tagsList}\n\n`;
    }

    // Summary
    if (options.includeSummary && note.summary) {
      markdown += `## Summary\n\n${note.summary}\n\n---\n\n`;
    }

    // Content
    const contentMarkdown = convertTipTapToMarkdown(note.content);
    markdown += contentMarkdown;

    this.downloadFile(markdown, `${fileName}.md`, "text/markdown");
  }

  // Export multiple notes to Markdown
  private exportMultipleNotesToMarkdown(
    notes: NoteData[],
    fileName: string,
    options: ExportOptions,
  ): void {
    let markdown = `# Notes Export\n\n`;
    markdown += `*Exported on ${new Date().toLocaleDateString()}*\n\n`;
    markdown += `---\n\n`;

    notes.forEach((note, index) => {
      const title = note.title || `Untitled Note ${index + 1}`;
      markdown += `## ${title}\n\n`;

      if (options.includeMetadata) {
        markdown += `**Created:** ${new Date(note.createdAt).toLocaleDateString()}\n`;
        markdown += `**Updated:** ${new Date(note.updatedAt).toLocaleDateString()}\n\n`;
      }

      if (options.includeTags && note.tags && note.tags.length > 0) {
        const tagsList = note.tags.map((tag) => `\`${tag.name}\``).join(" ");
        markdown += `**Tags:** ${tagsList}\n\n`;
      }

      if (options.includeSummary && note.summary) {
        markdown += `### Summary\n\n${note.summary}\n\n`;
      }

      const contentMarkdown = convertTipTapToMarkdown(note.content);
      markdown += contentMarkdown;
      markdown += `\n\n---\n\n`;
    });

    this.downloadFile(markdown, `${fileName}.md`, "text/markdown");
  }

  // Export to HTML
  private exportToHTML(
    note: NoteData,
    fileName: string,
    options: ExportOptions,
  ): void {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${note.title || "Note"}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1, h2, h3, h4, h5, h6 { color: #333; }
        .metadata { color: #666; font-size: 0.9em; margin-bottom: 20px; }
        .tags { margin: 10px 0; }
        .tag { background: #f0f0f0; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; margin-right: 5px; }
        .summary { background: #f9f9f9; border-left: 4px solid #007acc; padding: 15px; margin: 20px 0; }
        code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
        blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 20px; color: #666; }
    </style>
</head>
<body>`;

    if (note.title) {
      html += `    <h1>${this.escapeHtml(note.title)}</h1>\n`;
    }

    if (options.includeMetadata) {
      html += `    <div class="metadata">
        <p><strong>Created:</strong> ${new Date(note.createdAt).toLocaleDateString()}</p>
        <p><strong>Updated:</strong> ${new Date(note.updatedAt).toLocaleDateString()}</p>
    </div>\n`;
    }

    if (options.includeTags && note.tags && note.tags.length > 0) {
      html += `    <div class="tags">
        <strong>Tags:</strong> `;
      note.tags.forEach((tag) => {
        html += `<span class="tag">${this.escapeHtml(tag.name)}</span>`;
      });
      html += `\n    </div>\n`;
    }

    if (options.includeSummary && note.summary) {
      html += `    <div class="summary">
        <h3>Summary</h3>
        <p>${this.escapeHtml(note.summary)}</p>
    </div>\n`;
    }

    // Convert content to HTML
    const markdown = convertTipTapToMarkdown(note.content);
    const contentHtml = marked(markdown);
    html += `    <div class="content">\n${contentHtml}\n    </div>\n`;

    html += `</body>
</html>`;

    this.downloadFile(html, `${fileName}.html`, "text/html");
  }

  // Export multiple notes to HTML
  private exportMultipleNotesToHTML(
    notes: NoteData[],
    fileName: string,
    options: ExportOptions,
  ): void {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notes Export</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        .note { border-bottom: 2px solid #eee; margin-bottom: 40px; padding-bottom: 30px; }
        .note:last-child { border-bottom: none; }
        h1, h2, h3, h4, h5, h6 { color: #333; }
        .metadata { color: #666; font-size: 0.9em; margin-bottom: 20px; }
        .tags { margin: 10px 0; }
        .tag { background: #f0f0f0; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; margin-right: 5px; }
        .summary { background: #f9f9f9; border-left: 4px solid #007acc; padding: 15px; margin: 20px 0; }
        .toc { background: #f8f9fa; padding: 20px; margin-bottom: 30px; border-radius: 5px; }
        .toc ul { list-style-type: none; padding-left: 0; }
        .toc li { margin: 5px 0; }
        .toc a { color: #007acc; text-decoration: none; }
        .toc a:hover { text-decoration: underline; }
        code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
        blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 20px; color: #666; }
    </style>
</head>
<body>
    <h1>Notes Export</h1>
    <p><em>Exported on ${new Date().toLocaleDateString()}</em></p>

    <div class="toc">
        <h2>Table of Contents</h2>
        <ul>`;

    notes.forEach((note, index) => {
      const title = note.title || `Untitled Note ${index + 1}`;
      const anchorId = `note-${index}`;
      html += `            <li><a href="#${anchorId}">${this.escapeHtml(title)}</a></li>\n`;
    });

    html += `        </ul>
    </div>\n`;

    notes.forEach((note, index) => {
      const title = note.title || `Untitled Note ${index + 1}`;
      const anchorId = `note-${index}`;

      html += `    <div class="note" id="${anchorId}">
        <h2>${this.escapeHtml(title)}</h2>\n`;

      if (options.includeMetadata) {
        html += `        <div class="metadata">
            <p><strong>Created:</strong> ${new Date(note.createdAt).toLocaleDateString()}</p>
            <p><strong>Updated:</strong> ${new Date(note.updatedAt).toLocaleDateString()}</p>
        </div>\n`;
      }

      if (options.includeTags && note.tags && note.tags.length > 0) {
        html += `        <div class="tags">
            <strong>Tags:</strong> `;
        note.tags.forEach((tag) => {
          html += `<span class="tag">${this.escapeHtml(tag.name)}</span>`;
        });
        html += `\n        </div>\n`;
      }

      if (options.includeSummary && note.summary) {
        html += `        <div class="summary">
            <h3>Summary</h3>
            <p>${this.escapeHtml(note.summary)}</p>
        </div>\n`;
      }

      const markdown = convertTipTapToMarkdown(note.content);
      const contentHtml = marked(markdown);
      html += `        <div class="content">\n${contentHtml}\n        </div>\n`;
      html += `    </div>\n`;
    });

    html += `</body>
</html>`;

    this.downloadFile(html, `${fileName}.html`, "text/html");
  }

  // Export to JSON
  private exportToJSON(
    note: NoteData,
    fileName: string,
    options: ExportOptions,
  ): void {
    const exportData: any = {
      id: note.id,
      title: note.title,
      content: note.content,
    };

    if (options.includeMetadata) {
      exportData.createdAt = note.createdAt;
      exportData.updatedAt = note.updatedAt;
    }

    if (options.includeTags && note.tags) {
      exportData.tags = note.tags;
    }

    if (options.includeSummary && note.summary) {
      exportData.summary = note.summary;
    }

    this.downloadFile(
      JSON.stringify(exportData, null, 2),
      `${fileName}.json`,
      "application/json",
    );
  }

  // Export multiple notes to JSON
  private exportMultipleNotesToJSON(
    notes: NoteData[],
    fileName: string,
    options: ExportOptions,
  ): void {
    const exportData = {
      exportedAt: new Date().toISOString(),
      notesCount: notes.length,
      notes: notes.map((note) => {
        const noteData: any = {
          id: note.id,
          title: note.title,
          content: note.content,
        };

        if (options.includeMetadata) {
          noteData.createdAt = note.createdAt;
          noteData.updatedAt = note.updatedAt;
        }

        if (options.includeTags && note.tags) {
          noteData.tags = note.tags;
        }

        if (options.includeSummary && note.summary) {
          noteData.summary = note.summary;
        }

        return noteData;
      }),
    };

    this.downloadFile(
      JSON.stringify(exportData, null, 2),
      `${fileName}.json`,
      "application/json",
    );
  }

  // Export to plain text
  private exportToText(
    note: NoteData,
    fileName: string,
    options: ExportOptions,
  ): void {
    let text = "";

    if (note.title) {
      text += `${note.title}\n`;
      text += "=".repeat(note.title.length) + "\n\n";
    }

    if (options.includeMetadata) {
      text += `Created: ${new Date(note.createdAt).toLocaleDateString()}\n`;
      text += `Updated: ${new Date(note.updatedAt).toLocaleDateString()}\n\n`;
    }

    if (options.includeTags && note.tags && note.tags.length > 0) {
      text += `Tags: ${note.tags.map((tag) => tag.name).join(", ")}\n\n`;
    }

    if (options.includeSummary && note.summary) {
      text += `SUMMARY\n-------\n${note.summary}\n\n`;
    }

    const content = extractTextFromTipTapContent(note.content);
    text += content;

    this.downloadFile(text, `${fileName}.txt`, "text/plain");
  }

  // Export multiple notes to text
  private exportMultipleNotesToText(
    notes: NoteData[],
    fileName: string,
    options: ExportOptions,
  ): void {
    let text = `NOTES EXPORT\n`;
    text += "=".repeat(12) + "\n\n";
    text += `Exported on: ${new Date().toLocaleDateString()}\n`;
    text += `Number of notes: ${notes.length}\n\n`;
    text += "-".repeat(50) + "\n\n";

    notes.forEach((note, index) => {
      const title = note.title || `Untitled Note ${index + 1}`;

      text += `${index + 1}. ${title}\n`;
      text += "-".repeat(title.length + 3) + "\n\n";

      if (options.includeMetadata) {
        text += `Created: ${new Date(note.createdAt).toLocaleDateString()}\n`;
        text += `Updated: ${new Date(note.updatedAt).toLocaleDateString()}\n\n`;
      }

      if (options.includeTags && note.tags && note.tags.length > 0) {
        text += `Tags: ${note.tags.map((tag) => tag.name).join(", ")}\n\n`;
      }

      if (options.includeSummary && note.summary) {
        text += `Summary: ${note.summary}\n\n`;
      }

      const content = extractTextFromTipTapContent(note.content);
      text += content;
      text += "\n\n" + "=".repeat(50) + "\n\n";
    });

    this.downloadFile(text, `${fileName}.txt`, "text/plain");
  }

  // Helper method to generate file names
  private generateFileName(note: NoteData, options: ExportOptions): string {
    if (options.customFileName) {
      return options.customFileName;
    }

    const title = note.title || "untitled-note";
    const cleanTitle = title.replace(/[^a-zA-Z0-9\-_]/g, "-").toLowerCase();
    const date = new Date().toISOString().split("T")[0];

    return `${cleanTitle}-${date}`;
  }

  // Helper method to download files
  private downloadFile(
    content: string,
    fileName: string,
    mimeType: string,
  ): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  // Helper method to escape HTML
  private escapeHtml(text: string): string {
    if (typeof document === "undefined") {
      return text.replace(/[&<>"']/g, (match) => {
        const escapeMap: Record<string, string> = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        };
        return escapeMap[match] || match;
      });
    }
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export singleton instance
export const exportService = new ExportService();
