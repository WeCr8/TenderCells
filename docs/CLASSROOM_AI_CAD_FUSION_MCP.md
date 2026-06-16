# Classroom: AI-Driven Design & CAD with Fusion 360 + MCP

**Advanced lesson.** How to use AI across the whole design loop — from a blank idea to
a manufacturable part — and how to wire **Autodesk Fusion 360** to Claude over **MCP**
so you model and iterate by talking to it. For students/makers who've done the
[door + Roaming Roost build](CLASSROOM_DOOR_AND_ROAMING_ROOST.md) and want to design
their *own* hardware.

> **Big idea:** AI is useful at every stage — *before* a design (turn intent into
> geometry), *during* (generate parametric models), and *after* (review, fix, optimize,
> document). MCP closes the loop: Claude drives the CAD tool directly.

---

## The AI design loop

```text
  idea ─▶ [AI: concept + dimensions] ─▶ [AI: model it] ─▶ [AI: review/fix] ─▶ export ─▶ make
            (chat / sketch)              (MCP or OpenSCAD)   (DFM checklist)    STL/DXF/STEP
                    ▲                                              │
                    └──────────────── iterate ─────────────────────┘
```

You stay the engineer. AI accelerates each leg; you judge fit, safety, and intent.

---

## Stage 1 — AI for the *initial* design (no CAD yet)

Use plain chat to go from intent → a concrete, dimensioned plan before any geometry.

Good prompts:
- "I need a bracket to mount an SG90 servo to a 3D-printed coop door. Give me overall
  dimensions, hole pattern, wall thickness, and material — imperial units."
- "Sketch the constraints for a hinge that lets a 4×4 in door swing 90°."
- "What's the required arm reach to hit all corners of a 4×4 ft floor from a ceiling
  mount?" (AI does the trig — see the reach calc in CLAUDE.md §5.)

What to demand back: **numbers** (dimensions, tolerances, hole sizes), **material**
choice with a reason, and the **assumptions** it made so you can correct them.

---

## Stage 2 — AI generates the model

Two paths, pick by tooling:

### A) Code-first parametric (free, no Fusion) — OpenSCAD
Best for learning and for parts that are mostly prisms + holes. Claude writes `.scad`
directly; change a variable, re-render. Example skeleton (full one in CLAUDE.md):

```scad
// TC-CT-ARM-MOUNT-BRACKET-R1  — units: inches, material: 1/8" steel
PLATE_W=4.0; PLATE_H=3.0; PLATE_T=0.125; HOLE_D=0.25; HOLE_INSET=0.5;
module bracket() {
  difference() {
    cube([PLATE_W, PLATE_H, PLATE_T]);
    for (x=[HOLE_INSET, PLATE_W-HOLE_INSET])
      for (y=[HOLE_INSET, PLATE_H-HOLE_INSET])
        translate([x,y,-0.01]) cylinder(h=PLATE_T+0.02, d=HOLE_D, $fn=32);
  }
}
bracket();
```

Teach: every dimension is a named variable → AI can re-tune the whole part from one
sentence ("make it fit a 16-inch rafter spacing").

### B) Live Fusion 360 via MCP (advanced, parametric assemblies)
Claude drives a real Fusion session. Setup (from CLAUDE.md §"Autodesk MCP"):

1. Fusion 360 → Utilities → Add-Ins → enable **Fusion MCP Bridge**, Run on Startup.
2. Add to Claude Desktop config (`%APPDATA%\Claude\claude_desktop_config.json`):
   ```json
   { "mcpServers": { "fusion360": {
       "command": "python3",
       "args": ["/path/to/fusion-mcp-bridge/mcp-server/server.py"] } } }
   ```
3. Restart Claude Desktop — hammer icon = tools live.
4. New Project → upload `CLAUDE.md` so every CAD session has Tender Cells context.

Then design by talking:
```
"Create a 4 in × 4 in sketch on XY, extrude 0.75 in for the coop floor panel."
"Add a 0.25 in hole at each corner, 0.5 in from the edges."
"Make a component TC-CT-FLOOR-PANEL-R1."
"Check interference between the arm mount and the roof rafters."
"Export TC-CT-SCRAPER-TOOL-R1 as STL to docs/cad/stl/."
```

---

## Stage 3 — AI *after* the design (review, fix, document)

This is where AI earns its keep. Feed it the part (or screenshot) and run:

- **DFM review** — "Check this against the design-review checklist." (Overhangs >45°,
  min wall 2 mm, fastener access, sharp edges inside the coop — full list in CLAUDE.md.)
- **Animal-safety pass** — "Any gap 0.5–2 in a chicken could trap a head/leg in?"
- **Fix** — "Wall is 1.2 mm; bump to 3 mm structural and re-export."
- **Document** — "Add this part to docs/hardware-bom.md with cost + source, and save a
  render to docs/cad/renders/."
- **Cost** — "Estimate print time + material at 0.2 mm layers."

---

## Rapid-dev loop for advanced users

```text
talk ▶ model (MCP/SCAD) ▶ screenshot ▶ AI review ▶ tweak vars ▶ export ▶ print/cut ▶ test ▶ repeat
```

Make it fast and disciplined:
- **One source of truth:** keep parts parametric so a change is one variable, not a
  remodel.
- **Name everything** by the standard: `TC-[PRODUCT]-[ASSEMBLY]-[PART]-R[N]`
  (e.g. `TC-CT-ARM-MOUNT-BRACKET-R1`). AI uses it to track revisions.
- **Units = inches**, tolerances per CLAUDE.md (±0.010" printed, ±0.005" machined).
- **Commit each revision** so AI can diff R1→R2 and explain what changed.
- **Verify, don't trust:** AI proposes; you confirm dimensions, run the review
  checklist, and check it physically fits before fabricating.

---

## Try it (first AI-CAD task)

1. Ask: "Design a servo horn-to-door link for an SG90 driving a 4 in coop door 90°.
   Imperial, PETG, name it `TC-CT-DOOR-LINK-R1`."
2. Have it emit OpenSCAD (or build it in Fusion via MCP).
3. Run the DFM + animal-safety review on the result.
4. Export STL, print, fit it to your [door build](CLASSROOM_DOOR_AND_ROAMING_ROOST.md).

You just took a part from sentence → printed hardware with AI in every step. That's the
Tender Cells engineering loop.

---

*Deeper reference: CLAUDE.md → "SKILL: Autonomous Engineering & CAD (Autodesk MCP)" —
full MCP setup (Fusion, APS, FreeCAD), design standards, calculations, and the
design-review checklist.*
