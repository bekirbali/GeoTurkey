"use client";

import React from "react";
import { GeoCategoryType, QuizMode, SubCategory } from "@/types/geography";
import { CATEGORIES } from "@/data/categories";
import { Flame, Trophy, Award, Compass, Sparkles, BookOpen, Target, MapPin } from "lucide-react";

interface QuizHeaderProps {
  selectedCategory: GeoCategoryType;
  selectedSubCategoryId: string;
  onSelectCategory: (cat: GeoCategoryType) => void;
  onSelectSubCategory: (subCatId: string) => void;
  mode: QuizMode;
  onSelectMode: (mode: QuizMode) => void;
  score: number;
  streak: number;
  questionNumber: number;
  totalQuestions: number;
}

export default function QuizHeader({
  selectedCategory,
  selectedSubCategoryId,
  onSelectCategory,
  onSelectSubCategory,
  mode,
  onSelectMode,
  score,
  streak,
  questionNumber,
  totalQuestions,
}: QuizHeaderProps) {
  const currentCategory = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];

  return (
    <header className="w-full bg-slate-900/80 backdrop-blur-2xl border-b border-slate-800/80 sticky top-0 z-30 px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Sol Taraf: Logo & Kategori Seçimi */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="relative w-11 h-11 rounded-2xl overflow-hidden shadow-lg shadow-cyan-500/25 border border-cyan-500/30 flex items-center justify-center bg-slate-900 group">
              <img
                src="/logo.png"
                alt="GeoTürkiye Logo"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
                  GeoTürkiye
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  KPSS & YKS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Gerçek Harita ile Coğrafya Testi
              </p>
            </div>
          </div>

          {/* Kategori Seçim Butonları */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/60 border border-slate-800">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.id);
                  onSelectSubCategory(cat.subCategories[0].id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/25"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                {cat.title.replace("Türkiye'nin ", "")}
              </button>
            ))}
          </div>
        </div>

        {/* Orta: Oyun Modları Seçimi */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/70 border border-slate-800/80 shadow-inner">
          <button
            onClick={() => onSelectMode("study")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              mode === "study"
                ? "bg-slate-800 text-amber-300 shadow-sm border border-amber-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen size={14} className={mode === "study" ? "text-amber-400" : ""} />
            <span>Keşfet & Çalış</span>
          </button>

          <button
            onClick={() => onSelectMode("pinpoint")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              mode === "pinpoint"
                ? "bg-slate-800 text-cyan-300 shadow-sm border border-cyan-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MapPin size={14} className={mode === "pinpoint" ? "text-cyan-400" : ""} />
            <span>İşaretçiyi Bul</span>
          </button>

          <button
            onClick={() => onSelectMode("blind")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              mode === "blind"
                ? "bg-gradient-to-r from-rose-600 to-orange-600 text-white shadow-md shadow-rose-500/25 border border-rose-400/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Target size={14} className={mode === "blind" ? "animate-pulse" : ""} />
            <span>Körleme Mod (Zor)</span>
          </button>
        </div>

        {/* Sağ Taraf: Skor & Streak & Soru Durumu */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {mode !== "study" && (
            <>
              {/* Seri (Streak) */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                <Flame size={15} className={`text-amber-500 ${streak > 0 ? "animate-bounce" : ""}`} />
                <span>{streak} Seri</span>
              </div>

              {/* Skor */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold">
                <Trophy size={15} className="text-cyan-400" />
                <span>{score} Puan</span>
              </div>

              {/* İlerleme */}
              <div className="text-xs font-medium text-slate-400 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/50">
                Soru <strong className="text-white">{questionNumber}</strong> / {totalQuestions}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Alt Kategori Filtreleme Şeridi */}
      <div className="max-w-7xl mx-auto mt-2.5 pt-2 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        <span className="text-[11px] font-semibold text-slate-400 shrink-0 flex items-center gap-1">
          <Sparkles size={12} className="text-cyan-400" /> Alt Konu:
        </span>
        {currentCategory.subCategories.map((sub) => (
          <button
            key={sub.id}
            onClick={() => onSelectSubCategory(sub.id)}
            className={`shrink-0 px-3 py-1 rounded-xl text-xs font-medium transition-all ${
              selectedSubCategoryId === sub.id
                ? `${sub.badgeColor} shadow-md scale-105`
                : "bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            {sub.title}
          </button>
        ))}
      </div>
    </header>
  );
}
