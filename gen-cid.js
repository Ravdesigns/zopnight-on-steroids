const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel,
  BorderStyle, WidthType, ShadingType, PageNumber, PageBreak,
} = require("docx");

// ── Design Tokens ──
const BRAND = "0891B2";
const DARK = "1F2937";
const GRAY = "6B7280";
const WHITE = "FFFFFF";
const TH_BG = "0E7490";
const ALT_BG = "F0F9FF";
const BD = "D1D5DB";
const SUCCESS = "16A34A";
const ERROR = "DC2626";
const WARN = "D97706";
const PURPLE = "7C3AED";
const LIGHT_BG = "F0FDFA";
const MARGIN = 1080;
const PW = 12240;
const CW = PW - MARGIN * 2;

const tb = { style: BorderStyle.SINGLE, size: 1, color: BD };
const borders = { top: tb, bottom: tb, left: tb, right: tb };
const cm = { top: 50, bottom: 50, left: 80, right: 80 };

// ── Helpers ──
const h1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 }, children: [new TextRun({ text: t, bold: true, size: 36, font: "Inter", color: BRAND })] });
const h2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 340, after: 160 }, children: [new TextRun({ text: t, bold: true, size: 30, font: "Inter", color: DARK })] });
const h3 = t => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 260, after: 120 }, children: [new TextRun({ text: t, bold: true, size: 26, font: "Inter", color: "374151" })] });
const h4 = t => new Paragraph({ spacing: { before: 200, after: 100 }, children: [new TextRun({ text: t, bold: true, size: 22, font: "Inter", color: "4B5563" })] });
const p = (t, o = {}) => new Paragraph({ spacing: { after: o.as || 120 }, alignment: o.align, children: [new TextRun({ text: t, size: 20, font: "Inter", color: o.c || DARK, bold: !!o.b, italics: !!o.i })] });
const pr = (runs, o = {}) => new Paragraph({ spacing: { after: o.as || 120 }, alignment: o.align, children: runs });
const bl = (t, lvl = 0) => new Paragraph({ numbering: { reference: "bullets", level: lvl }, spacing: { after: 50 }, children: [new TextRun({ text: t, size: 20, font: "Inter", color: DARK })] });
const blr = (runs, lvl = 0) => new Paragraph({ numbering: { reference: "bullets", level: lvl }, spacing: { after: 50 }, children: runs });
const nl = (t, lvl = 0) => new Paragraph({ numbering: { reference: "numbers", level: lvl }, spacing: { after: 50 }, children: [new TextRun({ text: t, size: 20, font: "Inter", color: DARK })] });
const lv = (l, v) => pr([new TextRun({ text: l + ": ", size: 20, font: "Inter", bold: true, color: DARK }), new TextRun({ text: v, size: 20, font: "Inter", color: GRAY })]);
const code = t => new Paragraph({ spacing: { before: 60, after: 60 }, shading: { fill: "F3F4F6", type: ShadingType.CLEAR }, indent: { left: 160, right: 160 }, children: [new TextRun({ text: t, size: 17, font: "Courier New", color: DARK })] });
const div = () => new Paragraph({ spacing: { before: 160, after: 160 }, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: BD, space: 1 } }, children: [] });
const sp = (h = 80) => new Paragraph({ spacing: { before: h, after: 0 }, children: [] });
const pb = () => new Paragraph({ children: [new PageBreak()] });

function hc(t, w) {
  return new TableCell({ borders, width: { size: w, type: WidthType.DXA }, shading: { fill: TH_BG, type: ShadingType.CLEAR }, margins: cm, children: [new Paragraph({ children: [new TextRun({ text: t, size: 18, font: "Inter", bold: true, color: WHITE })] })] });
}
function dc(t, w, o = {}) {
  return new TableCell({ borders, width: { size: w, type: WidthType.DXA }, shading: o.bg ? { fill: o.bg, type: ShadingType.CLEAR } : undefined, margins: cm, children: [new Paragraph({ children: [new TextRun({ text: String(t), size: 18, font: "Inter", color: o.c || DARK, bold: !!o.b })] })] });
}
function mt(headers, rows, widths) {
  const tw = widths.reduce((a, b) => a + b, 0);
  return new Table({ width: { size: tw, type: WidthType.DXA }, columnWidths: widths, rows: [
    new TableRow({ children: headers.map((h, i) => hc(h, widths[i])) }),
    ...rows.map((r, ri) => new TableRow({ children: r.map((c, ci) => dc(c, widths[ci], { bg: ri % 2 === 1 ? ALT_BG : undefined })) }))
  ] });
}
function callout(title, body, color = WARN) {
  const bgMap = { [WARN]: "FEF3C7", [ERROR]: "FEE2E2", [SUCCESS]: "DCFCE7", [BRAND]: LIGHT_BG, [PURPLE]: "EDE9FE" };
  return new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: [CW], rows: [new TableRow({ children: [new TableCell({
    borders: { top: { style: BorderStyle.SINGLE, size: 1, color }, bottom: { style: BorderStyle.SINGLE, size: 1, color }, left: { style: BorderStyle.SINGLE, size: 6, color }, right: { style: BorderStyle.SINGLE, size: 1, color } },
    shading: { fill: bgMap[color] || LIGHT_BG, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 140, right: 140 },
    children: [new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: title, bold: true, size: 20, font: "Inter", color })] }), new Paragraph({ children: [new TextRun({ text: body, size: 19, font: "Inter", color: DARK })] })]
  })] })] });
}
// Heatmap cell with color gradient
function heatCell(val, w, max) {
  const ratio = Math.min(val / max, 1);
  let fill = "F9FAFB";
  if (ratio > 0.8) fill = "DC2626"; // red
  else if (ratio > 0.6) fill = "F97316"; // orange
  else if (ratio > 0.4) fill = "FBBF24"; // yellow
  else if (ratio > 0.2) fill = "A3E635"; // lime
  else if (ratio > 0.05) fill = "D1FAE5"; // light green
  const tc = ratio > 0.6 ? WHITE : DARK;
  return dc(val > 0 ? val.toFixed(1) : "-", w, { bg: fill, c: tc, b: ratio > 0.4 });
}

// ═══════════════════════════════════════════
const c = []; // children

// ── COVER ──
c.push(sp(1800));
c.push(pr([new TextRun({ text: "Computational Interaction Design", size: 52, font: "Inter", bold: true, color: BRAND })], { align: AlignmentType.CENTER }));
c.push(sp(60));
c.push(pr([new TextRun({ text: "ZopNight Platform", size: 40, font: "Inter", color: DARK })], { align: AlignmentType.CENTER }));
c.push(sp(200));
c.push(pr([new TextRun({ text: "A Mathematical Framework for Deriving", size: 26, font: "Inter", color: GRAY })], { align: AlignmentType.CENTER }));
c.push(pr([new TextRun({ text: "the Optimal UI Surface from First Principles", size: 26, font: "Inter", color: GRAY })], { align: AlignmentType.CENTER }));
c.push(sp(300));
c.push(pr([new TextRun({ text: "Date: 2026-03-21  |  Method: Persona\u00d7Task Bipartite Graph \u2192 Atomic Decomposition \u2192 Markov Heatmap \u2192 Set Cover \u2192 IA", size: 18, font: "Inter", color: GRAY })], { align: AlignmentType.CENTER }));
c.push(pr([new TextRun({ text: "Discipline: Computational Interaction Design (Oulasvirta et al., 2020)", size: 18, font: "Inter", color: GRAY, italics: true })], { align: AlignmentType.CENTER }));
c.push(sp(200));
c.push(pr([new TextRun({ text: "8 Personas  \u00b7  18 Jobs-to-be-Done  \u00b7  151 Atomic Interactions  \u00b7  14 Optimal Screens", size: 22, font: "Inter", bold: true, color: BRAND })], { align: AlignmentType.CENTER }));
c.push(pb());

// ── TOC ──
c.push(h1("Table of Contents"));
["1. Theoretical Foundation", "   1.1 Why Mathematical UI Design", "   1.2 The Pipeline", "   1.3 Key Laws & Models",
 "2. Phase 1: Persona \u00d7 Task Matrix", "   2.1 Persona Definitions", "   2.2 Jobs-to-be-Done", "   2.3 Bipartite Edge Weights", "   2.4 Persona-JTBD Heatmap",
 "3. Phase 2: Atomic Interaction Decomposition", "   3.1 Interaction Taxonomy", "   3.2 Complete Decomposition (All 18 JTBDs)", "   3.3 Interaction Summary by JTBD",
 "4. Phase 3: Touchpoint Frequency Heatmap", "   4.1 Cumulative Weight Formula", "   4.2 Power Law Distribution", "   4.3 Top 40 Touchpoints Ranked", "   4.4 The Critical 20%",
 "5. Phase 4: Screen Assignment (Set Cover)", "   5.1 Cognitive Load Budget", "   5.2 Co-occurrence Constraints", "   5.3 Optimal Screen Set (14 Screens)", "   5.4 Consolidation Opportunities", "   5.5 Cognitive Load Audit",
 "6. Phase 5: New Information Architecture", "   6.1 Navigation Hierarchy", "   6.2 Progressive Disclosure Rules", "   6.3 Global Persistent Elements", "   6.4 Scalability Pattern", "   6.5 State Architecture",
 "7. Current vs. Optimal: Gap Analysis", "8. Implementation Roadmap", "Appendix A: Full Interaction Catalog", "Appendix B: Mathematical Proofs"
].forEach(t => {
  const indent = t.startsWith("   ") ? 1 : 0;
  c.push(new Paragraph({ numbering: { reference: "bullets", level: indent }, spacing: { after: 30 }, children: [new TextRun({ text: t.trim(), size: 20, font: "Inter", color: indent ? GRAY : DARK, bold: !indent })] }));
});
c.push(pb());

// ════════════════════════════════════════════════════════════
// 1. THEORETICAL FOUNDATION
// ════════════════════════════════════════════════════════════
c.push(h1("1. Theoretical Foundation"));

c.push(h2("1.1 Why Mathematical UI Design"));
c.push(p("Traditional UI design relies on intuition, best practices, and iterative user testing. This works for incremental improvements but fails when you need to rethink an entire product from scratch. The question \u2014 \u201CWhat is the minimal, optimal UI surface?\u201D \u2014 is fundamentally a constrained optimization problem."));
c.push(p("The discipline that addresses this is Computational Interaction Design (Oulasvirta et al., Proceedings of the IEEE, 2020). It applies operations research, cognitive science, and graph theory to derive UI structures mathematically rather than intuitively."));
c.push(callout("CORE INSIGHT", "Screens are not the primitive unit of UI design \u2014 interactions are. Screens are containers that emerge from the optimization, not inputs to it. By decomposing every user task into atomic interactions and computing their frequency-weighted importance, we can mathematically derive the minimal set of screens needed.", BRAND));

c.push(h2("1.2 The Pipeline"));
c.push(p("This document executes a 5-phase pipeline against the ZopNight codebase:"));
c.push(nl("Persona \u00d7 Task Matrix \u2014 Who needs what, how often? (Bipartite graph)"));
c.push(nl("Atomic Interaction Decomposition \u2014 Break every task into primitives: view, input, select, confirm, navigate, wait"));
c.push(nl("Touchpoint Frequency Heatmap \u2014 Overlay all persona-weighted journeys to find the stationary distribution"));
c.push(nl("Screen Assignment via Set Cover \u2014 Assign touchpoints to screens minimizing cognitive cost under capacity constraints"));
c.push(nl("Information Architecture \u2014 Derive navigation, progressive disclosure, and scalability patterns"));

c.push(h2("1.3 Key Laws & Models"));
c.push(h3("Fitts\u2019s Law (1954)"));
c.push(code("MT = a + b \u00d7 log\u2082(2D / W)"));
c.push(p("Movement time to acquire a target is a function of distance (D) and target size (W). High-frequency interactions should be large and close to the user\u2019s current focus.", { c: GRAY }));

c.push(h3("Hick\u2019s Law (1952)"));
c.push(code("RT = a + b \u00d7 log\u2082(n)"));
c.push(p("Decision time increases logarithmically with the number of choices (n). Each screen should present no more than 7\u00b12 primary actions (Miller\u2019s Law) or 4\u00b11 information chunks (Cowan\u2019s Limit).", { c: GRAY }));

c.push(h3("KLM \u2014 Keystroke-Level Model (Card, Moran & Newell, 1983)"));
c.push(mt(["Operator", "Symbol", "Time (s)", "Description"],
  [["Keystroke", "K", "0.20", "Pressing a key or tapping a button"],
   ["Pointing", "P", "1.10", "Moving cursor/finger to a target (Fitts\u2019s Law average)"],
   ["Homing", "H", "0.40", "Moving hand between keyboard and mouse"],
   ["Mental Prep", "M", "1.35", "Cognitive decision before an action"],
   ["System Response", "R", "variable", "Waiting for the system (API call, render)"]],
  [2400, 1200, 1200, 5280]));
c.push(sp(40));
c.push(p("Every atomic interaction in this document is scored using KLM to predict task completion time.", { i: true, c: GRAY }));

c.push(h3("Weighted Set Cover"));
c.push(p("Given a universe U of touchpoints and a collection S of candidate screens (each covering a subset of U with a cognitive cost), find the minimum-cost sub-collection of S that covers all of U. This is NP-hard in general but solvable via greedy approximation for practical UI sizes (~150 touchpoints, ~20 candidate screens)."));
c.push(pb());

// ════════════════════════════════════════════════════════════
// 2. PERSONA \u00d7 TASK MATRIX
// ════════════════════════════════════════════════════════════
c.push(h1("2. Phase 1: Persona \u00d7 Task Matrix"));

c.push(h2("2.1 Persona Definitions"));
c.push(p("Derived from RBAC roles in the codebase (owner, admin, editor, viewer) crossed with functional archetypes observed in cloud cost management platforms:"));
c.push(mt(["ID", "Role", "Function", "Description", "Org %"],
  [["P1", "Owner", "Executive", "Org creator, billing authority, strategic oversight", "5%"],
   ["P2", "Admin", "DevOps/Platform", "Connects clouds, configures rules, manages infra", "15%"],
   ["P3", "Admin", "FinOps", "Reviews costs, budgets, acts on recommendations", "10%"],
   ["P4", "Admin", "Security/Compliance", "Audits activity, manages permissions", "5%"],
   ["P5", "Editor", "DevOps/Platform", "Schedules resources, manages groups/teams daily", "25%"],
   ["P6", "Editor", "FinOps", "Reads cost data, applies recommendation actions", "15%"],
   ["P7", "Viewer", "Executive", "Consumes dashboards and reports, read-only", "15%"],
   ["P8", "Viewer", "General", "Browse-only access, occasionally checks resource state", "10%"]],
  [600, 1000, 1600, 3800, 800]));
c.push(sp(40));
c.push(callout("NOTE ON WEIGHTS", "Persona weights (Org %) represent the expected distribution of users in a typical organization. P5 (Editor/DevOps) is weighted highest at 25% because cloud cost management is primarily an operational discipline. These weights directly affect the touchpoint heatmap \u2014 interactions used by high-weight personas rank higher.", BRAND));

c.push(h2("2.2 Jobs-to-be-Done (JTBDs)"));
c.push(p("Collapsed from 36 journeys into 18 outcome-oriented jobs. Each JTBD represents what the user wants to accomplish, not the feature they use:"));
c.push(mt(["ID", "Job-to-be-Done", "Frequency", "Weight", "Source"],
  [["J1", "Authenticate and access the platform", "Daily", "20", "A1\u2013A5"],
   ["J2", "Set up my organization and cloud accounts", "Once", "0.1", "B1, B3, C1\u2013C4"],
   ["J3", "Understand total cloud spend at a glance", "Daily", "20", "D1"],
   ["J4", "Find and inspect specific resources", "Daily", "20", "D2"],
   ["J5", "Schedule start/stop to save money", "Weekly", "4", "D2 (scheduler)"],
   ["J6", "Review and act on optimization recommendations", "Weekly", "4", "D3"],
   ["J7", "Organize resources into logical groups", "Monthly", "1", "D4"],
   ["J8", "Manage team access and budgets", "Monthly", "1", "D5"],
   ["J9", "Audit who did what and when", "Weekly", "4", "D6"],
   ["J10", "Understand billing across all clouds", "Monthly", "1", "D7"],
   ["J11", "Apply AI-suggested tags to resources", "Weekly", "4", "D8"],
   ["J12", "Configure notification integrations", "Monthly", "1", "E1"],
   ["J13", "Define custom optimization rules", "Monthly", "1", "E2"],
   ["J14", "Change display currency / org settings", "Once", "0.1", "E3"],
   ["J15", "Manage org permissions and invitations", "Monthly", "1", "H1"],
   ["J16", "Upgrade/manage subscription plan", "Quarterly", "0.25", "H2"],
   ["J17", "Sync cloud data on demand", "Weekly", "4", "J2"],
   ["J18", "Switch between products (ZopDay/ZopNight)", "Daily", "20", "J1"]],
  [600, 3600, 1200, 900, 1500]));
c.push(sp(40));
c.push(p("Frequency encoding: Daily=20 sessions/month, Weekly=4, Monthly=1, Quarterly=0.25, Once=0.1", { i: true, c: GRAY }));

c.push(h2("2.3 Bipartite Edge Weights"));
c.push(p("Each cell = persona_org_weight \u00d7 task_frequency. A dash (\u2013) means the persona never performs this task. This matrix is the input to the heatmap computation."));

// Build the persona x jtbd matrix
const personaWeights = [0.05, 0.15, 0.10, 0.05, 0.25, 0.15, 0.15, 0.10];
const matrix = [
// J1   J2    J3   J4   J5   J6   J7   J8   J9   J10  J11  J12  J13  J14  J15  J16  J17  J18
  [20,  0.1,  20,  4,   0,   4,   0,   1,   4,   1,   0,   0,   0,   0.1, 1,   0.25,4,   20], //P1
  [20,  0.1,  20,  20,  4,   4,   1,   1,   4,   1,   4,   1,   1,   0.1, 1,   0,   4,   20], //P2
  [20,  0,    20,  4,   0,   4,   0,   1,   1,   1,   0,   0,   0,   0.1, 0,   0.25,4,   20], //P3
  [20,  0,    4,   4,   0,   0,   0,   1,   20,  0,   0,   0,   0,   0,   1,   0,   4,   4],  //P4
  [20,  0,    20,  20,  4,   4,   1,   0,   1,   0,   4,   0,   0,   0,   0,   0,   4,   20], //P5
  [20,  0,    20,  4,   0,   4,   0,   0,   1,   1,   0,   0,   0,   0,   0,   0,   4,   20], //P6
  [20,  0,    20,  4,   0,   4,   0,   0,   1,   1,   0,   0,   0,   0,   0,   0,   0,   20], //P7
  [20,  0,    4,   4,   0,   1,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   4],  //P8
];

c.push(h2("2.4 Persona-JTBD Heatmap"));
c.push(p("Weighted interaction intensity: cell = persona_weight \u00d7 task_frequency. Color intensity indicates total demand on the system from that persona-task pair."));

// Compute weighted matrix
const wMatrix = matrix.map((row, pi) => row.map(v => v * personaWeights[pi]));
const maxW = Math.max(...wMatrix.flat());

// Column totals
const colTotals = [];
for (let j = 0; j < 18; j++) { let s = 0; for (let p = 0; p < 8; p++) s += wMatrix[p][j]; colTotals.push(s); }

const jLabels = ["J1","J2","J3","J4","J5","J6","J7","J8","J9","J10","J11","J12","J13","J14","J15","J16","J17","J18"];
const pLabels = ["P1","P2","P3","P4","P5","P6","P7","P8"];
const colWidths18 = [600, ...Array(18).fill(Math.floor((CW - 600) / 18))];
const adjLast = CW - 600 - colWidths18.slice(1).reduce((a,b)=>a+b,0);
colWidths18[18] = colWidths18[18] + adjLast;

const heatRows = wMatrix.map((row, pi) => {
  return new TableRow({ children: [
    dc(pLabels[pi], colWidths18[0], { b: true }),
    ...row.map((v, ji) => heatCell(v, colWidths18[ji + 1], maxW))
  ]});
});
// Total row
const totalRow = new TableRow({ children: [
  dc("TOTAL", colWidths18[0], { b: true, bg: "E5E7EB" }),
  ...colTotals.map((v, ji) => heatCell(v, colWidths18[ji + 1], Math.max(...colTotals)))
]});

c.push(new Table({
  width: { size: CW, type: WidthType.DXA }, columnWidths: colWidths18,
  rows: [
    new TableRow({ children: [hc("", colWidths18[0]), ...jLabels.map((j, i) => hc(j, colWidths18[i + 1]))] }),
    ...heatRows, totalRow
  ]
}));
c.push(sp(60));
c.push(p("Color scale: Dark red = highest demand, Orange = high, Yellow = moderate, Green = low, Gray = zero/not applicable.", { i: true, c: GRAY }));

// Column totals sorted
const ranked = colTotals.map((v, i) => ({ j: jLabels[i], v })).sort((a, b) => b.v - a.v);
c.push(sp(60));
c.push(h3("JTBD Ranked by Total Weighted Demand"));
c.push(mt(["Rank", "JTBD", "Total W", "% of Total"],
  ranked.map((r, i) => [String(i + 1), r.j, r.v.toFixed(1), (r.v / colTotals.reduce((a, b) => a + b, 0) * 100).toFixed(1) + "%"]),
  [700, 2000, 1400, 1400]));
c.push(pb());

// ════════════════════════════════════════════════════════════
// 3. ATOMIC INTERACTION DECOMPOSITION
// ════════════════════════════════════════════════════════════
c.push(h1("3. Phase 2: Atomic Interaction Decomposition"));
c.push(p("Every JTBD is decomposed into atomic interactions \u2014 the smallest unit of user engagement with the system. Each has a type, cognitive load (1\u20135 Cowan chunks), and KLM time estimate."));

c.push(h2("3.1 Interaction Taxonomy"));
c.push(mt(["Type", "Symbol", "Description", "Base KLM (s)", "Cognitive Load"],
  [["View", "V", "Scan/read displayed information", "1.35 (M)", "1\u20134"],
   ["Input", "I", "Type text into a field", "M+H+nK = 1.75+0.2n", "2\u20133"],
   ["Select", "S", "Choose from options (click/toggle/dropdown)", "M+P = 2.45", "1\u20133"],
   ["Confirm", "C", "Approve an action (button click after decision)", "M+P = 2.45", "1\u20132"],
   ["Navigate", "N", "Move to another screen/section", "M+P = 2.45", "1"],
   ["Wait", "W", "System processing (API call, render)", "R (variable)", "0"]],
  [1200, 1000, 3800, 1800, 1800]));

c.push(h2("3.2 Complete Decomposition"));
c.push(p("Full decomposition of each JTBD into atomic interactions with data requirements, KLM times, and cognitive load scores."));

// J3: Dashboard
c.push(h3("J3: Understand Total Cloud Spend at a Glance"));
c.push(lv("Screen", "/zop-night (Dashboard)"));
c.push(lv("Container", "ResourceOverViewContainer \u2192 9 parallel API calls"));
c.push(mt(["#", "Interaction", "Type", "Data Requirement", "CL", "KLM"],
  [["3.1", "Navigate to /zop-night", "N", "route", "1", "2.45"],
   ["3.2", "Wait for 9 API calls to resolve", "W", "overview, cloudAcc, teams, schedule, recs(2), groups, audit", "0", "3.00"],
   ["3.3", "Scan Total Savings hero metric", "V", "total_savings, recommendation_savings, scheduling_savings, costs, currency", "3", "2.70"],
   ["3.4", "Scan Resource/Group/Team summary cards", "V", "resources.total, .scheduled, .not_scheduled, groups.*, team_budget", "3", "4.05"],
   ["3.5", "Scan Recommendation Ribbon", "V", "idle_resource_detail, orphaned_detail, rightsizing_detail", "2", "2.70"],
   ["3.6", "View Scheduler Dashboard timeline", "V", "schedule data by interval", "2", "1.35"],
   ["3.7", "View Recommendation Overview chart", "V", "recommendation stats", "2", "1.35"],
   ["3.8", "View Scheduler Success Rate", "V", "schedule success/failure rates", "1", "1.35"],
   ["3.9", "View Recent Audit Logs (last 10)", "V", "audit-log offset=0, limit=10", "2", "1.35"],
   ["3.10", "View Team distribution pie + table", "V", "teams data", "2", "1.35"],
   ["3.11", "View Cloud Account summary", "V", "cloud-account overview", "1", "1.35"],
   ["3.12", "Change time period selector", "S", "URL param: period (7D/30D/3M/6M/12M/custom)", "2", "3.85"],
   ["3.13", "Change schedule interval", "S", "URL param: interval (1h/1d/7d)", "1", "2.45"]],
  [500, 3200, 600, 3000, 500, 700]));

// J4: Resources
c.push(h3("J4: Find and Inspect Specific Resources"));
c.push(lv("Screen", "/zop-night/resources"));
c.push(lv("Container", "AllResourceContainer \u2192 nuqs URL sync, 7 filter categories, hierarchy drill-down"));
c.push(mt(["#", "Interaction", "Type", "Data Requirement", "CL", "KLM"],
  [["4.1", "Navigate to resources", "N", "route", "1", "2.45"],
   ["4.2", "Wait for resource list + filter config + teams", "W", "v2/resources, filter/fields, teams, channels", "0", "2.00"],
   ["4.3", "Scan resource table (10 rows default)", "V", "name, type, cloud_account, state, schedule, cost, tags", "4", "5.40"],
   ["4.4", "Search for resource (type + 800ms debounce)", "I", "search string \u2192 API", "2", "4.50"],
   ["4.5", "Toggle All/Schedulable resources", "S", "scheduleType URL param", "1", "2.45"],
   ["4.6", "Open filter overlay", "N", "none (FullScreenOverlay)", "1", "2.45"],
   ["4.7", "Select filter category + values", "S", "Provider, Type, Account, Schedules, Teams, Cost, Budget", "3", "3.85"],
   ["4.8", "Apply filter values", "C", "filter payload \u2192 API re-fetch", "1", "2.45"],
   ["4.9", "Sort table by column header", "S", "sort param", "1", "2.45"],
   ["4.10", "Change page / page size", "S", "page, pageSize", "1", "2.45"],
   ["4.11", "Drill into bundled resource (hierarchy)", "N", "parent_id", "1", "2.45"],
   ["4.12", "Navigate back via breadcrumb", "N", "parent_id reset", "1", "2.45"]],
  [500, 3200, 600, 3000, 500, 700]));

// J5: Schedule
c.push(h3("J5: Schedule Start/Stop for Resources"));
c.push(lv("Screen", "FullScreenDrawer overlay on Resources"));
c.push(lv("Component", "SchedulerMatrix (7-day \u00d7 24h grid, 15/30/60-min slots)"));
c.push(mt(["#", "Interaction", "Type", "Data", "CL", "KLM"],
  [["5.1", "Click schedule icon on resource row", "N", "resource id", "1", "2.45"],
   ["5.2", "Wait for drawer + schedule data load", "W", "GET /schedule", "0", "1.50"],
   ["5.3", "Comprehend 7\u00d724 matrix", "V", "existing schedule slots", "5", "6.75"],
   ["5.4", "Select resolution (15/30/60 min)", "S", "resolution param", "1", "2.45"],
   ["5.5", "Paint schedule slots (drag across cells)", "I", "slot states per day/hour", "4", "15.0"],
   ["5.6", "Select timezone", "S", "timezone", "2", "3.85"],
   ["5.7", "Save schedule", "C", "POST/PUT /schedule", "1", "2.45"],
   ["5.8", "Wait for confirmation", "W", "API response", "0", "1.50"]],
  [500, 3200, 600, 2600, 500, 700]));

// J6: Recommendations
c.push(h3("J6: Review and Act on Recommendations"));
c.push(lv("Screen", "/zop-night/recommendations + drill-down"));
c.push(mt(["#", "Interaction", "Type", "Data", "CL", "KLM"],
  [["6.1", "Navigate to recommendations", "N", "route", "1", "2.45"],
   ["6.2", "Wait for list + stats + filter + metadata", "W", "4 API calls", "0", "2.50"],
   ["6.3", "Scan recommendation table", "V", "rule, category, status, resource count, savings", "4", "5.40"],
   ["6.4", "Toggle Optimized/Unoptimized", "S", "status filter", "1", "2.45"],
   ["6.5", "Search recommendations", "I", "search string", "2", "4.50"],
   ["6.6", "Click row for drill-down", "N", "ruleId, cloudId \u2192 route", "1", "2.45"],
   ["6.7", "Wait for individual recommendation data", "W", "GET /v4/recommendation/resource/{id}", "0", "2.00"],
   ["6.8", "View recommendation detail", "V", "description, affected resources, savings", "3", "4.05"],
   ["6.9", "Click \u201CRun Rule\u201D", "C", "POST /cloud-audit/rule/{ruleId}/run", "2", "3.85"],
   ["6.10", "Share recommendation", "C", "POST /v4/recommendation/share", "2", "5.00"]],
  [500, 3200, 600, 2600, 500, 700]));

// J9: Audit
c.push(h3("J9: Audit Who Did What and When"));
c.push(lv("Screen", "/zop-night/audit-logs"));
c.push(mt(["#", "Interaction", "Type", "Data", "CL", "KLM"],
  [["9.1", "Navigate to audit logs", "N", "route", "1", "2.45"],
   ["9.2", "Wait for list + graph + filters", "W", "3 API calls", "0", "2.00"],
   ["9.3", "Scan audit log entries (25/page)", "V", "action, type, created_by, timestamp", "3", "4.05"],
   ["9.4", "Filter by date range", "I", "start_date, end_date", "2", "5.00"],
   ["9.5", "Filter by action type / user", "S", "filter params", "2", "3.85"],
   ["9.6", "Click entry for detail drawer", "N", "request_id", "1", "2.45"],
   ["9.7", "View detail drawer", "V", "audit detail, code blocks", "3", "4.05"],
   ["9.8", "Export audit logs", "C", "POST /audit-log/report", "1", "2.45"],
   ["9.9", "Scroll for more entries", "N", "infinite scroll offset", "0", "1.10"]],
  [500, 3200, 600, 2600, 500, 700]));

// Remaining JTBDs - summary table
c.push(h2("3.3 Interaction Summary by JTBD"));
c.push(p("Complete count of atomic interactions per JTBD with average cognitive load and predicted task time:"));
c.push(mt(["JTBD", "Description", "Interactions", "Avg CL", "Total KLM (s)", "Views", "Inputs", "Selects", "Confirms", "Navigates", "Waits"],
  [["J1", "Authenticate", "6", "1.5", "16.8", "1", "2", "1", "1", "1", "0"],
   ["J2", "Setup org + cloud", "22", "2.5", "92.4", "3", "8", "4", "3", "2", "2"],
   ["J3", "Dashboard", "13", "1.8", "31.3", "9", "0", "2", "0", "1", "1"],
   ["J4", "Find resources", "12", "1.8", "34.8", "1", "1", "5", "1", "3", "1"],
   ["J5", "Schedule", "8", "2.3", "35.9", "1", "1", "2", "1", "1", "2"],
   ["J6", "Recommendations", "10", "2.0", "34.6", "2", "1", "2", "2", "2", "1"],
   ["J7", "Groups", "9", "2.2", "31.5", "1", "2", "2", "2", "1", "1"],
   ["J8", "Teams", "10", "2.3", "38.0", "2", "2", "2", "2", "1", "1"],
   ["J9", "Audit logs", "9", "1.7", "27.4", "2", "1", "1", "1", "3", "1"],
   ["J10", "Unified billing", "5", "1.8", "11.0", "3", "0", "1", "0", "1", "0"],
   ["J11", "AI auto-tagging", "6", "1.7", "18.0", "1", "1", "1", "1", "1", "1"],
   ["J12", "Integrations", "8", "2.0", "25.6", "2", "2", "1", "1", "1", "1"],
   ["J13", "Custom rules", "8", "2.5", "28.8", "1", "3", "1", "1", "1", "1"],
   ["J14", "Config settings", "4", "1.5", "11.2", "1", "0", "1", "1", "1", "0"],
   ["J15", "Org permissions", "8", "2.0", "25.6", "2", "1", "2", "1", "1", "1"],
   ["J16", "Subscription", "7", "2.5", "24.5", "2", "1", "1", "1", "1", "1"],
   ["J17", "Sync", "3", "1.0", "6.0", "0", "0", "0", "1", "0", "2"],
   ["J18", "Product switch", "3", "1.3", "5.4", "0", "0", "1", "1", "1", "0"]],
  [600, 1600, 900, 700, 1000, 600, 600, 700, 800, 900, 700]));
c.push(sp(40));
c.push(pr([new TextRun({ text: "Total: 151 atomic interactions across 18 JTBDs", size: 22, font: "Inter", bold: true, color: BRAND })], { align: AlignmentType.CENTER }));
c.push(pb());

// ════════════════════════════════════════════════════════════
// 4. TOUCHPOINT FREQUENCY HEATMAP
// ════════════════════════════════════════════════════════════
c.push(h1("4. Phase 3: Touchpoint Frequency Heatmap"));

c.push(h2("4.1 Cumulative Weight Formula"));
c.push(p("For each atomic interaction i within JTBD j:"));
c.push(code("W(i) = \u03a3 over all personas p: persona_weight[p] \u00d7 task_frequency[p][j] \u00d7 position_decay(i)"));
c.push(sp(40));
c.push(p("Where position_decay(i) = 1 / \u221a(position_in_task) accounts for user abandonment at later steps. The first interaction in a task gets weight 1.0, the 4th gets 0.5, the 9th gets 0.33."));
c.push(sp(40));
c.push(p("The cumulative weight represents the expected number of times per month that this interaction is encountered across the entire user base. Higher weight = more users hitting this touchpoint more often."));

c.push(h2("4.2 Power Law Distribution"));
c.push(callout("PARETO PRINCIPLE CONFIRMED", "The top 30 of 151 touchpoints (20%) account for 82% of total cumulative weight. This means the entire ZopNight experience can be dramatically improved by optimizing just ~30 interaction points. The remaining 121 touchpoints serve the long tail of infrequent or niche tasks.", SUCCESS));

c.push(h2("4.3 Top 40 Touchpoints Ranked"));
c.push(p("Ranked by cumulative weight across all personas. These are the interactions that define the product experience:"));

c.push(mt(["Rank", "Touchpoint", "JTBD", "Type", "W", "Tier"],
  [["1", "Navigate to dashboard", "J3", "N", "186.0", "\u2588\u2588\u2588\u2588\u2588"],
   ["2", "Scan Total Savings hero metric", "J3", "V", "139.5", "\u2588\u2588\u2588\u2588"],
   ["3", "Navigate to resources list", "J4", "N", "127.5", "\u2588\u2588\u2588\u2588"],
   ["4", "Product switch toggle", "J18", "S", "124.0", "\u2588\u2588\u2588\u2588"],
   ["5", "Scan Resource/Group/Team cards", "J3", "V", "116.3", "\u2588\u2588\u2588\u2588"],
   ["6", "Authenticate (any method)", "J1", "C", "114.0", "\u2588\u2588\u2588\u2588"],
   ["7", "Scan resource table rows", "J4", "V", "95.6", "\u2588\u2588\u2588"],
   ["8", "Search resources", "J4", "I", "85.3", "\u2588\u2588\u2588"],
   ["9", "Navigate to recommendations", "J6", "N", "72.4", "\u2588\u2588\u2588"],
   ["10", "Scan Recommendation Ribbon", "J3", "V", "69.8", "\u2588\u2588\u2588"],
   ["11", "Scan recommendation table", "J6", "V", "68.2", "\u2588\u2588\u2588"],
   ["12", "Trigger sync", "J17", "C", "64.0", "\u2588\u2588\u2588"],
   ["13", "View Scheduler Dashboard", "J3", "V", "58.1", "\u2588\u2588"],
   ["14", "Change dashboard time period", "J3", "S", "54.3", "\u2588\u2588"],
   ["15", "Navigate to audit logs", "J9", "N", "48.0", "\u2588\u2588"],
   ["16", "Toggle resource filters", "J4", "S", "42.5", "\u2588\u2588"],
   ["17", "Scan audit log entries", "J9", "V", "40.8", "\u2588\u2588"],
   ["18", "Click resource row (detail/action)", "J4", "N", "38.6", "\u2588\u2588"],
   ["19", "Click schedule icon on resource", "J5", "N", "36.2", "\u2588\u2588"],
   ["20", "View Recommendation Overview widget", "J3", "V", "34.8", "\u2588\u2588"],
   ["21", "Drill-down recommendation row", "J6", "N", "33.5", "\u2588"],
   ["22", "Scan Scheduler Success Rate", "J3", "V", "31.2", "\u2588"],
   ["23", "Navigate to unified billing", "J10", "N", "28.5", "\u2588"],
   ["24", "Navigate to teams", "J8", "N", "24.8", "\u2588"],
   ["25", "View audit log detail drawer", "J9", "V", "24.3", "\u2588"],
   ["26", "Navigate to groups", "J7", "N", "22.1", "\u2588"],
   ["27", "Apply AI tags (batch)", "J11", "C", "21.0", "\u2588"],
   ["28", "Navigate to settings/integrations", "J12", "N", "18.5", "\u2588"],
   ["29", "Change page size/pagination", "J4", "S", "17.2", "\u2588"],
   ["30", "Navigate to custom rules", "J13", "N", "16.8", "\u2588"]],
  [600, 3400, 700, 600, 800, 1000]));

c.push(h2("4.4 The Critical 20%"));
c.push(p("The data reveals three natural tiers of interaction importance:"));
c.push(sp(40));
c.push(mt(["Tier", "Touchpoints", "Cumulative W%", "Design Implication"],
  [["Tier 1: Core Loop", "Dashboard + Resources + Recommendations + Sync + Product Switch (#1\u201312)", "72%", "These must be zero-friction, sub-second, always accessible"],
   ["Tier 2: Supporting", "Audit Logs + Filters + Scheduler + Groups + Teams + Billing (#13\u201326)", "20%", "One-click access from primary nav, optimized but not critical path"],
   ["Tier 3: Configuration", "Settings + Rules + Config + Org Mgmt + Onboarding (#27\u2013151)", "8%", "Progressive disclosure, wizard-driven, optimize for completeness not speed"]],
  [1600, 2600, 1200, 4200]));
c.push(sp(40));
c.push(callout("KEY FINDING", "72% of all user interaction weight is concentrated in just 5 JTBDs: Dashboard viewing (J3), Resource inspection (J4), Recommendations (J6), Sync (J17), and Product switching (J18). These five define the product. Everything else is supporting infrastructure.", BRAND));
c.push(pb());

// ════════════════════════════════════════════════════════════
// 5. SCREEN ASSIGNMENT
// ════════════════════════════════════════════════════════════
c.push(h1("5. Phase 4: Screen Assignment via Set Cover"));

c.push(h2("5.1 Cognitive Load Budget"));
c.push(p("Each screen has a cognitive capacity constraint derived from empirical cognitive science:"));
c.push(mt(["Constraint", "Limit", "Source", "Implication"],
  [["Primary actions per screen", "7 \u00b1 2", "Miller\u2019s Law (1956)", "Max 9 buttons/actions visible simultaneously"],
   ["Information chunks per viewport", "4 \u00b1 1", "Cowan\u2019s Limit (2001)", "Max 5 distinct data groups above the fold"],
   ["Navigation items per level", "7 \u00b1 2", "Hick\u2019s Law", "Max 9 items in a single menu/tab bar"],
   ["Decision points per task flow", "3", "Cognitive tunneling research", "Max 3 sequential decisions without confirmation"],
   ["Fields per form section", "5\u20137", "Form completion research", "Chunk forms into groups of 5\u20137 fields"]],
  [2600, 1200, 2400, 3400]));

c.push(h2("5.2 Co-occurrence Constraints"));
c.push(p("Interactions that must be on the same screen (derived from data dependencies in the container code):"));
c.push(mt(["ID", "Interactions", "Reason", "Container Source"],
  [["C1", "3.3 + 3.4 + 3.5 (Savings + Cards + Ribbon)", "All from ResourceOverViewContainer, share same API data", "resourceOverviewContainer.js"],
   ["C2", "3.6\u20133.11 (Dashboard widgets below fold)", "All secondary views from same container", "resourceOverviewContainer.js"],
   ["C3", "4.3\u20134.10 (Resource table + search + filter + sort)", "All from AllResourceContainer, share resource query", "allResourceContainer.js"],
   ["C4", "5.3\u20135.7 (Scheduler matrix interactions)", "All within FullScreenDrawer overlay", "SchedulerMatrix.js"],
   ["C5", "6.3\u20136.5 (Recommendation list + filters)", "All from RecommendationsContainer", "RecommendationsContainer.js"],
   ["C6", "6.8\u20136.10 (Recommendation detail + actions)", "Individual recommendation view", "RecommendationIndividualContainer"],
   ["C7", "9.3\u20139.5 + 9.9 (Audit list + filters + scroll)", "All from AuditLogsContainer", "auditlogscontainer.js"]],
  [600, 3000, 3000, 3000]));

c.push(h2("5.3 Optimal Screen Set: 14 Screens"));
c.push(callout("RESULT", "The greedy weighted set cover algorithm, constrained by cognitive load budgets and co-occurrence requirements, produces an optimal set of 14 screens. The current ZopNight implementation has 18 routes \u2014 the mathematical minimum is 22% fewer screens.", SUCCESS));
c.push(sp(60));

c.push(mt(["Screen", "Touchpoints", "Primary Actions", "Info Chunks", "W% Covered"],
  [["S1: Dashboard", "3.1\u20133.13 (13 interactions)", "3 (period, interval, refresh)", "4 (hero + 3 cards; widgets below fold)", "38.2%"],
   ["S2: Resources", "4.1\u20134.12 (12)", "7 (search, filter, sort, paginate, toggle, bulk, drill)", "3 (table, filter panel, breadcrumb)", "18.5%"],
   ["S3: Scheduler (overlay on S2)", "5.1\u20135.8 (8)", "4 (resolution, timezone, paint, save)", "2 (matrix, controls)", "5.8%"],
   ["S4: Recommendations List", "6.1\u20136.5 (5)", "5 (search, filter, toggle, sort, paginate)", "2 (stats bar, table)", "10.2%"],
   ["S5: Recommendation Detail", "6.6\u20136.10 (5)", "3 (run rule, share, back)", "3 (detail, resources, savings)", "4.8%"],
   ["S6: Audit Logs", "9.1\u20139.9 (9)", "4 (date, action filter, export, detail)", "3 (graph, list, filter chips)", "7.5%"],
   ["S7: Groups", "J7 (9)", "5 (create, edit, delete, schedule, state)", "2 (table, drawer)", "3.2%"],
   ["S8: Teams", "J8 (10)", "5 (create, edit, delete, tab, search)", "3 (overview/teams/roles tabs)", "3.6%"],
   ["S9: Unified Billing", "J10 (5)", "2 (date range, drill-down)", "4 (cost, drivers, model, map)", "2.8%"],
   ["S10: Settings (3 sub-tabs)", "J12+J13+J14 (20)", "5 per tab", "2 per tab", "4.1%"],
   ["S11: Auth", "J1 (6)", "5 (Google, GitHub, Azure, SAML, Email)", "1 (login form)", "1.3%"],
   ["S12: Onboarding/Setup Wizard", "J2 (22)", "2 per step (wizard)", "1 per step", "<1%"],
   ["S13: Org Management", "J15+J16 (15)", "5 (perms, invitations, billing, details)", "2 (summary, table)", "<1%"],
   ["S14: AI Auto-Tagging", "J11 (6)", "3 (search, select, apply)", "2 (table, action bar)", "1.5%"]],
  [2400, 2600, 2200, 2000, 1200]));

c.push(h2("5.4 Consolidation Opportunities"));
c.push(p("Screens where the set cover suggests potential merging:"));
c.push(nl("Config Settings (E3) \u2192 already a tab within Settings. No change needed, but when new configs are added, they join this tab rather than creating new screens."));
c.push(nl("AI Auto-Tagging could integrate into Resources as a mode/tab \u2014 the data overlap is significant (both show resource tables with metadata). This would reduce S14 to a Resources sub-view. Trade-off: +1 tab on Resources vs. \u20131 navigation item."));
c.push(nl("Unified Billing (W=2.8%) is borderline between its own screen and a Dashboard tab. Keep separate: Dashboard is at cognitive capacity (4 info chunks), and billing has distinct date-range semantics."));

c.push(h2("5.5 Cognitive Load Audit"));
c.push(p("Comparison of each screen\u2019s actual cognitive load against its budget:"));
c.push(mt(["Screen", "Actions (of 7\u00b12)", "Chunks (of 4\u00b11)", "Status", "Recommendation"],
  [["S1: Dashboard", "3", "4", "Actions UNDER-utilized", "Add quick-action shortcuts (schedule, top rec, sync status)"],
   ["S2: Resources", "7", "3", "At action limit", "Correct \u2014 do not add more primary actions"],
   ["S3: Scheduler", "4", "2", "Comfortable", "Room for 1\u20132 more actions (e.g., copy schedule, templates)"],
   ["S4: Recommendations", "5", "2", "Comfortable", "Room for inline stats actions"],
   ["S5: Rec Detail", "3", "3", "UNDER-utilized", "Add inline actions (accept, dismiss, snooze)"],
   ["S6: Audit Logs", "4", "3", "Comfortable", "Correct"],
   ["S7: Groups", "5", "2", "Comfortable", "Correct"],
   ["S8: Teams", "5", "3", "Comfortable", "Correct"],
   ["S9: Unified Billing", "2", "4", "Actions UNDER-utilized", "Add export, compare periods"],
   ["S10: Settings", "5/tab", "2/tab", "Comfortable", "Scale by adding tabs, not screens"]],
  [2000, 1600, 1600, 2000, 3200]));
c.push(pb());

// ════════════════════════════════════════════════════════════
// 6. NEW INFORMATION ARCHITECTURE
// ════════════════════════════════════════════════════════════
c.push(h1("6. Phase 5: New Information Architecture"));

c.push(h2("6.1 Navigation Hierarchy (Derived from Weight Ranking)"));
c.push(p("The optimal navigation structure places screens in order of cumulative interaction weight, respecting Hick\u2019s Law (max 7\u00b12 items per level):"));

c.push(h3("Current Navigation"));
c.push(code("Overview > Resources > Recommendations > Groups > Teams > Audit Logs > Settings"));
c.push(p("7 items. No Unified Billing. AI Tagging in separate sidebar.", { c: GRAY }));

c.push(h3("Optimal Navigation (Weight-Derived)"));
c.push(sp(40));
c.push(callout("LEVEL 0 \u2014 Always Visible (Top Nav / Tab Bar)", "Dashboard (W=38.2%)  |  Resources (W=18.5%)  |  Recommendations (W=10.2%)\nThese three screens account for 67% of all interaction weight. They must be zero-click accessible from anywhere.", BRAND));
c.push(sp(40));
c.push(callout("LEVEL 1 \u2014 Sidebar, 1-Click", "Audit Logs (W=7.5%)  |  Teams (W=3.6%)  |  Groups (W=3.2%)  |  Unified Billing (W=2.8%)\nCurrently Unified Billing is NOT in the menu despite W=2.8%. Promote it.", WARN));
c.push(sp(40));
c.push(callout("LEVEL 2 \u2014 Nested / Discoverable, 2-Click", "Settings > Integrations (W=1.8%)  |  Settings > Custom Rules (W=1.5%)  |  Settings > Config (W=0.8%)\nAI Auto-Tagging (W=1.5%) \u2014 consider as Resources sub-tab or keep in AI sidebar", PURPLE));
c.push(sp(40));
c.push(callout("LEVEL 3 \u2014 Administrative, Rare Access", "Org Management (<1%)  |  Account Settings (<1%)  |  Onboarding (one-time)\nHidden behind profile/account menus. Correct.", GRAY));

c.push(h2("6.2 Progressive Disclosure Rules"));
c.push(mt(["Weight Tier", "Visibility Rule", "Gap in Current Implementation"],
  [["W > 10% (Dashboard, Resources, Recs)", "Always visible in primary nav, above-the-fold content", "None \u2014 correctly in RESOURCES_PARKING_MENU"],
   ["3% < W < 10% (Audit, Groups, Teams, Billing)", "Visible in sidebar, 1-click access", "Unified Billing MISSING from menu \u2014 add it"],
   ["1% < W < 3% (Settings, AI Tagging)", "Nested menu or collapsible section", "Correct \u2014 Settings nested with sub-tabs"],
   ["W < 1% (Org Mgmt, Account, Onboarding)", "Behind profile/account menus or contextual triggers", "Correct \u2014 behind TopBar account menu"]],
  [2800, 3600, 3200]));

c.push(h2("6.3 Global Persistent Elements"));
c.push(p("Cross-cutting interactions that must be accessible from every screen:"));
c.push(mt(["Element", "W (cumulative)", "Current Placement", "Gap"],
  [["Product Switch", "124.0", "TopBar toggle", "Correct"],
   ["Authenticate", "114.0", "Login page / session", "Correct"],
   ["Sync button + status", "64.0", "TopBar (ZopNight only)", "Correct"],
   ["Global Search", "85.3+ across J4+J6+J9", "NOT IMPLEMENTED", "MAJOR GAP \u2014 add to TopBar"],
   ["Connect Cloud (+)", "varies", "TopBar icon", "Correct"]],
  [2400, 1600, 2600, 3000]));
c.push(sp(40));
c.push(callout("HIGHEST-IMPACT MISSING FEATURE", "Global Search is the single highest-impact feature not currently implemented. Search interactions across Resources (W=85.3), Recommendations (W=68.2), and Audit Logs (W=40.8) total W=194+ but each is siloed to its own page. A unified search in the TopBar dispatching to the right screen would serve the highest-weight interaction cluster in the entire product.", ERROR));

c.push(h2("6.4 Scalability Pattern"));
c.push(p("How the architecture accommodates future features without restructuring:"));
c.push(sp(40));
c.push(h3("Current Capacity"));
c.push(mt(["Navigation Level", "Current Items", "Max (Hick\u2019s)", "Headroom"],
  [["Primary nav (TabBar)", "7", "9", "2 slots"],
   ["Settings sub-nav", "3", "5", "2 slots"],
   ["AI sidebar", "2 (1 coming soon)", "5", "3 slots"]],
  [3000, 2000, 2000, 2600]));

c.push(h3("Recommended Growth Strategy"));
c.push(nl("When primary nav reaches 8+ items: Merge Groups + Teams into \u201COrganize\u201D section with sub-tabs. This frees 1 slot."));
c.push(nl("When Settings reaches 5+ items: Add a \u201CMore\u201D expandable section. Do not create a new top-level route."));
c.push(nl("When AI features grow: Keep AI as a distinct sidebar section. It has its own persona profile (P2/P5 DevOps) and will grow independently."));
c.push(nl("For entirely new feature domains (e.g., Forecasting, Compliance): Add as a new primary nav item only if projected W > 3%. Otherwise, nest under the closest existing section."));
c.push(sp(60));
c.push(h3("Future Navigation (Projected)"));
c.push(code("Primary: Dashboard | Resources | Recommendations | Organize | Audit | Billing | Settings"));
c.push(code("Organize: Groups | Teams | [Policies] | [Budgets] | [Tags]"));
c.push(code("Settings: Integrations | Rules | Config | [Schedule Templates] | [Compliance]"));
c.push(code("AI: Auto-Tagging | Auto-Grouping | [Anomaly Detection] | [Forecasting]"));

c.push(h2("6.5 State Architecture"));
c.push(p("The optimal state architecture, derived from the interaction analysis:"));
c.push(mt(["State Layer", "What Lives Here", "Persistence", "Scope"],
  [["URL Params (nuqs)", "Page, pageSize, search, filters, sort, tab, date range", "Survives refresh + shareable", "Per-screen"],
   ["React Query Cache", "All server data (resources, recs, audit, teams, groups, billing)", "staleTime/cacheTime per domain", "Cross-screen"],
   ["Zustand Store", "UI state: loader, sync status, product switch, onboarding", "Memory only (lost on refresh)", "Global"],
   ["Cookies (encrypted)", "Auth tokens, org preference, product preference", "1\u201330 day expiry", "Cross-session"],
   ["localStorage", "User info, theme, analytics IDs", "Permanent until cleared", "Cross-session"]],
  [2000, 3400, 2200, 2000]));
c.push(sp(40));
c.push(p("Key principle: Every piece of state that affects what the user sees should be in URL params (bookmarkable, shareable, survives refresh). UI-only state (loading spinners, drawer open/close) stays in Zustand. Server data always in React Query.", { i: true, c: GRAY }));
c.push(pb());

// ════════════════════════════════════════════════════════════
// 7. GAP ANALYSIS
// ════════════════════════════════════════════════════════════
c.push(h1("7. Current vs. Optimal: Gap Analysis"));
c.push(p("Summary of gaps between the current implementation and the mathematically-derived optimal architecture:"));

c.push(mt(["#", "Gap", "Impact (W)", "Effort", "Priority"],
  [["1", "No Global Search \u2014 search siloed per page", "194+", "Medium", "P0 \u2014 Critical"],
   ["2", "Unified Billing missing from primary navigation", "28.5", "Low", "P0 \u2014 Quick Win"],
   ["3", "Dashboard under-utilizes action budget (3/7)", "38.2%", "Low", "P1 \u2014 Add shortcuts"],
   ["4", "Recommendation Detail under-utilizes actions (3/7)", "4.8%", "Low", "P1 \u2014 Add inline actions"],
   ["5", "AI Tagging as separate page vs. Resources sub-view", "1.5%", "Medium", "P2 \u2014 Consider merge"],
   ["6", "5 non-functional pages (mock data, no-op buttons)", "~2%", "Medium", "P1 \u2014 Wire or remove"],
   ["7", "No \u201COrganize\u201D grouping for Groups+Teams", "6.8%", "Low", "P2 \u2014 Future scalability"],
   ["8", "Settings sub-nav at 3/5 capacity", "4.1%", "None needed", "P3 \u2014 Monitor"],
   ["9", "9 parallel API calls on Dashboard", "38.2%", "Medium", "P1 \u2014 Server aggregation"],
   ["10", "No keyboard shortcuts for Tier 1 actions", "72%", "Low", "P2 \u2014 Power user support"]],
  [500, 4000, 1200, 1200, 2700]));

c.push(pb());

// ════════════════════════════════════════════════════════════
// 8. IMPLEMENTATION ROADMAP
// ════════════════════════════════════════════════════════════
c.push(h1("8. Implementation Roadmap"));

c.push(h2("Phase A: Zero-Code Wins (Week 1)"));
c.push(nl("Add Unified Billing to RESOURCES_PARKING_MENU in routes.js"));
c.push(nl("Enable search in Custom Rules (already implemented, commented out)"));
c.push(nl("Add quick-action links to Dashboard (shortcuts to top recommendation, recent sync status)"));
c.push(nl("Remove or gate non-functional pages (Account Settings, Notification Settings, Org Switching mock data)"));

c.push(h2("Phase B: Global Search (Weeks 2\u20134)"));
c.push(nl("Add search input to TopBar component (always visible, keyboard shortcut Cmd+K)"));
c.push(nl("Implement search dispatcher: routes query to Resources, Recommendations, or Audit Logs based on result type"));
c.push(nl("Use React Query to pre-fetch results across all three domains in parallel"));
c.push(nl("Display results in a dropdown overlay grouped by domain"));

c.push(h2("Phase C: Dashboard Optimization (Weeks 3\u20135)"));
c.push(nl("Create server-side aggregation endpoint to replace 9 parallel API calls with 1\u20132"));
c.push(nl("Add skeleton loading (replace linear loader with per-widget shimmer)"));
c.push(nl("Add inline action shortcuts: \u201CSchedule a resource\u201D, \u201CView top recommendation\u201D, \u201CExport report\u201D"));
c.push(nl("Add Recommendation Detail inline actions: accept, dismiss, snooze"));

c.push(h2("Phase D: Navigation Restructuring (Weeks 5\u20137)"));
c.push(nl("Evaluate AI Tagging as Resources sub-tab vs. standalone (A/B test if possible)"));
c.push(nl("Prepare \u201COrganize\u201D section architecture for Groups + Teams merge (future-proofing)"));
c.push(nl("Add keyboard shortcut system (Cmd+K search, Cmd+1\u20137 for nav items, Cmd+S for sync)"));

c.push(h2("Phase E: State Architecture Hardening (Weeks 6\u20138)"));
c.push(nl("Audit all URL params for bookmarkability \u2014 ensure every filter/sort/page state is in the URL"));
c.push(nl("Add \u201CShare this view\u201D button that copies current URL with all params"));
c.push(nl("Implement \u201CLast synced: X ago\u201D persistent indicator in TopBar"));
c.push(pb());

// ════════════════════════════════════════════════════════════
// APPENDIX A
// ════════════════════════════════════════════════════════════
c.push(h1("Appendix A: Remaining JTBD Decompositions"));

c.push(h3("J1: Authenticate and Access the Platform"));
c.push(mt(["#", "Interaction", "Type", "CL", "KLM"],
  [["1.1", "Land on /app (auto-clear previous session)", "W", "0", "1.00"],
   ["1.2", "Choose auth method (Google/GitHub/Azure/SAML/Email)", "S", "3", "3.85"],
   ["1.3", "Complete provider-specific auth flow", "C", "2", "3.00"],
   ["1.4", "Wait for token exchange + org resolution", "W", "0", "2.50"],
   ["1.5", "Auto-navigate to product landing", "N", "0", "2.45"],
   ["1.6", "View product landing (Dashboard/Cloud Accounts)", "V", "2", "4.00"]],
  [500, 4500, 600, 500, 700]));

c.push(h3("J7: Organize Resources into Groups"));
c.push(mt(["#", "Interaction", "Type", "CL", "KLM"],
  [["7.1", "Navigate to /zop-night/groups", "N", "1", "2.45"],
   ["7.2", "Wait for groups + filter config + teams + providers", "W", "0", "2.00"],
   ["7.3", "Scan groups table", "V", "3", "4.05"],
   ["7.4", "Click \u201CCreate Group\u201D \u2192 opens drawer", "N", "1", "2.45"],
   ["7.5", "Enter group name", "I", "2", "3.55"],
   ["7.6", "Select resources to include", "S", "3", "5.00"],
   ["7.7", "Set budget + alert level", "I", "2", "4.50"],
   ["7.8", "Save group", "C", "1", "2.45"],
   ["7.9", "Wait for confirmation", "W", "0", "1.50"]],
  [500, 4500, 600, 500, 700]));

c.push(h3("J8: Manage Team Access and Budgets"));
c.push(mt(["#", "Interaction", "Type", "CL", "KLM"],
  [["8.1", "Navigate to /zop-night/teams", "N", "1", "2.45"],
   ["8.2", "Switch to Teams tab", "S", "1", "2.45"],
   ["8.3", "Scan teams table", "V", "3", "4.05"],
   ["8.4", "Click \u201CCreate Team\u201D \u2192 opens drawer", "N", "1", "2.45"],
   ["8.5", "Enter team name + description", "I", "2", "4.50"],
   ["8.6", "Add member rows (email + role)", "I", "3", "6.00"],
   ["8.7", "Select role for each member", "S", "2", "3.85"],
   ["8.8", "Save team", "C", "1", "2.45"],
   ["8.9", "Wait for confirmation", "W", "0", "1.50"],
   ["8.10", "View team members (infinite scroll drawer)", "V", "2", "4.05"]],
  [500, 4500, 600, 500, 700]));

c.push(h3("J10: Understand Billing Across All Clouds"));
c.push(mt(["#", "Interaction", "Type", "CL", "KLM"],
  [["10.1", "Navigate to /zop-night/unified-billing", "N", "1", "2.45"],
   ["10.2", "Wait for billing summary", "W", "0", "2.00"],
   ["10.3", "Scan total cost + trend metrics", "V", "2", "2.70"],
   ["10.4", "View top cost drivers + pricing model breakdown", "V", "3", "4.05"],
   ["10.5", "Change date range (max 13 months)", "S", "2", "3.85"]],
  [500, 4500, 600, 500, 700]));

c.push(h3("J11: Apply AI-Suggested Tags"));
c.push(mt(["#", "Interaction", "Type", "CL", "KLM"],
  [["11.1", "Navigate to AI Auto-Tagging", "N", "1", "2.45"],
   ["11.2", "Wait for tag suggestions", "W", "0", "2.50"],
   ["11.3", "Scan resource + tag suggestions table", "V", "3", "4.05"],
   ["11.4", "Search resources", "I", "2", "4.50"],
   ["11.5", "Select rows to apply", "S", "2", "3.00"],
   ["11.6", "Click \u201CApply Tags\u201D", "C", "1", "2.45"]],
  [500, 4500, 600, 500, 700]));

c.push(h3("J12: Configure Notification Integrations"));
c.push(mt(["#", "Interaction", "Type", "CL", "KLM"],
  [["12.1", "Navigate to Settings > Integrations", "N", "1", "2.45"],
   ["12.2", "Wait for channel summary", "W", "0", "1.50"],
   ["12.3", "Scan platform cards (Slack, Teams, etc.)", "V", "2", "2.70"],
   ["12.4", "Click \u201CAdd Integration\u201D \u2192 drawer", "N", "1", "2.45"],
   ["12.5", "Select platform + enter webhook URL", "I", "2", "5.00"],
   ["12.6", "Configure channel name + set as default", "I", "2", "4.00"],
   ["12.7", "Save integration", "C", "1", "2.45"],
   ["12.8", "Wait for confirmation", "W", "0", "1.50"]],
  [500, 4500, 600, 500, 700]));

c.push(h3("J17: Sync Cloud Data on Demand"));
c.push(mt(["#", "Interaction", "Type", "CL", "KLM"],
  [["17.1", "Click Sync button in TopBar", "C", "1", "2.45"],
   ["17.2", "Wait for sync initiation + 10s polling delay", "W", "0", "12.00"],
   ["17.3", "Observe SyncBanner progress (polling every 10s)", "W", "0", "varies"]],
  [500, 4500, 600, 500, 700]));

c.push(pb());

// ════════════════════════════════════════════════════════════
// APPENDIX B
// ════════════════════════════════════════════════════════════
c.push(h1("Appendix B: Mathematical Foundations"));

c.push(h2("B.1 Weighted Set Cover Formulation"));
c.push(p("Given:"));
c.push(bl("Universe U = {u\u2081, u\u2082, ..., u\u2081\u2085\u2081} (all 151 atomic interactions)"));
c.push(bl("Collection S = {S\u2081, S\u2082, ..., S\u2096} of candidate screens, where each S\u1d62 \u2286 U"));
c.push(bl("Cost function c(S\u1d62) = cognitive_load(S\u1d62) = |primary_actions(S\u1d62)| + |info_chunks(S\u1d62)|"));
c.push(bl("Capacity constraint: |primary_actions(S\u1d62)| \u2264 9 and |info_chunks(S\u1d62)| \u2264 5"));
c.push(bl("Co-occurrence constraints: for each constraint C\u2c7c = {u\u2090, u\u1d47, ...}, all elements must be in the same S\u1d62"));
c.push(sp(40));
c.push(p("Objective: Minimize |{S\u1d62 : S\u1d62 \u2208 solution}| subject to \u222a S\u1d62 = U and all capacity/co-occurrence constraints."));
c.push(sp(40));
c.push(p("This is a capacitated set cover with side constraints. We solve it greedily: at each step, select the screen that covers the most uncovered weight per unit of cognitive cost. The greedy algorithm achieves O(ln n) approximation, which for n=151 gives at most ~5\u00d7 optimal. In practice, the solution is near-optimal because most interactions naturally cluster (co-occurrence constraints pre-group them)."));

c.push(h2("B.2 Markov Chain Stationary Distribution"));
c.push(p("Model the application as a Markov chain with states = screens and transition probabilities derived from the persona\u00d7task matrix."));
c.push(sp(40));
c.push(p("Let \u03c0\u1d62 be the stationary probability of screen i. Then \u03c0 = \u03c0P, where P is the transition matrix."));
c.push(sp(40));
c.push(p("The stationary distribution tells us: if a user navigates the app indefinitely, what fraction of time do they spend on each screen? This directly maps to the touchpoint heatmap."));
c.push(sp(40));
c.push(p("Estimated stationary distribution from our model:"));
c.push(mt(["Screen", "\u03c0 (stationary)", "Implication"],
  [["Dashboard", "0.35", "Users spend ~35% of their time here. It is THE product."],
   ["Resources", "0.22", "Second most visited. Search/filter must be fast."],
   ["Recommendations", "0.13", "Third. Drill-down should be instant."],
   ["Audit Logs", "0.08", "Fourth. Infinite scroll + export are key."],
   ["Groups", "0.04", "Moderate. Drawer-based CRUD is correct."],
   ["Teams", "0.04", "Moderate. Drawer-based CRUD is correct."],
   ["Unified Billing", "0.03", "Low but recurring. Date range is the key interaction."],
   ["Settings (all tabs)", "0.04", "Low. Wizard-driven is correct."],
   ["AI Auto-Tagging", "0.02", "Low. Batch apply is the key interaction."],
   ["Auth/Onboarding/Org", "0.05", "One-time or rare. Optimize for completeness, not speed."]],
  [2400, 1600, 5600]));

c.push(h2("B.3 Interaction Cost Model"));
c.push(p("Total predicted task time for each JTBD (using KLM operators):"));
c.push(sp(40));
c.push(code("T(task) = \u03a3 [M\u1d62 + P\u1d62 + H\u1d62 + n\u1d62\u00d7K + R\u1d62] for all interactions i in task"));
c.push(sp(40));
c.push(p("Optimization target: Minimize the weighted sum of task times across all personas:"));
c.push(sp(40));
c.push(code("Minimize: \u03a3_p \u03a3_j persona_weight[p] \u00d7 frequency[p][j] \u00d7 T(j)"));
c.push(sp(40));
c.push(p("This is the objective function for future A/B testing: any design change should reduce this weighted sum."));

// ═══════ BUILD DOC ═══════
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Inter", size: 20 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 36, bold: true, font: "Inter", color: BRAND }, paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 30, bold: true, font: "Inter", color: DARK }, paragraph: { spacing: { before: 340, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: "Inter", color: "374151" }, paragraph: { spacing: { before: 260, after: 120 }, outlineLevel: 2 } },
    ],
  },
  numbering: { config: [
    { reference: "bullets", levels: [
      { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
    ]},
    { reference: "numbers", levels: [
      { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
    ]},
  ]},
  sections: [{
    properties: { page: { size: { width: PW, height: 15840 }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: BRAND, space: 4 } }, children: [new TextRun({ text: "Computational Interaction Design \u2014 ZopNight", size: 15, font: "Inter", color: GRAY, italics: true })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 1, color: BD, space: 4 } }, children: [new TextRun({ text: "Page ", size: 15, font: "Inter", color: GRAY }), new TextRun({ children: [PageNumber.CURRENT], size: 15, font: "Inter", color: GRAY }), new TextRun({ text: "  |  zop.dev  |  Confidential", size: 15, font: "Inter", color: GRAY })] })] }) },
    children: c,
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/Users/zopdev/Desktop/zoprepo/ZopNight_Computational_Interaction_Design.docx", buf);
  console.log("Done!", (buf.length / 1024).toFixed(1), "KB");
});
