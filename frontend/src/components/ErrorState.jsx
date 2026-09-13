export default function ErrorState({ message = "Something went wrong." }) {
  return (
    <section className="error-state">
      <h2>Unable to load</h2>
      <p>{message}</p>
    </section>
  );
}
