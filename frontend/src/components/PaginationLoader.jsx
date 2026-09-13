export default function PaginationLoader({
  loading = false,
  hasMore = false,
  onLoadMore,
}) {
  if (!loading && !hasMore) return null;

  return (
    <section className="pagination-loader">
      {loading ? (
        <span className="spinner" />
      ) : (
        <button onClick={onLoadMore} type="button">
          Load More
        </button>
      )}
    </section>
  );
}
