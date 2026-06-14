import type { CSSProperties, ReactNode } from "react";

interface PageHeroProps {
  title: ReactNode;
  subtitle?: ReactNode;
  kicker?: ReactNode;
  /** Optional preset variant class: "green" | "dark" | "orange" | "red" */
  variant?: string;
  /** Optional inline gradient/background override (takes precedence over variant). */
  gradient?: string;
  /** Visual hook shown beside the copy (right on desktop, on top on mobile). */
  image?: string;
  imageAlt?: string;
  children?: ReactNode;
}

/**
 * Shared marketing page hero.
 *
 * Renders centered copy by default. When `image` is supplied it switches to a
 * two-column layout (copy + visual) and, on mobile, stacks the image on top so
 * every page opens with a visual hook instead of a wall of text.
 *
 * @param title    - Hero headline
 * @param subtitle - Optional supporting line
 * @param image    - Optional hero visual path (e.g. /assets/images/...)
 * @example
 *   <PageHero variant="green" title="Shop Tender Cells" image="/assets/images/products/chicken-tender-concept.png" />
 */
export default function PageHero({
  title,
  subtitle,
  kicker,
  variant,
  gradient,
  image,
  imageAlt,
  children,
}: PageHeroProps) {
  const className = ["page-hero", variant, image ? "has-visual" : ""]
    .filter(Boolean)
    .join(" ");
  const style: CSSProperties | undefined = gradient ? { background: gradient } : undefined;

  return (
    <div className={className} style={style}>
      <div className="page-hero-copy">
        {kicker ? <p className="page-hero-kicker">{kicker}</p> : null}
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
        {children}
      </div>
      {image ? (
        <figure className="page-hero-visual">
          <img src={image} alt={imageAlt ?? ""} loading="eager" />
          <figcaption className="page-hero-visual-label">{title}</figcaption>
        </figure>
      ) : null}
    </div>
  );
}
