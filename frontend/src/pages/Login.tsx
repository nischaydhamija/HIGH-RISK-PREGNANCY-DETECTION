import { useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import heroImage from "@/assets/hero-mother.jpg";
import { API_BASE_URL } from "../lib/api";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      alert("Enter email and password");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: normalizedEmail, password: normalizedPassword }),
      });

      const responseText = await response.text();
      const data = responseText ? JSON.parse(responseText) : null;

      if (!response.ok) {
        alert(data?.message || data?.error || "Login failed");
        return;
      }

      if (data.success) {
        localStorage.removeItem("pendingVerificationEmail");
        localStorage.setItem(
          "user",
          JSON.stringify({
            user_id: data.user_id,
            history: Array.isArray(data.history) ? data.history : [],
          }),
        );
        navigate("/home");
      } else {
        alert(data.message || "Login failed");
      }
    } catch (error) {
      console.error(error);
      alert(`Login failed. Make sure the backend is reachable at ${API_BASE_URL}`);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleLogin();
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
            <p className="text-sm uppercase tracking-[0.2em] opacity-80">Official Portal</p>
            <p className="text-2xl font-bold leading-tight mt-2">MatriCare Maternal Health Platform</p>
          </div>
        </div>

        <div className="p-8 md:p-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">MatriCare</h1>
          </div>

          <p className="text-center text-slate-600 mb-8">Sign in to continue to your health dashboard</p>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-300"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-300"
            />

            <button
              onClick={handleLogin}
              className="w-full rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 transition-colors"
            >
              Login
            </button>

            <button
              onClick={() => navigate("/signup")}
              className="w-full rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-3 transition-colors"
            >
              New user? Register
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}