"use client";

import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { GuessResult } from "@/types/geography";
import { Trophy, Flame, RotateCcw, CheckCircle2, XCircle, ArrowRight, Award } from "lucide-react";

interface QuizSummaryModalProps {
  isOpen: boolean;
  score: number;
  maxScore: number;
  results: GuessResult[];
  maxStreak: number;
  onRestart: () => void;
  onChangeCategory: () => void;
}

export default function QuizSummaryModal({
  isOpen,
  score,
  maxScore,
  results,
  maxStreak,
  onRestart,
  onChangeCategory,
}: QuizSummaryModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Kutlama Konfetisi
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        console.error(err);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const correctAnswers = results.filter((r) => r.isCorrect).length;
  const accuracyPercent = results.length > 0 ? Math.round((correctAnswers / results.length) * 100) : 0;
  
  // Ortalama km sapması (Körleme modu sonuçları için)
  const distances = results.filter((r) => r.distanceKm !== undefined).map((r) => r.distanceKm!);
  const avgDistance =
    distances.length > 0
      ? Math.round((distances.reduce((a, b) => a + b, 0) / distances.length) * 10) / 10
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Dekoratif Işık Efekti */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative text-center">
          {/* Rozet */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4 animate-bounce">
            <Trophy className="w-8 h-8 text-slate-950" />
          </div>

          <h3 className="text-2xl font-black text-white tracking-tight">
            Test Tamamlandı!
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Harika performans! İşte coğrafi isabet istatistiklerin:
          </p>

          {/* İstatistik Kutuları */}
          <div className="grid grid-cols-3 gap-2.5 my-6">
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block font-medium">Toplam Puan</span>
              <strong className="text-xl font-black text-cyan-400">{score}</strong>
              <span className="text-[10px] text-slate-500 block">/ {maxScore}</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block font-medium">Başarı Oranı</span>
              <strong className="text-xl font-black text-emerald-400">%{accuracyPercent}</strong>
              <span className="text-[10px] text-slate-500 block">{correctAnswers}/{results.length} Doğru</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block font-medium">En Uzun Seri</span>
              <strong className="text-xl font-black text-amber-400 flex items-center justify-center gap-1">
                <Flame size={18} className="text-amber-500" /> {maxStreak}
              </strong>
              <span className="text-[10px] text-slate-500 block">Üst üste doğru</span>
            </div>
          </div>

          {avgDistance !== null && (
            <div className="mb-5 p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 text-xs">
              Ortalama Sapma Mesafen: <strong>{avgDistance} km</strong>
            </div>
          )}

          {/* Soru Detay Listesi */}
          <div className="max-h-48 overflow-y-auto space-y-1.5 text-left mb-6 pr-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Cevaplanan Sorular
            </span>
            {results.map((res, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2">
                  {res.isCorrect ? (
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle size={16} className="text-rose-400 shrink-0" />
                  )}
                  <span className="font-semibold text-slate-200">
                    {res.questionItem.name}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-medium mr-2">
                    {res.distanceKm !== undefined ? `${res.distanceKm} km` : ""}
                  </span>
                  <span className="font-bold text-cyan-400">+{res.score}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Aksiyon Butonları */}
          <div className="flex items-center gap-3">
            <button
              onClick={onRestart}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
            >
              <RotateCcw size={15} />
              <span>Tekrar Oyna</span>
            </button>
            <button
              onClick={onChangeCategory}
              className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all border border-slate-700"
            >
              Kategori Değiştir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
