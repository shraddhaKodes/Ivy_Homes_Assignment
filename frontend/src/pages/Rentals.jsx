import { useCallback, useEffect, useState } from "react";
import Loading from "../components/Loading.jsx";
import ErrorState from "../components/ErrorState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ListingCard from "../components/ListingCard.jsx";
import PaginationLoader from "../components/PaginationLoader.jsx";
import { getFavouriteIds, listRentals } from "../services/api.js";
import { getCollection, getTotal, pickValue } from "../utils/apiData.js";

const PAGE_SIZE = 20;

export default function Rentals() {
  const [rentals, setRentals] = useState([]);
  const [savedListingIds, setSavedListingIds] = useState(new Set());
  const [summary, setSummary] = useState({
    count: 0,
    total: 0,
    hasMore: false,
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const loadRentals = useCallback(async ({ offset = 0, append = false } = {}) => {
    const setBusy = append ? setLoadingMore : setLoading;
    setBusy(true);
    setError("");

    try {
      const [payload, savedPayload] = await Promise.all([
        listRentals({ limit: PAGE_SIZE, offset }),
        getFavouriteIds(),
      ]);
      const nextRentals = getCollection(payload);
      const savedIds = new Set(
        (savedPayload?.listing_ids || []).map((id) => String(id)),
      );

      setSavedListingIds(savedIds);
      setRentals((current) => (append ? [...current, ...nextRentals] : nextRentals));
      setSummary({
        count: payload?.count || nextRentals.length,
        total: getTotal(payload, nextRentals.length),
        hasMore: Boolean(payload?.has_more),
      });
    } catch (err) {
      setError(err.message || "Unable to load rentals.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => loadRentals({ offset: 0 }));
  }, [loadRentals]);

  function handleLoadMore() {
    loadRentals({ offset: rentals.length, append: true });
  }

  function handleFavouriteChange({ saved, listingId }) {
    setSavedListingIds((current) => {
      const next = new Set(current);
      if (saved) {
        next.add(String(listingId));
      } else {
        next.delete(String(listingId));
      }
      return next;
    });
  }

  if (loading) return <Loading message="Loading rentals..." />;
  if (error && rentals.length === 0) return <ErrorState message={error} />;

  return (
    <main className="page rentals-page">
      <section className="page-heading">
        <span className="eyebrow">Rental inventory</span>
        <h1>Rentals</h1>
        <p>
          Showing {rentals.length} of {summary.total} rentals from the backend.
        </p>
      </section>

      {error && <ErrorState message={error} />}

      <section className="listing-grid">
        {rentals.length ? (
          rentals.map((rental) => (
            <ListingCard
              key={rental.id || rental.listing_id || rental._id}
              listing={rental}
              mode="rent"
              initiallySaved={savedListingIds.has(
                String(pickValue(rental, ["id", "listing_id", "_id"], "")),
              )}
              onFavouriteChange={handleFavouriteChange}
            />
          ))
        ) : (
          <EmptyState title="No rentals found" message="No rental records were returned." />
        )}
      </section>

      <PaginationLoader
        loading={loadingMore}
        hasMore={summary.hasMore}
        onLoadMore={handleLoadMore}
      />
    </main>
  );
}
