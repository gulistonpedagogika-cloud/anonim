import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, Star, CheckCircle2, ListChecks, ArrowLeft, Loader2, Save } from "lucide-react";

interface Question {
  type: "star" | "single" | "multiple";
  text: string;
  options: string[];
}

export function SurveyEditor() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);

  const addQuestion = (type: "star" | "single" | "multiple") => {
    setQuestions([...questions, { type, text: "", options: type !== "star" ? [""] : [] }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestionText = (index: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[index].text = text;
    setQuestions(newQuestions);
  };

  const addOption = (qIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.push("");
    setQuestions(newQuestions);
  };

  const updateOptionText = (qIndex: number, oIndex: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = text;
    setQuestions(newQuestions);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, i) => i !== oIndex);
    setQuestions(newQuestions);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !code || questions.length === 0) {
      alert("Iltimos, sarlavha, kod va kamida bitta savol kiriting.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, code, questions }),
      });

      if (res.ok) {
        navigate("/admin");
      } else {
        const data = await res.json();
        alert(data.error || "Xatolik yuz berdi");
      }
    } catch (err) {
      alert("Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-12">
        <button onClick={() => navigate("/admin")} className="text-slate-500 hover:text-brand flex items-center gap-2 mb-6 transition-colors">
          <ArrowLeft size={18} /> Orqaga
        </button>
        <h2 className="text-3xl font-bold text-slate-900">Yangi so'rovnoma yaratish</h2>
        <p className="text-slate-500">So'rovnoma tafsilotlari va savollarini kiriting.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Basic Info */}
        <div className="card space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">So'rovnoma sarlavhasi</label>
              <input
                type="text"
                className="input"
                placeholder="Masalan: O'qituvchilar faoliyatini baholash"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Kirish kodi</label>
              <input
                type="text"
                className="input"
                placeholder="Masalan: GULDPI-MATH-2024"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Tavsif (ixtiyoriy)</label>
            <textarea
              className="input min-h-[100px]"
              placeholder="Ushbu so'rovnoma maqsadi haqida qisqacha..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            Savollar <span className="bg-brand-light text-brand px-2 py-0.5 rounded-lg text-sm">{questions.length}</span>
          </h3>

          <AnimatePresence>
            {questions.map((q, qIdx) => (
              <motion.div
                key={qIdx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="card relative group"
              >
                <button
                  type="button"
                  onClick={() => removeQuestion(qIdx)}
                  className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-brand text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold">
                    {qIdx + 1}
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {q.type === "star" ? "Yulduzchali baholash" : q.type === "single" ? "Bitta tanlov" : "Ko'p tanlov"}
                  </span>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Savol matni</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Savolingizni kiriting..."
                      value={q.text}
                      onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                      required
                    />
                  </div>

                  {(q.type === "single" || q.type === "multiple") && (
                    <div className="space-y-4 pl-4 border-l-2 border-slate-100">
                      <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Variantlar</label>
                      <div className="space-y-3">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex gap-2">
                            <input
                              type="text"
                              className="input py-2"
                              placeholder={`Variant ${oIdx + 1}`}
                              value={opt}
                              onChange={(e) => updateOptionText(qIdx, oIdx, e.target.value)}
                              required
                            />
                            {q.options.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeOption(qIdx, oIdx)}
                                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => addOption(qIdx)}
                        className="text-brand text-sm font-bold flex items-center gap-1 hover:underline"
                      >
                        <Plus size={16} /> Variant qo'shish
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add Question Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => addQuestion("star")}
              className="p-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center gap-3 text-slate-500 hover:border-brand hover:text-brand transition-all"
            >
              <Star size={32} />
              <span className="font-bold">Yulduzchali baholash</span>
            </button>
            <button
              type="button"
              onClick={() => addQuestion("single")}
              className="p-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center gap-3 text-slate-500 hover:border-brand hover:text-brand transition-all"
            >
              <CheckCircle2 size={32} />
              <span className="font-bold">Bitta tanlov</span>
            </button>
            <button
              type="button"
              onClick={() => addQuestion("multiple")}
              className="p-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center gap-3 text-slate-500 hover:border-brand hover:text-brand transition-all"
            >
              <ListChecks size={32} />
              <span className="font-bold">Ko'p tanlov</span>
            </button>
          </div>
        </div>

        <div className="pt-12 flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex-1 py-4 text-lg flex items-center justify-center gap-3"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={20} /> Saqlanmoqda...
              </>
            ) : (
              <>
                <Save size={20} /> Saqlash va yakunlash
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="btn-secondary px-8"
          >
            Bekor qilish
          </button>
        </div>
      </form>
    </div>
  );
}
