import { useEffect, useState } from "react";
import Loading from "../components/Loading.jsx";
import ErrorState from "../components/ErrorState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ListingCard from "../components/ListingCard.jsx";
import { getFavourites } from "../services/api.js";
import { getCollection } from "../utils/apiData.js";

export default function SavedListings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const payload = await getFavourites();
        setItems(getCollection(payload));
      } catch (err) {
        setError(err.message || "Unable to load favourites.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function handleFavouriteChange({ saved, favouriteRecordId }) {
    if (!saved && favouriteRecordId) {
      setItems((current) =>
        current.filter((item) => {
          const candidate =
            item.favourite_id || item.id || item._id || item.favorite_id;
          return String(candidate) !== String(favouriteRecordId);
        }),
      );
    }
  }

  if (loading) return <Loading message="Loading saved listings..." />;
  if (error) return <ErrorState message={error} />;
  if (!items.length)
    return (
      <EmptyState title="Saved Listings" message="No saved properties yet." />
    );

  return (
    <main className="page saved-listings-page">
      <section className="page-heading">
        <span className="eyebrow">Favourites</span>
        <h1>Saved Listings</h1>
        <p>Your favorite properties will appear here.</p>
      </section>

      <section className="listing-grid">
        {items.map((item) => (
          <ListingCard
            key={
              item.id ||
              item.listing_id ||
              item.favourite_id ||
              item.favorite_id ||
              item._id
            }
            listing={item.listing || item}
            favouriteId={
              item.favourite_id || item.favorite_id || item.id || item._id
            }
            onFavouriteChange={handleFavouriteChange}
            mode="sale"
          />
        ))}
      </section>
    </main>
  );
}
