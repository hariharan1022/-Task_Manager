import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { api } from "../../utils/axios.js";
import { Card, EmptyState, Spinner } from "../../components/common/index.jsx";

export default function Leaderboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/applications/leaderboard")
      .then((res) => !cancelled && setItems(res.data.items || []))
      .catch(() => !cancelled && setItems([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="card p-10 flex justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink">Leaderboard</h1>
        <p className="text-text-secondary text-sm mt-1">
          Top interns ranked by total task score.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Leaderboard is empty"
          description="Scores appear here once interns complete and get tasks approved."
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-text-secondary">
                <th className="px-4 py-3 font-medium">Rank</th>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">College</th>
                <th className="px-4 py-3 font-medium">Program</th>
                <th className="px-4 py-3 font-medium text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, i) => (
                <tr key={row._id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-semibold text-ink">#{i + 1}</td>
                  <td className="px-4 py-3">{row.student?.fullName || "—"}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-text-secondary">
                    {row.student?.college || "—"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {row.internship?.title || "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-primary">
                    {row.totalScore || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
