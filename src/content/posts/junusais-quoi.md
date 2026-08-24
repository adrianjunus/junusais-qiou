---
title: "Junusais quoi"
date: 2026-08-23
tag: "personal site"
category: portfolio
link: "https://github.com/adrianjunus/junusais-qiou"
excerpt: "(Claude-generated placeholder.) This site — an Astro static build with a Markdown blog and portfolio via content collections, plus a turtle-cam page streaming a live Tapo camera over HLS. The camera feed runs through MediaMTX (RTSP→HLS) and a Cloudflare Tunnel on a separate always-on machine, with no exposed home IP or port forwarding."
---
*(Placeholder description — Claude-generated for now, until I go through and flesh this out myself.)*

This site — an Astro static build with a Markdown blog and portfolio via content collections, plus a turtle-cam page streaming a live Tapo camera over HLS. The camera feed runs through MediaMTX (RTSP→HLS) and a Cloudflare Tunnel on a separate always-on machine, with no exposed home IP or port forwarding.

The player uses hls.js rather than relying on native browser HLS support, since more than just Safari (e.g. Brave) reports partial HLS support and was silently landing on the wrong playback path. The streaming pipeline itself has been migrated across machines a couple of times, including tracking down a Windows-specific bug where cloudflared's built-in Windows service integration crash-loops even with valid config and credentials — worked around by wrapping it with NSSM instead, the same way MediaMTX is run as a service there.
