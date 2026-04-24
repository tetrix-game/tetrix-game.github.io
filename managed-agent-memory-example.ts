import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

async function main() {
  // 1. Create environment
  const environment = await client.beta.environments.create({
    name: "memory-demo-env",
    config: {
      type: "cloud",
      networking: { type: "unrestricted" },
    },
  });

  // 2. Create memory store
  const store = await client.beta.memoryStores.create({
    name: "Project Context",
    description: "Project notes, preferences, and learned context.",
  });

  // 3. Seed with initial content
  await client.beta.memoryStores.memories.create(store.id, {
    path: "/project-info.md",
    content: "This is a TypeScript project using React and Vite.",
  });

  // 4. Create agent
  const agent = await client.beta.agents.create({
    name: "Coding Assistant",
    model: "claude-opus-4-7",
    system: "You are a helpful coding assistant. Check memory for project context.",
    tools: [{ type: "agent_toolset_20260401" }],
  });

  // 5. Create session with memory attached
  const session = await client.beta.sessions.create({
    agent: agent.id,
    environment_id: environment.id,
    resources: [
      {
        type: "memory_store",
        memory_store_id: store.id,
        access: "read_write",
        instructions: "Check for project context and preferences before responding.",
      },
    ],
  });

  // 6. Send a message
  await client.beta.sessions.events.send(session.id, {
    events: [
      {
        type: "user.message",
        content: [
          {
            type: "text",
            text: "Remember that I prefer functional components with hooks.",
          },
        ],
      },
    ],
  });

  // 7. Stream response
  const stream = await client.beta.sessions.events.stream(session.id);

  for await (const event of stream) {
    if (event.type === "agent.message") {
      for (const block of event.content) {
        if (block.type === "text") {
          process.stdout.write(block.text);
        }
      }
    } else if (event.type === "session.status_idle") {
      break;
    }
  }

  // 8. List what the agent wrote to memory
  console.log("\n\n--- Memories in store ---");
  const memories = await client.beta.memoryStores.memories.list(store.id, {
    path_prefix: "/",
    view: "full",
  });

  for await (const m of memories) {
    if (m.type === "memory") {
      console.log(`\n${m.path}:`);
      console.log(m.content);
    }
  }

  // 9. Cleanup
  await client.beta.sessions.delete(session.id);
  await client.beta.memoryStores.delete(store.id);
  await client.beta.environments.delete(environment.id);
}

main().catch(console.error);
