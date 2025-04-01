import { NextResponse } from "next/server";

const ASSISTANT_ID = "asst_nipc9GXJQ6gmPoWo6i3Bs9tV";
const PROJECT_ID = "proj_7457brf0vep8AB8VD9sC60IV";
const BETA_HEADER = { "OpenAI-Beta": "assistants=v2" };

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Create a new thread using the correct endpoint without project_id
    const threadRes = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...BETA_HEADER,
      },
      body: JSON.stringify({
        // Empty body or metadata if needed
      }),
    });

    if (!threadRes.ok) {
      const errorText = await threadRes.text();
      console.error("Error creating thread:", errorText);
      return NextResponse.json(
        { error: errorText },
        { status: threadRes.status }
      );
    }
    const threadData = await threadRes.json();
    const threadId = threadData.id;

    // Add each message from the request to the thread
    for (const msg of body.messages) {
      const addMsgRes = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            ...BETA_HEADER,
          },
          body: JSON.stringify({
            role: msg.role,
            content: msg.content,
          }),
        }
      );
      if (!addMsgRes.ok) {
        const errorText = await addMsgRes.text();
        console.error("Error adding message:", errorText);
        return NextResponse.json(
          { error: errorText },
          { status: addMsgRes.status }
        );
      }
    }

    // Trigger a run for the thread with assistant_id
    // Keep project_id if your organization needs it and supports it
    const runRes = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/runs`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          ...BETA_HEADER,
        },
        body: JSON.stringify({
          assistant_id: ASSISTANT_ID,
          // project_id removed from here as well, add back if needed by your org
        }),
      }
    );
    if (!runRes.ok) {
      const errorText = await runRes.text();
      console.error("Error creating run:", errorText);
      return NextResponse.json({ error: errorText }, { status: runRes.status });
    }
    const runData = await runRes.json();
    const runId = runData.id;

    // Poll for run completion
    let runStatus = runData.status;
    const maxAttempts = 20;
    let attempts = 0;
    while (
      (runStatus === "queued" || runStatus === "in_progress") &&
      attempts < maxAttempts
    ) {
      await new Promise((resolve) => setTimeout(resolve, 500)); // wait 500ms
      const pollRes = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            ...BETA_HEADER,
          },
        }
      );
      if (!pollRes.ok) {
        const errorText = await pollRes.text();
        console.error("Error polling run:", errorText);
        return NextResponse.json(
          { error: errorText },
          { status: pollRes.status }
        );
      }
      const pollData = await pollRes.json();
      runStatus = pollData.status;
      attempts++;
    }

    if (runStatus !== "completed") {
      console.error("Run did not succeed. Final status:", runStatus);
      return NextResponse.json(
        { error: "Run did not succeed", status: runStatus },
        { status: 500 }
      );
    }

    // Fetch messages from the thread and extract the assistant's reply
    const messagesRes = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          ...BETA_HEADER,
        },
      }
    );
    if (!messagesRes.ok) {
      const errorText = await messagesRes.text();
      console.error("Error fetching messages:", errorText);
      return NextResponse.json(
        { error: errorText },
        { status: messagesRes.status }
      );
    }
    const messagesData = await messagesRes.json();
    // Assume the assistant's reply is the last message with role "assistant"
    const assistantMessage =
      messagesData.data.find((msg: any) => msg.role === "assistant") || null;

    return NextResponse.json({ message: assistantMessage });
  } catch (error) {
    console.error("Error in OpenAI Assistants API route:", error);
    return NextResponse.error();
  }
}
