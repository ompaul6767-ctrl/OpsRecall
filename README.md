<div align="center">

# 🧠 OpsRecall

### The incident-response agent that remembers how *your* infrastructure broke before.

![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![Memory](https://img.shields.io/badge/Memory-Hindsight-6C47FF)
![LLM](https://img.shields.io/badge/LLM-Groq-F55036)
![Collaboration](https://img.shields.io/badge/Notifications-Band_AI-00C389)

[The Problem](#-the-problem) · [Before vs After](#-before-vs-after) · [Screenshots](#-screenshots) · [How It Works](#-how-it-works) · [How Hindsight Is Used](#-how-hindsight-memory-is-used) · [Band Integration](#-band-ai-integration) · [Setup](#-getting-started) · [API](#-api-reference)

</div>

---

## 🔥 The Problem

When production goes down, an SRE usually does the same thing: dig through old Slack threads, post-mortems and runbooks to find out *how a similar failure was fixed last time*.

A generic LLM doesn't help much here. Paste in a `502 Bad Gateway` and it will say "restart Nginx". It doesn't know your servers, your services, or the fix your team already found three weeks ago. And because it is stateless, it never learns.

## 💡 The Solution

**OpsRecall** is an AI agent with long-term memory built on **[Hindsight](https://github.com/vectorize-io/hindsight)**.

1. An engineer pastes a raw error log.
2. OpsRecall **recalls** semantically similar past incidents (root causes and fixes) from Hindsight.
3. A fast LLM (Groq) combines the new error with those memories to produce a fix specific to your infrastructure.
4. After the engineer resolves the issue, the steps they actually took are **retained** in memory, so the next outage is faster.
5. **[Band AI](https://www.band.ai)** posts a short status update to the team's room at each stage, so the people on call see what the agent did without opening the dashboard.

The agent gets better with every incident your team closes.

## 🎬 Before vs After

| | Memory OFF (generic assistant) | Memory ON (OpsRecall) |
|---|---|---|
| **Input** | `payments-api returned 502 Bad Gateway. upstream timed out` | *same error* |
| **Answer** | Generic checklist: check upstream, restart the web server, review the logs | Points to the matching past incident, names the likely cause (process hit its memory limit and was OOM-killed) and reuses the exact fix steps recorded for it |
| **Source of fix** | General model knowledge | Your team's own resolved incident |

> Illustrative example. Exact wording varies by model. Run it yourself with the **Use Memory** toggle in the UI.

**The learning loop:** analyze a brand-new error (generic answer) → resolve it with real steps → analyze a similar error again → the fix you just entered is now recalled.

## 📸 Screenshots

### Compare Mode

![Compare Mode: memory off next to memory on](docs/images/compare-mode.jpg)

The same log analyzed twice: a generic baseline on the left, and the memory-informed response with its recalled memories on the right. Each panel shows its own response time.

### Analysis view

![Analysis view with the memory switch and suggested resolution](docs/images/analyze-view.jpg)

An incident signal, the memory switch, and the suggested resolution with the number of memories recalled.

## ⚙️ How It Works

![OpsRecall architecture: React frontend, Express API, MongoDB Atlas, Hindsight memory, Groq LLM and a Band room](docs/images/architecture.png)

The numbered steps in the diagram, in order:

| Step | What happens |
|---|---|
| 1 to 7 | **Analyze:** the engineer submits a log, the API recalls similar incidents from Hindsight, the LLM drafts a fix from the log and those memories, the incident is saved, and the fix is returned |
| 8 | A summary is posted to the Band room (background, best-effort) |
| 9 to 11 | **Resolve:** the engineer submits the steps they took, the incident is marked Resolved, and the fix is retained in Hindsight |
| 12 | A resolution status is posted to the Band room (background, best-effort) |

The same flow as a sequence diagram:

```mermaid
sequenceDiagram
    autonumber
    actor SRE as SRE (React UI)
    participant API as Express API
    participant HS as Hindsight Memory
    participant LLM as Groq LLM
    participant DB as MongoDB Atlas
    participant BAND as Band room

    SRE->>API: POST /api/incident/analyze (error log)
    API->>HS: recall(error log)
    HS-->>API: similar past incidents
    API->>LLM: error + recalled memories
    LLM-->>API: root cause + fix steps
    API->>DB: save incident (Investigating)
    API--)BAND: analysis summary (best-effort)
    API-->>SRE: resolution + memories used

    SRE->>API: POST /api/incident/resolve (steps taken)
    API->>DB: status = Resolved
    API->>HS: retain(error + human fix)
    API--)BAND: resolution status (best-effort)
    API-->>SRE: success
```

## 🧠 How Hindsight Memory Is Used

Memory is the core of OpsRecall, not an add-on. Two calls drive the whole loop.

**Recall (before answering)** in `server/controllers/incidentController.js`:

```js
const recall = await hs.recall(BANK, log.slice(0, RECALL_QUERY_CHARS));
memories = recall.results.slice(0, TOP_K).map(r => r.text);
```

Hindsight searches by meaning, so an error worded differently from the old incident can still match. The top results are injected into the LLM prompt.

**Retain (after resolving)**:

```js
await hs.retain(BANK, `Incident: ${rawErrorLog}\nResolution by Engineer: ${feedback}`, {
  context: 'resolved incident',
  metadata: { type: 'resolved_incident', incidentId },
  async: false, // wait until processed so the next analyze can recall it
});
```

**Grounding the model** in `server/services/llm.js`: the system prompt tells the model to use only the recalled memories for company-specific details, to say so when no match exists, and never to invent server names or commands.

**Seed data:** `server/scripts/seed.js` preloads 8 realistic past incidents (OOM kills, Atlas IP allow-lists, Redis client exhaustion, Kubernetes config drift, S3 CORS, expired TLS certificates, Postgres connection slots, Elasticsearch disk watermarks), so the agent has institutional memory from the first run.

## 🔗 Band AI Integration

OpsRecall reports to a **[Band](https://www.band.ai)** room. When an incident is analyzed or resolved, the backend posts a short status message from the OpsRecall agent into a shared room, so the whole on-call team sees progress in the place they already collaborate.

![OpsRecall Agent posting an analysis summary in a Band room](docs/images/band-room.jpg)

### What gets posted

| Event | Trigger | Message |
|---|---|---|
| Analysis completed | `POST /api/incident/analyze` saved an incident | `OpsRecall analysis completed.` + incident ID, status, and how many past incidents Hindsight recalled (or that memory was disabled) |
| Incident resolved | `POST /api/incident/resolve` succeeded | `OpsRecall incident resolved.` + incident ID and whether Hindsight retention was confirmed |

Example message:

```text
OpsRecall analysis completed.
Incident ID: 6aef24d9e15615060affc772
Status: Investigating
1 past incident(s) recalled from Hindsight
Review the incident in OpsRecall for analysis details.
```

### Privacy by design

- Messages carry **only** the incident ID, status, recall count and retention status.
- Raw error logs, the generated resolution, root-cause text and engineer feedback are **never** sent. The tests assert this with secret-looking strings.
- The incident ID is validated as a 24-character hex string before anything is posted.
- If the Band API rejects a request (HTTP 422), the logged error is reduced to an allow-listed set of field names and a classification such as `mention_required`. Raw response bodies are never logged.

### Behavior

- **Opt-in.** With `BAND_AGENT_API_KEY` or `BAND_ROOM_ID` unset, notifications are skipped and a single warning is logged.
- **Best-effort.** The call is fire-and-forget: a Band outage or error never delays or fails an incident response.
- **Compare mode is silent.** Comparison runs that are not saved to history (`saveIncident: false`) do not post to the room.
- **Mentions.** Each message mentions a team member so the room notifies them. The mention is currently set in `server/services/band.js`.

### Enable it

1. Register the OpsRecall agent in Band and copy its API key (see the [Band docs](https://www.band.ai)).
2. Add the agent to the room that should receive updates and copy the room ID.
3. Set both values in `server/.env`:

```env
BAND_AGENT_API_KEY=your_band_agent_key
BAND_ROOM_ID=your_room_id
```

4. Restart the server, then analyze an incident. A message should appear in the room.

### Tests

```bash
cd server
npm test
```

The test suite in `server/services/band.test.js` uses a stubbed Band client, so it makes no live requests. It covers the safe analysis message, the closure message, the sanitized 422 handling, the skip-when-unconfigured path and the exact request shape the Band SDK sends.

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS |
| Backend | Node.js, Express 5 |
| Database | MongoDB Atlas (Mongoose) for incident state |
| **Agent memory** | **Hindsight Cloud** (`@vectorize-io/hindsight-client`) |
| LLM | Groq (`openai/gpt-oss-120b` by default, with automatic fallback to `openai/gpt-oss-20b`) |
| Team notifications | Band AI (`@band-ai/sdk`, `@band-ai/rest-client`) |
| Dev tooling | Band AI desktop |

## 📁 Project Structure

```
OpsRecall/
├── client/                      # React frontend
├── docs/images/                 # README screenshots and architecture diagram
└── server/
    ├── index.js                 # Express app + routes
    ├── models/Incident.js       # Mongoose schema
    ├── controllers/
    │   └── incidentController.js  # analyze (recall) + resolve (retain)
    ├── services/
    │   ├── memory.js            # Hindsight client + memory bank
    │   ├── llm.js               # Groq client + system prompt
    │   ├── band.js              # Band room notifications (best-effort)
    │   └── band.test.js         # Band integration tests (stubbed client)
    └── scripts/
        ├── seed.js              # preload past incidents
        ├── create-bank.js       # create the Hindsight memory bank
        ├── test-memory.js       # quick recall check
        ├── test-api.js          # quick /analyze check
        └── test-resolve.js      # quick /resolve check
```

## 🚀 Getting Started

### Prerequisites

- Node.js 22.12+ (required by the installed Band SDK)
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (or local MongoDB)
- A [Hindsight Cloud](https://ui.hindsight.vectorize.io) account and API key
- A [Groq](https://groq.com) API key

### 1. Clone and install

```bash
git clone https://github.com/ompaul6767-ctrl/OpsRecall.git
cd OpsRecall

cd server && npm install
cd ../client && npm install
```

### 2. Configure environment

Create `server/.env` (this file is gitignored, never commit it):

```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/opsrecall
HINDSIGHT_API_KEY=your_hindsight_key
GROQ_API_KEY=your_groq_key
PORT=5000

# Optional Band room notifications (see "Band AI Integration"); leave both unset to disable
BAND_AGENT_API_KEY=
BAND_ROOM_ID=

# Optional
# Models are tried in order; if the first fails, the next is used
# GROQ_MODELS=openai/gpt-oss-120b,openai/gpt-oss-20b
# HINDSIGHT_BASE_URL=https://api.hindsight.vectorize.io
# HINDSIGHT_BANK_ID=opsrecall-infra
```

When both Band variables are set, OpsRecall posts analysis and resolution updates to that room. Details, privacy rules and tests are in [Band AI Integration](#-band-ai-integration).

### 3. Seed the memory (run once)

```bash
cd server
node scripts/seed.js --confirm
```

Running the seed more than once creates duplicate memories.

### 4. Run

```bash
# terminal 1: API on http://localhost:5000
cd server && node index.js

# terminal 2: UI (Vite default http://localhost:5173)
cd client && npm run dev
```

### 5. Smoke test the API

```bash
cd server
node scripts/test-api.js        # analyze with memory ON
# copy the incidentId from the output into scripts/test-resolve.js, then:
node scripts/test-resolve.js

npm test                        # Band integration tests (no live requests)
```

## 📡 API Reference

Base URL: `http://localhost:5000`

### `POST /api/incident/analyze`

```jsonc
// request
{ "errorLog": "payments-api returned 502 Bad Gateway...", "useMemory": true, "saveIncident": true }

// 200 response
{
  "success": true,
  "incidentId": "665f...",          // null when saveIncident is false
  "savedToHistory": true,
  "status": "Investigating",        // "Comparison only" when not saved
  "resolution": "1) Likely Root Cause ...",
  "memories": ["Incident: payments-api returned 502 ..."],
  "memoryEnabled": true,
  "memoryError": false,
  "latencyMs": 4892
}
```

| Status | Meaning |
|---|---|
| 400 | `errorLog` missing or empty |
| 502 | LLM failed to generate a resolution |
| 500 | Unexpected server error |

If Hindsight is unreachable, the request still succeeds without memory and returns `memoryError: true`. When an incident is saved, a Band notification is sent in the background.

### `POST /api/incident/resolve`

```jsonc
// request
{ "incidentId": "665f...", "engineerFeedback": "Restarted via PM2, raised the memory limit..." }

// 200 response
{ "success": true, "retained": true, "message": "Incident resolved and retained in memory." }
```

| Status | Meaning |
|---|---|
| 400 | Invalid `incidentId` or empty `engineerFeedback` |
| 404 | Incident not found |
| 500 | Unexpected server error |

`retained: false` means MongoDB was updated but saving to Hindsight failed. An already-resolved incident returns `alreadyResolved: true` and is not retained twice.

## 🧪 Design Decisions

- **Memory toggle (`useMemory`)** makes the with/without-memory comparison reproducible.
- **Graceful degradation:** a Hindsight outage degrades to a generic answer instead of an error.
- **Grounded prompting:** the model is told to label generic advice as `GENERIC` and to state when no past incident matches.
- **Low temperature (0.2)** for consistent, factual output.
- **LLM fallback:** if the primary Groq model fails (rate limit, retired model), the next model in `GROQ_MODELS` is tried automatically.
- **Synchronous retain** (`async: false`) so a fix is recallable immediately after it is saved.
- **Band notifications are metadata-only and best-effort:** incident ID, status and counts, never log contents, and never on the request's critical path.
- **Injectable notifier:** `createBandNotifier` takes its environment, client factory and logger as parameters, so the integration is tested without network access.

## ⚠️ Known Limitations

- Answer quality depends on the quality and specificity of the retained incidents.
- Recall returns the closest matches even when they are only loosely related, so the prompt tells the model to ignore irrelevant memories. Relevance is not scored in the UI yet.
- A single shared memory bank; there is no per-team or per-user isolation or authentication yet.
- Fallback models may phrase answers differently or be less accurate than the primary model.
- Seed data is synthetic. Replace it with your own post-mortems for real use.
- The `useMemory` switch is a demo and testing aid, not a production feature.
- Band delivery has no retry or queue. A failed notification is logged and dropped.
- Notifications go to one room, and the mentioned team member is set in `server/services/band.js` rather than in configuration.
- Band messages are one-way status updates. You cannot trigger an analysis from the room yet.

## 🗺️ Roadmap

- Authentication and per-team memory banks
- Importing existing post-mortems and runbooks in bulk
- Showing recall relevance in the UI
- Configurable Band mentions and per-severity rooms
- Triggering analyses and resolutions from Band chat
- Slack / PagerDuty integration to ingest alerts automatically

## 👥 Team

| Name | Role |
|---|---|
| Sarthak Gawande | Frontend (UI/UX) |
| Sujal Khandre | Backend and database |
| Om Paul | AI logic and memory engineering |
| Ved Kale | Demo, docs and product |

## 🔗 Links

- Hindsight on GitHub: https://github.com/vectorize-io/hindsight
- Hindsight documentation: https://hindsight.vectorize.io/
- What is agent memory: https://vectorize.io/what-is-agent-memory
- Band AI: https://www.band.ai
- Live demo:https://client-ten-eta-26.vercel.app/
- Demo video: https://youtu.be/DlG6P-4U0gE?si=liwtUMnYvtL16BE-

---

<div align="center">
Built with Hindsight agent memory. Every resolved incident makes the next one faster.
</div>
