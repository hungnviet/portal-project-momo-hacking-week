import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getMemory, addMessage } from "@/lib/memory";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import {TaskData} from "@/service"
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getContextInChat(projectDescription: String, teamDescription: String, tasksTable: TaskData[]) : Promise<string>{
  
  
  return "";
}

export async function POST(req: Request) {
  try {
    // const { sessionId, message, teamId, projectId } = await req.json();
    const { sessionId, message, projectDescription, teamDescription, tasksTable } = await req.json();
    if (!sessionId || !message) {
      return NextResponse.json({ error: "Missing sessionId or message" }, { status: 400 });
    }

    if (!projectDescription || !teamDescription || !tasksTable) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: projectDescription, teamDescription, tasksTable' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 1. Get memory & add user message
    const memory = getMemory(sessionId);
    addMessage(sessionId, "user", message);

    // 2. Get project/team/task context
    const context = await getContextInChat(projectDescription, teamDescription, tasksTable);
    // 3. Build messages array with context included as system message
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: context },
      ...memory,
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: "gemini-2.0-flash",
      messages,
    });


    const reply = completion.choices[0].message?.content || "";

    // 5. Store assistant reply
    addMessage(sessionId, "assistant", reply);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
