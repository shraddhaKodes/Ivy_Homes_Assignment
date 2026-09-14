import { useCallback, useEffect, useState } from "react";
import Loading from "../components/Loading.jsx";
import ErrorState from "../components/ErrorState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import PaginationLoader from "../components/PaginationLoader.jsx";
import { listProjects } from "../services/api.js";
import {
  formatNumber,
  formatProjectPrice,
  getCollection,
  getTotal,
  pickValue,
  titleCase,
} from "../utils/apiData.js";
import {
  applyClientProjectFilters,
  buildProjectFilterQuery,
} from "../utils/filters.js";

const PAGE_SIZE = 20;
const EMPTY_FILTERS = {
  locality: "",
  developer_name: "",
  project_status: "",
  price_min: "",
  price_max: "",
  project_id: "",
};

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
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
  const [optionValues, setOptionValues] = useState({
    developer_name: [],
    locality: [],
    project_status: [],
  });

  const loadFilterOptions = useCallback(async () => {
    try {
      const payload = await listProjects({ limit: 5000, offset: 0 });
      const allProjects = getCollection(payload);

      const developerOptions = [
        ...new Set(
          allProjects.map((project) => project.developer_name).filter(Boolean),
        ),
      ].sort();

      const localityOptions = [
        ...new Set(
          allProjects.map((project) => project.locality).filter(Boolean),
        ),
      ].sort();

      const statusOptions = [
        ...new Set(
          allProjects.map((project) => project.project_status).filter(Boolean),
        ),
      ].sort();

      setOptionValues({
        developer_name: developerOptions,
        locality: localityOptions,
        project_status: statusOptions,
      });
    } catch (err) {
      setOptionValues({ developer_name: [], locality: [], project_status: [] });
    }
  }, []);

  const loadProjects = useCallback(
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
          ...buildProjectFilterQuery(filterState),
        };

        const payload = await listProjects(query);
        const sourceProjects = getCollection(payload);
        const clientFiltered = applyClientProjectFilters(
          sourceProjects,
          filterState,
        );

        setProjects((current) =>
          append ? [...current, ...clientFiltered] : clientFiltered,
        );
        setSummary({
          count: clientFiltered.length,
          total: getTotal(payload, clientFiltered.length),
          hasMore: Boolean(payload?.has_more),
        });
        setServerOffset(offset + sourceProjects.length);
      } catch (err) {
        setError(err.message || "Unable to load projects.");
      } finally {
        setBusy(false);
      }
    },
    [appliedFilterState],
  );

  useEffect(() => {
    Promise.resolve().then(() => {
      loadFilterOptions();
      loadProjects({ offset: 0 });
    });
  }, [loadFilterOptions, loadProjects]);

  function handleApply(event) {
    event.preventDefault();
    setProjects([]);
    setServerOffset(0);
    setAppliedFilterState(filters);
    loadProjects({ offset: 0, append: false, filterState: filters });
  }

  function handleClear(event) {
    event.preventDefault();
    setFilters({ ...EMPTY_FILTERS });
    setProjects([]);
    setServerOffset(0);
    setAppliedFilterState({});
    loadProjects({ offset: 0, append: false, filterState: {} });
  }

  function handleLoadMore() {
    loadProjects({
      offset: serverOffset,
      append: true,
      filterState: appliedFilterState,
    });
  }

  if (loading) return <Loading message="Loading projects..." />;
  if (error && projects.length === 0) return <ErrorState message={error} />;

  return (
    <main className="page projects-page">
      <section className="page-heading">
        <span className="eyebrow">Development updates</span>
        <h1>Projects</h1>
        <p>
          Showing {projects.length} of {summary.total} projects from the
          backend.
        </p>
      </section>

      <form className="listing-filters" onSubmit={handleApply}>
        <div className="filter-group">
          <label>Locality</label>
          <select
            value={filters.locality || ""}
            onChange={(event) =>
              setFilters({ ...filters, locality: event.target.value })
            }
            disabled={loading || loadingMore}
          >
            <option value="">All Localities</option>
            {optionValues.locality.map((value) => (
              <option key={value} value={value}>
                {titleCase(value)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Developer</label>
          <select
            value={filters.developer_name || ""}
            onChange={(event) =>
              setFilters({
                ...filters,
                developer_name: event.target.value,
              })
            }
            disabled={loading || loadingMore}
          >
            <option value="">All Developers</option>
            {optionValues.developer_name.map((value) => (
              <option key={value} value={value}>
                {titleCase(value)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Project Status</label>
          <select
            value={filters.project_status || ""}
            onChange={(event) =>
              setFilters({
                ...filters,
                project_status: event.target.value,
              })
            }
            disabled={loading || loadingMore}
          >
            <option value="">All Statuses</option>
            {optionValues.project_status.map((value) => (
              <option key={value} value={value}>
                {titleCase(value)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Project ID</label>
          <input
            type="text"
            value={filters.project_id || ""}
            placeholder="e.g. P20001"
            onChange={(event) =>
              setFilters({ ...filters, project_id: event.target.value })
            }
            disabled={loading || loadingMore}
          />
        </div>

        <div className="filter-group">
          <label>Min Price</label>
          <input
            type="number"
            min="0"
            step="1"
            value={filters.price_min || ""}
            placeholder="Min"
            onChange={(event) =>
              setFilters({
                ...filters,
                price_min: event.target.value,
              })
            }
            disabled={loading || loadingMore}
          />
        </div>

        <div className="filter-group">
          <label>Max Price</label>
          <input
            type="number"
            min="0"
            step="1"
            value={filters.price_max || ""}
            placeholder="Max"
            onChange={(event) =>
              setFilters({
                ...filters,
                price_max: event.target.value,
              })
            }
            disabled={loading || loadingMore}
          />
        </div>

        <div className="filter-actions">
          <button className="filter-button" disabled={loading || loadingMore}>
            {loading || loadingMore ? "Loading..." : "Apply Filters"}
          </button>
          <button
            className="filter-button secondary"
            type="button"
            disabled={loading || loadingMore}
            onClick={handleClear}
          >
            Clear Filters
          </button>
        </div>
      </form>

      {error && <ErrorState message={error} />}

      <section className="project-grid">
        {projects.length ? (
          projects.map((project) => (
            <article
              className="project-card"
              key={project.project_id || project.id || project._id}
            >
              <span className="eyebrow">
                {titleCase(
                  pickValue(
                    project,
                    ["project_status", "status", "stage", "type"],
                    "Project",
                  ),
                )}
              </span>
              <h2>
                {pickValue(
                  project,
                  ["apartment_name", "title", "name", "project_name"],
                  "Project",
                )}
              </h2>
              <p>
                {pickValue(
                  project,
                  ["developer_name", "developer"],
                  "Developer pending",
                )}
              </p>
              <p>
                {titleCase(
                  pickValue(
                    project,
                    ["locality", "city", "location"],
                    "Location pending",
                  ),
                )}
              </p>
              <div className="project-meta">
                <span>
                  {formatNumber(pickValue(project, ["total_units"], "-"))} units
                </span>
                <span>
                  {formatNumber(pickValue(project, ["total_towers"], "-"))}{" "}
                  towers
                </span>
              </div>
              <div className="project-meta">
                <span>
                  {formatNumber(pickValue(project, ["min_area_sqft"], "-"))} -{" "}
                  {formatNumber(pickValue(project, ["max_area_sqft"], "-"))}{" "}
                  sqft
                </span>
              </div>
              <div className="project-meta">
                <span>
                  {formatProjectPrice(pickValue(project, ["price_min"], ""))} -{" "}
                  {formatProjectPrice(pickValue(project, ["price_max"], ""))}
                </span>
              </div>
              <div className="project-meta">
                <span>
                  {formatNumber(pickValue(project, ["total_listings"], "0"))}{" "}
                  listings
                </span>
              </div>
            </article>
          ))
        ) : (
          <EmptyState
            title="No projects found"
            message="No project records were returned."
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
