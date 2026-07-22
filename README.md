# Simple Notepad

This is a small browser-based notepad built with plain HTML5, CSS, and JavaScript. It is meant to feel familiar, closer to the default Windows Notepad layout than a modern dashboard.

The app runs fully in the browser. Notes are saved with `localStorage`, so you can close the page, come back later, and keep working from the same browser.

## What It Can Do

- Write and edit notes in a clean Notepad-style editor
- Create new notes from the File menu
- Auto-save notes locally in the browser while you type
- Open supported text files from your computer
- Download the current note as a `.txt` file
- Change the font, font size, and editor background color

Supported file types include `.txt`, `.md`, `.markdown`, `.log`, `.csv`, `.json`, `.js`, `.html`, and `.css`.

## Run It Normally

Open `index.html` in your browser.

That is enough for the app to work because it does not need a backend server.

## Run It With Docker

Build the image:

```bash
docker build -t simple-notepad .
```

Start the container:

```bash
docker run --rm -p 8080:80 simple-notepad
```

Then open this address in your browser:

```text
http://localhost:8080
```

## A Small Note

Your notes and format settings live in your browser storage. If you clear site data for this app, those saved notes and settings will be removed too.
