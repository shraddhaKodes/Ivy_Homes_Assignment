export default function Loading({ message = "Loading..." }) {
  return (
    <section className="loading-state">
      <span className="spinner" aria-label="loading" />
      <p>{message}</p>
    </section>
  );
}
