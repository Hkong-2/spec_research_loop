"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  useLoginApiIdentityLoginPost,
  useRegisterApiIdentityRegisterPost,
} from "@/lib/api/generated/endpoints";
import { getApiErrorMessage, setStoredToken } from "@/lib/api";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});

type AuthValues = z.infer<typeof registerSchema>;
type Mode = "login" | "register";

export function AuthForm({
  mode,
  onSuccess,
}: {
  mode: Mode;
  onSuccess: () => void;
}) {
  const summaryRef = useRef<HTMLDivElement>(null);
  const form = useForm<AuthValues>({
    resolver: zodResolver(mode === "login" ? loginSchema : registerSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMut = useLoginApiIdentityLoginPost({
    mutation: {
      onSuccess: (res) => {
        if (res.status === 200) {
          setStoredToken(res.data.access_token);
          onSuccess();
        }
      },
    },
  });

  const registerMut = useRegisterApiIdentityRegisterPost({
    mutation: {
      onSuccess: (res) => {
        if (res.status === 201) {
          setStoredToken(res.data.access_token);
          onSuccess();
        }
      },
    },
  });

  const pending = loginMut.isPending || registerMut.isPending;
  const apiError =
    loginMut.error ?? registerMut.error
      ? getApiErrorMessage(loginMut.error ?? registerMut.error)
      : null;
  const fieldErrors = form.formState.errors;
  const showSummary =
    form.formState.isSubmitted && Boolean(apiError || fieldErrors.email || fieldErrors.password);

  useEffect(() => {
    if (showSummary) summaryRef.current?.focus();
  }, [showSummary, apiError, fieldErrors.email, fieldErrors.password]);

  function onSubmit(values: AuthValues) {
    loginMut.reset();
    registerMut.reset();
    if (mode === "login") loginMut.mutate({ data: values });
    else registerMut.mutate({ data: values });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        {showSummary ? (
          <div
            ref={summaryRef}
            role="alert"
            tabIndex={-1}
            aria-labelledby="auth-error-title"
            className="scroll-mt-[var(--header-height)] rounded-md border border-destructive bg-card p-3"
          >
            <h2 id="auth-error-title" className="text-sm font-medium text-destructive">
              There is a problem
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
              {fieldErrors.email ? (
                <li>
                  <a className="text-in-progress underline-offset-4 hover:underline" href="#auth-email">
                    {String(fieldErrors.email.message)}
                  </a>
                </li>
              ) : null}
              {fieldErrors.password ? (
                <li>
                  <a className="text-in-progress underline-offset-4 hover:underline" href="#auth-password">
                    {String(fieldErrors.password.message)}
                  </a>
                </li>
              ) : null}
              {apiError ? <li>{apiError}</li> : null}
            </ul>
          </div>
        ) : null}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem id="auth-email" className="scroll-mt-[var(--header-height)]">
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem id="auth-password" className="scroll-mt-[var(--header-height)]">
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Working…" : mode === "login" ? "Sign in" : "Create Account"}
        </Button>
      </form>
    </Form>
  );
}
