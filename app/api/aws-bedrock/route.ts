import { NextResponse } from "next/server";
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";
import { randomUUID } from "crypto"; // Node's crypto module

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, sessionId } = body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "No se ha envíado ningún mensaje" },
        { status: 400 }
      );
    }

    // Extract the latest user message
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage.role !== "user" || !lastUserMessage.content) {
      return NextResponse.json(
        { error: "The last message must be a user message with content." },
        { status: 400 }
      );
    }
    const inputText = lastUserMessage.content;

    // Agent details
    const agentId = process.env.BEDROCK_AGENT_ID;
    const agentAliasId = process.env.BEDROCK_AGENT_ALIAS_ID;

    // Generate a sessionId if one is not provided
    const effectiveSessionId = sessionId || randomUUID();

    const client = new BedrockAgentRuntimeClient({ region: "us-east-1" });

    const command = new InvokeAgentCommand({
      agentId,
      agentAliasId,
      sessionId: effectiveSessionId,
      inputText,
    });

    const response = await client.send(command);

    let completion = "";
    const decoder = new TextDecoder("utf-8");
    if (!response.completion) {
      return NextResponse.json(
        { error: "No completion data received from the agent." },
        { status: 500 }
      );
    }
    for await (const chunk of response.completion) {
      if (chunk.chunk) {
        completion += decoder.decode(chunk.chunk.bytes);
      }
    }

    return NextResponse.json({ text: completion });
  } catch (error: unknown) {
    console.error("Agent invocation error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
