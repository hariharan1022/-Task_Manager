import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, ArrowRight, Briefcase } from "lucide-react";
import { api } from "../utils/axios.js";
import { Badge, Card, EmptyState, Spinner } from "../components/common/index.jsx";

export default function Internships() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [domain, setDomain] = useState("all");

  useEffect(() => {
    let cancelled = false;
    api
      .get("/internships")
      .then((res) => !cancelled && setItems(res.data.items || []))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const domains = useMemo(() => {
    const set = new Set(items.map((i) => i.domain));
    return ["all", ...Array.from(set)];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const matchesQ =
        !q ||
        i.title.toLowerCase().includes(q.toLowerCase()) ||
        (i.skills || []).join(" ").toLowerCase().includes(q.toLowerCase());
      const matchesDomain = domain === "all" || i.domain === domain;
      return matchesQ && matchesDomain;
    });
  }, [items, q, domain]);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-ink">
            Browse internships
          </h1>
          <p className="text-text-secondary mt-1">
            {loading ? "Loading…" : `${filtered.length} program${filtered.length === 1 ? "" : "s"} available`}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              className="input pl-9"
              placeholder="Search title or skill…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-56">
            <Filter
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <select
              className="input pl-9 appearance-none"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            >
              {domains.map((d) => (
                <option key={d} value={d}>
                  {d === "all" ? "All domains" : d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-6">
              <div className="skeleton h-5 w-3/4 mb-3" />
              <div className="skeleton h-4 w-1/2 mb-5" />
              <div className="skeleton h-16 w-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No internships match your filters"
          description="Try a different search keyword or remove the domain filter."
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <Link
              key={p._id}
              to={`/internships/${p._id}`}
              className="group card p-6 hover:shadow-glow hover:-translate-y-0.5 transition"
            >
              <div className="flex items-center gap-2 mb-3">
                <Badge tone="primary">{p.domain}</Badge>
                <Badge tone="default">{p.duration}</Badge>
              </div>
              <h3 className="text-lg font-semibold text-ink group-hover:text-primary">
                {p.title}
              </h3>
              <p className="text-sm text-text-secondary line-clamp-3 mt-2">
                {p.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {(p.skills || []).slice(0, 4).map((s) => (
                  <span
                    key={s}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-surface text-text-secondary"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between">
                <span className="text-xs text-text-secondary">{p.stipend}</span>
                <span className="text-sm font-semibold text-primary inline-flex items-center gap-1">
                  View details <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
