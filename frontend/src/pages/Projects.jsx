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

const PAGE_SIZE = 20;

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState({
    count: 0,
    total: 0,
    hasMore: false,
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const loadProjects = useCallback(
    async ({ offset = 0, append = false } = {}) => {
      const setBusy = append ? setLoadingMore : setLoading;
      setBusy(true);
      setError("");

      try {
        const payload = await listProjects({ limit: PAGE_SIZE, offset });
        const nextProjects = getCollection(payload);

        setProjects((current) =>
          append ? [...current, ...nextProjects] : nextProjects,
        );
        setSummary({
          count: payload?.count || nextProjects.length,
          total: getTotal(payload, nextProjects.length),
          hasMore: Boolean(payload?.has_more),
        });
      } catch (err) {
        setError(err.message || "Unable to load projects.");
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  useEffect(() => {
    Promise.resolve().then(() => loadProjects({ offset: 0 }));
  }, [loadProjects]);

  function handleLoadMore() {
    loadProjects({ offset: projects.length, append: true });
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
