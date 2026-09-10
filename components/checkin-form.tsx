"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { theme } from "@/lib/theme"
import type { FormQuestionDef } from "@/lib/forms"
import { FormRenderer, type RendererChange } from "./form-renderer"
import { SignInLink } from "./sign-in-link"
import { useToast } from "./toast"
import { checkinToast } from "@/lib/checkin-toast"

interface CheckinFormProps {
  eventId: string
  eventTitle?: string
  hasCheckedIn?: boolean
  checkInForm?: {
    id: string
    title: string
    description: string | null
    questions: FormQuestionDef[]
  } | null
  formRequired?: boolean
}

export function CheckinForm({
  eventId,
  eventTitle,
  hasCheckedIn = false,
  checkInForm = null,
  formRequired = true,
}: CheckinFormProps) {
  const { status } = useSession()
  const router = useRouter()
  const showToast = useToast()
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(hasCheckedIn)
  const [poll, setPoll] = useState<RendererChange>({
    answers: [],
    isValid: !checkInForm,
  })

  const handlePollChange = useCallback((change: RendererChange) => {
    setPoll(change)
  }, [])

  if (status === "loading") {
    return null
  }

  if (status === "unauthenticated") {
    return (
      <div className={`${theme.card.className} p-4`}>
        <p className="text-sm text-theme-muted">
          <SignInLink className="text-accent hover:text-accent-hover">
            Sign in
          </SignInLink>{" "}
          to check in to this event
        </p>
      </div>
    )
  }

  if (success) {
    return (
      <div className={`${theme.card.className} p-4 border-green-500/50`}>
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium">You&apos;re checked in!</span>
        </div>
      </div>
    )
  }

  const pollSatisfied = !checkInForm || !formRequired || poll.isValid
  const canSubmit = code.length === 6 && pollSatisfied && !isLoading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setFieldErrors({})
    setIsLoading(true)

    try {
      const res = await fetch(`/api/events/${eventId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          answers: checkInForm ? poll.answers : undefined,
        }),
      })
      const data = await res.json()

      if (data.error) {
        setError(data.error)
        if (data.fieldErrors) setFieldErrors(data.fieldErrors)
      } else {
        setSuccess(true)
        showToast(checkinToast(data, eventTitle))
        // Refresh server components so RSVP/attendance state reflects check-in.
        router.refresh()
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`${theme.card.className} p-4`}>
      <h3 className={`text-sm font-medium ${theme.text.heading} mb-3`}>
        Event Check-in
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {checkInForm && (
          <div className="space-y-3">
            {checkInForm.description && (
              <p className="text-sm text-theme-muted">
                {checkInForm.description}
              </p>
            )}
            <FormRenderer
              questions={checkInForm.questions}
              disabled={isLoading}
              fieldErrors={fieldErrors}
              onChange={handlePollChange}
            />
            {!formRequired && (
              <p className="text-xs text-theme-muted">
                This poll is optional.
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="Enter 6-digit code"
            maxLength={6}
            pattern="\d{6}"
            className={`${theme.input.className} flex-1 text-center tracking-widest font-mono`}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className={theme.button.primary}
          >
            {isLoading ? (
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              "Check In"
            )}
          </button>
        </div>
      </form>

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}
