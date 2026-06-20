## Vacuum Sewers Deep Dive — Technical Monograph

Build a single-page engineering reference following the "Technical monograph" direction: warm off-white background, dark slate ink, burnt-orange accent, Inter + JetBrains Mono. Sticky top nav, sticky left contents sidebar, long-form scrollable article, dense technical content for practicing modelers.

### Content sections

1. **Header** — Title, lead paragraph, revision metadata.
2. **01. System Principles** — How vacuum sewers work (differential pressure ~0.5–0.7 bar, two-phase slug flow, air-to-liquid ratio ~2:1 to 10:1, intermittent valve operation). When to choose vacuum (flat terrain, high water table, coastal/karst, environmentally sensitive, dispersed low-density populations, retrofit where deep excavation is unfeasible).
3. **02. Component Anatomy** — Annotated SVG schematic showing house connections → collection sump → valve pit → vacuum main with sawtooth lifts → vacuum station (collection tank, vacuum pumps/generators, sewage discharge pumps, controls/SCADA). Three component cards (Valve Pit, Vacuum Main, Vacuum Station) with detailed engineering notes (pit volumes 40–60 L, breather/controller, 3-second nominal valve cycle, lift heights typically 0.3 m every 60–100 m, station vacuum reservoir 4–8 m³, dual rotary vane / liquid ring pumps).
4. **03. Gravity vs. Vacuum** — Expanded comparison table: driving force, typical velocities, pipe sizes, depth/slope, manhole/access, energy use, infiltration risk, retrofit suitability, monitoring needs.
5. **04. ICM Object Mapping** — Table mapping physical → ICM construct → parameters → notes. Cover: house lateral (subcatchment + node), collection sump (manhole or storage node), interface valve (RTC-controlled orifice or flap valve), vacuum main (user-defined conduit, low Manning's n ≈ 0.009, sawtooth invert profile), vacuum reservoir (storage node with custom area-depth), vacuum generators (pumps with H-Q curve, suction-side), discharge pumps to gravity/force main (standard pump).
   - Sub-section: **Modeling strategy** — ICM is gravity/free-surface oriented. Vacuum behavior is approximated by: (a) representing the main with a steep equivalent slope or fixed downstream pressure boundary at the station; (b) using RTC to pulse-open interface valves when upstream sump level exceeds threshold; (c) using a fixed-head outfall at negative head to mimic vacuum reservoir; (d) calibrating equivalent roughness to match observed travel times rather than trying to capture true two-phase physics. Note ICM does not natively simulate compressible air-water slug flow — document this limitation explicitly.
   - Sub-section: **Inflow representation** — wastewater profiles applied at sump nodes; do not use rainfall RDII directly on sealed vacuum mains (only on gravity collection portion).
6. **05. RTC Control Pseudocode** — Two code blocks: (a) Interface valve cycle (open when sump level > Hopen, hold 3 s, close when level < Hclose or after max-open duration), (b) Station duty control (start vacuum generator when reservoir vacuum < setpoint; start discharge pump when liquid level > start setpoint; lockouts on pressure-break alarms).
7. **06. Calibration & Pitfalls** — Callout boxes: (i) Air-to-liquid ratio not directly representable — use travel-time calibration; (ii) Avoid modeling each valve cycle for system-scale studies — use aggregated pulse hydrographs at trunk junctions; (iii) Watch surcharge instability at near-flat sawtooth sections — use shorter timesteps (0.5–1 s) and Preissmann slot; (iv) Compare modeled vs SCADA station runtimes, not just flows.
8. **07. Case Studies** — Three cards with metrics and short narratives:
   - Coastal village retrofit (high water table, ~1,200 PE, 8.4 km, shallow trench saving)
   - Industrial logistics hub (RTC-optimized peak surge management)
   - Island/karst community (where gravity infeasible, contamination risk)
9. **References** — WEF FD-12, ASCE/EWRI 60-12, ATV-DVWK-A 116, Innovyze ICM help (Pumps, RTC, User-defined conduits), Roediger & AIRVAC vendor design guides.

### Implementation

- Replace `src/routes/index.tsx` with the monograph page. Single route, no new pages needed.
- Update `src/styles.css`: add the monograph tokens (warm off-white background, slate foreground, burnt-orange `--accent`, muted slate, hairline border). Keep oklch format. Add Inter + JetBrains Mono via Google Fonts in route `head()` links.
- Update route `head()` meta: title "Vacuum Sewers: Hydraulic Modeling & ICM Implementation", concise description, og tags.
- Inline SVG for the system schematic (annotated, labeled — no raster image needed; cheaper and crisper than generated images for a technical diagram). Keep all visuals as SVG/HTML so no `imagegen` calls are required.
- All content static — no Cloud, no server functions, no data fetching.
- Single H1; semantic `<section>` blocks with `id` for sticky-nav anchors and `scroll-mt` for sticky-nav offset.

### Out of scope

- No imagegen photography (case-study cards use stylized SVG/gradient tiles with metric chips instead).
- No backend, auth, or interactive simulation.
- No PDF export.
