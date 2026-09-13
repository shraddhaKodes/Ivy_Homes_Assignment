import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { addFavourite, removeFavourite } from "../services/api.js";
import { formatMoney, pickValue, titleCase } from "../utils/apiData.js";

function favouriteRecordIdFromPayload(payload = {}) {
  const favourite = payload.favourite || payload;
  return pickValue(favourite, ["id", "favourite_id", "favorite_id", "_id"], "");
}

export default function ListingCard({
  listing,
  mode = "sale",
  favouriteId = "",
  initiallySaved = false,
  onFavouriteChange = null,
}) {
  const item = listing || {};
  const listingId = pickValue(item, ["id", "listing_id", "_id"], "");
  const id = listingId || favouriteId;
  const [saving, setSaving] = useState(false);
  const [recordId, setRecordId] = useState(
    favouriteId || item?.favourite_id || item?.favorite_id || "",
  );
  const [saved, setSaved] = useState(
    Boolean(initiallySaved || recordId || item?.is_saved || item?.saved),
  );
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    setRecordId(favouriteId || item?.favourite_id || item?.favorite_id || "");
    setSaved(Boolean(initiallySaved || favouriteId || item?.is_saved || item?.saved));
  }, [favouriteId, initiallySaved, item]);

  const title = pickValue(
    item,
    ["title", "apartment_name", "name", "property_name"],
    "Property",
  );
  const location = pickValue(
    item,
    ["location", "city", "locality", "address"],
    "Location not available",
  );
  const type = pickValue(
    item,
    ["type", "property_type", "category"],
    "Property",
  );
  const price = pickValue(
    item,
    ["price", "rent", "amount", "listing_price"],
    "",
  );
  const bedrooms = pickValue(item, ["bedroom", "bedrooms", "beds", "bhk"], "-");
  const bathrooms = pickValue(item, ["bathroom", "bathrooms", "baths"], "-");
  const area = pickValue(
    item,
    [
      "super_builtup_area",
      "super_built_up_area",
      "carpet_area",
      "area",
      "sqft",
      "built_up_area",
    ],
    "",
  );
  const website = pickValue(item, ["website"], "");
  const postedBy = pickValue(item, ["posted_by_name", "posted_by"], "");
  const floor = pickValue(item, ["floor"], "");
  const totalFloors = pickValue(item, ["total_floors"], "");
  const apartment = pickValue(item, ["apartment_name"], "");
  const deposit = pickValue(item, ["deposit"], "");
  const maintenance = pickValue(item, ["maintenance"], "");

  const content = (
    <>
      <div className="listing-image">
        <span>{titleCase(type)}</span>
      </div>
      <div className="listing-details">
        <div className="listing-top">
          <h3>{title}</h3>
          <span className="price">{formatMoney(price)}</span>
        </div>
        <p className="listing-location">{titleCase(location)}</p>
        {apartment && apartment !== title && (
          <p className="listing-apartment">{apartment}</p>
        )}
        <p className="listing-meta">
          {bedrooms} beds | {bathrooms} baths
          {area ? ` | ${area} sqft` : ""}
        </p>
        {mode === "rent" && (
          <p className="listing-money-row">
            {deposit ? `Deposit ${formatMoney(deposit)}` : "Deposit not listed"}
            {maintenance ? ` | Maintenance ${formatMoney(maintenance)}` : ""}
          </p>
        )}
        <div className="listing-badges">
          {item.is_verified && <span className="badge verified">Verified</span>}
          {item.is_live && <span className="badge live">Live</span>}
          {website && <span className="badge">{titleCase(website)}</span>}
        </div>
        <p className="listing-extra">
          {floor !== ""
            ? `Floor ${floor}${totalFloors !== "" ? ` of ${totalFloors}` : ""}`
            : ""}
          {postedBy ? `${floor !== "" ? " | " : ""}${postedBy}` : ""}
        </p>
      </div>
    </>
  );

  const detailPath =
    mode === "rent"
      ? `/rentals/${encodeURIComponent(id)}`
      : `/listings/${encodeURIComponent(id)}`;

  async function handleFavourite(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!listingId || saving) return;

    setSaving(true);
    setSaveError("");

    try {
      if (saved) {
        const removeId = recordId || favouriteId;
        if (!removeId) {
          setSaving(false);
          return;
        }

        await removeFavourite(removeId);
        setSaved(false);
        setRecordId("");
        if (onFavouriteChange) {
          onFavouriteChange({
            saved: false,
            listingId,
            favouriteRecordId: removeId,
          });
        }
      } else {
        const payload = await addFavourite(listingId, item);
        const nextRecordId = favouriteRecordIdFromPayload(payload);
        setSaved(true);
        setRecordId(nextRecordId || listingId);
        if (onFavouriteChange) {
          onFavouriteChange({
            saved: true,
            listingId,
            favouriteRecordId: nextRecordId || listingId,
          });
        }
      }
    } catch (err) {
      setSaveError(err.message || "Unable to update saved listing.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="listing-card">
      {id ? (
        <Link className="listing-card-link" to={detailPath}>
          {content}
        </Link>
      ) : (
        content
      )}

      {listingId && (
        <button
          className="save-toggle"
          type="button"
          disabled={saving}
          onClick={handleFavourite}
        >
          {saved ? "Remove" : "Save"}
        </button>
      )}
      {saveError && <p className="save-error">{saveError}</p>}
    </article>
  );
}
