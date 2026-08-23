# Turtle cam streaming setup

The site is a static build deployed to a public host, but the Tapo C100 lives on the home
LAN. Browsers can't play RTSP directly, and the camera isn't reachable from the internet by
default — so an always-on machine on the same network bridges the two: it pulls RTSP from the
camera, remuxes it to HLS, and exposes that HLS endpoint publicly through a Cloudflare Tunnel
(no port forwarding, no exposed home IP).

```
Tapo C100 --RTSP (LAN)--> MediaMTX --HLS (localhost)--> cloudflared tunnel --HTTPS--> internet
```

`src/pages/turtle-cam.astro` already expects an HLS URL at the `STREAM_URL` constant and plays
it with `hls.js` (Safari uses its native HLS support instead). Everything below happens outside
this repo, on the always-on machine.

## 1. Enable RTSP on the camera

In the Tapo app: camera → gear icon → **Advanced Settings** → **Camera Account** → set a
username/password. This is separate from your TP-Link cloud login and is what RTSP auth uses.

Give the camera a stable local IP (DHCP reservation in your router), then the streams are:

- `rtsp://USER:PASS@CAMERA_IP:554/stream1` — 1080p, higher bandwidth
- `rtsp://USER:PASS@CAMERA_IP:554/stream2` — 360p, lower bandwidth (use this one for the
  public site — plenty for a tank cam and much cheaper to re-stream)

Test it locally first with VLC (Media → Open Network Stream) before wiring up anything else.

## 2. Run MediaMTX on an always-on machine on the same LAN

[MediaMTX](https://github.com/bluenviron/mediamtx) pulls the RTSP stream and serves it back out
as HLS with no transcoding (just remuxing), which keeps CPU use low enough for something like a
Raspberry Pi.

`mediamtx.yml`:

```yaml
paths:
  turtle:
    source: rtsp://USER:PASS@CAMERA_IP:554/stream2
```

Run it (Docker is the easiest way to keep it self-contained):

```sh
docker run -d --name mediamtx --restart unless-stopped \
  -v $(pwd)/mediamtx.yml:/mediamtx.yml \
  -p 8888:8888 \
  bluenviron/mediamtx
```

This serves HLS at `http://localhost:8888/turtle/index.m3u8`. Confirm it works locally (VLC or
`ffplay`) before moving on.

**On Windows without Docker Desktop** (e.g. virtualization/WSL2 unavailable on the host — Docker
Desktop needs VT-x/AMD-V exposed to Windows, which isn't always on by default on a given machine):
run the native binary instead, in PowerShell.

```powershell
mkdir C:\mediamtx
cd C:\mediamtx
Invoke-WebRequest -Uri "https://github.com/bluenviron/mediamtx/releases/download/v1.20.1/mediamtx_v1.20.1_windows_amd64.zip" -OutFile mediamtx.zip
Expand-Archive mediamtx.zip -DestinationPath .
# edit mediamtx.yml to the paths.turtle.source block above, then test manually:
.\mediamtx.exe .\mediamtx.yml
```

Once that works, wrap it as a real Windows service with [NSSM](https://nssm.cc/download) so it
survives reboot/logout (needs an elevated "Run as Administrator" PowerShell window):

```powershell
.\nssm.exe install mediamtx "C:\mediamtx\mediamtx.exe" "C:\mediamtx\mediamtx.yml"
.\nssm.exe set mediamtx AppDirectory C:\mediamtx
.\nssm.exe set mediamtx Start SERVICE_AUTO_START
.\nssm.exe start mediamtx
```

## 3. Expose it with a Cloudflare Tunnel

Requires a domain added to Cloudflare (free tier is fine).

```sh
brew install cloudflared        # or the Linux/Pi package for your distro; winget on Windows
cloudflared tunnel login
cloudflared tunnel create turtle-cam
cloudflared tunnel route dns turtle-cam turtle.yourdomain.com
```

`~/.cloudflared/config.yml`:

```yaml
tunnel: turtle-cam
credentials-file: /home/you/.cloudflared/<tunnel-id>.json
ingress:
  - hostname: turtle.yourdomain.com
    service: http://localhost:8888
  - service: http_status:404
```

Run it, then install as a service so it survives reboots:

```sh
cloudflared tunnel run turtle-cam
cloudflared service install   # systemd on Linux/Pi, launchd on macOS
```

**On Windows**, in PowerShell:

```powershell
winget install --id Cloudflare.cloudflared
cloudflared.exe tunnel login
cloudflared.exe tunnel create turtle-cam
cloudflared.exe tunnel route dns turtle-cam turtle.yourdomain.com
```

Config file goes at `$env:USERPROFILE\.cloudflared\config.yml`, same contents as above. Two
Windows-specific gotchas:

- `--config` is a *global* flag on `cloudflared.exe` — it must come **before** the subcommand:
  `cloudflared.exe --config $env:USERPROFILE\.cloudflared\config.yml tunnel run`, not after `tunnel`.
- `cloudflared.exe --config "$env:USERPROFILE\.cloudflared\config.yml" service install` registers
  a Windows service via the Service Control Manager, so it needs an elevated ("Run as
  Administrator") PowerShell window or it fails with access denied.

Camera credentials never leave this machine — the public URL only ever serves the remuxed
video, not the RTSP source or its auth.

## 4. Point the site at it

The page reads the stream URL from `PUBLIC_STREAM_URL` (see `.env.example`) rather than a
hardcoded value, since the repo is public — this keeps the tunnel hostname out of GitHub
source until it's actually live.

- Local dev: set `PUBLIC_STREAM_URL` in `.env` (gitignored) to the local MediaMTX URL
  (`http://localhost:8888/turtle/index.m3u8`) or the tunnel URL.
- Production: set `PUBLIC_STREAM_URL` to `https://turtle.yourdomain.com/turtle/index.m3u8` in
  your host's environment variable settings (Netlify/Vercel/etc — whatever's configured per
  the main README) and redeploy.

Note this isn't a secret in the security sense — anyone visiting the live site can see the URL
in their browser's network tab. It's only kept out of the *repo source*, not out of the page
itself. The page shows OFFLINE until the `<video>` element actually starts playing, then flips
the pill to LIVE — so a dead tunnel, a missing env var, or a rebooting Pi all degrade to the
placeholder state instead of a broken player.

## Notes

- If the always-on machine or camera reboots, MediaMTX's `restart unless-stopped` and
  `cloudflared service install` bring both back without manual intervention.
- Bandwidth: sub-stream HLS is a few hundred Kbps, well within a typical home upload.
- To add basic access control (e.g. only show the cam to yourself while testing), put
  Cloudflare Access in front of the tunnel hostname — this is orthogonal to the site changes.
