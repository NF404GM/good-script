<div align="center">

# 📜 GOOD SCRIPT

### AI-Powered Teleprompter & Collaborative Scriptwriting Studio

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-green?logo=supabase)](https://supabase.com/)

**Write. Rehearse. Perform.**

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Usage](#-usage) • [Tech Stack](#-tech-stack) • [Contributing](#-contributing)

</div>

---

## ✨ Features

### 🎬 Professional Teleprompter

- **Smooth Auto-Scroll** with adjustable speed (0.5x - 20x)
- **Smart Pacing** that adapts to embedded timing cues `[00:30]`
- **Mirrored Mode** for reflection-based setups
- **High-Contrast Themes** including Broadcast, Dark, Light, and E-Ink modes

### 📝 AI-Powered Writing Studio

- **Gemini Integration** for script generation and improvement
- **Auto-Formatter** that detects Sluglines, Actions, Characters, and Dialogue
- **Character Bible** with visual highlighting when a character appears in the script
- **Script Analytics Dashboard** — track dialogue balance, readability scores, and pacing

### 🤝 Real-Time Collaboration ("Writers Room")

- **Multiplayer Editing** with live presence indicators
- **Real-Time Cursor Tracking** via Supabase Realtime
- **Instant Document Sync** across all connected users

### 📱 Mobile Remote Control

- **Phone-as-Remote** — control the teleprompter from your smartphone
- **Supabase Realtime Backbone** — works across any network (no local Wi-Fi pairing required)
- **Haptic Feedback** for tactile control

### 🔧 Power User Features

- **Voice-to-Script Dictation** using Web Speech API
- **Hand Gesture Control** (webcam-based, experimental)
- **Keyboard Shortcuts** and Command Palette (`Ctrl+K`)
- **PWA Support** — installable on mobile and desktop

---

## 🎥 Demo

> Coming soon! In the meantime, clone and run locally.

---

## 🚀 Installation

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- A [Gemini API Key](https://aistudio.google.com/app/apikey) (for AI features)
- A [Supabase Project](https://supabase.com/) (for collaboration & remote control)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/NF404GM/good-script.git
cd good-script

# 2. Install dependencies
npm install

# 3. Copy the environment template
cp .env.example .env

# 4. Add your API keys to .env
#    VITE_GEMINI_API_KEY=your_key_here
#    VITE_SUPABASE_URL=https://your-project.supabase.co
#    VITE_SUPABASE_ANON_KEY=your_anon_key_here

# 5. Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## 📖 Usage

### Writing a Script

1. Open the **Editor** and start typing.
2. Use the **AI Wand** (✨) to generate or improve content.
3. Add characters to your **Character Bible** for consistency tracking.

### Using the Teleprompter

1. Click the **Play** button to launch the Prompter.
2. Adjust speed with the slider or keyboard (`↑` / `↓`).
3. For timing precision, add markers like `[01:30]` in your script.

### Mobile Remote Control

1. On your laptop, click the **Smartphone** icon in the sidebar.
2. Scan the QR code or enter the Room ID on your phone.
3. Control Play/Pause/Speed from your device.

### Collaboration

1. Share your script URL with collaborators.
2. See who's online via the colored dots in the header.
3. All edits sync instantly.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Framer Motion |
| **Editor** | Tiptap (ProseMirror) |
| **AI** | Google Gemini 1.5 Flash |
| **Realtime** | Supabase Realtime (Presence & Broadcast) |
| **Build** | Vite |
| **Icons** | Lucide React |

---

## 🔒 Security

- **Environment Variables** are never committed (protected by `.gitignore`).
- **API Keys** are client-safe (`VITE_` prefix) and should be scoped appropriately.
- **Supabase Row Level Security (RLS)** should be enabled for production deployments.

See [`.env.example`](.env.example) for the required variables.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ for creators, speakers, and storytellers.**

[⬆ Back to Top](#-good-script)

</div>
