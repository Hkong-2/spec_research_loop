"use client";

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
  const error =
    loginMut.error ?? registerMut.error
      ? getApiErrorMessage(loginMut.error ?? registerMut.error)
      : null;

  function onSubmit(values: AuthValues) {
    loginMut.reset();
    registerMut.reset();
    if (mode === "login") loginMut.mutate({ data: values });
    else registerMut.mutate({ data: values });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
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
            <FormItem>
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
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Working…" : mode === "login" ? "Sign in" : "Create Account"}
        </Button>
      </form>
    </Form>
  );
}
