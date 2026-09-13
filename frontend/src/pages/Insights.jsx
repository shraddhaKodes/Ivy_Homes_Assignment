import { useEffect, useState } from "react";
import Loading from "../components/Loading.jsx";
import ErrorState from "../components/ErrorState.jsx";
import { getAnalyticsSummary } from "../services/api.js";
import { formatNumber, pickValue } from "../utils/apiData.js";

export default function Insights() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const payload = await getAnalyticsSummary();
        setSummary(payload);
      } catch (err) {
        setError(err.message || "Unable to load analytics.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) return <Loading message="Loading insights..." />;
  if (error) return <ErrorState message={error} />;

  const stats = [
    ["Total listings", pickValue(summary, ["total_listings", "listings", "listing_count"], 0)],
    ["Average price", pickValue(summary, ["average_price", "avg_price"], 0)],
    ["Active rentals", pickValue(summary, ["rentals", "rental_count", "active_rentals"], 0)],
    ["Projects", pickValue(summary, ["projects", "project_count"], 0)],
  ];

  return (
    <main className="page insights-page">
      <section className="page-heading">
        <span className="eyebrow">Backend analytics</span>
        <h1>Insights</h1>
        <p>Live market summary from the Ivy Homes API.</p>
      </section>

      <section className="stats-grid">
        {stats.map(([label, value]) => (
          <article className="stat-card" key={label}>
            <span>{label}</span>
            <strong>{formatNumber(value)}</strong>
          </article>
        ))}
      </section>
    </main>
  );
}
