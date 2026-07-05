# 🎓 AI Developer Tutor Simulator — Hitesh Choudhary & Piyush Garg

An interactive, AI-powered web application simulating conversations with two of India's prominent tech educators: **Hitesh Choudhary** (creator of *Chai aur Code*) and **Piyush Garg** (creator of *I build devs, not just apps*).

Built using a secure **Next.js App Router** server architecture with OpenAI models (via system instructions and Hinglish few-shot examples) to replicate their distinct speaking styles, teaching approaches, and personalities.

**🔗 Live Demo:** [https://tutor-avatar-chat.vercel.app](https://tutor-avatar-chat.vercel.app)

---

## 🚀 Key Features

- **Dual Persona Simulation:** Switch seamlessly between Hitesh Choudhary and Piyush Garg.
- **Adaptive Language Matching:** The model automatically matches the user's input language (fluent Hinglish or English).
- **Unique Persona Styles:**
  - **Hitesh Choudhary (The Calm Mentor):** Calm, patient, step-by-step teaching. Features a virtual **"Chai Break Simulator"** with breathing timers and developer tips.
  - **Piyush Garg (The Pragmatic Builder):** Direct, no-nonsense, code-focused. Features a **"Latent Show Roast Mode"** for reviewing bad code/setups.
- **Clash Mode (Debate Arena):** Pit Hitesh and Piyush against each other on a technical topic. Watch them banter, mock each other's developer choices, and resolve the debate constructively.
- **Premium Glassmorphism UI:** Dark theme with dynamic persona-based accent colors (amber/gold for Hitesh, sky blue/cyan for Piyush).
- **Secure API Proxying:** Zero API credentials in the client bundle. All chats and debates are proxied through secure server-side Next.js route handlers.
- **IP-Based Rate Limiting:** In-memory sliding window rate limiter with configurable limits:
  - *1-on-1 Chat*: 3 messages/min/IP (configurable via `CHAT_RATE_LIMIT`)
  - *Debate Mode*: 1 clash/min/IP (configurable via `DEBATE_RATE_LIMIT`)
  - *Persona Banter Errors*: Rate limit responses are humorously themed per mentor!
- **Persistent Chat History:** Conversations are saved in `localStorage` and restored on page refresh.

---

## 📂 Project Structure

```text
tutor-avatar-chat/
├── docs/
│   ├── persona_collection.md     # How trait data was collected & prepared
│   ├── prompt_strategy.md        # System prompt structure & memory logic
│   └── conversations.md          # Sample conversation transcripts
├── public/
│   └── favicon.png               # Custom app logo
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts     # Secure API handler for 1-on-1 chats
│   │   │   └── debate/route.ts   # Secure API handler for debate simulations
│   │   ├── layout.tsx            # Root layout with metadata & SEO
│   │   └── page.tsx              # Next.js entry page
│   ├── components/
│   │   ├── ChatWindow.tsx        # Message thread, markdown renderer, code blocks
│   │   ├── Sidebar.tsx           # Mentor selector card & mode switcher
│   │   └── TutorSpecialModes.tsx # Chai simulator & Build challenge widgets
│   ├── constants/
│   │   └── tutor.ts              # Centralized prompts, suggestions & messages
│   ├── lib/
│   │   ├── rate-limit.ts         # IP sliding window rate limiter
│   │   └── withRateLimit.ts      # Reusable route middleware decorator
│   ├── services/
│   │   └── tutorService.ts       # Client-side API fetch wrappers
│   ├── App.tsx                   # Main controller, theme switcher, state sync
│   ├── index.css                 # Premium Glassmorphism design system
│   └── custom.d.ts               # CSS module type declarations
├── .env.example                  # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- An [OpenAI API key](https://platform.openai.com/api-keys)

### Steps

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/<your-username>/tutor-avatar-chat.git
   cd tutor-avatar-chat
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Copy the example env file and add your OpenAI API key:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env`:
   ```env
   OPENAI_API_KEY=sk-proj-your_key_here
   OPENAI_MODEL_NAME=gpt-4o
   CHAT_RATE_LIMIT=3
   DEBATE_RATE_LIMIT=1
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build & Run Production:**
   ```bash
   npm run build
   npm run start
   ```

---

## ⚙️ How to Use the Simulator

1. Start the dev server and open `http://localhost:3000`.
2. Toggle between **Hitesh Choudhary** and **Piyush Garg** in the sidebar. Visual accents and suggestion chips change dynamically.
3. Use the **Quick Prompt Chips** or type custom queries to chat.
4. Switch to **Clash Mode** in the sidebar, input a technical topic (e.g., *Docker vs PM2*, *Tailwind vs Raw CSS*), and click send to watch them debate.
5. Try the **"Take a Sip of Chai"** timer or **"Pitch to Piyush"** cohort challenges in the special modes panel.
6. Spam requests beyond the limit to see custom tutor-specific rate limit banter!

---

## 📝 Documentation

Detailed documentation is available in the [`docs/`](./docs) directory:

| Document | Description |
|---|---|
| [persona_collection.md](./docs/persona_collection.md) | How persona trait data was collected and prepared from public content |
| [prompt_strategy.md](./docs/prompt_strategy.md) | System prompt engineering strategy & context management approach |
| [conversations.md](./docs/conversations.md) | Sample conversations demonstrating both personas |

---

## 🏗️ Architecture & Design Decisions

### Prompt Engineering Strategy
- **System Instructions**: Each persona has a detailed system prompt with personality directives, tone rules, greeting constraints, and few-shot examples.
- **Context Management**: Full chat history is sent with each request, allowing the model to maintain conversational context and avoid repeating greetings.
- **Debate Scripting**: Clash mode uses a structured JSON output format with `response_format: { type: 'json_object' }` to generate 5-turn debate scripts.

### Security & Rate Limiting
- **Server-Side API Proxying**: OpenAI API keys never reach the client. All LLM calls go through Next.js API route handlers (`/api/chat`, `/api/debate`).
- **Reusable Middleware Decorator**: The `withRateLimit` higher-order function wraps route handlers, automatically handling IP resolution, rate checking, persona-specific error messages, and response header injection.
- **Configurable Limits**: Rate limits are loaded from environment variables at runtime, making them configurable per deployment without code changes.

### UI/UX
- **Glassmorphism Design System**: Built with CSS custom properties and `backdrop-filter` for frosted-glass effects.
- **Custom Markdown Renderer**: Supports headers, ordered/unordered lists, inline code, code blocks with copy-to-clipboard, and bold text — all rendered safely without `dangerouslySetInnerHTML`.
- **Persistent Chat History**: Conversations are stored in `localStorage` and restored on page load with hydration-safe mount guards.

---

## 🌐 Live Practical Demo

Demo is Live on [Vercel](https://tutor-simulator.vercel.app/){:target="_blank"}

---

## 📜 License

This project is created for educational and assignment purposes.
