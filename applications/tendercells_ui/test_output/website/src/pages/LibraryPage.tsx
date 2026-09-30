// LibraryPage.tsx - tendercells.com/library: animal health by species (poultry, rabbits &
// rodents, livestock, pond fish, reptiles), predators & pests, DIY habitat projects and the
// plant library (crops, weeds, toxic plants). Same data as the OS library (shared/library),
// so a species page here and in the app always agree; each entry links to its app page.
import { Link, useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import PageHero from "../components/PageHero";
import { GROUP_LABEL, TOXIC_PLANT_IDS_BY_SPECIES, animalById, animalsIn, type AnimalGroup } from "../../../shared/library/animals";
import { PLANTS, plantById, type PlantKind } from "../../../shared/library/plants";
import { OS_SCREENS, PLANT_PAGES, WILDLIFE_PAGES, animalPages, type PageLink } from "../../../shared/library/links";
import { WILDLIFE, threatsTo, wildlifeById } from "../../../shared/library/wildlife";
import { PROJECTS, hfUrl, projectsFor } from "../../../shared/library/projects";
import "./AccountPage.css";

const KIND_LABEL: Record<PlantKind, string> = { crop: "Garden crops", weed: "Common weeds", toxic: "Toxic to animals" };

function Related({ links }: { links: PageLink[] }) {
  return (
    <>
      <h2>Related on tendercells.com</h2>
      <ul data-testid="library-related">{links.map((l) => <li key={l.href}><Link to={l.href}>{l.label}</Link></li>)}</ul>
    </>
  );
}

/** Comma-separated links. */
function Links({ items }: { items: { key: string; to: string; label: string }[] }) {
  return <>{items.map((i, n) => <span key={i.key}>{n ? ", " : ""}<Link to={i.to}>{i.label}</Link></span>)}</>;
}

function AnimalDetail({ id }: { id: string }) {
  const a = animalById(id);
  if (!a) return <p>Unknown species. <Link to="/library">Back to the library</Link></p>;
  const toxic = (TOXIC_PLANT_IDS_BY_SPECIES[a.id] ?? []).map(plantById).filter((p) => !!p);
  const threats = threatsTo(a.id);
  const projects = projectsFor(a.group);
  return (
    <article className="account-card account-doc library-entry" style={{ maxWidth: 820 }}>
      <h1>{a.emoji} {a.name}</h1>
      <p className="account-sub">{GROUP_LABEL[a.group]} · Tender Cells: {a.product} · {a.tempNote ?? "comfortable"} {a.comfortF[0]}–{a.comfortF[1]}°F
        {a.bodyTempF ? ` · normal body temperature ${a.bodyTempF[0]}–${a.bodyTempF[1]}°F` : ""} · lives {a.lifespanYears[0]}–{a.lifespanYears[1]} years</p>
      <p><strong>Space:</strong> {a.spacePerAnimal}</p>
      <h2>Daily checks</h2>
      <ul>{a.dailyChecks.map((c) => <li key={c}>{c}</li>)}</ul>
      <h2>Warning signs</h2>
      <ul>{a.warningSigns.map((c) => <li key={c}>{c}</li>)}</ul>
      <h2>Common conditions</h2>
      <table className="account-table">
        <thead><tr><th>Condition</th><th>Signs</th><th>First steps</th><th>Call a vet</th></tr></thead>
        <tbody>{a.conditions.map((c) => <tr key={c.name}><td><strong>{c.name}</strong></td><td>{c.signs}</td><td>{c.firstSteps}</td><td>{c.vetWhen}</td></tr>)}</tbody>
      </table>
      {toxic.length > 0 && <p><strong>Keep away:</strong> <Links items={toxic.map((p) => ({ key: p!.id, to: `/library/plants/${p!.id}`, label: p!.name }))} /></p>}
      {threats.length > 0 && <p><strong>Predators &amp; pests:</strong> <Links items={threats.map((w) => ({ key: w.id, to: `/library/wildlife/${w.id}`, label: w.name }))} /></p>}
      <p><strong>What Tender Cells watches:</strong> {a.sensors.join(", ")}.</p>
      {projects.length > 0 && <p><strong>DIY projects:</strong> <Links items={projects.map((p) => ({ key: p.id, to: `/library#project-${p.id}`, label: p.title }))} /></p>}
      <Related links={animalPages(a.id)} />
      <p className="account-hint">General care education, not veterinary advice. When in doubt, call your vet.</p>
      <div className="account-actions">
        <a className="btn-primary" href={`/app/library/animals/${a.id}`}>Open in Tender Cells OS</a>
        <a className="btn-outline" href={`/app${OS_SCREENS.animal.path}`}>{OS_SCREENS.animal.label}</a>
        <Link className="btn-outline" to="/library">All species &amp; plants</Link>
      </div>
    </article>
  );
}

function WildlifeDetail({ id }: { id: string }) {
  const w = wildlifeById(id);
  if (!w) return <p>Unknown animal. <Link to="/library">Back to the library</Link></p>;
  return (
    <article className="account-card account-doc library-entry" style={{ maxWidth: 820 }}>
      <h1>{w.emoji} {w.name}</h1>
      <p className="account-sub">{w.kind === "pest" ? "Pest" : w.kind === "venomous" ? "Venomous" : "Predator"} · usually active {w.active}</p>
      <p><strong>Signs:</strong> {w.signs}</p>
      <p><strong>Prevention:</strong> {w.prevention}</p>
      <p><strong>What Tender Cells does:</strong> {w.patrol}</p>
      {w.caution && <p style={{ color: "#b3261e" }}><strong>Caution:</strong> {w.caution}</p>}
      <p><strong>Threat to:</strong> <Links items={w.threatTo.map((s) => ({ key: s, to: `/library/animals/${s}`, label: animalById(s)?.name ?? s }))} /></p>
      <Related links={WILDLIFE_PAGES} />
      <div className="account-actions">
        <a className="btn-primary" href={`/app${OS_SCREENS.wildlife.path}`}>{OS_SCREENS.wildlife.label} in the OS</a>
        <Link className="btn-outline" to="/library#wildlife">All predators &amp; pests</Link>
      </div>
    </article>
  );
}

function PlantDetail({ id }: { id: string }) {
  const p = plantById(id);
  if (!p) return <p>Unknown plant. <Link to="/library">Back to the library</Link></p>;
  return (
    <article className="account-card account-doc library-entry" style={{ maxWidth: 820 }}>
      <h1>{p.emoji} {p.name}</h1>
      <p className="account-sub">{KIND_LABEL[p.kind]} · {p.summary}</p>
      {p.spacingIn && <p><strong>Spacing:</strong> {p.spacingIn} in · <strong>Harvest:</strong> {p.daysToHarvest?.join("–")} days</p>}
      {p.water && <p><strong>Water:</strong> {p.water}</p>}
      {p.identify && <p><strong>How to recognise it:</strong> {p.identify}</p>}
      {p.control && <p><strong>Control:</strong> {p.control}</p>}
      {p.laser && <p><strong>Weed Patrol (laser):</strong> {p.laser}</p>}
      {p.toxicTo && <p><strong>Poisonous to:</strong> <Links items={p.toxicTo.map((s) => ({ key: s, to: `/library/animals/${s}`, label: animalById(s)?.name ?? s }))} /></p>}
      <Related links={PLANT_PAGES[p.kind]} />
      <div className="account-actions">
        <a className="btn-primary" href={`/app/library/plants/${p.id}`}>Open in Tender Cells OS</a>
        {p.kind !== "toxic" && <a className="btn-outline" href={`/app${OS_SCREENS[p.kind].path}`}>{OS_SCREENS[p.kind].label}</a>}
        <Link className="btn-outline" to="/library">All species &amp; plants</Link>
      </div>
    </article>
  );
}

const cardLink = { textDecoration: "none", color: "inherit" } as const;

export default function LibraryPage() {
  const { kind, id } = useParams();
  if (kind && id) {
    const detail = kind === "animals" ? <AnimalDetail id={id} /> : kind === "wildlife" ? <WildlifeDetail id={id} /> : <PlantDetail id={id} />;
    return <PageLayout><div className="account-page" style={{ alignItems: "flex-start" }}>{detail}</div></PageLayout>;
  }
  return (
    <PageLayout>
      <PageHero kicker="Library" title="Animal & plant library"
        subtitle="Health by species - poultry, rabbits and rodents, livestock, pond fish and reptiles - predators and pests, DIY habitat projects, garden crops, weeds and toxic plants. The same library is inside the Tender Cells OS." />
      <div className="prose">
        {(Object.keys(GROUP_LABEL) as AnimalGroup[]).map((g) => (
          <section key={g}>
            <h2 className="section-title" id={g}>{GROUP_LABEL[g]}</h2>
            <div className="card-grid">
              {animalsIn(g).map((a) => (
                <Link key={a.id} to={`/library/animals/${a.id}`} className="card" style={cardLink}>
                  <h3>{a.emoji} {a.name}</h3>
                  <p>{a.product} · {a.comfortF[0]}–{a.comfortF[1]}°F · {a.conditions.length} conditions</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
        <h2 className="section-title" id="wildlife">Predators &amp; pests</h2>
        <div className="card-grid">
          {WILDLIFE.map((w) => (
            <Link key={w.id} to={`/library/wildlife/${w.id}`} className="card" style={cardLink}>
              <h3>{w.emoji} {w.name}</h3>
              <p>{w.kind} · active {w.active}</p>
            </Link>
          ))}
        </div>
        <h2 className="section-title" id="projects">DIY habitat projects</h2>
        <p>Build one, then connect it in the OS (<a href="/app/projects">DIY Projects</a>). Video and audio stay on your network; only small readings and AI events go through Tender Cells.</p>
        <div className="card-grid">
          {PROJECTS.map((p) => (
            <div key={p.id} className="card" id={`project-${p.id}`}>
              <h3>{p.emoji} {p.title}</h3>
              <p>{p.level}{p.video ? " · video" : ""}{p.audio ? " · audio" : ""} · {p.summary}</p>
              <p><small>Parts: {p.parts.join(" · ")}</small></p>
              {p.hf.map((m) => <p key={m.id}><small>🤗 <a href={hfUrl(m)} target="_blank" rel="noreferrer">{m.id}</a> - {m.use}</small></p>)}
              <p><small>Safety: {p.safety}</small></p>
              <p>{p.lessons.map((l) => <Link key={l} to={`/lessons/${l}`} style={{ marginRight: 8 }}>Lesson: {l}</Link>)}<a href={`/app/projects?project=${p.id}`}>Connect in the OS</a></p>
            </div>
          ))}
        </div>
        {(["crop", "weed", "toxic"] as PlantKind[]).map((k) => (
          <section key={k}>
            <h2 className="section-title" id={k}>{KIND_LABEL[k]}</h2>
            <div className="card-grid">
              {PLANTS.filter((p) => p.kind === k).map((p) => (
                <Link key={p.id} to={`/library/plants/${p.id}`} className="card" style={cardLink}>
                  <h3>{p.emoji} {p.name}</h3>
                  <p>{p.summary}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageLayout>
  );
}
