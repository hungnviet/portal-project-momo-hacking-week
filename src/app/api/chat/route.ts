import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getMemory, getContext, setContext, addMessage } from "@/lib/memory";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { TaskData } from "@/service";
import { convertTicketsToMarkdown } from "@/utils/preprocess_context"


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
});

async function getContextInChat(
  projectDescription: string,
  teamDescription: string,
  tasksTable: TaskData[]
): Promise<string> {
  const tasksTable_modified = await convertTicketsToMarkdown(tasksTable);
  const prompt = `
### Project Context
${projectDescription}

### Team Context
${teamDescription}

### Task Details
${tasksTable_modified}

### Notes for AI Assistant
- Always consider project objectives and deadlines before suggesting actions.
- Use team availability to recommend task assignments.
- Prioritize tasks by **priority** and **due date**.
- If a task is blocked, suggest potential next steps or who to contact.
- Maintain concise, actionable answers (prefer checklists or bullet points when possible).
`;
  return prompt;
}

export async function POST(req: Request) {
  try {
    const {
      sessionId,
      message,
      projectDescription,
      teamDescription,
      tasksTable,
    } = await req.json();

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: "Missing sessionId or message" },
        { status: 400 }
      );
    }

    // 🔑 Check if context is already stored for this session
    let context = getContext(sessionId);

    if (!context) {
      // First request -> require descriptions
      if (!projectDescription || !teamDescription || !tasksTable) {
        return NextResponse.json(
          {
            error:
              "Missing required parameters: projectDescription, teamDescription, tasksTable",
          },
          { status: 400 }
        );
      }

      context = await getContextInChat(
        projectDescription,
        teamDescription,
        tasksTable
      );

      setContext(sessionId, context);
    }

    // Add user message to memory
    addMessage(sessionId, "user", message);

    // Build messages
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: context },
      ...getMemory(sessionId),
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: "gemini-2.0-flash",
      messages,
    });

    const reply = completion.choices[0].message?.content || "";

    // Store assistant reply
    addMessage(sessionId, "assistant", reply);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
