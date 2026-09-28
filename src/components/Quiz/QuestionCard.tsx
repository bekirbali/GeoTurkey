"use client";

import React, { useState } from "react";
import { GeoItem, QuizMode } from "@/types/geography";
import { ChevronRight, CheckCircle2, XCircle, Lightbulb, Award, Heart } from "lucide-react";

interface QuestionCardProps {
  item: GeoItem;
  mode: QuizMode;
  allowGuess: boolean;
  currentAttempt: number;
  maxAttempts: number;
  attemptFeedback?: string | null;
  lastGuessResult?: {
    distanceKm: number;
    score: number;
    isCorrect: boolean;
    accuracyLabel: string;
    attemptsUsed?: number;
  } | null;
  onNextQuestion: () => void;
}

export default function QuestionCard({
  item,
  mode,
  allowGuess,
  currentAttempt,
  maxAttempts,
  attemptFeedback,
  lastGuessResult,
  onNextQuestion,
}: QuestionCardProps) {
  const [showHint, setShowHint] = useState(false);

  // Yeni soru geldiğinde ipucunu sıfırla
  React.useEffect(() => {
    setShowHint(false);
  }, [item.id]);

  const remainingAttempts = Math.max(0, maxAttempts - currentAttempt + 1);

  return (
    <div className="w-full max-w-md bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-3xl p-5 shadow-2xl transition-all">
      {/* Üst Rozetler ve Kalan Hak Göstergesi */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
          {item.subCategoryTitle}
        </span>

        <div className="flex items-center gap-2">
          {/* Kalan Hak Sayaç Rozeti */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-[11px] font-semibold text-slate-300">
            <span className="text-slate-400 mr-0.5">Hak:</span>
            {Array.from({ length: maxAttempts }).map((_, idx) => (
              <Heart
                key={idx}
                size={12}
                className={
                  idx < remainingAttempts
                    ? "fill-rose-500 text-rose-500 transition-colors"
                    : "fill-slate-700 text-slate-700 opacity-40 transition-colors"
                }
              />
            ))}
          </div>

          <button
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1 text-xs text-amber-400/90 hover:text-amber-300 transition-colors font-medium ml-1"
          >
            <Lightbulb size={13} />
            <span>{showHint ? "Gizle" : "İpucu"}</span>
          </button>
        </div>
      </div>

      {/* Soru Başlığı */}
      <div className="mb-3">
        <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-1">
          {mode === "blind" ? "Körleme Tahmin" : "Hedefi Bul"}
        </span>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          {item.name}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {mode === "blind"
            ? "Haritada hiçbir işaret yok. Doğru konumunu tahmin edip tıkla!"
            : "Haritada parıldayan noktalardan doğru olanın üzerine tıkla."}
        </p>
      </div>

      {/* Hatalı Deneme Sonrası Canlı Uyarı Bildirimi */}
      {attemptFeedback && allowGuess && (
        <div className="mb-3 p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-150">
          <span>{attemptFeedback}</span>
          <span className="text-[11px] font-bold text-amber-400 px-2 py-0.5 rounded-lg bg-slate-950/60 border border-amber-500/20">
            {currentAttempt === 2 ? "+600 P" : "+300 P"}
          </span>
        </div>
      )}

      {/* İpucu Kutusu (Açıldığında) */}
      {showHint && (
        <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="font-semibold mb-0.5 flex items-center gap-1">
            <Lightbulb size={13} className="text-amber-400" /> Bölge / İl İpucu:
          </p>
          <p className="text-slate-300">
            {item.region} Bölgesi &bull; Bulunduğu İl: <strong>{item.province.join(", ")}</strong>
          </p>
        </div>
      )}

      {/* Cevap Verildikten Sonraki Değerlendirme & Hap Bilgi */}
      {!allowGuess && lastGuessResult && (
        <div className="space-y-4 pt-3 border-t border-slate-800 animate-in fade-in duration-300">
          {/* Sonuç Kartı */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              lastGuessResult.isCorrect
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/15 border-rose-500/30 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {lastGuessResult.isCorrect ? (
                <CheckCircle2 size={22} className="text-emerald-400 shrink-0" />
              ) : (
                <XCircle size={22} className="text-rose-400 shrink-0" />
              )}
              <div>
                <p className="font-bold text-sm leading-tight">
                  {lastGuessResult.accuracyLabel}
                </p>
                {mode === "blind" && lastGuessResult.distanceKm !== undefined && (
                  <p className="text-[11px] opacity-80 mt-0.5">
                    Sapma Mesafesi: <strong>{lastGuessResult.distanceKm} km</strong>
                  </p>
                )}
              </div>
            </div>
            <span className="text-base font-black px-2.5 py-1 rounded-xl bg-slate-950/60 border border-white/10">
              +{lastGuessResult.score} P
            </span>
          </div>

          {/* Sınav Hap Notu (Öğretici Kısım) */}
          <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/60 text-xs">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold mb-1.5">
              <Award size={14} />
              <span>KPSS / YKS Sınav Notu</span>
            </div>
            <p className="text-slate-200 leading-relaxed font-normal">
              {item.examTips}
            </p>
            {item.details && (
              <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-700/50 text-[11px] text-slate-400">
                {item.details.waterType && (
                  <span>Su Türü: <strong className="text-slate-200">{item.details.waterType}</strong></span>
                )}
                {item.details.elevation && (
                  <span>Yükseklik: <strong className="text-slate-200">{item.details.elevation}</strong></span>
                )}
                {item.details.depth && (
                  <span>Derinlik: <strong className="text-slate-200">{item.details.depth}</strong></span>
                )}
              </div>
            )}
          </div>

          {/* Sonraki Soru Butonu */}
          <button
            onClick={onNextQuestion}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-98 transition-all"
          >
            <span>Sonraki Soru</span>
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
