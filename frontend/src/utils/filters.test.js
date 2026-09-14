import test from "node:test";
import assert from "node:assert/strict";
import { buildListingFilterQuery, buildProjectFilterQuery } from "./filters.js";

test("buildListingFilterQuery omits blank filters and keeps only values the user applied", () => {
  const filters = {
    city_id: "2",
    property_type: "",
    locality: "Kompally",
    bedrooms: "",
    min_rent: "",
    max_rent: "5000000",
    furnishing: "",
  };

  assert.deepEqual(buildListingFilterQuery(filters), {
    locality: "Kompally",
    max_rent: "5000000",
  });
});

test("buildProjectFilterQuery accepts the project fields requested by the Projects screen", () => {
  const filters = {
    locality: "Kompally",
    developer_name: "MySpace",
    project_status: "Ongoing",
    price_min: "1000000",
    price_max: "5000000",
    project_id: "P123",
  };

  assert.deepEqual(buildProjectFilterQuery(filters), {
    locality: "Kompally",
    developer_name: "MySpace",
    project_status: "Ongoing",
    price_min: "1000000",
    price_max: "5000000",
    project_id: "P123",
  });
});
