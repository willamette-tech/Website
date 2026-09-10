import { PointSource } from "@prisma/client"

const LABELS: Record<PointSource, string> = {
  [PointSource.EVENT_CHECKIN]: "Attendance",
  [PointSource.RSVP_BONUS]: "RSVP bonus",
  [PointSource.MANUAL]: "Awarded",
}

const STYLES: Record<PointSource, string> = {
  [PointSource.EVENT_CHECKIN]:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  [PointSource.RSVP_BONUS]:
    "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  [PointSource.MANUAL]:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
}

export function PointSourceBadge({ source }: { source: PointSource }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STYLES[source]}`}
    >
      {LABELS[source]}
    </span>
  )
}
