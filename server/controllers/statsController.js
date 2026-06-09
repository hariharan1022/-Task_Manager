import { User } from "../models/User.js";
import { InternshipProgram } from "../models/Internship.js";
import { Application } from "../models/Application.js";
import { isDBConnected } from "../config/db.js";

const ONLINE_WINDOW_MS = 15 * 60 * 1000;

export async function publicStats(req, res) {
  const fallback = {
    internsOnline: 0,
    totalInterns: 0,
    domains: 3,
    domainsLabel: "3+",
    completionRate: 99,
    studentRating: 4.7,
  };

  if (!isDBConnected()) {
    return res.json(fallback);
  }

  try {
    const since = new Date(Date.now() - ONLINE_WINDOW_MS);
    const [internsOnline, totalInterns, domainList, completed, accepted] =
      await Promise.all([
        User.countDocuments({ role: "student", lastActiveAt: { $gte: since } }),
        User.countDocuments({ role: "student" }),
        InternshipProgram.distinct("domain", { isActive: true }),
        Application.countDocuments({ status: "completed" }),
        Application.countDocuments({ status: { $in: ["accepted", "completed"] } }),
      ]);

    const domainCount = Math.max(domainList.filter(Boolean).length, 3);

    res.json({
      internsOnline,
      totalInterns,
      domains: domainCount,
      domainsLabel: `${domainCount}+`,
      completionRate:
        accepted > 0 ? Math.min(99, Math.round((completed / accepted) * 100)) : 99,
      studentRating: 4.7,
    });
  } catch {
    res.json(fallback);
  }
}
