import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import {
    EyeClosedIcon, EyeIcon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type React from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { usePost } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { z } from "zod";

type SignupFormData = {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
};

export default function SignupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<
    Partial<Record<keyof SignupFormData, string[]>>
  >({});
  const { trigger: post, loading, data, error } = usePost("/api/auth/signup");
  const [showPassword, setShowPassword] = useState(false);

  // Move schema inside component to access t function
  const SignupSchema = z.object({
    firstname: z
      .string()
      .min(2, { message: t("auth.signup.errors.firstnameMinLength") })
      .trim(),
    lastname: z
      .string()
      .min(2, { message: t("auth.signup.errors.lastnameMinLength") })
      .trim(),
    email: z
      .string()
      .email({ message: t("auth.signup.errors.invalidEmail") })
      .trim(),
    password: z
      .string()
      .min(8, { message: t("auth.signup.errors.passwordMinLength") })
      .regex(/[a-zA-Z]/, { message: t("auth.signup.errors.passwordLetter") })
      .regex(/[0-9]/, { message: t("auth.signup.errors.passwordNumber") })
      .regex(/[^a-zA-Z0-9]/, {
        message: t("auth.signup.errors.passwordSpecial"),
      })
      .trim(),
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

    const formData = new FormData(event.currentTarget);
    const data: SignupFormData = {
      firstname: formData.get("firstname") as string,
      lastname: formData.get("lastname") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const result = SignupSchema.safeParse(data);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors(fieldErrors);
      return;
    }

    post(result.data);
  };

  useEffect(() => {
    if (data && !error) {
      toast.success(t("auth.signup.messages.accountCreated"));
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    }
  }, [data, error, navigate, t]);

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {t("auth.signup.title")}
          </CardTitle>
          <CardDescription className="text-center">
            {t("auth.signup.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstname">
                  {t("auth.signup.form.firstname.label")}
                </Label>
                <Input
                  id="firstname"
                  name="firstname"
                  placeholder={t("auth.signup.form.firstname.placeholder")}
                  disabled={loading}
                />
                {errors.firstname && (
                  <p className="text-sm text-red-600">{errors.firstname[0]}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastname">
                  {t("auth.signup.form.lastname.label")}
                </Label>
                <Input
                  id="lastname"
                  name="lastname"
                  placeholder={t("auth.signup.form.lastname.placeholder")}
                  disabled={loading}
                />
                {errors.lastname && (
                  <p className="text-sm text-red-600">{errors.lastname[0]}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.signup.form.email.label")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t("auth.signup.form.email.placeholder")}
                disabled={loading}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                {t("auth.signup.form.password.label")}
              </Label>

              <div className="flex items-center justify-between gap-2">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.signup.form.password.placeholder")}
                  disabled={loading}
                />
                  <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <EyeClosedIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {errors.password && (
                <div className="space-y-1">
                  <p className="text-sm text-red-600">
                    {t("auth.signup.form.password.requirements")}
                  </p>
                  <ul className="text-sm text-red-600 list-disc list-inside">
                    {errors.password.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? t("auth.signup.form.creatingAccount")
                : t("auth.signup.form.createButton")}
            </Button>
          </form>
          <section className="flex flex-col mt-4 gap-1">
            <div className="text-center text-sm">
              {t("auth.signup.hasAccount")}{" "}
              <a
                href="/login"
                className="underline hover:text-primary cursor-pointer"
              >
                {t("auth.signup.signInLink")}
              </a>
            </div>
            <div className="text-center text-sm">
              {import.meta.env.VITE_OIDC_ENDPOINT && (
                <div className="text-center text-sm">
                  {t("auth.signup.oidc")}{" "}
                  <a
                    href={import.meta.env.VITE_OIDC_ENDPOINT}
                    className="underline hover:text-primary"
                  >
                    {t("auth.signup.oidcLink")}
                  </a>
                </div>
              )}
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
