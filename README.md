# DO NOT OPEN

A cooperative horror maze prototype where every door says "DO NOT OPEN" — but one of them is the exit. Wrong doors release enemies that roam permanently, making each run progressively more dangerous.

## Play Now

This is a browser-based prototype using Three.js. No installation required!

### Option 1: GitHub Pages (Recommended)
1. Go to [Settings](https://github.com/klosixgaming-arch/do-not-open/settings/pages) for this repo
2. Under "Source", select **main** branch, root folder `/`
3. Click Save — your game will be live at `https://klosixgaming-arch.github.io/do-not-open/`

### Option 2: Local Play
1. Clone or download the repo
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge)
3. That's it!

## Controls

| Key | Action |
|-----|--------|
| WASD | Move |
| Mouse | Look around |
| E | Open door (when near one) |
| Shift | Sprint (uses stamina) |
| F | Toggle flashlight |

## Gameplay

- You're trapped in an abandoned asylum maze
- Find the exit door among many identical doors
- Some doors release enemies that chase you permanently
- Some doors contain supplies (batteries for your flashlight)
- Enemies roam, detect you when close, and chase — lose them by getting far enough away
- No combat — survive through navigation and smart door choices

## Prototype Features

✅ Procedurally generated maze layout  
✅ Randomized door outcomes each run  
✅ Enemy AI (roam → detect → chase → lose)  
✅ Flashlight with battery management  
✅ Stamina system for sprinting  
✅ First-person camera with mouse look  

## Roadmap

- [ ] Multiplayer support (1-4 players co-op)
- [ ] Multiple enemy types with different behaviors
- [ ] Sound design and atmosphere improvements
- [ ] Larger, more complex maze layouts
- [ ] Flare system for player regrouping
- [ ] Callout mechanic that attracts enemies

## Tech Stack

- Three.js (3D rendering)
- Vanilla JavaScript
- HTML5/CSS3

Built as a proof-of-concept prototype to test the core "door opening" tension mechanic.