# How to Run the Chess Game with AI Analysis

## Quick Start

To use the Stockfish AI analysis features, you need to run a local web server (due to browser security restrictions with the `file://` protocol).

### Method 1: Python HTTP Server (Easiest)

```bash
cd d:\Chess
python -m http.server 8000
```

Then open: `http://localhost:8000`

### Method 2: Node.js HTTP Server

```bash
cd d:\Chess
npx serve .
```

### Method 3: VS Code Live Server

1. Install "Live Server" extension in VS Code
2. Right-click `index.html`
3. Select "Open with Live Server"

## Features Available

Once running on a local server:

- ✅ **Position Evaluation** - Real-time score showing who's winning
- ✅ **Best Move Hints** - Click "Show Hint" to see Stockfish's recommended move
- ✅ **Automatic Analysis** - Position analyzed after each move
- ✅ **Apply Hint** - One-click to execute the suggested move
- ✅ **Visual Highlights** - Best moves highlighted on the board

## Offline Play

You can still play the full 2-player chess game by opening `index.html` directly in your browser - all core features work. Only the AI analysis requires a local server.
