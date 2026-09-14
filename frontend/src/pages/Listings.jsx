import { useCallback, useEffect, useState } from "react";
import ListingCard from "../components/ListingCard.jsx";
import ListingFilters from "../components/ListingFilters.jsx";
import PaginationLoader from "../components/PaginationLoader.jsx";
import Loading from "../components/Loading.jsx";
import ErrorState from "../components/ErrorState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { getFavouriteIds, listListings } from "../services/api.js";
import { getCollection, getTotal, pickValue } from "../utils/apiData.js";
import {
  applyClientListingFilters,
  buildListingFilterQuery,
} from "../utils/filters.js";

const PAGE_SIZE = 20;

export default function Listings() {
  const [listings, setListings] = useState([]);
  const [savedListingIds, setSavedListingIds] = useState(new Set());
  const [summary, setSummary] = useState({
    count: 0,
    total: 0,
    hasMore: false,
  });
  const [filters, setFilters] = useState({
    property_type: "",
    locality: "",
    bedrooms: "",
    min_price: "",
    max_price: "",
    furnishing: "",
  });
  const [serverOffset, setServerOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [appliedFilterState, setAppliedFilterState] = useState({});

  const loadListings = useCallback(
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
          listListings(query),
          getFavouriteIds(),
        ]);

        const sourceListings = getCollection(payload);
        const savedIds = new Set(
          (savedPayload?.listing_ids || []).map((id) => String(id)),
        );
        const clientFiltered = applyClientListingFilters(
          sourceListings,
          filterState,
        );

        setSavedListingIds(savedIds);
        setListings((current) =>
          append ? [...current, ...clientFiltered] : clientFiltered,
        );
        setSummary({
          count: clientFiltered.length,
          total: getTotal(payload, clientFiltered.length),
          hasMore: Boolean(payload?.has_more),
        });

        setServerOffset(offset + sourceListings.length);
      } catch (err) {
        setError(err.message || "Unable to load listings.");
      } finally {
        setBusy(false);
      }
    },
    [appliedFilterState],
  );

  useEffect(() => {
    Promise.resolve().then(() => loadListings({ offset: 0 }));
  }, []);

  function handleApply(event) {
    event.preventDefault();
    setListings([]);
    setServerOffset(0);
    setAppliedFilterState(filters);
    loadListings({ offset: 0, append: false, filterState: filters });
  }

  function handleLoadMore() {
    loadListings({
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

  if (loading) return <Loading message="Loading listings..." />;
  if (error && listings.length === 0) return <ErrorState message={error} />;

  return (
    <main className="page listings-page">
      <section className="page-heading">
        <span className="eyebrow">Live inventory</span>
        <h1>Listings</h1>
        <p>
          Showing {listings.length} of {summary.total} properties from the
          backend.
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
        {listings.length === 0 ? (
          <EmptyState
            title="No listings found"
            message="Try again after changing filters."
          />
        ) : (
          listings.map((listing) => (
            <ListingCard
              key={listing.id || listing.listing_id}
              listing={listing}
              initiallySaved={savedListingIds.has(
                String(pickValue(listing, ["id", "listing_id", "_id"], "")),
              )}
              onFavouriteChange={handleFavouriteChange}
            />
          ))
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
