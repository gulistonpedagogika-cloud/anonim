import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Star, CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";

interface Question {
  id: number;
  type: "star" | "single" | "multiple";
  text: string;
  options?: { id: number; text: string }[];
}

interface Survey {
  id: number;
  title: string;
  description: string;
  questions: Question[];
}

export function SurveyView() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/surveys/${code}`)
      .then(async (res) => {
        if (!res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await res.json();
            throw new Error(errorData.error || "So'rovnoma topilmadi.");
          } else {
            throw new Error("So'rovnoma topilmadi yoki serverda xatolik yuz berdi.");
          }
        }
        return res.json();
      })
      .then((data) => {
        setSurvey(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [code]);

  const handleAnswer = (questionId: number, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all questions answered
    if (survey && Object.keys(answers).length < survey.questions.length) {
      alert("Iltimos, barcha savollarga javob bering.");
      return;
    }

    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([qId, val]) => ({
        question_id: parseInt(qId),
        value: val,
      }));

      const res = await fetch(`/api/surveys/${code}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: formattedAnswers }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        throw new Error("Xatolik yuz berdi");
      }
    } catch (err) {
      alert("Javobni yuborishda xatolik yuz berdi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="animate-spin text-brand mb-4" size={48} />
        <p className="text-slate-500">So'rovnoma yuklanmoqda...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center">
        <div className="bg-red-50 text-red-600 p-8 rounded-3xl mb-8">
          <AlertCircle size={48} className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Xatolik!</h2>
          <p>{error}</p>
        </div>
        <button onClick={() => navigate("/")} className="btn-secondary flex items-center gap-2 mx-auto">
          <ArrowLeft size={18} /> Bosh sahifaga qaytish
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl mx-auto py-24 text-center"
      >
        <div className="bg-emerald-50 text-emerald-600 p-12 rounded-3xl mb-8">
          <CheckCircle2 size={64} className="mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Rahmat!</h2>
          <p className="text-lg">Sizning javobingiz anonim tarzda muvaffaqiyatli qabul qilindi.</p>
        </div>
        <button onClick={() => navigate("/")} className="btn-primary">
          Bosh sahifaga qaytish
        </button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-12">
        <button onClick={() => navigate("/")} className="text-slate-500 hover:text-brand flex items-center gap-2 mb-6 transition-colors">
          <ArrowLeft size={18} /> Orqaga
        </button>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">{survey?.title}</h2>
        <p className="text-slate-500">{survey?.description}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {survey?.questions.map((q, idx) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="card"
          >
            <div className="flex gap-4 mb-6">
              <span className="bg-brand-light text-brand w-8 h-8 rounded-lg flex items-center justify-center font-bold flex-shrink-0">
                {idx + 1}
              </span>
              <h4 className="text-lg font-semibold text-slate-800">{q.text}</h4>
            </div>

            {q.type === "star" && (
              <div className="flex gap-4 justify-center py-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleAnswer(q.id, star)}
                    className={`transition-all transform hover:scale-110 ${
                      answers[q.id] >= star ? "text-yellow-400 fill-yellow-400" : "text-slate-300"
                    }`}
                  >
                    <Star size={40} />
                  </button>
                ))}
              </div>
            )}

            {q.type === "single" && (
              <div className="space-y-3">
                {q.options?.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      answers[q.id] === opt.text
                        ? "border-brand bg-brand-light/30"
                        : "border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      className="hidden"
                      onChange={() => handleAnswer(q.id, opt.text)}
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      answers[q.id] === opt.text ? "border-brand" : "border-slate-300"
                    }`}>
                      {answers[q.id] === opt.text && <div className="w-2.5 h-2.5 rounded-full bg-brand" />}
                    </div>
                    <span className="font-medium text-slate-700">{opt.text}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === "multiple" && (
              <div className="space-y-3">
                {q.options?.map((opt) => {
                  const currentAnswers = answers[q.id] || [];
                  const isChecked = currentAnswers.includes(opt.text);
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isChecked ? "border-brand bg-brand-light/30" : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        onChange={() => {
                          const newVal = isChecked
                            ? currentAnswers.filter((v: string) => v !== opt.text)
                            : [...currentAnswers, opt.text];
                          handleAnswer(q.id, newVal);
                        }}
                      />
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                        isChecked ? "bg-brand border-brand" : "border-slate-300"
                      }`}>
                        {isChecked && <CheckCircle2 size={14} className="text-white" />}
                      </div>
                      <span className="font-medium text-slate-700">{opt.text}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </motion.div>
        ))}

        <div className="pt-8">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={20} /> Yuborilmoqda...
              </>
            ) : (
              "Javoblarni yuborish"
            )}
          </button>
          <p className="text-center text-slate-400 text-sm mt-4">
            Ushbu so'rovnoma to'liq anonimdir. Sizning ma'lumotlaringiz saqlanmaydi.
          </p>
        </div>
      </form>
    </div>
  );
}
