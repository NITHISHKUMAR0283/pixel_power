```markdown
# Pixel Power / LifeBeacon

Live demo: https://pixel-power-xi.vercel.app/

Pixel Power (a.k.a. LifeBeacon) is a browser-based emergency & rescue dashboard built with React and Tailwind.  
It aggregates device sensors (accelerometer, gyroscope, geolocation, microphone, camera), performs audio and physics analyses (seismic / acoustic), visualizes location on a map, coordinates rescue teams, and allows sending SOS/mesh-style messages and AI-style recommendations (currently static).

## Quick highlights
- Real-time sensor aggregation: motion, location, audio, camera (where permitted).  
- Physics & audio analysis: seismic/acoustic metrics and visual cards.  
- Rescue coordination UI: teams, emergency contacts, SOS signaling and messages.  
- Dynamic map integration: Leaflet/OpenStreetMap loaded at runtime for location display.  
- Built with Create React App + Tailwind + lucide-react icons.

## Demo
Visit the live site: https://pixel-power-xi.vercel.app/

## Getting started (local)
Prerequisites:
- Node.js (v16+ recommended)
- npm or yarn
- Browser with secure context (https/localhost) to enable sensor APIs

Clone and install:
git clone https://github.com/NITHISHKUMAR0283/pixel_power.git
cd pixel_power
npm install

Run dev server:
npm start
Open http://localhost:3000 in a browser (HTTPS/localhost recommended for full sensor access).

Build for production:
npm run build

Run tests (basic setup present):
npm test

## Important runtime notes & permissions
- The app uses the following browser/device APIs and will request permission at runtime:
  - Geolocation (navigator.geolocation)
  - DeviceMotion / Accelerometer (if supported) — falls back to simulated motion when unavailable
  - Gyroscope (if supported)
  - Camera (getUserMedia video)
  - Microphone + Web Audio API (getUserMedia audio and AnalyserNode)
  - Battery API (navigator.getBattery)
- These APIs require a secure context (https or localhost) and user consent. Features degrade gracefully; many values are simulated when sensors are unavailable.
- Leaflet is loaded dynamically from a CDN (CSS + JS) when location becomes available.

## How to use
- On first load the app will request permissions for sensors it needs. Grant permissions for full functionality.
- The dashboard shows:
  - Live Sensor Data (acceleration, gyroscope values, timestamps)
  - GPS Location with accuracy indicators and a Leaflet map
  - Audio analysis and acoustic mapping derived from microphone input
  - Advanced Physics cards (seismic, acoustic) and an earthquake alert display
  - Rescue Coordination with sample teams and an Emergency Contacts list
  - AI Recommendations panel (currently uses static/deterministic values)
- Send an SOS: press the SOS control in the UI to create an SOS message entry and increment the SOS counter (simulated messaging).

## Project structure (key files)
- src/App.js — main application and UI (core logic lives here)
- src/App.css — app styling (CRA starter CSS)
- public/index.html — app HTML template
- tailwind.config.js — Tailwind config
- src/setupTests.js — test setup
- README.md — this file

## Implementation notes for maintainers
- The bulk of the app logic and UI lives in src/App.js using React hooks (useState, useEffect, useRef, useCallback).
- Sensor initialization code attempts native sensor usage then falls back to simulated data where needed.
- Microphone handling uses navigator.mediaDevices.getUserMedia and Web Audio AnalyserNode (fftSize 2048) for audio metrics.
- Leaflet map is injected dynamically via CDN when location data is numeric and available.
- AI analysis currently returns static values; can be replaced with a model or remote API for dynamic recommendations.
- UI uses Tailwind CSS classes; lucide-react supplies icons.

## Privacy & security
- This app requests access to sensitive hardware and data. Do not run in untrusted environments or deploy without informed consent and appropriate privacy notices.
- Review any data transmission or storage before enabling any networking features (the current implementation simulates mesh/SOS messaging locally).

## Known limitations & TODOs
- AI analysis is static — replace with real inference if intended.
- Mesh/network communications appear simulated — integrate with backend or WebRTC for real peer-to-peer functionality.
- Improve modularity: move large App.js into smaller components and extract sensor/analysis logic to separate modules.
- Add formal tests and CI, and include a LICENSE file if you want to publish under a specific license.

## Contributing
1. Fork the repo and create a feature branch: git checkout -b feat/your-feature
2. Make changes, add tests if applicable, and run the app locally.
3. Open a pull request with a clear description of what you changed and why.

## License
No license file is included in the repository. Add a LICENSE file (for example MIT) if you want to make the project open source.

## Contact
Maintainer: NITHISHKUMAR0283 (GitHub)  
Open issues on the repository for bugs or feature requests.

```
