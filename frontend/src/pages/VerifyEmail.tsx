import { useEffect, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import heroImage from "@/assets/hero-mother.jpg";
import { API_BASE_URL, getApiUrl, parseApiJson, readApiResponseMessage } from "../lib/api";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  useEffect(() => {
    const storedEmail = localStorage.getItem("pendingVerificationEmail") || "";
    setEmail(storedEmail);
  }, []);

  const handleVerify = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOtp = otp.trim();

    if (!normalizedEmail || normalizedOtp.length !== 6) {
      alert("Enter email and the 6-digit OTP");
      return;
    }

    try {
      const response = await fetch(getApiUrl("/verify-email"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: normalizedEmail, otp: normalizedOtp }),
      });

      const responseText = await response.text();
      const data = parseApiJson<{ success?: boolean; message?: string; error?: string }>(responseText);

      if (!response.ok) {
        alert(readApiResponseMessage(responseText, "Verification failed"));
        return;
      }

      if (data.success) {
        localStorage.removeItem("pendingVerificationEmail");
        alert("Email verified successfully. Please login.");
        navigate("/");
      } else {
        alert(data.message || "Verification failed");
      }
    } catch (error) {
      console.error(error);
      alert(API_BASE_URL ? `Verification failed. Make sure the backend is reachable at ${API_BASE_URL}` : "Verification failed. Set VITE_API_URL first.");
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleVerify();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-rose-100 px-4 py-10">
      <div className="w-full max-w-4xl rounded-3xl overflow-hidden bg-white shadow-2xl border border-rose-100 grid md:grid-cols-2">
        <div className="hidden md:block relative">
          <img
            src={heroImage}
            alt="Mother and baby wellness"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-rose-900/60 via-rose-800/20 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <p className="text-sm uppercase tracking-[0.2em] opacity-80">Verification</p>
            <p className="text-2xl font-bold leading-tight mt-2">Confirm your email to unlock access</p>
          </div>
        </div>

        <div className="p-8 md:p-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">MatriCare</h1>
          </div>

          <p className="text-center text-slate-600 mb-8">Enter the OTP sent to your email</p>

          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-300"
            />

            <div className="flex justify-center py-2">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot index={0} className="rounded-xl border border-slate-300" />
                  <InputOTPSlot index={1} className="rounded-xl border border-slate-300" />
                  <InputOTPSlot index={2} className="rounded-xl border border-slate-300" />
                  <InputOTPSlot index={3} className="rounded-xl border border-slate-300" />
                  <InputOTPSlot index={4} className="rounded-xl border border-slate-300" />
                  <InputOTPSlot index={5} className="rounded-xl border border-slate-300" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <button
              onClick={handleVerify}
              className="w-full rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 transition-colors"
            >
              Verify Email
            </button>

            <button
              onClick={() => navigate("/signup")}
              className="w-full rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-3 transition-colors"
            >
              Back to Signup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
