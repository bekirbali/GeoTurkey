"use client";

import React, { useState } from "react";
import { GeoItem, QuizMode } from "@/types/geography";
import { ChevronRight, CheckCircle2, XCircle, Lightbulb, Award, Heart, Star, ChevronUp, ChevronDown, SlidersHorizontal } from "lucide-react";

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
  options?: GeoItem[];
  onSelectOption?: (option: GeoItem) => void;
  selectedOptionId?: string | null;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onOpenSettings?: () => void;
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
  options = [],
  onSelectOption,
  selectedOptionId,
  isFavorite = false,
  onToggleFavorite,
  onOpenSettings,
}: QuestionCardProps) {
  const [showHint, setShowHint] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Yeni soru geldiğinde sadece ipucunu sıfırla (Kullanıcı haritayı rahat görmek için küçülttüyse seçimini koru)
  React.useEffect(() => {
    setShowHint(false);
  }, [item.id]);

  const remainingAttempts = Math.max(0, maxAttempts - currentAttempt + 1);

  // Haritayı tamamen görmek için küçültülmüş ince HUD modu (Hem soru hem de cevap sonrası aktif)
  if (isMinimized) {
    return (
      <div className="w-full bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl px-3 py-2 shadow-2xl flex items-center justify-between gap-2 animate-in fade-in duration-150">
        <div className="flex items-center gap-2 min-w-0">
          {!allowGuess ? (
            lastGuessResult?.isCorrect ? (
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold shrink-0">
                +{lastGuessResult.score} P
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold shrink-0 truncate max-w-[100px]">
                {lastGuessResult?.distanceKm ? `${Math.round(lastGuessResult.distanceKm)} km` : "Bitti"}
              </span>
            )
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
          )}

          <strong className="text-xs sm:text-sm font-black text-white truncate">
            {mode === "reverse" && allowGuess ? "Haritada Gösterilen Yer?" : item.name}
          </strong>

          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 truncate hidden sm:inline">
            {item.subCategoryTitle}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {allowGuess ? (
            <>
              {mode !== "reverse" && (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: maxAttempts }).map((_, idx) => (
                    <Heart
                      key={idx}
                      size={11}
                      className={
                        idx < remainingAttempts
                          ? "fill-rose-500 text-rose-500"
                          : "fill-slate-700 text-slate-700 opacity-40"
                      }
                    />
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-amber-400 p-1 hover:bg-slate-800 rounded-lg text-xs"
                title="İpucu"
              >
                <Lightbulb size={14} />
              </button>
            </>
          ) : (
            <button
              onClick={onNextQuestion}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 transition-all shadow-md shadow-cyan-500/20"
            >
              <span>Sonraki</span>
              <ChevronRight size={13} />
            </button>
          )}

          {/* Zorluk Ayarı Butonu (Küçültülmüş Görünüm) */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="text-slate-400 hover:text-cyan-300 p-1 hover:bg-slate-800 rounded-lg text-xs transition-colors"
              title="Zorluk & Katman Ayarları"
            >
              <SlidersHorizontal size={14} />
            </button>
          )}

          <button
            onClick={() => setIsMinimized(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Genişlet"
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl sm:rounded-3xl p-2.5 sm:p-5 shadow-2xl transition-all">
      {/* Üst Rozetler, Favori Butonu, Küçültme ve Kalan Hak Göstergesi */}
      <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            {item.subCategoryTitle}
          </span>
          {onToggleFavorite && (
            <button
              onClick={onToggleFavorite}
              title={isFavorite ? "Yıldızı Kaldır" : "Zorlandığım / Favorilere Ekle"}
              className="p-1 rounded-full hover:bg-slate-800 transition-colors"
            >
              <Star
                size={15}
                className={
                  isFavorite
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-500 hover:text-amber-400"
                }
              />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Kalan Hak Sayaç Rozeti */}
          {mode !== "reverse" && (
            <div className="flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-slate-950/80 border border-slate-800 text-[10px] sm:text-[11px] font-semibold text-slate-300">
              <span className="text-slate-400 mr-0.5">Hak:</span>
              {Array.from({ length: maxAttempts }).map((_, idx) => (
                <Heart
                  key={idx}
                  size={11}
                  className={
                    idx < remainingAttempts
                      ? "fill-rose-500 text-rose-500 transition-colors"
                      : "fill-slate-700 text-slate-700 opacity-40 transition-colors"
                  }
                />
              ))}
            </div>
          )}

          {allowGuess && (
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-1 text-[11px] sm:text-xs text-amber-400/90 hover:text-amber-300 transition-colors font-medium ml-0.5"
            >
              <Lightbulb size={12} />
              <span>{showHint ? "Gizle" : "İpucu"}</span>
            </button>
          )}

          {/* Zorluk Ayarı Butonu (Genişletilmiş Görünüm) */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-cyan-300 transition-all text-[11px] font-semibold"
              title="Harita Zorluk ve Katman Ayarları"
            >
              <SlidersHorizontal size={12} className="text-cyan-400" />
              <span className="hidden sm:inline">Zorluk</span>
            </button>
          )}

          {/* Küçültme Butonu (Cevap öncesi ve sonrası haritayı engelsiz görmek için) */}
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Haritayı Rahat Görmek İçin Küçült"
          >
            <ChevronUp size={15} />
          </button>
        </div>
      </div>

      {/* Soru Başlığı */}
      <div className="mb-1.5 sm:mb-3">
        <span className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-400 font-semibold block">
          {mode === "blind"
            ? "Körleme Tahmin"
            : mode === "reverse"
            ? "Ters Mod (Konumdan İsim)"
            : "Hedefi Bul"}
        </span>
        <h2 className="text-base sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
          {mode === "reverse" ? "Haritada Vurgulanan Yer?" : item.name}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
          {mode === "blind"
            ? "Haritada hiçbir işaret yok. Doğru konumunu tahmin edip tıkla!"
            : mode === "reverse"
            ? "Haritada parıldayan mor işaretçinin hangi coğrafi yer olduğunu seç."
            : "Haritada parıldayan noktalardan doğru olanın üzerine tıkla."}
        </p>
      </div>

      {/* Ters Mod: 4 Şıklı Çoktan Seçmeli Butonlar (Mobilde 2x2 grid ile kompakt) */}
      {mode === "reverse" && options.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 my-2 sm:my-3">
          {options.map((opt, idx) => {
            const letter = ["A", "B", "C", "D"][idx] || "";
            const isSelected = selectedOptionId === opt.id;
            const isTarget = opt.id === item.id;
            let btnClass = "bg-slate-800/80 hover:bg-slate-700/80 text-white border-slate-700/60";

            if (!allowGuess) {
              if (isTarget) {
                btnClass = "bg-emerald-600/90 text-white border-emerald-400 font-bold shadow-lg shadow-emerald-500/25";
              } else if (isSelected && !isTarget) {
                btnClass = "bg-rose-600/90 text-white border-rose-400 font-bold line-through";
              } else {
                btnClass = "bg-slate-900/60 text-slate-500 border-slate-800 opacity-50";
              }
            }

            return (
              <button
                key={opt.id}
                disabled={!allowGuess}
                onClick={() => onSelectOption?.(opt)}
                className={`py-2 px-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left flex items-center gap-2 transition-all ${btnClass}`}
              >
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-slate-950/70 flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0 text-cyan-400">
                  {letter}
                </span>
                <span className="text-xs font-semibold truncate">{opt.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Hatalı Deneme Sonrası Canlı Uyarı Bildirimi */}
      {attemptFeedback && allowGuess && (
        <div className="mb-2.5 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-150">
          <span>{attemptFeedback}</span>
          <span className="text-[10px] sm:text-[11px] font-bold text-amber-400 px-2 py-0.5 rounded-lg bg-slate-950/60 border border-amber-500/20">
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
