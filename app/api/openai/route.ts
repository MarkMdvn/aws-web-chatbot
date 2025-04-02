import { NextResponse } from "next/server";

const ASSISTANT_ID = "asst_nipc9GXJQ6gmPoWo6i3Bs9tV";
const BETA_HEADER = { "OpenAI-Beta": "assistants=v2" };

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Create a new thread using the correct endpoint
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

    // Find the assistant's message in the data array
    const assistantMessage = messagesData.data?.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (msg: any) => msg.role === "assistant"
    );

    // If we found an assistant message, extract the content and return it
    if (assistantMessage) {
      // Extract the text content from the message
      let textContent = "";
      if (Array.isArray(assistantMessage.content)) {
        // OpenAI can return content as an array of blocks
        for (const block of assistantMessage.content) {
          if (block.type === "text") {
            textContent += block.text.value;
          }
        }
      }

      // Return a simplified message structure that matches what the chat component expects
      return NextResponse.json({
        id: assistantMessage.id,
        role: "assistant",
        content: textContent,
        createdAt: new Date(assistantMessage.created_at * 1000).toISOString(),
      });
    }

    return NextResponse.json(
      { error: "No assistant message found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error in OpenAI Assistants API route:", error);
    return NextResponse.error();
  }
}
