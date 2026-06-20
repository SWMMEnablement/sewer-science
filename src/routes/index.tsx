import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

type Mode = "vacuum" | "gravity";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vacuum Sewers: Hydraulic Modeling & ICM Implementation" },
      {
        name: "description",
        content:
          "A technical deep dive into vacuum sewer systems — principles, components, and how to represent them in InfoWorks ICM for practicing modelers.",
      },
      { property: "og:title", content: "Vacuum Sewers: Hydraulic Modeling & ICM Implementation" },
      {
        property: "og:description",
        content:
          "Principles, components, ICM object mapping, RTC pseudocode, calibration pitfalls, and field case studies for vacuum sewer modeling.",
      },
      { property: "og:type", content: "article" },
    ],
  }),
  component: VacuumSewersMonograph,
});

function VacuumSewersMonograph() {
  const [mode, setMode] = useState<Mode>("vacuum");
  const isVac = mode === "vacuum";
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent/20">

      {/* Top Nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="mono-label font-bold text-accent">Doc-V4.2</span>
            <span className="h-4 w-px bg-border" />
            <span className="text-sm font-medium tracking-tight">
              HYDRAULIC ENGINEERING DESIGN SERIES
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ModeToggle mode={mode} setMode={setMode} />
            <span className="hidden sm:block mono-label text-muted-foreground italic">
              Rev. June 2026
            </span>
          </div>
        </div>
      </nav>


      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-12 pt-12 pb-24">
        {/* Sticky Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            <div className="space-y-1">
              <p className="mono-label text-muted-foreground mb-3">Contents</p>
              {[
                ["#principles", "01. System Principles"],
                ["#anatomy", "02. Component Anatomy"],
                ["#comparison", "03. Gravity vs. Vacuum"],
                ["#icm-mapping", "04. ICM Object Mapping"],
                ["#rtc-logic", "05. RTC Pseudocode"],
                ["#pitfalls", "06. Calibration & Pitfalls"],
                ["#case-studies", "07. Field Implementations"],
                ["#references", "08. References"],
              ].map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  className="block py-1 text-sm text-muted-foreground hover:text-accent transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
            <div className="border-t border-border pt-4 mono-label text-muted-foreground leading-relaxed">
              For practicing modelers.
              <br />
              Reading time ~18 min.
            </div>
          </div>
        </aside>

        {/* Main */}
        <main>
          {/* Header */}
          <header className="mb-20">
            <div className="flex items-center gap-2 mb-6">
              <span className="mono-label text-accent">Monograph 07</span>
              <span className="h-px w-8 bg-border" />
              <span className="mono-label text-muted-foreground">
                Wastewater Collection · Pressurized Systems
              </span>
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight text-balance mb-6 leading-[1.05]">
              Vacuum Sewer Systems: Hydraulic Modeling &amp; ICM Implementation
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-[65ch] text-pretty">
              A reference for engineers designing, simulating, and calibrating vacuum-driven
              wastewater collection networks — and translating their two-phase, pneumatically
              switched behavior into the gravity-oriented hydraulic engine of InfoWorks ICM.
            </p>
          </header>

          {/* 01. Principles */}
          <Section id="principles" tag="FIG 00" title="System Principles">
            <Prose>
              <p>
                A vacuum sewer is a sealed, pressurized collection network in which sewage is
                transported by a differential pressure — typically{" "}
                <Mono>−0.5 to −0.7 bar</Mono> relative to atmosphere — generated and maintained
                continuously at a central vacuum station. Unlike a gravity system, the driving
                force is independent of pipe slope. Pipes can run nearly level, climb shallow
                grades using a sawtooth profile, and be laid at trench depths of{" "}
                <Mono>0.8 – 1.5 m</Mono> regardless of terrain.
              </p>
              <p>
                Flow into the main is intermittent. Wastewater accumulates by gravity in a small
                sump beneath each interface valve pit. When the sump level reaches a setpoint, a
                pneumatic controller pulses the valve open for roughly{" "}
                <Mono>3 – 10 seconds</Mono>. The pressure differential evacuates the sump and
                draws in a deliberate slug of air behind it. The resulting air-to-liquid ratio of
                roughly <Mono>2:1 to 10:1</Mono> by volume is what actually transports the
                sewage as accelerating plug flow toward the station.
              </p>
              <p>
                The technology is the right answer in a narrow envelope. It is selected when one
                or more conditions make conventional gravity uneconomic or infeasible:
              </p>
              <ul>
                <li>Flat or undulating terrain with no usable hydraulic gradient.</li>
                <li>
                  High groundwater, tidal influence, or contaminated ground — where infiltration
                  and exfiltration risks rule out leak-prone gravity manholes.
                </li>
                <li>
                  Karst, rocky, or unstable substrates that make deep open-cut excavation
                  prohibitive.
                </li>
                <li>
                  Dispersed low-density populations where multiple small lift stations would be
                  required.
                </li>
                <li>Environmentally sensitive corridors (wetlands, dune systems, marinas).</li>
              </ul>
            </Prose>
          </Section>

          {/* 02. Anatomy */}
          <Section id="anatomy" tag="FIG 01" title="Component Anatomy">
            <SystemSchematic mode={mode} />
            <p className="mono-label text-muted-foreground mt-3 mb-10">
              Figure 1.0 — {isVac
                ? "Typical vacuum collection layout. Sawtooth lifts maintain liquid seals between transport events; the station maintains continuous negative head."
                : "Conventional gravity collection. Continuous downhill profile, manholes at junctions, free-surface flow driven by slope."}
            </p>


            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ComponentCard
                accent
                label="Valve Pit"
                body="Pneumatic interface between gravity collection sump (40–60 L) and the vacuum main. A breather line and dual-action controller open the valve for ~3 s when the sump reaches its high level, then close it after a calibrated air-admission period."
              />
              <ComponentCard
                label="Vacuum Main"
                body="Sealed PE or PVC main, 90–250 mm. Laid in a sawtooth profile with short 0.15–0.3 m vertical lifts every 60–100 m. The lifts trap liquid seals so the negative pressure propagates from the station to every valve."
              />
              <ComponentCard
                label="Vacuum Station"
                body="Collection reservoir (4–8 m³), duty/standby vacuum generators (liquid-ring or rotary-vane), discharge pumps to gravity or rising main, and a controller that maintains reservoir vacuum within a pressure band."
              />
            </div>
          </Section>

          {/* 03. Comparison */}
          <Section id="comparison" title="Gravity vs. Vacuum">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm text-left">
                <thead>
                  <tr className="border-y-2 border-foreground">
                    <th className="py-3 pr-4 font-bold uppercase tracking-wider">Parameter</th>
                    <th className={`py-3 pr-4 font-bold uppercase tracking-wider transition-colors ${!isVac ? "text-accent" : "text-muted-foreground"}`}>
                      Gravity {!isVac && <span className="ml-1 text-[10px]">● active</span>}
                    </th>
                    <th className={`py-3 pr-4 font-bold uppercase tracking-wider transition-colors ${isVac ? "text-accent" : "text-muted-foreground"}`}>
                      Vacuum {isVac && <span className="ml-1 text-[10px]">● active</span>}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["Driving force", "Gravitational potential", "Differential pressure −0.5 to −0.7 bar"],
                    ["Pipe size (residential)", "150–225 mm minimum", "90–160 mm typical"],
                    ["Trench depth", "Continuous fall — often >3 m", "Shallow, 0.8–1.5 m"],
                    ["Slope requirement", "Strictly downhill (0.4–1.0%)", "Effectively flat; sawtooth lifts"],
                    ["Min. transport velocity", "0.6–0.9 m/s scour", "4–6 m/s slug (instantaneous)"],
                    ["Manholes / access", "Every 100 m & at all changes", "None on main; valve pits only"],
                    ["Infiltration risk", "High (open joints, manholes)", "Negligible (sealed, vacuum bias)"],
                    ["Exfiltration on failure", "Possible — leaks outward", "Air drawn inward — contained"],
                    ["Continuous energy use", "None (gravity)", "Station vacuum generation 24/7"],
                    ["Suited service area", "Most urban contexts", "≤2,500 PE, flat / sensitive sites"],
                  ].map(([p, g, v]) => (
                    <tr key={p}>
                      <td className="py-4 pr-4 font-medium">{p}</td>
                      <td className={`py-4 pr-4 transition-colors ${!isVac ? "text-foreground bg-accent/5" : "text-muted-foreground"}`}>{g}</td>
                      <td className={`py-4 pr-4 transition-colors ${isVac ? "text-foreground bg-accent/5" : "text-muted-foreground"}`}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          </Section>

          {/* 04. ICM Mapping */}
          <Section id="icm-mapping" title="InfoWorks ICM Object Mapping">
            <Prose>
              <p>
                ICM&apos;s 1D Saint-Venant engine is built for free-surface and surcharged
                gravity flow. {isVac
                  ? "It does not natively model two-phase compressible slug transport. Vacuum systems are therefore represented by analogy: the dominant transient behaviors that govern system-level performance — sump fill cycles, station duty patterns, reservoir level, and trunk-main travel times — can be reproduced accurately, while the microscale air-liquid mechanics inside a single transport event are abstracted away."
                  : "A conventional gravity network is its native problem domain. Components map directly to first-class ICM objects without analogy or workaround — the engine solves free-surface flow with optional surcharge throughout."}
              </p>
            </Prose>

            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="p-4 bg-secondary border-b border-border flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">
                  Table 4.1 — Physical component → ICM construct
                </p>
                <span className="mono-label text-accent">
                  {isVac ? "VACUUM MODE" : "GRAVITY MODE"}
                </span>
              </div>
              <div className="grid grid-cols-[1.2fr_1.3fr_1.8fr] mono-label bg-foreground text-background py-2 px-4">
                <span>Physical</span>
                <span>ICM construct</span>
                <span>Key parameters / notes</span>
              </div>
              <div className="divide-y divide-border">
                {(isVac
                  ? [
                      ["House lateral / gravity collection", "Subcatchment + Node", "Standard wastewater profile; no RDII unless premises drain into the sump."],
                      ["Collection sump (4–10 dwellings)", "Storage Node", "Custom area-depth (~0.04 m³ active). Open level boundary at top."],
                      ["Interface valve", "RTC-controlled Orifice or Sluice", "Cd ≈ 0.6; binary opening logic on sump level; pulse duration 3–10 s."],
                      ["Vacuum main (sawtooth)", "User-defined Conduit", "Manning's n ≈ 0.009 (PE/PVC); invert profile mirrors sawtooth; enable Preissmann slot."],
                      ["Vacuum reservoir", "Storage Node", "Area-depth of physical tank; downstream level set by fixed-head outfall at negative head."],
                      ["Vacuum generators", "Implicit (fixed-head boundary)", "Represented as a constant-head outfall (e.g. −5.5 to −6.5 mH₂O) maintained by RTC."],
                      ["Sewage discharge pumps", "Pump (H–Q curve)", "Standard rotodynamic pump; suction from reservoir node; level-based start/stop."],
                      ["Force / rising main downstream", "Conduit (circular)", "Modeled normally; pump curve must match steady-state operating point."],
                    ]
                  : [
                      ["House lateral / property drainage", "Subcatchment + Node", "Standard wastewater diurnal; add RDII for combined or leaky systems."],
                      ["Manhole / access chamber", "Manhole Node", "Cover level, invert, chamber area; flood type Lost / Stored / 2D as needed."],
                      ["Gravity collector / trunk sewer", "Conduit (circular)", "Manning's n ≈ 0.012–0.015 (concrete); true slope; surcharge handled natively."],
                      ["Junction / drop manhole", "Manhole + headloss type", "Standard / Quadratic / HEC-22 headloss; use drop for vertical offsets."],
                      ["Inverted siphon", "Siphon link", "Multiple barrels with priming logic; verify scour velocity in low flows."],
                      ["Lift / pumping station wet well", "Storage Node", "Plan area, invert, top level; defines pump start/stop range."],
                      ["Lift station pumps", "Pump (H–Q curve)", "Level-based RTC; verify duty point against system curve."],
                      ["Outfall to WWTP / receiving water", "Outfall Node", "Free, fixed-head, or tidal boundary as appropriate."],
                    ]
                ).map(([p, icm, params]) => (
                  <div
                    key={p}
                    className="grid grid-cols-[1.2fr_1.3fr_1.8fr] p-4 text-sm items-start"
                  >
                    <span className="font-medium">{p}</span>
                    <span className="text-accent font-mono text-[13px]">{icm}</span>
                    <span className="text-muted-foreground">{params}</span>
                  </div>
                ))}
              </div>
            </div>


            <SubHeading>Modeling strategy</SubHeading>
            <Prose>
              <ol>
                <li>
                  <strong>Represent the main as a sealed conduit</strong> with a low roughness and
                  the true sawtooth invert profile. Enable the Preissmann slot so ICM can carry
                  pressurized flow without losing mass.
                </li>
                <li>
                  <strong>Drive flow with a fixed-head boundary</strong> at the station end of the
                  main, set to the operating vacuum (negative head). This single boundary
                  reproduces the system-wide pressure gradient without needing to simulate the
                  vacuum pumps themselves.
                </li>
                <li>
                  <strong>Pulse each interface valve with RTC</strong> on its upstream sump level.
                  For system-scale studies, aggregate clusters of valves at a trunk junction into
                  a single equivalent pulse hydrograph — this avoids tens of thousands of RTC
                  events per simulation.
                </li>
                <li>
                  <strong>Calibrate equivalent roughness</strong> against observed transport times
                  from SCADA, not against headloss equations derived for full-bore liquid flow.
                  The effective resistance includes interfacial drag of air-water slugs, which is
                  higher than a Colebrook prediction.
                </li>
              </ol>
            </Prose>

            <SubHeading>Inflow representation</SubHeading>
            <Prose>
              <p>
                Apply diurnal wastewater profiles at sump nodes only. The sealed vacuum main is
                not subject to rainfall-derived inflow and infiltration (RDII); only the
                gravity collection branches upstream of each pit can. Wet-weather scenarios are
                therefore dominated by sump fill rate rather than by main hydraulics — a useful
                property for stress-testing station capacity.
              </p>
            </Prose>
          </Section>

          {/* 05. RTC */}
          <Section id="rtc-logic" title="RTC Control Pseudocode">
            <Prose>
              <p>
                Two control loops carry most vacuum system behavior: the interface valve cycle
                at each pit, and the duty management of the central station. Both translate
                directly into ICM RTC objects.
              </p>
            </Prose>

            <CodeBlock filename="interface_valve.rtc">
              {`# Interface valve — per pit
# Triggers a pulse when sump fills; closes on low level or max-open

IF (Sump_01.Level > 0.35 m) AND (Valve_01.State == CLOSED) THEN
    SET Valve_01.State        = OPEN
    SET Valve_01.Cd           = 0.62
    SET Valve_01.OpenSince    = SimTime
ENDIF

IF (Valve_01.State == OPEN) THEN
    IF (Sump_01.Level < 0.05 m) OR
       (SimTime - Valve_01.OpenSince > 10 s) THEN
        SET Valve_01.State = CLOSED
    ENDIF
ENDIF`}
            </CodeBlock>

            <CodeBlock filename="vacuum_station.rtc">
              {`# Station — vacuum band and discharge duty
#   Reservoir vacuum maintained between -6.5 and -5.0 mH2O
#   Discharge pumps cycle on reservoir liquid level

IF (Reservoir.Head > -5.0 mH2O) THEN
    SET VacuumBoundary.Head = -6.5 mH2O   # generators ON
ELSE IF (Reservoir.Head < -6.5 mH2O) THEN
    SET VacuumBoundary.Head = -5.0 mH2O   # generators IDLE
ENDIF

IF (Reservoir.Level > 1.80 m) THEN
    SET DischargePump_A.State = ON
ENDIF
IF (Reservoir.Level > 2.20 m) THEN
    SET DischargePump_B.State = ON        # duty + assist
ENDIF
IF (Reservoir.Level < 0.60 m) THEN
    SET DischargePump_A.State = OFF
    SET DischargePump_B.State = OFF
ENDIF

# Safety interlock — vacuum break
IF (Reservoir.Head > -0.5 mH2O) THEN
    ALARM "Vacuum break — close all interface valves"
    SET AllValves.State = CLOSED
ENDIF`}
            </CodeBlock>
          </Section>

          {/* 06. Calibration & Pitfalls */}
          <Section id="pitfalls" title="Calibration &amp; Common Pitfalls">
            <div className="space-y-4">
              <Callout kind="warning" title="Do not aim for true two-phase physics">
                ICM cannot represent compressible air-water slug flow. Calibrating equivalent
                roughness or orifice coefficients to match SCADA transport times and station
                runtimes is the right target — matching instantaneous pipe velocities is not.
              </Callout>
              <Callout kind="tip" title="Aggregate valves for system studies">
                Modeling every interface valve explicitly is appropriate for a single trunk
                investigation but explodes RTC evaluation cost for system-wide assessments.
                Aggregate by trunk junction into pulse hydrographs derived from PE counts and
                diurnal patterns.
              </Callout>
              <Callout kind="warning" title="Watch numerical stability on sawtooth lifts">
                Near-flat conduits with rapid pressure transients are prone to oscillation. Use
                a fixed timestep of <Mono>0.5 – 1 s</Mono>, raise the Preissmann slot width
                only as needed, and verify continuity at the reservoir node.
              </Callout>
              <Callout kind="note" title="Validate on duty, not just flow">
                The most reliable calibration target is station behavior over a week: vacuum
                pump runtime hours, discharge pump cycle counts, and reservoir level traces.
                These integrate every upstream effect and are typically logged at high
                resolution by SCADA.
              </Callout>
              <Callout kind="tip" title="Never apply RDII to the sealed main">
                Wet-weather inflow belongs on the upstream gravity laterals and sumps. Loading
                rainfall directly onto the vacuum main produces nonsensical surcharge and
                masks real capacity bottlenecks.
              </Callout>
            </div>
          </Section>

          {/* 07. Case Studies */}
          <Section id="case-studies" title="Field Implementations">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <CaseStudy
                tone="warm"
                title="Bayside Coastal Heights — Retrofit"
                stats={[
                  ["1,200", "PE served"],
                  ["8.4 km", "Vacuum main"],
                  ["−42%", "Excavation cost"],
                ]}
                body="Replacement of a failing on-site septic array in a tidally influenced coastal
                neighborhood. Groundwater at 0.8 m below grade made conventional gravity
                infeasible. ICM model used 142 storage-node sumps aggregated into 9 trunk pulse
                hydrographs; calibrated against 4 weeks of station SCADA to within 6% on daily
                runtime."
              />
              <CaseStudy
                tone="cool"
                title="North-End Logistics Hub — RTC Optimization"
                stats={[
                  ["3,400", "PE peak"],
                  ["12 km", "Network"],
                  ["−18%", "Pump energy"],
                ]}
                body="Existing vacuum network served an expanding distribution park with sharp
                shift-change inflow peaks. RTC scenario analysis in ICM identified a revised
                discharge pump start band that absorbed the peak in reservoir storage rather
                than in generator duty, cutting annualized energy use by 18% without capital
                works."
              />
              <CaseStudy
                tone="warm"
                title="Karst Island Community"
                stats={[
                  ["860", "PE served"],
                  ["6.1 km", "Vacuum main"],
                  ["0", "Exfiltration events"],
                ]}
                body="Limestone substrate and a protected aquifer ruled out gravity collection.
                Vacuum was selected explicitly for its inward-leak failure mode. ICM was used
                to size the central reservoir for a 6-hour station outage, ensuring no surface
                discharge during a worst-case power loss."
              />
              <CaseStudy
                tone="cool"
                title="Wetland Boardwalk Village"
                stats={[
                  ["540", "PE served"],
                  ["3.2 km", "Vacuum main"],
                  ["0.9 m", "Avg. cover"],
                ]}
                body="Boardwalk-mounted shallow main through a protected wetland corridor. Sawtooth
                profile modeled explicitly in ICM to confirm liquid-seal retention under
                low-flow off-season operation; sump cluster sizing was reduced after model
                showed adequate seal recovery between events."
              />
            </div>
          </Section>

          {/* 08. References */}
          <Section id="references" title="References &amp; Standards">
            <ul className="text-sm text-muted-foreground leading-relaxed space-y-3">
              <li>
                <span className="text-foreground font-medium">WEF MOP FD-12</span> —{" "}
                <em>Alternative Sewer Systems</em>, Water Environment Federation. Chapter on
                vacuum collection covers sizing, pit spacing, and station design.
              </li>
              <li>
                <span className="text-foreground font-medium">ASCE/EWRI 60-12</span> —{" "}
                <em>Guidelines for the Physical Security of Water Utilities</em> and companion
                vacuum sewer practice documents.
              </li>
              <li>
                <span className="text-foreground font-medium">ATV-DVWK-A 116-2</span> —{" "}
                <em>Special Sewer Systems: Vacuum Sewerage</em> (German DWA standard, widely
                adopted in EU practice).
              </li>
              <li>
                <span className="text-foreground font-medium">Innovyze / Autodesk InfoWorks ICM Help</span> —
                Topics: RTC, User-defined conduits, Storage nodes, Pumps, Preissmann slot.
              </li>
              <li>
                <span className="text-foreground font-medium">AIRVAC &amp; Roediger</span> —
                Vendor design manuals for interface valves, vacuum station equipment, and
                sawtooth profile geometry.
              </li>
            </ul>
          </Section>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-foreground text-background py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <p className="mono-label text-accent mb-4">Engineering Reference</p>
            <p className="text-sm text-background/70 max-w-md leading-relaxed">
              This monograph is reference material for practicing hydraulic modelers. Validate
              all parameters against vendor specifications and local design standards before
              committing to a model.
            </p>
          </div>
          <div className="md:text-right flex flex-col md:items-end justify-end gap-2">
            <p className="mono-label text-background/60">Hydraulic Engineering Design Series</p>
            <p className="text-xs text-background/40">Monograph 07 · Rev. June 2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ----------------------------- subcomponents ----------------------------- */

function Section({
  id,
  title,
  tag,
  children,
}: {
  id: string;
  title: string;
  tag?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-24 scroll-mt-24">
      <div className="flex items-center gap-3 mb-8">
        {tag ? (
          <span className="px-2 py-0.5 bg-foreground text-background text-[10px] font-bold tracking-wider">
            {tag}
          </span>
        ) : null}
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-10 mb-3 text-sm font-bold tracking-wider uppercase text-accent">
      {children}
    </h3>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[68ch] text-foreground/90 leading-relaxed text-[15px] space-y-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1.5 [&_em]:italic [&_strong]:text-foreground [&_strong]:font-semibold mb-6">
      {children}
    </div>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-[13px] bg-secondary px-1.5 py-0.5 rounded text-foreground">
      {children}
    </code>
  );
}

function ComponentCard({
  label,
  body,
  accent,
}: {
  label: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        accent
          ? "p-4 bg-accent/5 border-l-2 border-accent"
          : "p-4 bg-foreground/5 border-l-2 border-foreground"
      }
    >
      <p
        className={
          accent
            ? "mono-label text-accent font-bold mb-2"
            : "mono-label font-bold mb-2 text-foreground"
        }
      >
        {label}
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function CodeBlock({
  filename,
  children,
}: {
  filename: string;
  children: string;
}) {
  return (
    <div className="rounded-lg bg-zinc-900 p-6 shadow-xl mb-6">
      <div className="flex justify-between mb-4 border-b border-white/10 pb-2">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
          {filename}
        </span>
        <div className="flex gap-2">
          <div className="size-2 rounded-full bg-red-500/50" />
          <div className="size-2 rounded-full bg-amber-500/50" />
          <div className="size-2 rounded-full bg-green-500/50" />
        </div>
      </div>
      <pre className="font-mono text-[13px] leading-relaxed text-zinc-300 overflow-x-auto whitespace-pre">
        {children}
      </pre>
    </div>
  );
}

function Callout({
  kind,
  title,
  children,
}: {
  kind: "tip" | "warning" | "note";
  title: string;
  children: React.ReactNode;
}) {
  const config = {
    tip: { label: "Tip", color: "text-accent", border: "border-accent" },
    warning: {
      label: "Warning",
      color: "text-destructive",
      border: "border-destructive",
    },
    note: { label: "Note", color: "text-foreground", border: "border-foreground" },
  }[kind];

  return (
    <div className={`border-l-2 ${config.border} pl-4 py-2`}>
      <div className="flex items-baseline gap-3 mb-1">
        <span className={`mono-label font-bold ${config.color}`}>{config.label}</span>
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-[68ch]">{children}</p>
    </div>
  );
}

function CaseStudy({
  title,
  body,
  stats,
  tone,
}: {
  title: string;
  body: string;
  stats: Array<[string, string]>;
  tone: "warm" | "cool";
}) {
  return (
    <div className="border border-border bg-surface rounded-lg overflow-hidden flex flex-col">
      <div
        className={
          "aspect-video relative overflow-hidden " +
          (tone === "warm"
            ? "bg-[linear-gradient(135deg,oklch(0.85_0.05_60),oklch(0.62_0.16_45))]"
            : "bg-[linear-gradient(135deg,oklch(0.35_0.04_240),oklch(0.22_0.02_250))]")
        }
      >
        <svg
          viewBox="0 0 400 200"
          className="absolute inset-0 w-full h-full opacity-40"
          aria-hidden
        >
          <defs>
            <pattern id={`grid-${title}`} width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
                opacity="0.4"
              />
            </pattern>
          </defs>
          <rect width="400" height="200" fill={`url(#grid-${title})`} />
          {/* sawtooth schematic */}
          <polyline
            points="20,150 60,140 60,120 100,110 100,90 140,80 140,60 180,50 220,55 260,45 300,50 340,40 380,45"
            fill="none"
            stroke="white"
            strokeWidth="2"
            opacity="0.9"
          />
          <circle cx="380" cy="45" r="6" fill="white" opacity="0.95" />
        </svg>
        <div className="absolute bottom-3 left-4 mono-label text-white/90">
          Schematic · {tone === "warm" ? "Coastal / wetland" : "Industrial / hard substrate"}
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="font-bold text-lg mb-3">{title}</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {stats.map(([v, l]) => (
            <div
              key={l}
              className="text-xs bg-foreground/5 px-2.5 py-1 rounded border border-border"
            >
              <span className="font-mono font-semibold text-foreground">{v}</span>{" "}
              <span className="text-muted-foreground">{l}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{body}</p>
      </div>
    </div>
  );
}

/* ----------------------------- schematic SVG ----------------------------- */

function SystemSchematic() {
  return (
    <div className="w-full border border-border bg-surface rounded-lg overflow-hidden">
      <svg
        viewBox="0 0 1200 520"
        className="w-full h-auto block"
        role="img"
        aria-label="Vacuum sewer system schematic"
      >
        <defs>
          <pattern id="paperGrid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-foreground"
              opacity="0.06"
            />
          </pattern>
        </defs>
        <rect width="1200" height="520" fill="url(#paperGrid)" />

        {/* Ground line */}
        <line
          x1="0"
          y1="120"
          x2="1200"
          y2="120"
          stroke="currentColor"
          className="text-foreground"
          strokeWidth="1"
          opacity="0.35"
        />
        <text
          x="12"
          y="112"
          className="fill-current text-muted-foreground"
          style={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
        >
          GROUND
        </text>

        {/* Houses */}
        {[80, 220, 360, 500].map((x, i) => (
          <g key={i}>
            <polygon
              points={`${x - 22},90 ${x},65 ${x + 22},90`}
              fill="currentColor"
              className="text-accent"
              opacity="0.85"
            />
            <rect
              x={x - 18}
              y="90"
              width="36"
              height="28"
              fill="currentColor"
              className="text-accent"
              opacity="0.7"
            />
            {/* gravity lateral */}
            <line
              x1={x}
              y1="118"
              x2={x + 30}
              y2="200"
              stroke="currentColor"
              className="text-foreground"
              strokeWidth="2"
              opacity="0.5"
            />
          </g>
        ))}

        {/* Valve pits */}
        {[160, 440].map((x, i) => (
          <g key={i}>
            <rect
              x={x - 28}
              y="170"
              width="56"
              height="80"
              fill="currentColor"
              className="text-surface"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <rect
              x={x - 28}
              y="170"
              width="56"
              height="80"
              fill="none"
              stroke="currentColor"
              className="text-accent"
              strokeWidth="1.5"
            />
            {/* liquid in sump */}
            <rect
              x={x - 24}
              y="220"
              width="48"
              height="26"
              fill="currentColor"
              className="text-accent"
              opacity="0.3"
            />
            {/* valve */}
            <circle
              cx={x}
              cy="250"
              r="6"
              fill="currentColor"
              className="text-accent"
            />
            <text
              x={x}
              y="265"
              textAnchor="middle"
              className="fill-current text-muted-foreground"
              style={{ fontSize: 9, fontFamily: "JetBrains Mono, monospace" }}
            >
              PIT
            </text>
            {/* breather */}
            <line
              x1={x + 20}
              y1="170"
              x2={x + 20}
              y2="135"
              stroke="currentColor"
              className="text-muted-foreground"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
          </g>
        ))}

        {/* Vacuum main with sawtooth lifts */}
        <path
          d="M 160 280
             L 220 280 L 220 260 L 300 260 L 300 280
             L 380 280 L 380 260 L 440 260 L 440 280
             L 520 280 L 520 260 L 600 260 L 600 280
             L 680 280 L 680 260 L 760 260 L 760 280
             L 840 280 L 840 260 L 920 260 L 920 280
             L 1000 280"
          fill="none"
          stroke="currentColor"
          className="text-foreground"
          strokeWidth="3"
        />
        <text
          x="600"
          y="310"
          textAnchor="middle"
          className="fill-current text-muted-foreground"
          style={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
        >
          VACUUM MAIN — SAWTOOTH PROFILE · 0.15–0.3 m LIFTS @ 60–100 m
        </text>

        {/* Vacuum station */}
        <g>
          <rect
            x="1000"
            y="170"
            width="170"
            height="180"
            fill="currentColor"
            className="text-surface"
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="1"
          />
          <rect
            x="1000"
            y="170"
            width="170"
            height="180"
            fill="none"
            stroke="currentColor"
            className="text-foreground"
            strokeWidth="1.5"
          />
          {/* Reservoir tank */}
          <rect
            x="1020"
            y="200"
            width="80"
            height="110"
            fill="none"
            stroke="currentColor"
            className="text-foreground"
            strokeWidth="1.5"
          />
          <rect
            x="1020"
            y="260"
            width="80"
            height="50"
            fill="currentColor"
            className="text-accent"
            opacity="0.3"
          />
          <text
            x="1060"
            y="245"
            textAnchor="middle"
            className="fill-current text-muted-foreground"
            style={{ fontSize: 9, fontFamily: "JetBrains Mono, monospace" }}
          >
            −6 mH₂O
          </text>
          {/* Vacuum generators */}
          <circle
            cx="1130"
            cy="215"
            r="14"
            fill="none"
            stroke="currentColor"
            className="text-accent"
            strokeWidth="1.5"
          />
          <circle
            cx="1130"
            cy="250"
            r="14"
            fill="none"
            stroke="currentColor"
            className="text-accent"
            strokeWidth="1.5"
          />
          <text
            x="1130"
            y="218"
            textAnchor="middle"
            className="fill-current text-accent"
            style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", fontWeight: 600 }}
          >
            VP
          </text>
          <text
            x="1130"
            y="253"
            textAnchor="middle"
            className="fill-current text-accent"
            style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", fontWeight: 600 }}
          >
            VP
          </text>
          {/* Discharge pump */}
          <polygon
            points="1115,295 1145,295 1135,315 1125,315"
            fill="currentColor"
            className="text-foreground"
          />
          <line
            x1="1100"
            y1="305"
            x2="1115"
            y2="305"
            stroke="currentColor"
            className="text-foreground"
            strokeWidth="2"
          />
          <line
            x1="1145"
            y1="305"
            x2="1170"
            y2="305"
            stroke="currentColor"
            className="text-foreground"
            strokeWidth="2"
          />
          <text
            x="1085"
            y="345"
            className="fill-current text-foreground"
            style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", fontWeight: 600 }}
          >
            STATION
          </text>
        </g>

        {/* Outfall arrow */}
        <line
          x1="1170"
          y1="305"
          x2="1195"
          y2="305"
          stroke="currentColor"
          className="text-foreground"
          strokeWidth="2"
        />
        <polygon
          points="1195,300 1195,310 1205,305"
          fill="currentColor"
          className="text-foreground"
        />

        {/* Callouts */}
        <g style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10 }}>
          <line
            x1="160"
            y1="170"
            x2="160"
            y2="60"
            stroke="currentColor"
            className="text-accent"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <text x="160" y="50" textAnchor="middle" className="fill-current text-accent" fontWeight="700">
            VALVE PIT
          </text>

          <line
            x1="600"
            y1="260"
            x2="600"
            y2="380"
            stroke="currentColor"
            className="text-foreground"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.5"
          />
          <text x="600" y="400" textAnchor="middle" className="fill-current text-foreground" fontWeight="700">
            VACUUM MAIN
          </text>

          <line
            x1="1085"
            y1="170"
            x2="1085"
            y2="60"
            stroke="currentColor"
            className="text-foreground"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.5"
          />
          <text x="1085" y="50" textAnchor="middle" className="fill-current text-foreground" fontWeight="700">
            VACUUM STATION
          </text>
        </g>

        {/* Direction of flow */}
        <g>
          <line
            x1="700"
            y1="450"
            x2="900"
            y2="450"
            stroke="currentColor"
            className="text-accent"
            strokeWidth="1.5"
          />
          <polygon
            points="900,445 900,455 912,450"
            fill="currentColor"
            className="text-accent"
          />
          <text
            x="800"
            y="475"
            textAnchor="middle"
            className="fill-current text-accent"
            style={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace", fontWeight: 600 }}
          >
            FLOW · ΔP DRIVEN
          </text>
        </g>
      </svg>
    </div>
  );
}
