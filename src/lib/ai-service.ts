import OpenAI from "openai";

// Initialize OpenAI client
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// Types for AI service responses
export interface SummarizationResult {
  summary: string;
  keyPoints: string[];
  confidence: number;
}

export interface AutoTitleResult {
  suggestions: string[];
  recommended: string;
  confidence: number;
}

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
}

// Extract text content from TipTap JSON structure
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

    // Add space after block elements
    if (
      node.type &&
      ["paragraph", "heading", "blockquote"].includes(node.type)
    ) {
      text += " ";
    }

    return text;
  }

  return extractText(content).trim();
}

// Generate summary of note content
export async function generateSummary(
  content: unknown,
  title?: string,
): Promise<SummarizationResult> {
  try {
    const text = extractTextFromTipTapContent(content);

    if (!text || text.length < 50) {
      throw new Error("Content too short for summarization");
    }

    const prompt = `
Please analyze the following note content and provide:
1. A concise summary (2-3 sentences)
2. Key points (3-5 bullet points)
3. Your confidence level (0-1)

${title ? `Title: ${title}\n` : ""}
Content: ${text}

Respond with valid JSON in this format:
{
  "summary": "Brief summary here",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "confidence": 0.85
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an expert at analyzing and summarizing text content. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("No response from AI service");
    }

    try {
      const result = JSON.parse(response);
      return {
        summary: result.summary || "Summary not available",
        keyPoints: result.keyPoints || [],
        confidence: result.confidence || 0.5,
      };
    } catch {
      // Fallback parsing if JSON is malformed
      const summaryMatch = response.match(/"summary":\s*"([^"]+)"/);
      const summary = summaryMatch ? summaryMatch[1] : "Summary not available";

      return {
        summary,
        keyPoints: ["Summary generated but details unavailable"],
        confidence: 0.3,
      };
    }
  } catch (error) {
    console.error("Error generating summary:", error);
    throw new Error("Failed to generate summary");
  }
}

// Generate title suggestions
export async function generateAutoTitle(
  content: unknown,
): Promise<AutoTitleResult> {
  try {
    const text = extractTextFromTipTapContent(content);

    if (!text || text.length < 20) {
      throw new Error("Content too short for title generation");
    }

    // Use first 500 characters for title generation
    const truncatedText = text.substring(0, 500);

    const prompt = `
Based on the following note content, suggest 3-5 potential titles that are:
- Concise (under 60 characters)
- Descriptive of the main topic
- Engaging and clear

Content: ${truncatedText}

Respond with valid JSON in this format:
{
  "suggestions": ["Title 1", "Title 2", "Title 3"],
  "recommended": "Title 1",
  "confidence": 0.85
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an expert at creating compelling, concise titles for notes and articles. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 300,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("No response from AI service");
    }

    try {
      const result = JSON.parse(response);
      return {
        suggestions: result.suggestions || ["Untitled Note"],
        recommended:
          result.recommended || result.suggestions?.[0] || "Untitled Note",
        confidence: result.confidence || 0.5,
      };
    } catch {
      // Fallback if JSON parsing fails
      return {
        suggestions: ["Untitled Note"],
        recommended: "Untitled Note",
        confidence: 0.1,
      };
    }
  } catch (error) {
    console.error("Error generating title:", error);
    throw new Error("Failed to generate title suggestions");
  }
}

// Generate embeddings for semantic search
export async function generateEmbedding(
  text: string,
): Promise<EmbeddingResult> {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error("No text provided for embedding generation");
    }

    // Truncate text if too long (OpenAI has token limits)
    const truncatedText = text.substring(0, 8000);

    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: truncatedText,
    });

    const embedding = response.data[0]?.embedding;
    if (!embedding) {
      throw new Error("No embedding returned from AI service");
    }

    return {
      embedding,
      tokens: response.usage?.total_tokens || 0,
    };
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error("Failed to generate embedding");
  }
}

// Calculate cosine similarity between two embeddings
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Embedding dimensions must match");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

// Search notes by semantic similarity
export async function semanticSearch(
  query: string,
  noteEmbeddings: {
    id: string;
    embedding: number[];
    title?: string;
    content?: unknown;
  }[],
  threshold: number = 0.7,
): Promise<{ id: string; similarity: number; title?: string }[]> {
  try {
    // Generate embedding for the search query
    const queryEmbeddingResult = await generateEmbedding(query);
    const queryEmbedding = queryEmbeddingResult.embedding;

    // Calculate similarities
    const results = noteEmbeddings
      .map((note) => ({
        id: note.id,
        title: note.title,
        similarity: cosineSimilarity(queryEmbedding, note.embedding),
      }))
      .filter((result) => result.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity);

    return results;
  } catch (error) {
    console.error("Error performing semantic search:", error);
    throw new Error("Failed to perform semantic search");
  }
}

// Batch process notes for embedding generation
export async function processNotesForEmbeddings(
  notes: { id: string; title?: string; content: unknown }[],
): Promise<{ id: string; embedding: number[]; error?: string }[]> {
  const results = [];

  for (const note of notes) {
    try {
      const text = extractTextFromTipTapContent(note.content);
      const fullText = `${note.title || ""} ${text}`.trim();

      if (fullText.length < 10) {
        results.push({
          id: note.id,
          embedding: [],
          error: "Content too short",
        });
        continue;
      }

      const embeddingResult = await generateEmbedding(fullText);
      results.push({
        id: note.id,
        embedding: embeddingResult.embedding,
      });

      // Add a small delay to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error processing note ${note.id}:`, error);
      results.push({
        id: note.id,
        embedding: [],
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}
