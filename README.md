# 🎅 Who's my santa

A dead-simple web app for organizing gift exchanges. No accounts, no hassle, just pure holiday chaos.

## What it does

Create a gift exchange, add your people, generate assignments, and share a link. Each participant logs in with their name and password to see who they're buying for. That's it.

## Why this exists

Because organizing gift exchanges over group chat is painful, and nobody wants to create an account just to find out they're buying a gift for Dave from accounting.

## Quick start

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` and start creating exchanges.

## How it works

1. **Create an exchange** - optionally set a budget range
2. **Add participants** - give each person a name and password
3. **Generate assignments** - hit the button, magic happens
4. **Share the link** - send it to everyone
5. **Check assignments** - participants log in to see who they got

## Features

- 🔒 Password-protected assignments (so nobody peeks)
- 💰 Optional cost constraints (no $5 vs $500 situations)
- 🎲 Seeded randomization (for testing or superstitious reasons)
- 🔗 Shareable links (one for admin, one for participants)
- 🎪 Circular assignments (everyone gives, everyone receives)

## Deployment

Built with SvelteKit. Works on Vercel, Netlify, or wherever you can run a SvelteKit app.

**Note:** Uses SQLite locally. For production, use [Turso](https://turso.tech/) or switch to PostgreSQL.

## License

Do whatever you want with it. Make it better, make it worse, I don't care.
