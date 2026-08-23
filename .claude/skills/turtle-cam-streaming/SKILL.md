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
1. Is MediaMTX running? `brew services list | grep mediamtx` (Homebrew launchd service) or
   `pgrep -fl mediamtx`. If it was installed via Docker instead, `docker ps --filter name=mediamtx`.
2. Is it producing HLS locally? `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8888/turtle/index.m3u8`
   — expect `200` or a `30x` into the playlist. Anything else means MediaMTX isn't pulling from
   the camera (check the camera is reachable on the LAN and its RTSP credentials are still valid).
3. Is the tunnel running? `pgrep -fl cloudflared`, or `brew services list | grep cloudflared` if
   it's installed as a service rather than run ad hoc.
4. Does the public URL work end-to-end? `curl -s -o /dev/null -w '%{http_code}\n' "$PUBLIC_STREAM_URL"`,
   ideally from outside the LAN.

## Restart
- MediaMTX (Homebrew): `brew services restart mediamtx`
- MediaMTX (Docker, per docs): `docker restart mediamtx`
- cloudflared: `brew services restart cloudflared` / `cloudflared service restart` if installed as
  a service; otherwise kill the process and re-run `cloudflared tunnel run <tunnel-name>`.

## Config locations — values are machine-local secrets, never put them in this repo
- MediaMTX config: `brew --prefix mediamtx` to find the Homebrew prefix, then
  `etc/mediamtx/mediamtx.yml` under it (Docker installs mount the file explicitly — see docs).
  The `source:` line under `paths.turtle` embeds the camera's RTSP username/password — treat that
  whole line as a secret; never paste it into a commit, PR, issue, or chat log.
- cloudflared config: `~/.cloudflared/config.yml`, plus a per-tunnel credentials JSON and
  `cert.pem` in the same directory — also machine-local secrets.
- Site-side URL only: `.env` (gitignored) locally, or the deploy host's env var settings in
  production. Both should hold `PUBLIC_STREAM_URL` and nothing else from this list.

## Setting this up on a new (or replacement) machine
Follow [docs/turtle-cam-streaming.md](../../../docs/turtle-cam-streaming.md) start to finish —
camera RTSP credentials, MediaMTX, then the Cloudflare Tunnel. Once the tunnel is live there,
update `PUBLIC_STREAM_URL` wherever the site is deployed (outside this repo) and confirm with the
status checks above before treating the migration as done. If an old machine was previously
running this pipeline, stop MediaMTX/cloudflared there once the new one is confirmed working, so
there's exactly one source pulling the RTSP stream at a time.
