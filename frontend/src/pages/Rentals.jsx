import { useCallback, useEffect, useState } from "react";
import Loading from "../components/Loading.jsx";
import ErrorState from "../components/ErrorState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ListingCard from "../components/ListingCard.jsx";
import ListingFilters from "../components/ListingFilters.jsx";
import PaginationLoader from "../components/PaginationLoader.jsx";
import { getFavouriteIds, listRentals } from "../services/api.js";
import { getCollection, getTotal, pickValue } from "../utils/apiData.js";
import {
  applyClientListingFilters,
  buildListingFilterQuery,
} from "../utils/filters.js";

const PAGE_SIZE = 20;

export default function Rentals() {
  const [rentals, setRentals] = useState([]);
  const [savedListingIds, setSavedListingIds] = useState(new Set());
  const [filters, setFilters] = useState({
    property_type: "",
    locality: "",
    bedrooms: "",
    min_rent: "",
    max_rent: "",
    furnishing: "",
  });
  const [summary, setSummary] = useState({
    count: 0,
    total: 0,
    hasMore: false,
  });
  const [serverOffset, setServerOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [appliedFilterState, setAppliedFilterState] = useState({});

  const loadRentals = useCallback(
    async ({
      offset = 0,
      append = false,
      filterState = appliedFilterState,
    } = {}) => {
      const setBusy = append ? setLoadingMore : setLoading;
      setBusy(true);
      setError("");

      try {
        const query = {
          limit: PAGE_SIZE,
          offset,
          ...buildListingFilterQuery(filterState),
        };

        const [payload, savedPayload] = await Promise.all([
          listRentals(query),
          getFavouriteIds(),
        ]);

        const sourceRentals = getCollection(payload);
        const savedIds = new Set(
          (savedPayload?.listing_ids || []).map((id) => String(id)),
        );
        const clientFiltered = applyClientListingFilters(
          sourceRentals,
          filterState,
        );

        setSavedListingIds(savedIds);
        setRentals((current) =>
          append ? [...current, ...clientFiltered] : clientFiltered,
        );
        setSummary({
          count: clientFiltered.length,
          total: getTotal(payload, clientFiltered.length),
          hasMore: Boolean(payload?.has_more),
        });
        setServerOffset(offset + sourceRentals.length);
      } catch (err) {
        setError(err.message || "Unable to load rentals.");
      } finally {
        setBusy(false);
      }
    },
    [appliedFilterState],
  );

  useEffect(() => {
    Promise.resolve().then(() => loadRentals({ offset: 0 }));
  }, []);

  function handleApply(event) {
    event.preventDefault();
    setRentals([]);
    setServerOffset(0);
    setAppliedFilterState(filters);
    loadRentals({ offset: 0, append: false, filterState: filters });
  }

  function handleLoadMore() {
    loadRentals({
      offset: serverOffset,
      append: true,
      filterState: appliedFilterState,
    });
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

      <ListingFilters
        filters={filters}
        onChange={setFilters}
        onApply={handleApply}
        disabled={loading || loadingMore}
      />

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
          <EmptyState
            title="No rentals found"
            message="No rental records were returned."
          />
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
