# Cortex AI — OpenClaw Plugin

Long-term memory for OpenClaw powered by [Cortex AI](https://usecortex.ai). Automatically captures conversations, recalls relevant context with knowledge-graph connections, and injects them before every AI turn.

## Install

```bash
openclaw plugins install @usecortex_ai/openclaw-cortex-ai
```

Restart OpenClaw after installing.

## Configuration

Two required values: your Cortex API key and tenant ID.

```bash
export CORTEX_OPENCLAW_API_KEY="your-api-key"
export CORTEX_OPENCLAW_TENANT_ID="your-tenant-id"
```

Or configure directly in `openclaw.json`:

```json5
{
  "plugins": {
    "entries": {
      "openclaw-cortex-ai": {
        "enabled": true,
        "config": {
          "apiKey": "${CORTEX_OPENCLAW_API_KEY}",
          "tenantId": "${CORTEX_OPENCLAW_TENANT_ID}"
        }
      }
    }
  }
}
```

### Options

| Key                | Type      | Default            | Description                                                                |
| ------------------ | --------- | ------------------ | -------------------------------------------------------------------------- |
| `subTenantId`      | `string`  | `"cortex-openclaw"`| Sub-tenant for data partitioning within your tenant                        |
| `autoRecall`       | `boolean` | `true`             | Inject relevant memories before every AI turn                              |
| `autoCapture`      | `boolean` | `true`             | Store conversation exchanges after every AI turn                           |
| `maxRecallResults` | `number`  | `10`               | Max memory chunks injected into context per turn                           |
| `recallMode`       | `string`  | `"fast"`           | `"fast"` or `"thinking"` (deeper personalised recall with graph traversal) |
| `graphContext`     | `boolean` | `true`             | Include knowledge graph relations in recalled context                      |
| `debug`            | `boolean` | `false`            | Verbose debug logs                                                         |

## How It Works

- **Auto-Recall** — Before every AI turn, queries Cortex (`/recall/recall_preferences`) for relevant memories and injects graph-enriched context (entity paths, chunk relations, extra context).

- **Auto-Capture** — After every AI turn, the last user/assistant exchange is sent to Cortex (`/memories/add_memory`) as conversation pairs with `infer: true` and `upsert: true`. The session ID is used as `source_id` so Cortex groups exchanges per session and builds a knowledge graph automatically.

## Slash Commands

| Command                    | Description                                       |
| -------------------------- | ------------------------------------------------- |
| `/cortex-remember <text>`  | Save something to Cortex memory                   |
| `/cortex-recall <query>`   | Search memories with relevance scores              |
| `/cortex-list`             | List all stored user memories                      |
| `/cortex-delete <id>`      | Delete a specific memory by its ID                 |
| `/cortex-get <source_id>`  | Fetch the full content of a source                 |

## AI Tools

| Tool             | Description                                               |
| ---------------- | --------------------------------------------------------- |
| `cortex_store`   | Save information to long-term memory                      |
| `cortex_search`  | Search memories with graph-enriched results               |

## CLI

```bash
openclaw cortex search <query>     # Search memories
openclaw cortex list               # List all user memories
openclaw cortex delete <id>        # Delete a memory
openclaw cortex get <source_id>    # Fetch source content
openclaw cortex status             # Show plugin configuration
```

## Context Injection

Recalled context is injected inside `<cortex-context>` tags containing:

- **Entity Paths** — Knowledge graph paths connecting entities relevant to the query
- **Context Chunks** — Retrieved memory chunks with source titles, graph relations, and linked extra context
