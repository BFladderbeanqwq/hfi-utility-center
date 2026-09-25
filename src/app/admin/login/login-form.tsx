"use client"

import { useCallback, useEffect, useState } from "react"
import { LogIn } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"

import { AppShell } from "@/components/layout/app-shell"
import { useErrorShake } from "@/hooks/use-error-shake"
import { LoadingState } from "@/components/layout/data-state"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Turnstile } from "@/components/turnstile"
import { checkLogin, loginWithPassword, loginWithToken, rememberAdminEmail } from "@/lib/api/auth"

type LoginFields = { email: string; password: string }

export function AdminLoginForm({ token, redirectTo }: { token?: string; redirectTo: string }) {
  const t = useTranslations("admin")
  const router = useRouter()
  const form = useForm<LoginFields>({
    defaultValues: { email: "", password: "" },
  })
  const [turnstileToken, setTurnstileToken] = useState("")
  const [error, setError] = useState<string>()
  const [checkingSession, setCheckingSession] = useState(true)
  const { ref: formRef, shake } = useErrorShake<HTMLFormElement>()
  const handleToken = useCallback((value: string) => {
    setTurnstileToken(value)
    if (value) setError(undefined)
  }, [])

  useEffect(() => {
    let ignore = false

    async function restoreSession() {
      if (!token) {
        setCheckingSession(false)
        try {
          if ((await checkLogin()) && !ignore) {
            router.replace(redirectTo)
            router.refresh()
          }
        } catch {
          // The login form stays usable when the session probe is unavailable.
        }
        return
      }

      try {
        await loginWithToken(token)

        if (!ignore) {
          router.replace(redirectTo)
          router.refresh()
        }
      } catch {
        if (!ignore) setCheckingSession(false)
      }
    }

    restoreSession()
    return () => {
      ignore = true
    }
  }, [redirectTo, router, token])

  async function submit({ email, password }: LoginFields) {
    if (!turnstileToken) {
      setError(t("verificationRequired"))
      return
    }
    setError(undefined)
    try {
      const normalizedEmail = email.trim()
      await loginWithPassword(normalizedEmail, password, turnstileToken)
      rememberAdminEmail(normalizedEmail)
      router.replace(redirectTo)
      router.refresh()
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : t("loginFailed"))
    }
  }

  if (checkingSession) {
    return (
      <AppShell width="narrow">
        <div className="flex min-h-[80svh] items-center justify-center">
          <LoadingState label={t("loginLoading")} />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell width="narrow">
      <div className="flex min-h-[80svh] flex-col items-center justify-center gap-6">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{t("loginTitle")}</h1>

        <Card className="w-full max-w-md">
          <CardContent>
            <form
              noValidate
              ref={formRef}
              onSubmit={form.handleSubmit(submit, shake)}
              className="flex flex-col gap-4"
            >
              <Controller
                control={form.control}
                name="email"
                rules={{ required: t("emailRequired") }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>{t("email")}</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="email"
                      autoComplete="email"
                      placeholder="name@hfiuc.org"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="password"
                rules={{ required: t("passwordRequired") }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>{t("password")}</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="password"
                      autoComplete="current-password"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Turnstile onToken={handleToken} />
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <Button
                type="submit"
                size="lg"
                className="h-11 w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? <Spinner /> : <LogIn />}
                {t("login")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
