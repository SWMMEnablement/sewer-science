import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

type Mode = "vacuum" | "gravity";
type Preset = "light" | "typical" | "heavy";
type ViewMode = "single" | "compare";

type VacuumParams = {
  diameterMm: number;
  diffPressureBar: number; // magnitude; sign applied where shown
  liftSpacingM: number;
  sumpTriggerM: number;
  valveCd: number;
  pulseS: number;
};
type GravityParams = {
  diameterMm: number;
  slopePct: number;
  manningN: number;
  trenchDepthM: number;
  peakFlowLs: number;
};

const VAC_PRESETS: Record<Preset, VacuumParams> = {
  light:   { diameterMm: 90,  diffPressureBar: 0.50, liftSpacingM: 90, sumpTriggerM: 0.30, valveCd: 0.60, pulseS: 4 },
  typical: { diameterMm: 110, diffPressureBar: 0.60, liftSpacingM: 75, sumpTriggerM: 0.35, valveCd: 0.62, pulseS: 6 },
  heavy:   { diameterMm: 160, diffPressureBar: 0.70, liftSpacingM: 55, sumpTriggerM: 0.45, valveCd: 0.65, pulseS: 9 },
};
const GRV_PRESETS: Record<Preset, GravityParams> = {
  light:   { diameterMm: 200, slopePct: 0.50, manningN: 0.013, trenchDepthM: 2.0, peakFlowLs: 15 },
  typical: { diameterMm: 300, slopePct: 0.70, manningN: 0.013, trenchDepthM: 3.0, peakFlowLs: 60 },
  heavy:   { diameterMm: 500, slopePct: 1.00, manningN: 0.014, trenchDepthM: 4.5, peakFlowLs: 180 },
};

// Manning capacity (full pipe, m^3/s) Q = (1/n) * A * R^(2/3) * S^(1/2)
function manningCapacityLs(d_mm: number, slopePct: number, n: number) {
  const d = d_mm / 1000;
  const A = Math.PI * (d / 2) ** 2;
  const R = d / 4;
  const S = slopePct / 100;
  const Q = (1 / n) * A * Math.pow(R, 2 / 3) * Math.sqrt(S);
  return Q * 1000;
}
function manningVelocity(d_mm: number, slopePct: number, n: number) {
  const d = d_mm / 1000;
  const R = d / 4;
  const S = slopePct / 100;
  return (1 / n) * Math.pow(R, 2 / 3) * Math.sqrt(S);
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vacuum Sewers: Hydraulic Modeling & ICM Implementation" },
      {
        name: "description",
        content:
          "Interactive monograph: vacuum vs. gravity sewer design, live parameter sliders, scenario presets, ICM object mapping, and downloadable HTML report.",
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
  const [view, setView] = useState<ViewMode>("single");
  const [preset, setPreset] = useState<Preset>("typical");
  const [vac, setVac] = useState<VacuumParams>(VAC_PRESETS.typical);
  const [grv, setGrv] = useState<GravityParams>(GRV_PRESETS.typical);

  const applyPreset = (p: Preset) => {
    setPreset(p);
    setVac(VAC_PRESETS[p]);
    setGrv(GRV_PRESETS[p]);
  };

  const isVac = mode === "vacuum";

  const downloadReport = () => {
    const html = buildReportHtml({ mode, view, preset, vac, grv });
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `vacuum-sewer-${view === "compare" ? "compare" : mode}-${preset}-${stamp}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent/20">
      {/* Top Nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="mono-label font-bold text-accent">Doc-V4.2</span>
            <span className="h-4 w-px bg-border" />
            <span className="text-sm font-medium tracking-tight hidden md:inline">
              HYDRAULIC ENGINEERING DESIGN SERIES
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ViewToggle view={view} setView={setView} />
            {view === "single" && <ModeToggle mode={mode} setMode={setMode} />}
            <button
              onClick={downloadReport}
              className="px-3 py-1.5 rounded-md bg-accent text-background text-[11px] font-mono uppercase tracking-wider font-bold hover:opacity-90 transition"
              title="Download HTML report of current view"
            >
              ↓ Report
            </button>
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
                ["#controls", "00. Scenario Controls"],
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
              Interactive · {view === "compare" ? "side-by-side" : mode} · {preset} flow
            </div>
          </div>
        </aside>

        {/* Main */}
        <main>
          {/* Header */}
          <header className="mb-16">
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

          {/* 00. Controls */}
          <Section id="controls" tag="LIVE" title="Scenario Controls">
            <ControlsPanel
              mode={mode}
              view={view}
              preset={preset}
              vac={vac}
              grv={grv}
              setVac={setVac}
              setGrv={setGrv}
              applyPreset={applyPreset}
            />
          </Section>

          {/* 01. Principles */}
          <Section id="principles" tag="FIG 00" title="System Principles">
            <Prose>
              <p>
                A vacuum sewer is a sealed, pressurized collection network in which sewage is
                transported by a differential pressure — currently configured at{" "}
                <Mono>−{vac.diffPressureBar.toFixed(2)} bar</Mono> relative to atmosphere —
                generated and maintained continuously at a central vacuum station. Unlike a
                gravity system, the driving force is independent of pipe slope. Pipes can run
                nearly level, climb shallow grades using a sawtooth profile, and be laid at
                trench depths of <Mono>0.8 – 1.5 m</Mono> regardless of terrain.
              </p>
              <p>
                Flow into the main is intermittent. The pneumatic controller pulses the interface
                valve open for <Mono>{vac.pulseS.toFixed(0)} s</Mono> when the sump reaches{" "}
                <Mono>{vac.sumpTriggerM.toFixed(2)} m</Mono>. The pressure differential evacuates
                the sump and draws in a deliberate slug of air behind it.
              </p>
            </Prose>
          </Section>

          {/* 02. Anatomy + dynamic schematic */}
          <Section id="anatomy" tag="FIG 01" title="Component Anatomy">
            {view === "compare" ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <SchematicPane mode="gravity" grv={grv} vac={vac} />
                <SchematicPane mode="vacuum" grv={grv} vac={vac} />
              </div>
            ) : (
              <SchematicPane mode={mode} grv={grv} vac={vac} />
            )}
            <p className="mono-label text-muted-foreground mt-3 mb-10">
              Figure 1.0 — annotations update live from scenario controls.
            </p>
          </Section>

          {/* 03. Comparison */}
          <Section id="comparison" title="Gravity vs. Vacuum">
            <ComparisonTable vac={vac} grv={grv} mode={mode} view={view} />
          </Section>

          {/* 04. ICM Mapping */}
          <Section id="icm-mapping" title="InfoWorks ICM Object Mapping">
            <Prose>
              <p>
                ICM&apos;s 1D Saint-Venant engine is built for free-surface and surcharged
                gravity flow. Vacuum systems are represented by analogy: dominant transients —
                sump fill cycles, station duty patterns, reservoir level, and trunk-main travel
                times — can be reproduced accurately, while the microscale air-liquid mechanics
                inside a single transport event are abstracted away.
              </p>
            </Prose>

            {view === "compare" ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <IcmMappingTable mode="gravity" vac={vac} grv={grv} />
                <IcmMappingTable mode="vacuum" vac={vac} grv={grv} />
              </div>
            ) : (
              <IcmMappingTable mode={mode} vac={vac} grv={grv} />
            )}
          </Section>

          {/* 05. RTC */}
          <Section id="rtc-logic" title="RTC Control Pseudocode">
            <Prose>
              <p>
                Two control loops carry most vacuum system behavior: the interface valve cycle
                at each pit, and the duty management of the central station. Both translate
                directly into ICM RTC objects. Pseudocode below reflects the current scenario.
              </p>
            </Prose>

            <CodeBlock filename="interface_valve.rtc">
              {`# Interface valve — per pit (scenario: ${preset})
IF (Sump_01.Level > ${vac.sumpTriggerM.toFixed(2)} m) AND (Valve_01.State == CLOSED) THEN
    SET Valve_01.State        = OPEN
    SET Valve_01.Cd           = ${vac.valveCd.toFixed(2)}
    SET Valve_01.OpenSince    = SimTime
ENDIF

IF (Valve_01.State == OPEN) THEN
    IF (Sump_01.Level < 0.05 m) OR
       (SimTime - Valve_01.OpenSince > ${vac.pulseS.toFixed(0)} s) THEN
        SET Valve_01.State = CLOSED
    ENDIF
ENDIF`}
            </CodeBlock>

            <CodeBlock filename="vacuum_station.rtc">
              {`# Station — vacuum band and discharge duty
#   Reservoir vacuum target: -${(vac.diffPressureBar * 10).toFixed(1)} mH2O (≈ -${vac.diffPressureBar.toFixed(2)} bar)

IF (Reservoir.Head > -${(vac.diffPressureBar * 10 - 1.5).toFixed(1)} mH2O) THEN
    SET VacuumBoundary.Head = -${(vac.diffPressureBar * 10).toFixed(1)} mH2O   # generators ON
ELSE IF (Reservoir.Head < -${(vac.diffPressureBar * 10).toFixed(1)} mH2O) THEN
    SET VacuumBoundary.Head = -${(vac.diffPressureBar * 10 - 1.5).toFixed(1)} mH2O   # generators IDLE
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
ENDIF`}
            </CodeBlock>
          </Section>

          {/* 06. Calibration & Pitfalls */}
          <Section id="pitfalls" title="Calibration &amp; Common Pitfalls">
            <div className="space-y-4">
              <Callout kind="warning" title="Do not aim for true two-phase physics">
                ICM cannot represent compressible air-water slug flow. Calibrate to SCADA
                transport times and station runtimes — not instantaneous pipe velocities.
              </Callout>
              <Callout kind="tip" title="Aggregate valves for system studies">
                Aggregate by trunk junction into pulse hydrographs derived from PE counts and
                diurnal patterns to keep RTC evaluation cost manageable.
              </Callout>
              <Callout kind="warning" title="Watch numerical stability on sawtooth lifts">
                Near-flat conduits with rapid pressure transients are prone to oscillation. Use
                a fixed timestep of <Mono>0.5 – 1 s</Mono>.
              </Callout>
              <Callout kind="note" title="Validate on duty, not just flow">
                Vacuum pump runtime hours, discharge pump cycle counts, and reservoir level
                traces integrate every upstream effect and are typically high-resolution SCADA.
              </Callout>
            </div>
          </Section>

          {/* 07. Case Studies */}
          <Section id="case-studies" title="Field Implementations">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <CaseStudy
                tone="warm"
                title="Bayside Coastal Heights — Retrofit"
                stats={[["1,200", "PE served"], ["8.4 km", "Vacuum main"], ["−42%", "Excavation cost"]]}
                body="Replacement of a failing on-site septic array in a tidally influenced coastal neighborhood. Calibrated against 4 weeks of station SCADA to within 6% on daily runtime."
              />
              <CaseStudy
                tone="cool"
                title="North-End Logistics Hub — RTC Optimization"
                stats={[["3,400", "PE peak"], ["12 km", "Network"], ["−18%", "Pump energy"]]}
                body="RTC scenario analysis in ICM identified a revised discharge pump start band that absorbed the peak in reservoir storage rather than in generator duty."
              />
              <CaseStudy
                tone="warm"
                title="Karst Island Community"
                stats={[["860", "PE served"], ["6.1 km", "Vacuum main"], ["0", "Exfiltration events"]]}
                body="Limestone substrate and a protected aquifer ruled out gravity collection. Vacuum was selected for its inward-leak failure mode."
              />
              <CaseStudy
                tone="cool"
                title="Wetland Boardwalk Village"
                stats={[["540", "PE served"], ["3.2 km", "Vacuum main"], ["0.9 m", "Avg. cover"]]}
                body="Boardwalk-mounted shallow main; sawtooth profile modeled explicitly to confirm liquid-seal retention in low-flow off-season operation."
              />
            </div>
          </Section>

          {/* 08. References */}
          <Section id="references" title="References &amp; Standards">
            <ul className="text-sm text-muted-foreground leading-relaxed space-y-3">
              <li><span className="text-foreground font-medium">WEF MOP FD-12</span> — Alternative Sewer Systems.</li>
              <li><span className="text-foreground font-medium">ATV-DVWK-A 116-2</span> — Special Sewer Systems: Vacuum Sewerage.</li>
              <li><span className="text-foreground font-medium">Innovyze / Autodesk InfoWorks ICM Help</span> — RTC, User-defined conduits, Storage nodes, Pumps, Preissmann slot.</li>
              <li><span className="text-foreground font-medium">AIRVAC &amp; Roediger</span> — Vendor design manuals for interface valves and station equipment.</li>
            </ul>
          </Section>
        </main>
      </div>

      <footer className="bg-foreground text-background py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <p className="mono-label text-accent mb-4">Engineering Reference</p>
            <p className="text-sm text-background/70 max-w-md leading-relaxed">
              Validate all parameters against vendor specifications and local design standards
              before committing to a model.
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

/* ============================ Controls panel ============================ */

function ControlsPanel({
  mode,
  view,
  preset,
  vac,
  grv,
  setVac,
  setGrv,
  applyPreset,
}: {
  mode: Mode;
  view: ViewMode;
  preset: Preset;
  vac: VacuumParams;
  grv: GravityParams;
  setVac: (v: VacuumParams) => void;
  setGrv: (g: GravityParams) => void;
  applyPreset: (p: Preset) => void;
}) {
  const showVac = view === "compare" || mode === "vacuum";
  const showGrv = view === "compare" || mode === "gravity";

  return (
    <div className="border border-border bg-surface rounded-lg p-5 space-y-5">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <p className="mono-label text-muted-foreground mb-2">Scenario preset</p>
          <div className="inline-flex rounded-md border border-border bg-background p-0.5 text-[11px] font-mono uppercase tracking-wider">
            {(["light", "typical", "heavy"] as const).map((p) => {
              const active = p === preset;
              return (
                <button
                  key={p}
                  onClick={() => applyPreset(p)}
                  className={`px-3 py-1.5 rounded-[5px] transition-colors ${
                    active
                      ? "bg-accent text-background font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p} flow
                </button>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-muted-foreground max-w-md">
          Pick a preset to load realistic baselines, then drag any slider to override. All
          schematics, tables, ICM mappings, and RTC code update live.
        </p>
      </div>

      <div className={`grid gap-5 ${showVac && showGrv ? "lg:grid-cols-2" : "grid-cols-1"}`}>
        {showVac && (
          <div className="border-l-2 border-accent pl-4">
            <p className="mono-label text-accent font-bold mb-3">Vacuum parameters</p>
            <div className="space-y-3">
              <Slider label="Main diameter" unit="mm" min={75} max={250} step={5}
                value={vac.diameterMm}
                onChange={(v) => setVac({ ...vac, diameterMm: v })} />
              <Slider label="Differential pressure" unit="bar" min={0.4} max={0.75} step={0.01}
                value={vac.diffPressureBar} display={(v) => `−${v.toFixed(2)}`}
                onChange={(v) => setVac({ ...vac, diffPressureBar: v })} />
              <Slider label="Sawtooth lift spacing" unit="m" min={40} max={120} step={5}
                value={vac.liftSpacingM}
                onChange={(v) => setVac({ ...vac, liftSpacingM: v })} />
              <Slider label="Sump trigger level" unit="m" min={0.20} max={0.60} step={0.01}
                value={vac.sumpTriggerM}
                onChange={(v) => setVac({ ...vac, sumpTriggerM: v })} />
              <Slider label="Valve discharge coeff." unit="Cd" min={0.50} max={0.70} step={0.01}
                value={vac.valveCd}
                onChange={(v) => setVac({ ...vac, valveCd: v })} />
              <Slider label="Valve pulse duration" unit="s" min={3} max={12} step={1}
                value={vac.pulseS}
                onChange={(v) => setVac({ ...vac, pulseS: v })} />
            </div>
          </div>
        )}
        {showGrv && (
          <div className="border-l-2 border-foreground pl-4">
            <p className="mono-label font-bold mb-3 text-foreground">Gravity parameters</p>
            <div className="space-y-3">
              <Slider label="Pipe diameter" unit="mm" min={150} max={900} step={25}
                value={grv.diameterMm}
                onChange={(v) => setGrv({ ...grv, diameterMm: v })} />
              <Slider label="Slope" unit="%" min={0.20} max={2.00} step={0.05}
                value={grv.slopePct}
                onChange={(v) => setGrv({ ...grv, slopePct: v })} />
              <Slider label="Manning's n" unit="" min={0.010} max={0.018} step={0.001}
                value={grv.manningN} display={(v) => v.toFixed(3)}
                onChange={(v) => setGrv({ ...grv, manningN: v })} />
              <Slider label="Trench depth" unit="m" min={1.5} max={6.0} step={0.1}
                value={grv.trenchDepthM}
                onChange={(v) => setGrv({ ...grv, trenchDepthM: v })} />
              <Slider label="Peak design flow" unit="L/s" min={5} max={300} step={5}
                value={grv.peakFlowLs}
                onChange={(v) => setGrv({ ...grv, peakFlowLs: v })} />
              <div className="pt-2 mt-2 border-t border-border text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between font-mono">
                  <span>Full-pipe capacity</span>
                  <span className="text-foreground">
                    {manningCapacityLs(grv.diameterMm, grv.slopePct, grv.manningN).toFixed(0)} L/s
                  </span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Full-pipe velocity</span>
                  <span className="text-foreground">
                    {manningVelocity(grv.diameterMm, grv.slopePct, grv.manningN).toFixed(2)} m/s
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Slider({
  label, unit, min, max, step, value, onChange, display,
}: {
  label: string; unit: string; min: number; max: number; step: number;
  value: number; onChange: (v: number) => void; display?: (v: number) => string;
}) {
  const txt = display ? display(value) : (Number.isInteger(step) ? value.toFixed(0) : value.toFixed(2));
  return (
    <label className="block">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <span className="font-mono text-[12px] text-accent">{txt}{unit && ` ${unit}`}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-accent"
      />
    </label>
  );
}

/* ============================ View / Mode toggles ============================ */

function ViewToggle({ view, setView }: { view: ViewMode; setView: (v: ViewMode) => void }) {
  return (
    <div
      role="tablist"
      aria-label="View mode"
      className="inline-flex items-center rounded-md border border-border bg-surface p-0.5 text-[11px] font-mono uppercase tracking-wider"
    >
      {(["single", "compare"] as const).map((v) => {
        const active = v === view;
        return (
          <button
            key={v}
            role="tab"
            aria-selected={active}
            onClick={() => setView(v)}
            className={`px-3 py-1.5 rounded-[5px] transition-colors ${
              active ? "bg-foreground text-background font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}

function ModeToggle({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  return (
    <div
      role="tablist"
      aria-label="System mode"
      className="inline-flex items-center rounded-md border border-border bg-surface p-0.5 text-[11px] font-mono uppercase tracking-wider"
    >
      {(["gravity", "vacuum"] as const).map((m) => {
        const active = mode === m;
        return (
          <button
            key={m}
            role="tab"
            aria-selected={active}
            onClick={() => setMode(m)}
            className={`px-3 py-1.5 rounded-[5px] transition-colors ${
              active ? "bg-foreground text-background font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m}
          </button>
        );
      })}
    </div>
  );
}

/* ============================ Schematic pane ============================ */

function SchematicPane({ mode, vac, grv }: { mode: Mode; vac: VacuumParams; grv: GravityParams }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className={`mono-label font-bold ${mode === "vacuum" ? "text-accent" : "text-foreground"}`}>
          {mode === "vacuum" ? "VACUUM SCHEMATIC" : "GRAVITY SCHEMATIC"}
        </span>
      </div>
      {mode === "vacuum" ? <VacuumSchematic vac={vac} /> : <GravitySchematic grv={grv} />}
    </div>
  );
}

/* ============================ Comparison table ============================ */

function ComparisonTable({ vac, grv, mode, view }: {
  vac: VacuumParams; grv: GravityParams; mode: Mode; view: ViewMode;
}) {
  const isVac = mode === "vacuum";
  const compare = view === "compare";

  const rows: Array<[string, string, string]> = [
    ["Driving force", "Gravitational potential", `Differential pressure −${vac.diffPressureBar.toFixed(2)} bar`],
    ["Pipe size", `${grv.diameterMm} mm (chosen)`, `${vac.diameterMm} mm (chosen)`],
    ["Trench depth", `${grv.trenchDepthM.toFixed(1)} m`, "0.8 – 1.5 m"],
    ["Slope requirement", `${grv.slopePct.toFixed(2)}% downhill`, `Flat; sawtooth lifts every ${vac.liftSpacingM} m`],
    ["Min. transport velocity", "0.6–0.9 m/s scour", "4–6 m/s slug (instantaneous)"],
    ["Roughness param.", `Manning n = ${grv.manningN.toFixed(3)}`, `n ≈ 0.009 (PE/PVC)`],
    ["Full-pipe capacity", `${manningCapacityLs(grv.diameterMm, grv.slopePct, grv.manningN).toFixed(0)} L/s`, "Set by pump duty & vacuum band"],
    ["Continuous energy", "None (gravity)", "Station vacuum generation 24/7"],
    ["Infiltration risk", "High", "Negligible (sealed)"],
    ["Suited service area", "Most urban contexts", "≤2,500 PE; flat / sensitive"],
  ];

  const hi = (col: "g" | "v") =>
    compare
      ? "text-foreground bg-accent/5"
      : (col === "v" ? isVac : !isVac)
        ? "text-foreground bg-accent/5"
        : "text-muted-foreground";

  const head = (col: "g" | "v") =>
    compare
      ? "text-foreground"
      : (col === "v" ? isVac : !isVac)
        ? "text-accent"
        : "text-muted-foreground";

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm text-left">
        <thead>
          <tr className="border-y-2 border-foreground">
            <th className="py-3 pr-4 font-bold uppercase tracking-wider">Parameter</th>
            <th className={`py-3 pr-4 font-bold uppercase tracking-wider transition-colors ${head("g")}`}>Gravity</th>
            <th className={`py-3 pr-4 font-bold uppercase tracking-wider transition-colors ${head("v")}`}>Vacuum</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map(([p, g, v]) => (
            <tr key={p}>
              <td className="py-4 pr-4 font-medium">{p}</td>
              <td className={`py-4 pr-4 transition-colors ${hi("g")}`}>{g}</td>
              <td className={`py-4 pr-4 transition-colors ${hi("v")}`}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ============================ ICM mapping table ============================ */

function IcmMappingTable({ mode, vac, grv }: { mode: Mode; vac: VacuumParams; grv: GravityParams }) {
  const rows: Array<[string, string, string]> = mode === "vacuum"
    ? [
        ["House lateral", "Subcatchment + Node", "Standard wastewater profile; no RDII on main."],
        ["Collection sump", "Storage Node", `Open level boundary; trigger ${vac.sumpTriggerM.toFixed(2)} m.`],
        ["Interface valve", "RTC Orifice / Sluice", `Cd = ${vac.valveCd.toFixed(2)}; pulse ${vac.pulseS} s.`],
        ["Vacuum main (sawtooth)", "User-defined Conduit", `D = ${vac.diameterMm} mm; n ≈ 0.009; lift every ${vac.liftSpacingM} m; Preissmann slot on.`],
        ["Vacuum reservoir", "Storage Node", "Area-depth of physical tank."],
        ["Vacuum generators", "Fixed-head outfall", `Head ≈ −${(vac.diffPressureBar * 10).toFixed(1)} mH₂O (RTC band ±1.5).`],
        ["Discharge pumps", "Pump (H–Q curve)", "Level-based start/stop."],
        ["Rising main", "Conduit (circular)", "Standard pressurized model."],
      ]
    : [
        ["House lateral", "Subcatchment + Node", "Standard diurnal; add RDII if combined/leaky."],
        ["Manhole / access", "Manhole Node", `Cover, invert at ${grv.trenchDepthM.toFixed(1)} m depth.`],
        ["Gravity trunk", "Conduit (circular)", `D = ${grv.diameterMm} mm; n = ${grv.manningN.toFixed(3)}; slope ${grv.slopePct.toFixed(2)}%.`],
        ["Capacity check", "Computed (Manning)", `Q_full ≈ ${manningCapacityLs(grv.diameterMm, grv.slopePct, grv.manningN).toFixed(0)} L/s vs. peak ${grv.peakFlowLs} L/s.`],
        ["Junction / drop", "Manhole + headloss", "Standard / Quadratic / HEC-22."],
        ["Inverted siphon", "Siphon link", "Multiple barrels; verify scour velocity."],
        ["Wet well", "Storage Node", "Defines pump start/stop range."],
        ["Outfall", "Outfall Node", "Free, fixed-head, or tidal."],
      ];

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden mt-4">
      <div className="p-4 bg-secondary border-b border-border flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium">
          Table — Physical component → ICM construct
        </p>
        <span className={`mono-label ${mode === "vacuum" ? "text-accent" : "text-foreground"}`}>
          {mode.toUpperCase()} MODE
        </span>
      </div>
      <div className="grid grid-cols-[1.2fr_1.3fr_1.8fr] mono-label bg-foreground text-background py-2 px-4">
        <span>Physical</span>
        <span>ICM construct</span>
        <span>Key parameters / notes</span>
      </div>
      <div className="divide-y divide-border">
        {rows.map(([p, icm, params]) => (
          <div key={p} className="grid grid-cols-[1.2fr_1.3fr_1.8fr] p-4 text-sm items-start">
            <span className="font-medium">{p}</span>
            <span className={`font-mono text-[13px] ${mode === "vacuum" ? "text-accent" : "text-foreground"}`}>{icm}</span>
            <span className="text-muted-foreground">{params}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================ Primitives ============================ */

function Section({ id, title, tag, children }: {
  id: string; title: string; tag?: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-20 scroll-mt-24">
      <div className="flex items-center gap-3 mb-6">
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

function CodeBlock({ filename, children }: { filename: string; children: string }) {
  return (
    <div className="rounded-lg bg-zinc-900 p-6 shadow-xl mb-6">
      <div className="flex justify-between mb-4 border-b border-white/10 pb-2">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{filename}</span>
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

function Callout({ kind, title, children }: {
  kind: "tip" | "warning" | "note"; title: string; children: React.ReactNode;
}) {
  const config = {
    tip: { label: "Tip", color: "text-accent", border: "border-accent" },
    warning: { label: "Warning", color: "text-destructive", border: "border-destructive" },
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

function CaseStudy({ title, body, stats, tone }: {
  title: string; body: string; stats: Array<[string, string]>; tone: "warm" | "cool";
}) {
  return (
    <div className="border border-border bg-surface rounded-lg overflow-hidden flex flex-col">
      <div className={"aspect-video relative overflow-hidden " + (tone === "warm"
        ? "bg-[linear-gradient(135deg,oklch(0.85_0.05_60),oklch(0.62_0.16_45))]"
        : "bg-[linear-gradient(135deg,oklch(0.35_0.04_240),oklch(0.22_0.02_250))]")
      }>
        <div className="absolute bottom-3 left-4 mono-label text-white/90">
          {tone === "warm" ? "Coastal / wetland" : "Industrial / hard substrate"}
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="font-bold text-lg mb-3">{title}</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {stats.map(([v, l]) => (
            <div key={l} className="text-xs bg-foreground/5 px-2.5 py-1 rounded border border-border">
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

/* ============================ Vacuum schematic (dynamic) ============================ */

function VacuumSchematic({ vac }: { vac: VacuumParams }) {
  // Derive a few visual variations from params:
  const lifts = useMemo(() => {
    // Map liftSpacingM (40-120) -> number of teeth (more spacing = fewer teeth)
    const n = Math.round(10 - (vac.liftSpacingM - 40) / 12); // 3-10
    return Math.max(3, Math.min(10, n));
  }, [vac.liftSpacingM]);
  const liftHeight = useMemo(() => {
    // larger Δp → deeper lift dip in drawing
    return 14 + vac.diffPressureBar * 18;
  }, [vac.diffPressureBar]);
  const pipeStroke = 1.5 + (vac.diameterMm - 75) / 50; // 1.5 → ~5

  const startX = 160, endX = 1000, baseY = 280;
  const segW = (endX - startX) / lifts;
  let d = `M ${startX} ${baseY}`;
  for (let i = 0; i < lifts; i++) {
    const x0 = startX + i * segW;
    const x1 = x0 + segW * 0.35;
    const x2 = x0 + segW * 0.65;
    const x3 = x0 + segW;
    d += ` L ${x1} ${baseY} L ${x1} ${baseY - liftHeight} L ${x2} ${baseY - liftHeight} L ${x2} ${baseY} L ${x3} ${baseY}`;
  }

  return (
    <div className="w-full border border-border bg-surface rounded-lg overflow-hidden">
      <svg viewBox="0 0 1200 520" className="w-full h-auto block" role="img" aria-label="Vacuum sewer system schematic">
        <defs>
          <pattern id="paperGrid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-foreground" opacity="0.06" />
          </pattern>
        </defs>
        <rect width="1200" height="520" fill="url(#paperGrid)" />

        <line x1="0" y1="120" x2="1200" y2="120" stroke="currentColor" className="text-foreground" strokeWidth="1" opacity="0.35" />
        <text x="12" y="112" className="fill-current text-muted-foreground" style={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}>GROUND</text>

        {[80, 220, 360, 500].map((x, i) => (
          <g key={i}>
            <polygon points={`${x - 22},90 ${x},65 ${x + 22},90`} fill="currentColor" className="text-accent" opacity="0.85" />
            <rect x={x - 18} y="90" width="36" height="28" fill="currentColor" className="text-accent" opacity="0.7" />
            <line x1={x} y1="118" x2={x + 30} y2="200" stroke="currentColor" className="text-foreground" strokeWidth="2" opacity="0.5" />
          </g>
        ))}

        {[160, 440].map((x, i) => (
          <g key={i}>
            <rect x={x - 28} y="170" width="56" height="80" fill="currentColor" className="text-surface" stroke="currentColor" strokeWidth="1.5" />
            <rect x={x - 28} y="170" width="56" height="80" fill="none" stroke="currentColor" className="text-accent" strokeWidth="1.5" />
            {/* sump fill proportional to trigger */}
            <rect x={x - 24} y={250 - vac.sumpTriggerM * 100} width="48" height={vac.sumpTriggerM * 100 - 4} fill="currentColor" className="text-accent" opacity="0.35" />
            <circle cx={x} cy="250" r="6" fill="currentColor" className="text-accent" />
            <text x={x} y="265" textAnchor="middle" className="fill-current text-muted-foreground" style={{ fontSize: 9, fontFamily: "JetBrains Mono, monospace" }}>PIT</text>
          </g>
        ))}

        {/* dynamic sawtooth main */}
        <path d={d} fill="none" stroke="currentColor" className="text-foreground" strokeWidth={pipeStroke} />
        <text x="600" y="320" textAnchor="middle" className="fill-current text-muted-foreground" style={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}>
          VACUUM MAIN · D = {vac.diameterMm} mm · LIFT @ {vac.liftSpacingM} m · ΔP = −{vac.diffPressureBar.toFixed(2)} bar
        </text>

        {/* Vacuum station */}
        <g>
          <rect x="1000" y="170" width="170" height="180" fill="currentColor" className="text-surface" stroke="currentColor" strokeWidth="1.5" />
          <rect x="1000" y="170" width="170" height="180" fill="none" stroke="currentColor" className="text-foreground" strokeWidth="1.5" />
          <rect x="1020" y="200" width="80" height="110" fill="none" stroke="currentColor" className="text-foreground" strokeWidth="1.5" />
          <rect x="1020" y="260" width="80" height="50" fill="currentColor" className="text-accent" opacity="0.3" />
          <text x="1060" y="245" textAnchor="middle" className="fill-current text-muted-foreground" style={{ fontSize: 9, fontFamily: "JetBrains Mono, monospace" }}>
            −{(vac.diffPressureBar * 10).toFixed(1)} mH₂O
          </text>
          <circle cx="1130" cy="215" r="14" fill="none" stroke="currentColor" className="text-accent" strokeWidth="1.5" />
          <circle cx="1130" cy="250" r="14" fill="none" stroke="currentColor" className="text-accent" strokeWidth="1.5" />
          <text x="1130" y="218" textAnchor="middle" className="fill-current text-accent" style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", fontWeight: 600 }}>VP</text>
          <text x="1130" y="253" textAnchor="middle" className="fill-current text-accent" style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", fontWeight: 600 }}>VP</text>
          <polygon points="1115,295 1145,295 1135,315 1125,315" fill="currentColor" className="text-foreground" />
          <text x="1085" y="345" className="fill-current text-foreground" style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", fontWeight: 600 }}>STATION</text>
        </g>

        {/* annotations */}
        <g style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10 }}>
          <text x="160" y="50" textAnchor="middle" className="fill-current text-accent" fontWeight="700">VALVE PIT · Cd {vac.valveCd.toFixed(2)} · {vac.pulseS}s</text>
          <line x1="160" y1="55" x2="160" y2="170" stroke="currentColor" className="text-accent" strokeWidth="1" strokeDasharray="2 2" />
          <text x="600" y="400" textAnchor="middle" className="fill-current text-foreground" fontWeight="700">{lifts}-TOOTH PROFILE</text>
          <text x="1085" y="50" textAnchor="middle" className="fill-current text-foreground" fontWeight="700">VACUUM STATION</text>
        </g>

        <g>
          <line x1="700" y1="450" x2="900" y2="450" stroke="currentColor" className="text-accent" strokeWidth="1.5" />
          <polygon points="900,445 900,455 912,450" fill="currentColor" className="text-accent" />
          <text x="800" y="475" textAnchor="middle" className="fill-current text-accent" style={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace", fontWeight: 600 }}>
            FLOW · ΔP DRIVEN
          </text>
        </g>
      </svg>
    </div>
  );
}

/* ============================ Gravity schematic (dynamic) ============================ */

function GravitySchematic({ grv }: { grv: GravityParams }) {
  const manholes = [160, 360, 560, 760, 960];
  // slope shows visual exaggeration of slopePct (0.2–2 → 0.04–0.18 px/px)
  const slopeFactor = 0.03 + (grv.slopePct - 0.2) * 0.08;
  const pipeY = (x: number) => 230 + (x - 80) * slopeFactor;
  const pipeWidth = 8 + grv.diameterMm / 60; // visual thickness
  const fillRatio = Math.min(0.95, grv.peakFlowLs / Math.max(1, manningCapacityLs(grv.diameterMm, grv.slopePct, grv.manningN)));

  return (
    <div className="w-full border border-border bg-surface rounded-lg overflow-hidden">
      <svg viewBox="0 0 1200 520" className="w-full h-auto block" role="img" aria-label="Conventional gravity sewer schematic">
        <defs>
          <pattern id="paperGridG" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-foreground" opacity="0.06" />
          </pattern>
        </defs>
        <rect width="1200" height="520" fill="url(#paperGridG)" />

        <line x1="0" y1="110" x2="1200" y2="190" stroke="currentColor" className="text-foreground" strokeWidth="1" opacity="0.35" />
        <text x="12" y="102" className="fill-current text-muted-foreground" style={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}>
          GROUND · NATURAL FALL
        </text>

        {[100, 300, 500, 700, 900].map((x, i) => {
          const gy = 110 + (x / 1200) * 80;
          return (
            <g key={i}>
              <polygon points={`${x - 22},${gy - 20} ${x},${gy - 45} ${x + 22},${gy - 20}`} fill="currentColor" className="text-accent" opacity="0.85" />
              <rect x={x - 18} y={gy - 20} width="36" height="28" fill="currentColor" className="text-accent" opacity="0.7" />
            </g>
          );
        })}

        {/* Trunk pipe (top + bottom lines), thickness scaled by diameter */}
        <line x1="80" y1={pipeY(80)} x2="1080" y2={pipeY(1080)} stroke="currentColor" className="text-foreground" strokeWidth="2" />
        <line x1="80" y1={pipeY(80) + pipeWidth} x2="1080" y2={pipeY(1080) + pipeWidth} stroke="currentColor" className="text-foreground" strokeWidth="2" />
        {/* water free surface inside */}
        <line
          x1="80" y1={pipeY(80) + pipeWidth * (1 - fillRatio)}
          x2="1080" y2={pipeY(1080) + pipeWidth * (1 - fillRatio)}
          stroke="currentColor" className="text-accent" strokeWidth="2" opacity="0.6"
        />

        <text x="600" y={pipeY(600) + 50} textAnchor="middle" className="fill-current text-muted-foreground" style={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}>
          GRAVITY TRUNK · D = {grv.diameterMm} mm · S = {grv.slopePct.toFixed(2)}% · n = {grv.manningN.toFixed(3)} · {(fillRatio * 100).toFixed(0)}% FULL
        </text>

        {manholes.map((x, i) => {
          const gy = 110 + (x / 1200) * 80;
          const py = pipeY(x);
          return (
            <g key={i}>
              <rect x={x - 14} y={gy + 6} width="28" height={py - gy - 6} fill="currentColor" className="text-surface" stroke="currentColor" strokeWidth="1.5" />
              <rect x={x - 14} y={gy + 6} width="28" height={py - gy - 6} fill="none" stroke="currentColor" className="text-foreground" strokeWidth="1.5" />
              <rect x={x - 18} y={gy + 2} width="36" height="6" fill="currentColor" className="text-foreground" />
              <text x={x} y={gy - 4} textAnchor="middle" className="fill-current text-muted-foreground" style={{ fontSize: 9, fontFamily: "JetBrains Mono, monospace" }}>MH{i + 1}</text>
            </g>
          );
        })}

        <g>
          <rect x="1080" y={pipeY(1080) - 30} width="90" height="70" fill="currentColor" className="text-surface" stroke="currentColor" strokeWidth="1.5" />
          <rect x="1080" y={pipeY(1080) - 30} width="90" height="70" fill="none" stroke="currentColor" className="text-foreground" strokeWidth="1.5" />
          <text x="1125" y={pipeY(1080) + 60} textAnchor="middle" className="fill-current text-foreground" style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", fontWeight: 600 }}>
            OUTFALL / WWTP
          </text>
        </g>

        <g style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10 }}>
          <text x="160" y="420" textAnchor="middle" className="fill-current text-accent" fontWeight="700">
            MANHOLE · COVER {grv.trenchDepthM.toFixed(1)} m
          </text>
          <text x="600" y="460" textAnchor="middle" className="fill-current text-foreground" fontWeight="700">
            CAPACITY {manningCapacityLs(grv.diameterMm, grv.slopePct, grv.manningN).toFixed(0)} L/s
          </text>
        </g>
      </svg>
    </div>
  );
}

/* ============================ Report builder ============================ */

function buildReportHtml(opts: {
  mode: Mode; view: ViewMode; preset: Preset;
  vac: VacuumParams; grv: GravityParams;
}) {
  const { mode, view, preset, vac, grv } = opts;
  const modes: Mode[] = view === "compare" ? ["gravity", "vacuum"] : [mode];
  const cap = manningCapacityLs(grv.diameterMm, grv.slopePct, grv.manningN);
  const vel = manningVelocity(grv.diameterMm, grv.slopePct, grv.manningN);

  const icmRows = (m: Mode): Array<[string, string, string]> => m === "vacuum"
    ? [
        ["House lateral", "Subcatchment + Node", "Standard wastewater profile."],
        ["Collection sump", "Storage Node", `Trigger ${vac.sumpTriggerM.toFixed(2)} m.`],
        ["Interface valve", "RTC Orifice", `Cd = ${vac.valveCd.toFixed(2)}; pulse ${vac.pulseS}s.`],
        ["Vacuum main", "User-defined Conduit", `D = ${vac.diameterMm} mm; lift @ ${vac.liftSpacingM} m; Preissmann slot.`],
        ["Reservoir", "Storage Node", "Area-depth of tank."],
        ["Vacuum generators", "Fixed-head outfall", `Head ≈ −${(vac.diffPressureBar * 10).toFixed(1)} mH₂O.`],
        ["Discharge pumps", "Pump (H–Q)", "Level-based start/stop."],
      ]
    : [
        ["House lateral", "Subcatchment + Node", "Standard diurnal."],
        ["Manhole", "Manhole Node", `Cover/invert at ${grv.trenchDepthM.toFixed(1)} m.`],
        ["Trunk sewer", "Conduit (circular)", `D = ${grv.diameterMm} mm; n = ${grv.manningN.toFixed(3)}; S = ${grv.slopePct.toFixed(2)}%.`],
        ["Capacity check", "Computed (Manning)", `Q_full ≈ ${cap.toFixed(0)} L/s; v ≈ ${vel.toFixed(2)} m/s; peak ${grv.peakFlowLs} L/s.`],
        ["Wet well", "Storage Node", "Pump start/stop range."],
        ["Outfall", "Outfall Node", "Free / fixed-head / tidal."],
      ];

  const section = (m: Mode) => `
    <section>
      <h2>${m === "vacuum" ? "Vacuum mode" : "Gravity mode"}</h2>
      <h3>Parameters</h3>
      <table>
        ${(m === "vacuum"
          ? [
              ["Main diameter", `${vac.diameterMm} mm`],
              ["Differential pressure", `−${vac.diffPressureBar.toFixed(2)} bar`],
              ["Sawtooth lift spacing", `${vac.liftSpacingM} m`],
              ["Sump trigger", `${vac.sumpTriggerM.toFixed(2)} m`],
              ["Valve Cd", vac.valveCd.toFixed(2)],
              ["Valve pulse", `${vac.pulseS} s`],
            ]
          : [
              ["Pipe diameter", `${grv.diameterMm} mm`],
              ["Slope", `${grv.slopePct.toFixed(2)} %`],
              ["Manning's n", grv.manningN.toFixed(3)],
              ["Trench depth", `${grv.trenchDepthM.toFixed(1)} m`],
              ["Peak design flow", `${grv.peakFlowLs} L/s`],
              ["Full-pipe capacity", `${cap.toFixed(0)} L/s`],
              ["Full-pipe velocity", `${vel.toFixed(2)} m/s`],
            ]
        ).map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("")}
      </table>
      <h3>ICM Object Mapping</h3>
      <table>
        <thead><tr><th>Physical</th><th>ICM construct</th><th>Notes</th></tr></thead>
        <tbody>
          ${icmRows(m).map(([a, b, c]) => `<tr><td>${a}</td><td><code>${b}</code></td><td>${c}</td></tr>`).join("")}
        </tbody>
      </table>
    </section>
  `;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Vacuum Sewer Report · ${view === "compare" ? "Comparison" : mode} · ${preset}</title>
<style>
  :root { color-scheme: light; }
  body { font-family: -apple-system, system-ui, sans-serif; max-width: 880px; margin: 2rem auto; padding: 0 1.5rem; color: #1f2937; line-height: 1.55; }
  h1 { font-size: 1.8rem; margin-bottom: .25rem; }
  h2 { margin-top: 2.5rem; border-bottom: 2px solid #1f2937; padding-bottom: .25rem; }
  h3 { margin-top: 1.5rem; color: #b45309; font-size: .9rem; text-transform: uppercase; letter-spacing: .08em; }
  table { border-collapse: collapse; width: 100%; margin-top: .5rem; font-size: 14px; }
  th, td { text-align: left; padding: .5rem .75rem; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  thead th { background: #1f2937; color: #fff; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; }
  code { font-family: ui-monospace, monospace; color: #b45309; }
  .meta { color: #6b7280; font-size: 13px; margin-bottom: 2rem; }
</style>
</head>
<body>
  <h1>Vacuum Sewer Modeling Report</h1>
  <p class="meta">Scenario preset: <strong>${preset}</strong> · View: <strong>${view}</strong> · Generated ${new Date().toISOString()}</p>
  ${modes.map(section).join("")}
  <h2>Notes</h2>
  <p>Generated from the interactive Vacuum Sewers monograph. Validate all values against vendor specifications and local design standards before committing to a model.</p>
</body>
</html>`;
}
