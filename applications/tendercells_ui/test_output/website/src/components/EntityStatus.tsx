// EntityStatus - a product family's canonical definition and honest status, with links to
// try it in the demo and read how it works (data/entities.ts). Used on /os and product pages.
import { Link } from "react-router-dom";
import { PRODUCTION_NOTE, type Entity } from "../data/entities";
import "./EntityStatus.css";

export default function EntityStatus({ entity, compact = false }: { entity: Entity; compact?: boolean }) {
  const inSite = (to: string) => !/^\/(app|flash|viewer|api)(\/|\?|$)/.test(to);
  return (
    <div className={`es ${compact ? "es-compact" : ""}`} data-testid={`status-${entity.slug}`}>
      {!compact && <p className="es-def">{entity.definition}</p>}
      <div className="es-row">
        <span className="es-label">Status</span>
        {entity.status.map((s) => <span key={s} className="es-chip">{s}</span>)}
      </div>
      {!["tendercells-os", "chickeneye", "starter-node", "camera-node"].includes(entity.slug) && (
        <p className="es-note">{PRODUCTION_NOTE}</p>
      )}
      <div className="es-links">
        {entity.demo && <a href={entity.demo}>Try it in the demo →</a>}
        {entity.docs && (inSite(entity.docs) ? <Link to={entity.docs}>How it works →</Link> : <a href={entity.docs}>How it works →</a>)}
      </div>
    </div>
  );
}
