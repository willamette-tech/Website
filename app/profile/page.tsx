import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { ProfileForm } from "./profile-form"
import { theme } from "@/lib/theme"

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-theme-bg py-12">
      <div className={theme.container}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <h1 className={`text-3xl ${theme.text.heading}`}>Your Profile</h1>
            <Link
              href={`/members/${session.user.id}`}
              className="text-sm text-accent hover:text-accent-hover font-medium transition-colors"
            >
              View public profile
            </Link>
          </div>

          <div className={`${theme.card.className} p-6 md:p-8`}>
            {/* Avatar and Basic Info */}
            <div className="flex items-start gap-6 mb-8 pb-8 border-b border-theme-border">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-20 h-20 rounded-full border-2 border-theme-border"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-2xl">
                  {(session.user.name || session.user.email || "U")[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <h2 className={`text-xl ${theme.text.heading}`}>
                  {session.user.displayName || session.user.name || "Member"}
                </h2>
                {session.user.githubUsername && (
                  <a
                    href={`https://github.com/${session.user.githubUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-theme-muted hover:text-accent transition-colors flex items-center gap-1 mt-1"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path
                        fillRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    @{session.user.githubUsername}
                  </a>
                )}
                {/* Status badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {session.user.isAdmin && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                      Admin
                    </span>
                  )}
                  {session.user.isApproved ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      Approved Member
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                      Pending Approval
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <ProfileForm
              currentDisplayName={session.user.displayName || ""}
              email={session.user.email || ""}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
