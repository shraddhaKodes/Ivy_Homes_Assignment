import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import Loading from "../components/Loading.jsx";
import ErrorState from "../components/ErrorState.jsx";
import {
  addFavourite,
  getFavouriteIds,
  getListing,
  getRental,
  removeFavourite,
} from "../services/api.js";
import { formatMoney, pickValue, titleCase } from "../utils/apiData.js";

export default function ListingDetail() {
  const { listingId } = useParams();
  const location = useLocation();
  const [listing, setListing] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const isRentalDetail = location.pathname.startsWith("/rentals/");
        const [data, savedPayload] = await Promise.all([
          isRentalDetail ? getRental(listingId) : getListing(listingId),
          getFavouriteIds(),
        ]);

        setListing(data);
        setSaved(
          (savedPayload?.listing_ids || []).some(
            (id) => String(id) === String(listingId),
          ),
        );
      } catch (err) {
        setError(err.message || "Unable to load listing.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [listingId, location.pathname]);

  async function handleFavourite() {
    if (!listingId || saving) return;

    setSaving(true);
    setSaveError("");

    try {
      if (saved) {
        await removeFavourite(listingId);
        setSaved(false);
      } else {
        await addFavourite(listingId, listing);
        setSaved(true);
      }
    } catch (err) {
      setSaveError(err.message || "Unable to update saved listing.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading message="Loading property..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <main className="page listing-detail-page">
      <section className="detail-card">
        <span className="eyebrow">
          {titleCase(
            pickValue(
              listing,
              ["type", "property_type", "category"],
              "Property",
            ),
          )}
        </span>
        <h1>
          {pickValue(
            listing,
            ["apartment_name", "title", "name", "property_name"],
            "Property Detail",
          )}
        </h1>
        <p>
          {titleCase(
            pickValue(
              listing,
              ["location", "city", "locality", "address"],
              "Location pending",
            ),
          )}
        </p>

        <div className="detail-stats">
          <div>
            <span>Price</span>
            <strong>
              {formatMoney(pickValue(listing, ["price", "rent", "amount"], ""))}
            </strong>
          </div>
          <div>
            <span>Beds</span>
            <strong>
              {pickValue(listing, ["bedroom", "bedrooms", "beds", "bhk"], "-")}
            </strong>
          </div>
          <div>
            <span>Baths</span>
            <strong>
              {pickValue(listing, ["bathroom", "bathrooms", "baths"], "-")}
            </strong>
          </div>
          <div>
            <span>Area</span>
            <strong>
              {pickValue(
                listing,
                [
                  "super_built_up_area",
                  "carpet_area",
                  "area",
                  "sqft",
                  "built_up_area",
                ],
                "-",
              )}
            </strong>
          </div>
          <div>
            <span>Floor</span>
            <strong>
              {pickValue(listing, ["floor"], "-")} /{" "}
              {pickValue(listing, ["total_floors"], "-")}
            </strong>
          </div>
          <div>
            <span>Posted By</span>
            <strong>
              {pickValue(listing, ["posted_by_name", "posted_by"], "-")}
            </strong>
          </div>
        </div>

        {listing?.description && (
          <p className="detail-description">{listing.description}</p>
        )}

        {listing?.listing_url && (
          <a
            className="external-link"
            href={listing.listing_url}
            target="_blank"
            rel="noreferrer"
          >
            Open original listing
          </a>
        )}

        <button
          className="primary-button"
          type="button"
          disabled={saving}
          onClick={handleFavourite}
        >
          {saving ? "Saving..." : saved ? "Remove from Saved" : "Save Listing"}
        </button>

        {saveError && <p className="form-error">{saveError}</p>}
      </section>
    </main>
  );
}
