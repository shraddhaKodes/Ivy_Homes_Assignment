export default function EmptyState({
  title = "No results found",
  message = "Try adjusting your filters.",
}) {
  return (
    <section className="empty-state">
      <h2>{title}</h2>
      <p>{message}</p>
    </section>
  );
}
