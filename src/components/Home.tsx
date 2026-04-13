import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ClipboardList, ShieldCheck, ArrowRight } from "lucide-react";

export function Home() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      navigate(`/survey/${code.trim()}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Guliston davlat pedagogika instituti
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Talabalar va o'qituvchilar uchun xavfsiz va anonim so'rovnomalar platformasi.
          </p>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Participate Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="card flex flex-col justify-between"
        >
          <div>
            <div className="bg-brand-light text-brand w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <ClipboardList size={24} />
            </div>
            <h3 className="text-2xl font-bold mb-3">So'rovnomada ishtirok etish</h3>
            <p className="text-slate-500 mb-8">
              Sizga berilgan maxsus kodni kiriting va so'rovnomada anonim tarzda qatnashing.
            </p>
          </div>
          
          <form onSubmit={handleJoin} className="space-y-4">
            <input
              type="text"
              placeholder="So'rovnoma kodi (masalan: GULDPI-2024)"
              className="input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
              Boshlash <ArrowRight size={18} />
            </button>
          </form>
        </motion.div>

        {/* Admin Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="card flex flex-col justify-between border-brand/20 bg-brand/[0.02]"
        >
          <div>
            <div className="bg-emerald-100 text-emerald-600 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-2xl font-bold mb-3">Admin Panel</h3>
            <p className="text-slate-500 mb-8">
              Yangi so'rovnomalar yarating, natijalarni tahlil qiling va jarayonni boshqaring.
            </p>
          </div>
          
          <button
            onClick={() => navigate("/admin")}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            Panelga kirish <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>

      {/* Features */}
      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div className="p-4">
          <div className="text-brand font-bold text-lg mb-2">100% Anonim</div>
          <p className="text-sm text-slate-500">Sizning shaxsingiz hech qachon oshkor etilmaydi va saqlanmaydi.</p>
        </div>
        <div className="p-4">
          <div className="text-brand font-bold text-lg mb-2">Tezkor Natijalar</div>
          <p className="text-sm text-slate-500">So'rovnoma yakunlanishi bilan natijalar avtomatik tahlil qilinadi.</p>
        </div>
        <div className="p-4">
          <div className="text-brand font-bold text-lg mb-2">Oson Boshqaruv</div>
          <p className="text-sm text-slate-500">Sodda va tushunarli interfeys orqali so'rovnomalar yaratish.</p>
        </div>
      </div>
    </div>
  );
}
