# CREO motion notes (15 s film)

1920 x 1080, 30 fps, 15 s, stereo AAC. Everything is drawn in code from time: `creo.js` has `draw(ctx, t)` for every
scene, and `renderFrame` averages sub-frames inside a 180 degree shutter (in linear light) for motion blur, so anything
still stays sharp. The soundtrack is synthesised by `audio.mjs` from `events.json`, which the renderer writes from the
same numbers the picture uses, so every sound lands on its frame.

## Render

```sh
cd media/creo-motion
python3 -m http.server 3800 &                    # fonts load over http
node render.mjs 0 450 4                          # frames/f0000.png ... f0449.png and events.json (needs Playwright + Chromium)
node audio.mjs                                   # audio.wav
ffmpeg -y -i audio.wav -af "alimiter=limit=0.22:attack=3:release=50:level=false" audio_lim.wav
ffmpeg -y -i audio_lim.wav -af "volume=11.1dB,alimiter=limit=0.7:attack=2:release=40:level=false" audio_norm.wav
ffmpeg -y -framerate 30 -i frames/f%04d.png -i audio_norm.wav \
  -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" -c:v libx264 -preset slow -crf 15 \
  -profile:v high -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:a aac -b:a 192k -shortest -movflags +faststart creo-motion.mp4
```

`node stills.mjs 1.6,3.5,9.7 sheet` renders a quick contact sheet of single frames without blur.

## Story

0-3.7 s the dot (you post, it remembers, it learns) becomes the period of THE INTELLIGENCE LAYER FOR CREATORS.
3.7-5.6 s REMEMBER bounces, ANALYZE stretches, CREATE turns, DECIDE snaps. 5.6-8.4 s guessing is linear, memory is a
learning curve. 8.4-11.1 s a pattern moves through memory with a delayed coral echo (risky offer). 11.1-13.2 s the fit
ring fills to 96, draws back and opens into YOUR AI CREATOR MANAGER / CREO. with trycreosi.com.
All numbers are the site's sample data and are labelled as illustrative or sample.

Fonts: Anton, Caveat and JetBrains Mono, all under the SIL Open Font License (fonts.google.com).
