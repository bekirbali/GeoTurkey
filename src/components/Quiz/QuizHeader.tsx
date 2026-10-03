"use client";

import React from "react";
import { GeoCategoryType, QuizMode, SubCategory } from "@/types/geography";
import { CATEGORIES } from "@/data/categories";
import { Flame, Trophy, Award, Compass, Sparkles, BookOpen, Target, MapPin, ListChecks, Star, ChevronDown } from "lucide-react";

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
    <header className="w-full bg-slate-900/90 backdrop-blur-2xl border-b border-slate-800/80 sticky top-0 z-30 px-2.5 py-1.5 md:px-4 md:py-2.5 shadow-lg">
      <div className="max-w-7xl mx-auto">
        
        {/* ==================== MASAÜSTÜ GÖRÜNÜM (Orijinal Haline Birebir Geri Döndürüldü) ==================== */}
        <div className="hidden md:flex flex-col gap-2.5">
          {/* Üst Satır: Sol Logo - Orta Oyun Modları - Sağ Skor/Sayaçlar */}
          <div className="flex items-center justify-between gap-3">
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

            {/* Orta: 4 Oyun Modu */}
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

            {/* Sağ: Favoriler & Skor & Sayaçlar */}
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
                  <span className="whitespace-nowrap">Yıldızlı</span>
                  <span>({favoritesCount})</span>
                </button>
              )}

              {mode !== "study" && (
                <>
                  {/* Seri (Streak) */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold whitespace-nowrap">
                    <Flame size={13} className={`text-amber-500 ${streak > 0 ? "animate-bounce" : ""}`} />
                    <span>{streak}</span>
                  </div>

                  {/* Skor */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold whitespace-nowrap">
                    <Trophy size={13} className="text-cyan-400" />
                    <span>{score} P</span>
                  </div>

                  {/* İlerleme */}
                  <div className="text-xs font-medium text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/50 whitespace-nowrap">
                    <strong className="text-white">{questionNumber}</strong>/{totalQuestions}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Alt Satır: 9 Ana Kategori Sekmesi + Aktif Alt Konular */}
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
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

            {/* Masaüstü Alt Konu Açılır Seçicisi (Sağa taşmayı ve buton kalabalığını tamamen çözer) */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Sparkles size={13} className="text-cyan-400" />
                <span>Alt Konu:</span>
              </span>
              <div className="relative">
                <select
                  value={selectedSubCategoryId}
                  onChange={(e) => onSelectSubCategory(e.target.value)}
                  className="appearance-none bg-slate-950/90 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 rounded-xl px-3 py-1.5 pr-8 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer shadow-lg transition-all"
                >
                  {currentCategory.subCategories.map((sub) => (
                    <option key={sub.id} value={sub.id} className="bg-slate-900 text-white font-medium">
                      {sub.title}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* ==================== MOBİL GÖRÜNÜM (Haritaya Alan Kazandıran Kompakt Düzen) ==================== */}
        <div className="flex md:hidden flex-col gap-1.5">
          {/* Satır 1: Sol Logo & Sağ Skor/Sayaçlar */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <Compass className="w-4 h-4 text-white animate-spin-slow" />
              </div>
              <div className="flex items-center gap-1">
                <span className="font-black text-xs tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
                  GeoTürkiye
                </span>
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  KPSS
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {onToggleFavoritesOnly && (
                <button
                  onClick={onToggleFavoritesOnly}
                  className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${
                    isFavoritesOnly
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 border border-amber-400"
                      : "bg-slate-800/80 text-amber-300 border border-slate-700/60"
                  }`}
                >
                  <Star
                    size={11}
                    className={
                      isFavoritesOnly
                        ? "fill-slate-950 text-slate-950"
                        : favoritesCount > 0
                        ? "fill-amber-400 text-amber-400"
                        : "text-amber-400"
                    }
                  />
                  <span>({favoritesCount})</span>
                </button>
              )}

              {mode !== "study" && (
                <>
                  <div className="flex items-center gap-1 px-1.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold whitespace-nowrap">
                    <Flame size={11} className={`text-amber-500 ${streak > 0 ? "animate-bounce" : ""}`} />
                    <span>{streak}</span>
                  </div>

                  <div className="flex items-center gap-1 px-1.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold whitespace-nowrap">
                    <Trophy size={11} className="text-cyan-400" />
                    <span>{score}P</span>
                  </div>

                  <div className="text-[10px] font-medium text-slate-400 bg-slate-800/80 px-1.5 py-1 rounded-xl border border-slate-700/50 whitespace-nowrap">
                    <strong className="text-white">{questionNumber}</strong>/{totalQuestions}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Satır 2: 4 Oyun Modu (Mobilde Tam Ortalı) */}
          <div className="flex items-center justify-center gap-0.5 p-0.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 shadow-inner w-full">
            <button
              onClick={() => onSelectMode("study")}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all ${
                mode === "study"
                  ? "bg-slate-800 text-amber-300 shadow-sm border border-amber-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <BookOpen size={12} className={mode === "study" ? "text-amber-400" : ""} />
              <span>Keşfet</span>
            </button>

            <button
              onClick={() => onSelectMode("pinpoint")}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all ${
                mode === "pinpoint"
                  ? "bg-slate-800 text-cyan-300 shadow-sm border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <MapPin size={12} className={mode === "pinpoint" ? "text-cyan-400" : ""} />
              <span>İşaretçi</span>
            </button>

            <button
              onClick={() => onSelectMode("blind")}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all ${
                mode === "blind"
                  ? "bg-gradient-to-r from-rose-600 to-orange-600 text-white shadow-md shadow-rose-500/25 border border-rose-400/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Target size={12} className={mode === "blind" ? "animate-pulse" : ""} />
              <span>Körleme</span>
            </button>

            <button
              onClick={() => onSelectMode("reverse")}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all ${
                mode === "reverse"
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25 border border-purple-400/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ListChecks size={12} className={mode === "reverse" ? "text-purple-300" : ""} />
              <span>Ters</span>
            </button>
          </div>

          {/* Satır 3: Tek Satır Kompakt Kategori & Alt Konu Açılır Seçicisi */}
          <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/60">
            <div className="relative flex-1 min-w-0">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  const catId = e.target.value as GeoCategoryType;
                  onSelectCategory(catId);
                  const firstSub = CATEGORIES.find((c) => c.id === catId)?.subCategories[0].id || "";
                  onSelectSubCategory(firstSub);
                }}
                className="w-full appearance-none bg-slate-950/80 text-white border border-slate-700/80 rounded-xl px-2.5 py-1 pr-6 text-xs font-semibold focus:outline-none focus:border-cyan-500 truncate shadow-inner"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-slate-900 text-white">
                    {cat.tabLabel || cat.title.replace("Türkiye'nin ", "")}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative flex-1 min-w-0">
              <select
                value={selectedSubCategoryId}
                onChange={(e) => onSelectSubCategory(e.target.value)}
                className="w-full appearance-none bg-slate-950/80 text-cyan-300 border border-slate-700/80 rounded-xl px-2.5 py-1 pr-6 text-xs font-semibold focus:outline-none focus:border-cyan-500 truncate shadow-inner"
              >
                {currentCategory.subCategories.map((sub) => (
                  <option key={sub.id} value={sub.id} className="bg-slate-900 text-white">
                    {sub.title}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}
