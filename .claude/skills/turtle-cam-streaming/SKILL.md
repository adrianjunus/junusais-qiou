---
name: turtle-cam-streaming
description: Check status of, troubleshoot, or restart the turtle-cam live streaming pipeline (MediaMTX RTSP→HLS + Cloudflare Tunnel) on whichever machine hosts it. Use when the turtle-cam page shows OFFLINE, the stream won't load, someone asks to check/restart/set up the camera stream, or the always-on machine is being migrated. This pipeline runs outside the junusais-qiou repo itself — the site only ever reads a stream URL from PUBLIC_STREAM_URL.
---

# Turtle cam streaming — operations

Architecture (full setup steps in
[docs/turtle-cam-streaming.md](../../../docs/turtle-cam-streaming.md)):

```
Tapo C100 --RTSP (LAN)--> MediaMTX --HLS (localhost)--> cloudflared tunnel --HTTPS--> internet
```

None of this runs as part of the site's dev/build process — it's infrastructure on whichever
machine is currently the "always-on" one. The site (`src/pages/turtle-cam.astro`) just plays
whatever HLS URL is in `PUBLIC_STREAM_URL`; it shows OFFLINE until the `<video>` element actually
starts playing, so a break anywhere in the chain below just looks like "OFFLINE" in the browser —
diagnose via the chain, not the browser console, first.

## Check status
1. Is MediaMTX running?
   - Homebrew (Mac): `brew services list | grep mediamtx`, or `pgrep -fl mediamtx`.
   - Docker: `docker ps --filter name=mediamtx`.
   - Windows native + NSSM: `Get-Service mediamtx` (PowerShell) — expect `Running`.
2. Is it producing HLS locally? `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8888/turtle/index.m3u8`
   (or `curl.exe ...` in PowerShell) — expect `200` or a `30x` into the playlist. Anything else
   means MediaMTX isn't pulling from the camera (check the camera is reachable on the LAN and its
   RTSP credentials are still valid).
3. Is the tunnel running?
   - Mac/Linux: `pgrep -fl cloudflared`, or `brew services list | grep cloudflared` if installed
     as a service rather than run ad hoc.
   - Windows: `Get-Service cloudflared` (PowerShell) — expect `Running`.
4. Does the public URL work end-to-end? `curl -s -o /dev/null -w '%{http_code}\n' "$PUBLIC_STREAM_URL"`,
   ideally from outside the LAN.

## Restart
- MediaMTX (Homebrew): `brew services restart mediamtx`
- MediaMTX (Docker, per docs): `docker restart mediamtx`
- MediaMTX (Windows native + NSSM): `Restart-Service mediamtx` (elevated PowerShell)
- cloudflared (Mac/Linux service): `brew services restart cloudflared` / `cloudflared service restart`;
  ad hoc: kill the process and re-run `cloudflared tunnel run <tunnel-name>`.
- cloudflared (Windows service): `Restart-Service cloudflared` (elevated PowerShell)

## Config locations — values are machine-local secrets, never put them in this repo
- MediaMTX config:
  - Homebrew: `brew --prefix mediamtx` to find the prefix, then `etc/mediamtx/mediamtx.yml` under it.
  - Docker: mounted explicitly at run time — see docs.
  - Windows native: wherever it was extracted, e.g. `C:\mediamtx\mediamtx.yml`.
  The `source:` line under `paths.turtle` embeds the camera's RTSP username/password — treat that
  whole line as a secret; never paste it into a commit, PR, issue, or chat log.
- cloudflared config: `~/.cloudflared/config.yml` (Mac/Linux) or `$env:USERPROFILE\.cloudflared\config.yml`
  (Windows), plus a per-tunnel credentials JSON and `cert.pem` in the same directory — also
  machine-local secrets.
- Site-side URL only: `.env` (gitignored) locally, or the deploy host's env var settings in
  production. Both should hold `PUBLIC_STREAM_URL` and nothing else from this list.

## Windows-specific gotchas
- `cloudflared.exe`'s `--config` flag is *global* — it goes before the subcommand
  (`cloudflared.exe --config <path> tunnel run`), not after it. `flag provided but not defined`
  means it was put in the wrong place.
- `cloudflared.exe ... service install` and any NSSM service command need an elevated
  ("Run as Administrator") PowerShell window — a normal one fails with access denied since both
  register with the Service Control Manager.
- Docker Desktop needs VT-x/AMD-V exposed to Windows (WSL2 or Hyper-V backend); "Virtualization
  support not detected" / a `dockerDesktopLinuxEngine` pipe 500 means that's unavailable on this
  machine. Rather than chase a BIOS setting, prefer the native `mediamtx.exe` + NSSM path in
  [docs/turtle-cam-streaming.md](../../../docs/turtle-cam-streaming.md) — it has no virtualization
  dependency and is arguably a better fit for an always-on box anyway.
- `Invoke-WebRequest`, `Get-Service`, `Restart-Service`, and `$env:USERPROFILE` are PowerShell —
  they don't exist in `cmd.exe`. If a command isn't recognized, confirm you're in PowerShell, not
  Command Prompt.
- A stuck `>>` prompt means PowerShell is waiting for an unclosed quote/brace — almost always a
  straight `"` that got pasted in as a curly “smart quote”. `Ctrl+C` cancels back to a clean prompt.

## Setting this up on a new (or replacement) machine
Follow [docs/turtle-cam-streaming.md](../../../docs/turtle-cam-streaming.md) start to finish —
camera RTSP credentials, MediaMTX, then the Cloudflare Tunnel. Once the tunnel is live there,
update `PUBLIC_STREAM_URL` wherever the site is deployed (outside this repo) and confirm with the
status checks above before treating the migration as done. If an old machine was previously
running this pipeline, stop MediaMTX/cloudflared there once the new one is confirmed working, so
there's exactly one source pulling the RTSP stream at a time.
