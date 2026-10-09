# Anatomy Motion

A motion-first 3D explorer of human anatomy that runs in the browser.

**Educational, not medical advice.**

## Vercel Link:
https://anatomy-motion.vercel.app/

## What it does

- Two bodies, male and female, drawn as a point cloud with hairline organs.
- Nine sections: nervous system, heart, lungs, digestive system, kidneys, blood vessels, skeleton, lymphatic system and reproductive system.
- Tap an organ or a tab and the camera travels to it in one continuous, interruptible move.
- Drill into organs: brain lobes, heart chambers and valves, lung lobes, kidney layers, colon segments and more.
- A cutaway slider that slices through whatever is selected, from the front, side or top.
- Four guided tours, for example blood through the heart.
- Search and a full index of every part.
- Works with touch, mouse and keyboard, in light and dark themes, and respects reduced-motion settings.

## Run it locally

You need [Node.js](https://nodejs.org). There is nothing to install and no build step.

```bash
node dev-server.mjs
```

Then open http://localhost:5178. On Windows you can double-click `start.bat` instead.

The app loads Three.js and its fonts from the web, so it needs an internet connection.

Useful addresses:

- `?body=female` loads the female body
- `?theme=light` uses the light theme
- `#heart` opens straight on a section

## Deploy

It is a static site. Any static host works with no configuration; `vercel.json` only sets caching for the model files.

## What is real and what is not

Organ models come from scans. A few things the source library does not include are drawn as simple stand-ins: stomach, oesophagus, skull, rib cage, arm bones and peripheral nerves. They are dashed and labelled "stylised" in the app. Pulse, breathing, filtration and brain-wave readouts are simulations, not measurements.

Not included: arm and leg blood vessels, lymph vessels, muscles, and hand and foot bones.

## Project layout

| Path | What it is |
|---|---|
| `index.html`, `css/`, `js/` | The app |
| `js/content.js`, `js/tours.js` | All text, facts and tours, with sources in comments |
| `assets/models/opt/` | Compressed models the app loads |
| `tools/` | Scripts that build the compressed models and the part groupings |
| `qa/` | Playwright scripts for screenshots and interaction tests |
| `DECISIONS.md`, `STYLE-BRIEF.md` | Why things are the way they are |

The original, uncompressed models (about 244 MB for both bodies) are not in this repository. `assets/models/ATTRIBUTION.md` says where they come from if you want to rebuild the compressed copies.

## Credits and licences

- **Code:** MIT, see `LICENSE`.
- **3D models:** the [Human Reference Atlas 3D Reference Object Library](https://github.com/hubmapconsortium/ccf-3d-reference-object-library) (HuBMAP), male and female sets, built from the Visible Human datasets of the US National Library of Medicine. Licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The copies here are modified: simplified, regrouped and compressed. Details are in `assets/models/ATTRIBUTION.md`.
- **Facts:** OpenStax *Anatomy and Physiology 2e* and the other sources listed in `js/content.js`.
