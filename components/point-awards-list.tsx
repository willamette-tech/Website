import Link from "next/link"
import { PointSourceBadge } from "@/components/point-source-badge"
import { formatPoints } from "@/lib/format-points"
import type { MemberAward } from "@/lib/points"

export function PointAwardsList({ awards }: { awards: MemberAward[] }) {
  if (awards.length === 0) {
    return (
      <p className="text-sm text-theme-muted">
        No points yet. Check in at an event to get started.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-theme-border">
      {awards.map((award) => (
        <li key={award.id} className="py-4 flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <PointSourceBadge source={award.source} />
              <span className="text-xs text-theme-muted">
                {new Date(award.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            {/* The reason already names the event (it is stored denormalized so
                it still reads correctly if the event is deleted), so link the
                reason itself rather than repeating the title underneath. */}
            <p className="mt-1.5 text-sm text-theme-primary break-words">
              {award.event ? (
                <Link
                  href={`/events/${award.event.id}`}
                  className="hover:text-accent transition-colors"
                >
                  {award.reason}
                </Link>
              ) : (
                award.reason
              )}
            </p>
            {award.awardedBy && (
              <p className="mt-1 text-xs text-theme-muted">
                by {award.awardedBy.displayName || award.awardedBy.name || "an admin"}
              </p>
            )}
          </div>
          <span
            className={`text-sm font-semibold shrink-0 tabular-nums ${
              award.points > 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {formatPoints(award.points)}
          </span>
        </li>
      ))}
    </ul>
  )
}
