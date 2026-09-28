"use client";

import React from "react";
import { GeoCategoryType, QuizMode, SubCategory } from "@/types/geography";
import { CATEGORIES } from "@/data/categories";
import { Flame, Trophy, Award, Compass, Sparkles, BookOpen, Target, MapPin, ListChecks, Star } from "lucide-react";

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
  isFavoritesOnly?: boolean;
  onToggleFavoritesOnly?: () => void;
  favoritesCount?: number;
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
  isFavoritesOnly = false,
  onToggleFavoritesOnly,
  favoritesCount = 0,
}: QuizHeaderProps) {
  const currentCategory = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];

  return (
    <header className="w-full bg-slate-900/90 backdrop-blur-2xl border-b border-slate-800/80 sticky top-0 z-30 px-4 py-2.5 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col gap-2.5">
        
        {/* Üst Satır: Logo - Oyun Modları - Skor/Sayaçlar */}
        <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-3">
          
          {/* Sol: Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Compass className="w-4.5 h-4.5 text-white animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
                  GeoTürkiye
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  KPSS & YKS
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Gerçek Harita ile Coğrafya Testi
              </p>
            </div>
          </div>

          {/* Orta: 4 Oyun Modu (Kesilmeden, ferah ve ortalanmış) */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-950/70 border border-slate-800/80 shadow-inner shrink-0">
            <button
              onClick={() => onSelectMode("study")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                mode === "study"
                  ? "bg-slate-800 text-amber-300 shadow-sm border border-amber-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <BookOpen size={13} className={mode === "study" ? "text-amber-400" : ""} />
              <span>Keşfet</span>
            </button>

            <button
              onClick={() => onSelectMode("pinpoint")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                mode === "pinpoint"
                  ? "bg-slate-800 text-cyan-300 shadow-sm border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <MapPin size={13} className={mode === "pinpoint" ? "text-cyan-400" : ""} />
              <span>İşaretçi</span>
            </button>

            <button
              onClick={() => onSelectMode("blind")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                mode === "blind"
                  ? "bg-gradient-to-r from-rose-600 to-orange-600 text-white shadow-md shadow-rose-500/25 border border-rose-400/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Target size={13} className={mode === "blind" ? "animate-pulse" : ""} />
              <span>Körleme</span>
            </button>

            <button
              onClick={() => onSelectMode("reverse")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                mode === "reverse"
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25 border border-purple-400/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ListChecks size={13} className={mode === "reverse" ? "text-purple-300" : ""} />
              <span>Ters (4 Şık)</span>
            </button>
          </div>

          {/* Sağ: Favoriler & Skor & Sayaçlar (Asla taşmaz ve kırılmaz) */}
          <div className="flex items-center gap-2 shrink-0">
            {onToggleFavoritesOnly && (
              <button
                onClick={onToggleFavoritesOnly}
                title="Sadece Favoriye Alınan / Zorlandığım Soruları Çalış"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isFavoritesOnly
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 border border-amber-400"
                    : "bg-slate-800/80 text-amber-300 hover:bg-slate-700/80 border border-slate-700/60"
                }`}
              >
                <Star
                  size={13}
                  className={
                    isFavoritesOnly
                      ? "fill-slate-950 text-slate-950"
                      : favoritesCount > 0
                      ? "fill-amber-400 text-amber-400"
                      : "text-amber-400"
                  }
                />
                <span className="whitespace-nowrap">Yıldızlı ({favoritesCount})</span>
              </button>
            )}

            {mode !== "study" && (
              <>
                {/* Seri (Streak) */}
                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold whitespace-nowrap">
                  <Flame size={13} className={`text-amber-500 ${streak > 0 ? "animate-bounce" : ""}`} />
                  <span>{streak}</span>
                </div>

                {/* Skor */}
                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold whitespace-nowrap">
                  <Trophy size={13} className="text-cyan-400" />
                  <span>{score} P</span>
                </div>

                {/* İlerleme */}
                <div className="text-xs font-medium text-slate-400 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/50 whitespace-nowrap">
                  <strong className="text-white">{questionNumber}</strong> / {totalQuestions}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Alt Satır: 9 Ana Kategori Sekmesi + Aktif Alt Konular */}
        <div className="pt-2 border-t border-slate-800/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          {/* 9 Ana Kategori */}
          <div className="flex items-center gap-1 p-0.5 rounded-2xl bg-slate-950/60 border border-slate-800 overflow-x-auto scrollbar-none shrink-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.id);
                  onSelectSubCategory(cat.subCategories[0].id);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/25"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                {cat.tabLabel || cat.title.replace("Türkiye'nin ", "")}
              </button>
            ))}
          </div>

          {/* Alt Konu Sekmeleri */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-[11px] font-semibold text-slate-500 shrink-0 flex items-center gap-1">
              <Sparkles size={11} className="text-cyan-400" /> Alt Konu:
            </span>
            {currentCategory.subCategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => onSelectSubCategory(sub.id)}
                className={`shrink-0 px-2.5 py-0.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                  selectedSubCategoryId === sub.id
                    ? `${sub.badgeColor} shadow-md scale-105`
                    : "bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {sub.title}
              </button>
            ))}
          </div>
        </div>

      </div>
    </header>
  );
}
