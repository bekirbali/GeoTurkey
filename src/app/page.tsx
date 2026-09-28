"use client";

import React, { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { GeoCategoryType, QuizMode, GeoItem, GuessResult } from "@/types/geography";
import { GEO_ITEMS } from "@/data/geoItems";
import { CATEGORIES } from "@/data/categories";
import QuizHeader from "@/components/Quiz/QuizHeader";
import QuestionCard from "@/components/Quiz/QuestionCard";
import StudyDrawer from "@/components/Quiz/StudyDrawer";
import QuizSummaryModal from "@/components/Quiz/QuizSummaryModal";

// MapLibre Vektör Haritası Dinamik Yükleme
const VectorMap = dynamic(() => import("@/components/Map/VectorMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[650px] rounded-3xl bg-slate-950 flex flex-col items-center justify-center gap-3 border border-slate-800 shadow-2xl">
      <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-slate-400 font-medium">
        Türkiye Vektör Haritası Yükleniyor...
      </span>
    </div>
  ),
});

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<GeoCategoryType>("lakes");
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>("all_lakes");
  const [mode, setMode] = useState<QuizMode>("study");

  // Çalışma Modunda Seçili Öğe (Drawer Açmak İçin)
  const [activeStudyItem, setActiveStudyItem] = useState<GeoItem | null>(null);

  // Test Durumu (Quiz State)
  const [quizItems, setQuizItems] = useState<GeoItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [allowGuess, setAllowGuess] = useState<boolean>(true);
  const [results, setResults] = useState<GuessResult[]>([]);
  const [isQuizCompleted, setIsQuizCompleted] = useState<boolean>(false);
  const [lastGuessResult, setLastGuessResult] = useState<{
    distanceKm: number;
    score: number;
    isCorrect: boolean;
    accuracyLabel: string;
    attemptsUsed?: number;
  } | null>(null);

  // Çoklu Hak ve Kademeli Puanlama State'leri
  const MAX_ATTEMPTS = 3;
  const [currentAttempt, setCurrentAttempt] = useState<number>(1);
  const [wrongItemIds, setWrongItemIds] = useState<string[]>([]);
  const [attemptFeedback, setAttemptFeedback] = useState<string | null>(null);

  // Filtrelenmiş Öğeler
  const filteredItems = useMemo(() => {
    return GEO_ITEMS.filter((item) => {
      if (item.category !== selectedCategory) return false;
      if (
        selectedSubCategoryId.startsWith("all_") ||
        selectedSubCategoryId === "all"
      ) {
        return true;
      }
      return item.subCategoryId === selectedSubCategoryId;
    });
  }, [selectedCategory, selectedSubCategoryId]);

  // Yeni Bir Test Başlatma Fonksiyonu
  const startNewQuiz = (newItems = filteredItems) => {
    const shuffled = [...newItems].sort(() => Math.random() - 0.5);
    setQuizItems(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setAllowGuess(true);
    setCurrentAttempt(1);
    setWrongItemIds([]);
    setAttemptFeedback(null);
    setResults([]);
    setLastGuessResult(null);
    setIsQuizCompleted(false);
  };

  // Kategori veya Alt Kategori Değiştiğinde Testi Sıfırla
  useEffect(() => {
    startNewQuiz(filteredItems);
  }, [selectedCategory, selectedSubCategoryId, filteredItems]);

  // Mod Değiştiğinde
  const handleModeChange = (newMode: QuizMode) => {
    setMode(newMode);
    startNewQuiz(filteredItems);
  };

  const currentQuestionItem = quizItems[currentIndex] || filteredItems[0];

  // Yanlış Deneme Olduğunda (Hala hakkı varsa)
  const handleWrongAttempt = (info: {
    clickedItem?: GeoItem;
    attemptsUsed: number;
    remainingAttempts: number;
    distanceKm?: number;
  }) => {
    setCurrentAttempt((prev) => prev + 1);
    if (info.clickedItem) {
      setWrongItemIds((prev) => [...prev, info.clickedItem!.id]);
    }

    if (mode === "blind" && info.distanceKm !== undefined) {
      setAttemptFeedback(
        `Uzak kaldın (${info.distanceKm} km)! Tekrar tıkla (${info.remainingAttempts} hak kaldı)`
      );
    } else {
      setAttemptFeedback(
        `Yanlış nokta! Tekrar dene (${info.remainingAttempts} hak kaldı)`
      );
    }
  };

  // Soru Tamamlandığında (Doğru bilindi veya tüm haklar tükendi)
  const handleGuessComplete = (guessData: {
    item: GeoItem;
    distanceKm: number;
    score: number;
    isCorrect: boolean;
    accuracyLabel: string;
    attemptsUsed: number;
  }) => {
    setAllowGuess(false);
    setAttemptFeedback(null);
    setScore((prev) => prev + guessData.score);
    setLastGuessResult(guessData);

    const newStreak = guessData.isCorrect ? streak + 1 : 0;
    setStreak(newStreak);
    if (newStreak > maxStreak) {
      setMaxStreak(newStreak);
    }

    setResults((prev) => [
      ...prev,
      {
        questionItem: guessData.item,
        distanceKm: guessData.distanceKm,
        isCorrect: guessData.isCorrect,
        score: guessData.score,
        accuracyLabel: guessData.accuracyLabel,
        attemptsUsed: guessData.attemptsUsed,
      },
    ]);
  };

  // Sonraki Soruya Geçiş
  const handleNextQuestion = () => {
    if (currentIndex + 1 < quizItems.length) {
      setCurrentIndex((prev) => prev + 1);
      setAllowGuess(true);
      setCurrentAttempt(1);
      setWrongItemIds([]);
      setAttemptFeedback(null);
      setLastGuessResult(null);
    } else {
      setIsQuizCompleted(true);
    }
  };

  return (
    <div className="h-screen max-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Üst Navigasyon & Kontrol Çubuğu */}
      <QuizHeader
        selectedCategory={selectedCategory}
        selectedSubCategoryId={selectedSubCategoryId}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          const firstSub = CATEGORIES.find((c) => c.id === cat)?.subCategories[0].id || "";
          setSelectedSubCategoryId(firstSub);
        }}
        onSelectSubCategory={setSelectedSubCategoryId}
        mode={mode}
        onSelectMode={handleModeChange}
        score={score}
        streak={streak}
        questionNumber={currentIndex + 1}
        totalQuestions={quizItems.length}
      />

      {/* Ana Çalışma Alanı (Harita & Kartlar) */}
      <main className="flex-1 relative flex flex-col px-3 pb-3 pt-2 md:px-6 md:pb-4 md:pt-2 max-w-7xl mx-auto w-full min-h-0">
        {/* Mod Bilgilendirme Rozeti (Üst Bildirim) */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2 px-1 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400 font-medium">Toplam Konum:</span>
            <strong className="text-white font-bold">{filteredItems.length} Adet</strong>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Aktif Mod:</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300">
              {mode === "study" && "🎓 Keşfet & İncele"}
              {mode === "pinpoint" && "📍 İşaretçi Bulma (3 Hak)"}
              {mode === "blind" && "🎯 Körleme Koordinat Tahmini (3 Hak)"}
            </span>
          </div>
        </div>

        {/* Harita ve Üzerine Binen Yüzen Soru Paneli */}
        <div className="relative flex-1 w-full h-full min-h-0 rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
          {/* Gerçek Türkiye Haritası */}
          <VectorMap
            mode={mode}
            items={filteredItems}
            currentItem={mode !== "study" ? currentQuestionItem : undefined}
            onSelectItem={(item) => setActiveStudyItem(item)}
            onGuessComplete={handleGuessComplete}
            onWrongAttempt={handleWrongAttempt}
            allowGuess={allowGuess}
            currentAttempt={currentAttempt}
            maxAttempts={MAX_ATTEMPTS}
            wrongItemIds={wrongItemIds}
          />

          {/* Test Modundayken Harita Üzerine Binen Yüzen Soru Kartı */}
          {mode !== "study" && currentQuestionItem && (
            <div className="absolute top-4 left-4 z-20 max-w-[340px] md:max-w-md pointer-events-auto">
              <QuestionCard
                item={currentQuestionItem}
                mode={mode}
                allowGuess={allowGuess}
                currentAttempt={currentAttempt}
                maxAttempts={MAX_ATTEMPTS}
                attemptFeedback={attemptFeedback}
                lastGuessResult={lastGuessResult}
                onNextQuestion={handleNextQuestion}
              />
            </div>
          )}
        </div>
      </main>

      {/* Çalışma Modu Bilgi Çekmecesi (Drawer) */}
      <StudyDrawer
        item={activeStudyItem}
        onClose={() => setActiveStudyItem(null)}
        onStartQuizOnItem={(item) => {
          setMode("blind");
          setQuizItems([item]);
          setCurrentIndex(0);
          setAllowGuess(true);
          setCurrentAttempt(1);
          setWrongItemIds([]);
          setAttemptFeedback(null);
          setLastGuessResult(null);
        }}
      />

      {/* Test Tamamlandı Özet Modalı */}
      <QuizSummaryModal
        isOpen={isQuizCompleted}
        score={score}
        maxScore={quizItems.length * 1000}
        results={results}
        maxStreak={maxStreak}
        onRestart={() => startNewQuiz(filteredItems)}
        onChangeCategory={() => {
          setIsQuizCompleted(false);
        }}
      />
    </div>
  );
}
