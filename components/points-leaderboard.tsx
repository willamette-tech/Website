import Link from "next/link"
import { theme } from "@/lib/theme"
import type { RankedMember } from "@/lib/points"

interface PointsLeaderboardProps {
  members: RankedMember[]
  compact?: boolean
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center text-sm font-bold">
        1
      </span>
    )
  }
  if (rank === 2) {
    return (
      <span className="w-6 h-6 rounded-full bg-gray-300/30 text-gray-500 dark:text-gray-400 flex items-center justify-center text-sm font-bold">
        2
      </span>
    )
  }
  if (rank === 3) {
    return (
      <span className="w-6 h-6 rounded-full bg-amber-600/20 text-amber-700 dark:text-amber-500 flex items-center justify-center text-sm font-bold">
        3
      </span>
    )
  }
  return (
    <span className="w-6 h-6 text-theme-muted flex items-center justify-center text-sm">
      {rank}
    </span>
  )
}

export function PointsLeaderboard({
  members,
  compact = false,
}: PointsLeaderboardProps) {
  if (members.length === 0) {
    return (
      <div className={`${theme.card.className} p-6`}>
        <p className="text-sm text-theme-muted text-center">
          No points awarded yet
        </p>
      </div>
    )
  }

  return (
    <div className={compact ? "" : `${theme.card.className} p-6`}>
      {!compact && (
        <h3 className={`text-lg font-medium ${theme.text.heading} mb-4`}>
          Member Points
        </h3>
      )}
      <ul className={compact ? "space-y-1" : "space-y-2"}>
        {members.map((member) => (
          <li key={member.id}>
            <Link
              href={`/members/${member.id}`}
              className={`flex items-center gap-3 rounded-lg -mx-2 px-2 hover:bg-theme-hover transition-colors group ${
                compact ? "py-1.5" : "py-2"
              }`}
            >
              <RankBadge rank={member.rank} />
              {member.image ? (
                <img
                  src={member.image}
                  alt={member.displayName || "Member"}
                  className={compact ? "w-7 h-7 rounded-full" : "w-9 h-9 rounded-full"}
                />
              ) : (
                <div
                  className={`${
                    compact ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm"
                  } rounded-full bg-accent/10 flex items-center justify-center text-accent font-medium`}
                >
                  {(member.displayName || "M")[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span
                  className={`${
                    compact ? "text-sm" : "text-base"
                  } text-theme-primary group-hover:text-accent transition-colors truncate block`}
                >
                  {member.displayName || "Anonymous"}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-semibold text-theme-primary">
                  {member.points.toLocaleString()} pts
                </span>
                <span className="block text-xs text-theme-muted">
                  {member.checkInCount}{" "}
                  {member.checkInCount === 1 ? "event" : "events"}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
