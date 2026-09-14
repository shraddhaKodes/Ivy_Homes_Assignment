export default function ListingFilters({
  filters,
  onChange,
  onApply,
  disabled = false,
}) {
  return (
    <form className="listing-filters" onSubmit={onApply}>
      <div className="filter-group">
        <label>Property Type</label>
        <select
          value={filters.property_type || ""}
          onChange={(event) =>
            onChange({ ...filters, property_type: event.target.value })
          }
          disabled={disabled}
        >
          <option value="">All Types</option>
          <option value="apartment">Apartment</option>
          <option value="villa">Villa</option>
          <option value="independent house">Independent House</option>
          <option value="builder floor">Builder Floor</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Locality</label>
        <input
          type="text"
          value={filters.locality || ""}
          placeholder="e.g. Kompally"
          onChange={(event) =>
            onChange({ ...filters, locality: event.target.value })
          }
          disabled={disabled}
        />
      </div>

      <div className="filter-group">
        <label>Bedrooms</label>
        <select
          value={filters.bedrooms || ""}
          onChange={(event) =>
            onChange({ ...filters, bedrooms: event.target.value })
          }
          disabled={disabled}
        >
          <option value="">Any Bedrooms</option>
          <option value="1">1 Bedroom</option>
          <option value="2">2 Bedrooms</option>
          <option value="3">3 Bedrooms</option>
          <option value="4">4 Bedrooms</option>
          <option value="5">5+ Bedrooms</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Min Rent</label>
        <input
          type="number"
          min="0"
          step="1"
          value={filters.min_rent ?? filters.min_price ?? ""}
          placeholder="Min"
          onChange={(event) =>
            onChange({
              ...filters,
              min_rent: event.target.value,
              min_price: event.target.value,
            })
          }
          disabled={disabled}
        />
      </div>

      <div className="filter-group">
        <label>Max Rent</label>
        <input
          type="number"
          min="0"
          step="1"
          value={filters.max_rent ?? filters.max_price ?? ""}
          placeholder="Max"
          onChange={(event) =>
            onChange({
              ...filters,
              max_rent: event.target.value,
              max_price: event.target.value,
            })
          }
          disabled={disabled}
        />
      </div>

      <div className="filter-group">
        <label>Furnishing</label>
        <select
          value={filters.furnishing || ""}
          onChange={(event) =>
            onChange({ ...filters, furnishing: event.target.value })
          }
          disabled={disabled}
        >
          <option value="">Any Furnishing</option>
          <option value="fully-furnished">Fully Furnished</option>
          <option value="semi-furnished">Semi Furnished</option>
          <option value="unfurnished">Unfurnished</option>
        </select>
      </div>

      <button className="filter-button" disabled={disabled}>
        {disabled ? "Loading..." : "Apply Filters"}
      </button>
    </form>
  );
}
