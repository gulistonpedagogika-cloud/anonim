import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Lock, ShieldCheck, ArrowRight, AlertCircle } from "lucide-react";

export function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      localStorage.setItem("admin_auth", "true");
      navigate("/admin");
    } else {
      setError("Noto'g'ri parol!");
      setPassword("");
    }
  };

  return (
    <div className="max-w-md mx-auto py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="bg-brand-light text-brand w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8">
          <Lock size={32} />
        </div>
        
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">Admin Panelga kirish</h2>
        <p className="text-slate-500 text-center mb-8">Davom etish uchun parolni kiriting.</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Parol</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              required
              autoFocus
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-red-500 text-sm font-medium bg-red-50 p-3 rounded-xl"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
            Kirish <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400 text-xs uppercase tracking-widest font-bold">
          <ShieldCheck size={14} />
          Xavfsiz tizim
        </div>
      </motion.div>
    </div>
  );
}
