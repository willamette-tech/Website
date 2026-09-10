import Link from "next/link"
import { auth } from "@/lib/auth"
import { SignOutButton } from "./sign-out-button"
import { SignInLink } from "./sign-in-link"

export async function Navigation() {
  const session = await auth()

  return (
    <nav className="sticky top-0 z-50 bg-theme-card/80 backdrop-blur-lg border-b border-theme-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Main Nav */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold text-theme-primary"
            >
              <img
                src="/logo.svg"
                alt="Willamette Technology Club"
                className="h-8 w-8"
              />
              <span className="hidden sm:inline">Tech Club</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                className="px-3 py-2 text-sm font-medium text-theme-secondary hover:text-theme-primary hover:bg-theme-hover rounded-lg transition-colors"
              >
                Home
              </Link>
              <Link
                href="/calendar"
                className="px-3 py-2 text-sm font-medium text-theme-secondary hover:text-theme-primary hover:bg-theme-hover rounded-lg transition-colors"
              >
                Events
              </Link>
              <Link
                href="/posts"
                className="px-3 py-2 text-sm font-medium text-theme-secondary hover:text-theme-primary hover:bg-theme-hover rounded-lg transition-colors"
              >
                Posts
              </Link>
              <Link
                href="/projects"
                className="px-3 py-2 text-sm font-medium text-theme-secondary hover:text-theme-primary hover:bg-theme-hover rounded-lg transition-colors"
              >
                Projects
              </Link>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {session?.user ? (
              <>
                {session.user.isAdmin && (
                  <>
                    <Link
                      href="/admin/users"
                      className="hidden sm:block px-3 py-2 text-sm font-medium text-accent hover:text-accent-hover hover:bg-theme-hover rounded-lg transition-colors"
                    >
                      Admin
                    </Link>
                    <Link
                      href="/admin/forms"
                      className="hidden sm:block px-3 py-2 text-sm font-medium text-accent hover:text-accent-hover hover:bg-theme-hover rounded-lg transition-colors"
                    >
                      Forms
                    </Link>
                    <Link
                      href="/admin/points"
                      className="hidden sm:block px-3 py-2 text-sm font-medium text-accent hover:text-accent-hover hover:bg-theme-hover rounded-lg transition-colors"
                    >
                      Points
                    </Link>
                  </>
                )}
                <div className="h-6 w-px bg-theme-border mx-2 hidden sm:block" />
                <div className="flex items-center gap-3">
                  <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        className="w-8 h-8 rounded-full border border-theme-border"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-medium text-sm">
                        {(session.user.name || session.user.email || "U")[0].toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm text-theme-muted hidden lg:inline">
                      {session.user.displayName || session.user.name || session.user.email}
                    </span>
                  </Link>
                  <SignOutButton />
                </div>
              </>
            ) : (
              <SignInLink
                className="px-4 py-2 text-sm font-semibold text-white bg-accent hover:bg-accent-hover rounded-lg transition-colors shadow-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                Sign In
              </SignInLink>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
