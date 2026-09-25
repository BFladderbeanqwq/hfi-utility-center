"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"

import { Turnstile } from "@/components/turnstile"
import { useAppLocale } from "@/lib/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { checkLogin, loginWithPassword, loginWithToken, rememberAdminEmail } from "@/lib/api/auth"

type LoginFields = { email: string; password: string }

export function AdminLoginForm({ token, redirectTo }: { token?: string; redirectTo: string }) {
  const t = useTranslations("admin")
  const { locale } = useAppLocale()
  const router = useRouter()
  const form = useForm<LoginFields>({
    defaultValues: { email: "", password: "" },
  })
  const [turnstileToken, setTurnstileToken] = useState("")
  const [error, setError] = useState<string>()
  const [checkingSession, setCheckingSession] = useState(true)
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
      <main id="main-content" className="admin-login-loading">
        <Spinner className="size-8" />
        <span>{t("loginLoading")}</span>
      </main>
    )
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-brand" aria-label="HFI Campus">
        <h1>
          {locale === "zh-CN" ? (
            <>
              管理场地，
              <br />
              协调校园。
            </>
          ) : (
            <>
              Spaces,
              <br />
              in good hands.
            </>
          )}
        </h1>
        <p>
          {locale === "zh-CN"
            ? "审核预约，维护场地与使用规则。"
            : "Review bookings and manage campus spaces."}
        </p>
      </section>

      <section className="admin-login-form-panel">
        <Card className="admin-login-card">
          <CardHeader className="admin-login-card__header">
            <CardTitle>{t("loginTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="admin-login-card__content">
            <form noValidate onSubmit={form.handleSubmit(submit)} className="admin-login-form">
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
                      className="admin-login-input"
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
                      className="admin-login-input"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Turnstile onToken={handleToken} />
              <p className="admin-login-error" role="alert">
                {error}
              </p>
              <Button
                type="submit"
                className="admin-login-submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? <Spinner /> : null}
                {form.formState.isSubmitting ? t("loggingIn") : t("login")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
