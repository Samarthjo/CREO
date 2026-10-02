# Hero look-dev spike (throwaway)

Not product code. A three.js look-dev of "The Layer" (see `docs/creo-design-direction.md`, section 3).
It exists so the experiment survives the session; it is **not self-contained**.

To run it:

```bash
mkdir lookdev && cd lookdev
cp <this folder>/index.html <this folder>/scene.js .
npm init -y && npm i three @fontsource-variable/geist-mono @fontsource-variable/instrument-sans
mkdir fonts   # copy instrument-sans-latin-wght-{normal,italic}.woff2 and geist-mono-latin-wght-normal.woff2 into it
python3 -m http.server 8765   # open http://localhost:8765/?s=0.58
```

Known flaws are listed under the frame in the direction doc: glass not yet readable as glass, a mirrored floor reflection by the headline, a seam at the pane's lower edge.
Sample values on the tiles come from the real engine (see section 7 of the doc).
