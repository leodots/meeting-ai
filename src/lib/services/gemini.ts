import { GoogleGenerativeAI } from "@google/generative-ai";
import { Language } from "@prisma/client";
import { getApiKey } from "./settings";
import { AI_MODELS, API_KEYS } from "@/lib/config/models";

export interface Topic {
  title: string;
  description: string;
  importance: number; // 1-5
}

export interface KeyPoint {
  point: string;
  context?: string;
  speakerIndex?: number;
}

export interface ActionItem {
  item: string;
  assignee?: string;
  priority?: "high" | "medium" | "low";
}

export interface SpeakerName {
  speakerIndex: number;
  name: string;
}

export interface AnalysisResult {
  summary: string;
  topics: Topic[];
  keyPoints: KeyPoint[];
  actionItems: ActionItem[];
  speakerNames: SpeakerName[];
  meetingDocument: string;
  rawResponse: object;
}

const languageInstructions: Record<Language, string> = {
  ENGLISH: "English",
  PORTUGUESE_BR: "Portuguese (Brazil)",
  SPANISH: "Spanish",
};

export async function analyzeMeeting(
  transcript: string,
  language: Language,
  customInstructions?: string | null
): Promise<AnalysisResult> {
  const apiKey = await getApiKey(API_KEYS.gemini);
  if (!apiKey) {
    throw new Error(
      "Gemini API key not configured. Please add it in Settings."
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: AI_MODELS.gemini.id });

  const languageInstruction = languageInstructions[language];

  // Build custom instructions section if provided
  const customSection = customInstructions
    ? `
CUSTOM INSTRUCTIONS FROM USER:
${customInstructions}

Please incorporate these instructions into your analysis. Adjust the summary, topics, and key points according to what the user requested.
`
    : "";

  const prompt = `You are an expert meeting analyst. Analyze the following meeting transcript and provide a comprehensive analysis.

IMPORTANT: Respond in ${languageInstruction}.
${customSection}
Provide your response in this exact JSON format (and ONLY this JSON, no other text):
{
  "summary": "A 2-3 paragraph executive summary of the meeting, highlighting the main discussion points and outcomes",
  "topics": [
    {
      "title": "Topic title",
      "description": "Brief description of what was discussed",
      "importance": 1-5 (5 being most important)
    }
  ],
  "keyPoints": [
    {
      "point": "Key insight or decision",
      "context": "Optional context about when/how this came up",
      "speakerIndex": null or speaker number if identifiable
    }
  ],
  "actionItems": [
    {
      "item": "Action item description",
      "assignee": "Person responsible (if mentioned)",
      "priority": "high" | "medium" | "low"
    }
  ],
  "speakerNames": [
    {
      "speakerIndex": 0,
      "name": "Name of the speaker if mentioned"
    }
  ],
  "meetingDocument": "A comprehensive formal document about the meeting. This should be a well-structured document with: an introduction explaining the meeting context and participants, detailed explanations of each topic discussed, key decisions and their rationale, action items with context, and a conclusion. Write it as a professional meeting document that someone who wasn't present could read to fully understand what happened."
}

Guidelines:
- Extract ALL relevant topics discussed - include as many as necessary for complete understanding
- Identify ALL key points and decisions - do not limit the number, include everything important
- List ALL action items mentioned (who needs to do what) - include every actionable task
- Focus on actionable insights and important decisions
- If speakers are identified (e.g., [Speaker 0], [Speaker 1]), try to attribute key points to them
- Be comprehensive and thorough - quality and completeness are more important than brevity
- The meetingDocument should be a formal, well-written document that provides complete context and understanding of the meeting
- IMPORTANT: Try to identify speaker names from the transcript. Look for:
  * Self-introductions: "My name is X", "I'm X", "This is X speaking"
  * Direct mentions: "X, what do you think?", "As X said..."
  * Context clues that reveal who is speaking
  * Only include speakers whose names you can identify with confidence

Meeting Transcript:
${transcript}`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  // Parse JSON from response
  let parsed: AnalysisResult;
  try {
    // Extract JSON from the response (handle potential markdown code blocks)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    const jsonData = JSON.parse(jsonMatch[0]);

    parsed = {
      summary: jsonData.summary || "No summary available.",
      topics: (jsonData.topics || []).map((t: Topic) => ({
        title: t.title || "Untitled Topic",
        description: t.description || "",
        importance: Math.min(5, Math.max(1, t.importance || 3)),
      })),
      keyPoints: (jsonData.keyPoints || []).map((k: KeyPoint) => ({
        point: k.point || "",
        context: k.context || undefined,
        speakerIndex: k.speakerIndex ?? undefined,
      })),
      actionItems: (jsonData.actionItems || []).map((a: ActionItem) => ({
        item: a.item || "",
        assignee: a.assignee || undefined,
        priority: a.priority || "medium",
      })),
      speakerNames: (jsonData.speakerNames || [])
        .filter((s: SpeakerName) => s.name && s.speakerIndex !== undefined)
        .map((s: SpeakerName) => ({
          speakerIndex: s.speakerIndex,
          name: s.name,
        })),
      meetingDocument: jsonData.meetingDocument || "",
      rawResponse: { response: response },
    };
  } catch (parseError) {
    console.error("Failed to parse Gemini response:", parseError);
    // Return a basic response if parsing fails
    parsed = {
      summary: response,
      topics: [],
      keyPoints: [],
      actionItems: [],
      speakerNames: [],
      meetingDocument: "",
      rawResponse: { response: response, parseError: String(parseError) },
    };
  }

  return parsed;
}
