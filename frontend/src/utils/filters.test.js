import test from "node:test";
import assert from "node:assert/strict";
import { buildListingFilterQuery } from "./filters.js";

test("buildListingFilterQuery omits blank filters and keeps only values the user applied", () => {
  const filters = {
    city_id: "2",
    property_type: "",
    locality: "Kompally",
    bedrooms: "",
    min_price: "",
    max_price: "5000000",
    furnishing: "",
  };

  assert.deepEqual(buildListingFilterQuery(filters), {
    city_id: "2",
    locality: "Kompally",
    max_price: "5000000",
  });
});
