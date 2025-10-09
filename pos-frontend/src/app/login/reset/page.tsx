"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import PasswordInput from "@/components/ui/PasswordInput";
import toast, { Toaster } from "react-hot-toast";
import clsx from "clsx";
import Link from "next/link";
import { usePasswordresetconfirmMutation } from "@/store/api";
import AuthLayout, { type AuthLayoutWeatherProps } from "@/components/layout/AuthLayout";

type ResetForm = { 
  password: string; 
  passwordConfirm: string;
};

export default function ResetPage() {
  const search = useSearchParams();
  const router = useRouter();
  const token = search?.get("token") ?? "";
  const uid = search?.get("uid") ?? "";

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetForm>({
    defaultValues: { password: "", passwordConfirm: "" },
  });

  const [passwordresetconfirm, { isLoading: passwordresetconfirmLoading }] = usePasswordresetconfirmMutation();

  async function onSubmit(data: ResetForm) {
    // Basic validation
    if (!uid || !token) {
      toast.error("Invalid or expired reset link.");
      return;
    }

    if (!data.password || data.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (data.password !== data.passwordConfirm) {
      toast.error("Passwords do not match.");
      return;
    }

    const t = toast.loading("Resetting password…");
    
    try {
      await passwordresetconfirm({ 
        uid, 
        token, 
        new_password: data.password 
      }).unwrap();
      
      toast.success("Password has been reset successfully!");
      
      // Redirect to login after short delay
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      console.error("Reset error", err);
      const msg = err?.data?.detail || 
                  err?.error || 
                  err?.message || 
                  "Reset failed — token may be invalid or expired.";
      toast.error(String(msg));
    } finally {
      toast.dismiss(t);
    }
  }

  return (
    <AuthLayout showWeatherInfo={true}>
      {({ theme }: AuthLayoutWeatherProps) => (
        <>
          <Toaster position="top-right" />
          
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8">
            <h1 className="text-2xl font-bold mb-2 text-slate-800">Choose a new password</h1>
            <p className="text-sm text-slate-600 mb-6">
              Enter your new password below.
            </p>

            {/* Invalid token warning */}
            {(!uid || !token) && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  Invalid or missing reset link. Check your email for a fresh link.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div>
                <PasswordInput
                  label="New password"
                  {...register("password", { 
                    required: "Password is required", 
                    minLength: { value: 6, message: "Minimum 6 characters" } 
                  })}
                  placeholder="Enter new password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div>
                <PasswordInput
                  label="Confirm new password"
                  {...register("passwordConfirm", {
                    required: "Please confirm your password",
                    validate: (value) => value === watch("password") || "Passwords do not match",
                  })}
                  placeholder="Confirm new password"
                />
                {errors.passwordConfirm && (
                  <p className="mt-1 text-sm text-red-500">{errors.passwordConfirm.message}</p>
                )}
              </div>

              {/* Weather-themed button */}
              <button
                type="submit"
                disabled={passwordresetconfirmLoading || !uid || !token}
                className={clsx(
                  "w-full px-6 py-2 rounded-lg font-semibold shadow-lg focus:ring-4",
                  theme.button,
                  (passwordresetconfirmLoading || !uid || !token) && "opacity-70 cursor-not-allowed"
                )}
                aria-busy={passwordresetconfirmLoading}
              >
                {passwordresetconfirmLoading ? "Saving..." : "Save new password"}
              </button>

              <div className="mt-6 text-center text-sm text-slate-600">
                Remember your password?{" "}
                <Link href="/login" className="text-blue-600 font-medium hover:underline">
                  Back to Sign in
                </Link>
              </div>

              {/* Weather info */}
              <p className="text-xs text-slate-500 text-center mt-3">
                Theme adapts to your local time & weather
              </p>
            </form>
          </div>
        </>
      )}
    </AuthLayout>
  );
}