# Passive SPAD Foundation Models

Website for **Passive SPAD FMs**: foundation models for single-photon avalanche diodes (SPADs) that enable computer vision in extreme conditions (low light, high speed, and high dynamic range) by going directly from photons to perception.

## Structure

```
index.html          # single-page site
assets/style.css    # styles
assets/main.js      # photon simulations, interactive demo, HDR chart
assets/favicon.svg
.nojekyll           # serve files as-is on GitHub Pages
```

The site is static with no build step. The visualizations are small canvas/SVG simulations of Bernoulli photon detection written in plain JavaScript.

## Preview locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy with GitHub Pages

1. Push to `main`.
2. In the repo on GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, then choose `main` and `/ (root)`.
3. The site will be served at `https://passive-spad-fms.github.io/passive-spad-fms/`.

To serve it at `https://passive-spad-fms.github.io/` instead, rename the repository to `passive-spad-fms.github.io`.

## Contact

passive.spad.fms@gmail.com
