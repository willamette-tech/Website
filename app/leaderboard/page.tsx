import { theme } from "@/lib/theme"
import { getPointsLeaderboard } from "@/lib/points"
import { PointsLeaderboard } from "@/components/points-leaderboard"

export const metadata = {
  title: "Member Points | Willamette Technology Club",
  description:
    "Points earned by Willamette Technology Club members through event attendance and contributions",
}

export default async function LeaderboardPage() {
  const rankedMembers = await getPointsLeaderboard(100)

  return (
    <div className="min-h-screen bg-theme-bg">
      <div className={`${theme.container} ${theme.section}`}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className={`text-3xl md:text-4xl ${theme.text.heading}`}>
              Member Points
            </h1>
            <p className={`mt-2 ${theme.text.muted}`}>
              Earned by attending events and contributing to the club
            </p>
          </div>

          {rankedMembers.length > 0 ? (
            <div className={`${theme.card.className} p-6`}>
              <PointsLeaderboard members={rankedMembers} />
            </div>
          ) : (
            <div className={`${theme.card.className} p-12 text-center`}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-theme-hover flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-theme-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <p className="text-theme-muted">
                No points awarded yet. Check in at an event to get on the board!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
