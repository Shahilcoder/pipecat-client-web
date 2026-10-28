# Voice Agent Web Client

A mobile-first React client, **Sprout** (a joyful green light theme, see [`DESIGN.md`](DESIGN.md)), for the `pipecat-voice-agent` backend (Pipecat + LiveKit).

```bash
npm install
cp .env.example .env   # backend URL + API key (server-side only, used by the dev proxy)
npm run dev            # design previews: /?preview=empty|connecting|listening|thinking|speaking|muted|ended|error
npm test
```

The design and the stubs are in place. Logic and tests are built test-first by following [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md).
