export default function SkeletonCards({ count = 6 }) {
  return Array.from({ length: count }, (_, i) => (
    <div className="card opening-card skeleton-card" key={i} aria-hidden="true">
      <div className="row gap">
        <span className="sk sk-logo" />
        <div className="grow">
          <span className="sk sk-line w60" />
          <span className="sk sk-line w40" />
        </div>
      </div>
      <span className="sk sk-line w80" />
      <div className="row gap-sm">
        <span className="sk sk-pill" />
        <span className="sk sk-pill" />
      </div>
    </div>
  ));
}
