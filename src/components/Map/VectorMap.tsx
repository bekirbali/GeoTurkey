"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
type MapLibreMap = maplibregl.Map;
import { GeoItem, QuizMode, MapLayerSettings, DifficultyLevel } from "@/types/geography";
import { calculateDistanceKm, evaluateGuess, soundEffects } from "@/lib/geoUtils";
import { SlidersHorizontal, Volume2, VolumeX, MapPin, Check, Eye, EyeOff, Shield } from "lucide-react";

interface VectorMapProps {
  mode: QuizMode;
  items: GeoItem[];
  currentItem?: GeoItem;
  onSelectItem?: (item: GeoItem) => void;
  onGuessComplete?: (result: {
    item: GeoItem;
    distanceKm: number;
    score: number;
    isCorrect: boolean;
    accuracyLabel: string;
    attemptsUsed: number;
  }) => void;
  onWrongAttempt?: (info: {
    clickedItem?: GeoItem;
    attemptsUsed: number;
    remainingAttempts: number;
    distanceKm?: number;
  }) => void;
  allowGuess: boolean;
  currentAttempt: number;
  maxAttempts: number;
  wrongItemIds: string[];
}

// 100% Ücretsiz, API Key Gerektirmeyen Vektör Harita Stilleri
const VECTOR_STYLES = {
  positron: {
    name: "Sade Açık Vektör",
    url: "https://tiles.openfreemap.org/styles/positron",
  },
  liberty: {
    name: "Renkli / Fiziki Vektör",
    url: "https://tiles.openfreemap.org/styles/liberty",
  },
  bright: {
    name: "Canlı Açık Vektör",
    url: "https://tiles.openfreemap.org/styles/bright",
  },
};

// Vektör Katman ID Grupları
const WATER_LABEL_LAYERS = [
  "water_name_point_label",
  "water_name_line_label",
  "waterway_line_label",
];

const CITY_LABEL_LAYERS = [
  "label_city",
  "label_city_capital",
  "label_town",
  "label_village",
  "label_state",
  "label_other",
];

const PROVINCE_BOUNDARY_LAYERS = [
  "boundary_3",
];

export default function VectorMap({
  mode,
  items,
  currentItem,
  onSelectItem,
  onGuessComplete,
  onWrongAttempt,
  allowGuess,
  currentAttempt,
  maxAttempts,
  wrongItemIds,
}: VectorMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const activeMarkersRef = useRef<maplibregl.Marker[]>([]);
  const linePopupRef = useRef<maplibregl.Popup | null>(null);

  // Ses Efekti Durumu
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Katman ve Zorluk Ayarları
  const [settings, setSettings] = useState<MapLayerSettings>({
    difficulty: "medium",
    showProvinces: true,      // İl sınırları açık
    showCityNames: false,     // Şehir isimleri kapalı
    showWaterLabels: false,   // Göl isimleri kapalı
    stylePreset: "positron",
  });

  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Katman Görünürlüklerini Uygulayan Yardımcı Fonksiyon
  const applyLayerVisibility = useCallback((map: MapLibreMap, currentSettings: MapLayerSettings) => {
    if (!map.isStyleLoaded()) return;

    const style = map.getStyle();
    if (!style || !style.layers) return;

    // Tüm vektör katmanlarını tara ve Türkçe dil + görünürlük ayarlarını uygula
    style.layers.forEach((layer) => {
      // 1. Türkçe Dil Ayarı (Language: Turkish first)
      if (layer.type === "symbol" && layer.layout && layer.layout["text-field"]) {
        try {
          map.setLayoutProperty(layer.id, "text-field", [
            "coalesce",
            ["get", "name:tr"],
            ["get", "name"],
            ["get", "name:latin"],
          ]);
        } catch {
          // İlgili katman desteklemiyorsa geç
        }
      }

      // 2. Su ve Göl İsimleri (Görünürlük)
      if (
        layer.id.includes("water_name") ||
        layer.id.includes("waterway") ||
        layer.id.includes("lake") ||
        layer.id.includes("sea") ||
        layer.id.includes("ocean")
      ) {
        try {
          map.setLayoutProperty(
            layer.id,
            "visibility",
            currentSettings.showWaterLabels ? "visible" : "none"
          );
        } catch {}
      }

      // 3. Şehir, İl ve Yerleşim İsimleri
      if (
        layer.id.startsWith("label_city") ||
        layer.id.startsWith("label_town") ||
        layer.id.startsWith("label_village") ||
        layer.id.startsWith("label_state") ||
        layer.id.startsWith("label_other")
      ) {
        try {
          map.setLayoutProperty(
            layer.id,
            "visibility",
            currentSettings.showCityNames ? "visible" : "none"
          );
        } catch {}
      }

      // 4. İl Sınır Çizgileri
      if (layer.id === "boundary_3" || layer.id === "boundary_disputed") {
        try {
          map.setLayoutProperty(
            layer.id,
            "visibility",
            currentSettings.showProvinces ? "visible" : "none"
          );
        } catch {}
      }

      // 5. Karayolları ve Havalimanları (Görsel kalabalığı önlemek için kapalı)
      if (
        layer.id.includes("highway") ||
        layer.id.includes("airport") ||
        layer.id.includes("road_shield")
      ) {
        try {
          map.setLayoutProperty(layer.id, "visibility", "none");
        } catch {}
      }
    });
  }, []);

  // Haritayı Başlatma
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    if (typeof window !== "undefined") {
      maplibregl.setWorkerUrl("/maplibre-gl-csp-worker.js");
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: VECTOR_STYLES[settings.stylePreset].url,
      center: [35.2, 39.0], // [lng, lat]
      zoom: 5.7,
      minZoom: 4.8,
      maxZoom: 14,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("load", () => {
      applyLayerVisibility(map, settings);

      // Çizgi ve Hedef Katman Kaynakları (Körleme Modu İçin)
      if (!map.getSource("guess-line")) {
        map.addSource("guess-line", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });

        map.addLayer({
          id: "guess-line-layer",
          type: "line",
          source: "guess-line",
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": ["get", "color"],
            "line-width": 3.5,
            "line-dasharray": [2, 2],
          },
        });
      }
    });

    map.on("style.load", () => {
      applyLayerVisibility(map, settings);
    });

    mapInstanceRef.current = map;

    const handleResize = () => {
      map.resize();
    };
    window.addEventListener("resize", handleResize);
    const t = setTimeout(() => map.resize(), 150);

    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", handleResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Ayarlar Değiştiğinde Vektör Katmanlarını Güncelle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    applyLayerVisibility(map, settings);
  }, [settings, applyLayerVisibility]);

  // Stil Değişimi
  const handleStyleChange = (preset: "positron" | "liberty" | "bright") => {
    const map = mapInstanceRef.current;
    if (!map) return;

    setSettings((prev) => ({ ...prev, stylePreset: preset }));
    map.setStyle(VECTOR_STYLES[preset].url);
  };

  // Zorluk Seviyesi Seçimi
  const handleDifficultyPreset = (diff: DifficultyLevel) => {
    let newSettings: Partial<MapLayerSettings> = { difficulty: diff };

    if (diff === "easy") {
      newSettings = {
        difficulty: "easy",
        showProvinces: true,
        showCityNames: true,
        showWaterLabels: false,
      };
    } else if (diff === "medium") {
      newSettings = {
        difficulty: "medium",
        showProvinces: true,
        showCityNames: false,
        showWaterLabels: false,
      };
    } else if (diff === "hard") {
      newSettings = {
        difficulty: "hard",
        showProvinces: false,
        showCityNames: false,
        showWaterLabels: false,
      };
    }

    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Körleme Modunda Haritaya Tıklama
  const handleMapClick = useCallback(
    (e: maplibregl.MapMouseEvent) => {
      if (mode !== "blind" || !allowGuess || !currentItem) return;

      const map = mapInstanceRef.current;
      if (!map) return;

      const clickedLng = e.lngLat.lng;
      const clickedLat = e.lngLat.lat;
      const targetLng = currentItem.coordinates.lng;
      const targetLat = currentItem.coordinates.lat;

      const distanceKm = calculateDistanceKm(clickedLat, clickedLng, targetLat, targetLng);
      const evaluation = evaluateGuess(distanceKm, currentItem.toleranceKm, 1);

      // Ses efekti
      if (soundEnabled) {
        if (evaluation.score >= 800) soundEffects.playSuccess();
        else if (evaluation.score >= 300) soundEffects.playClose();
        else soundEffects.playMiss();
      }

      // 1. Önceki markerları temizle
      activeMarkersRef.current.forEach((m) => m.remove());
      activeMarkersRef.current = [];

      if (linePopupRef.current) {
        linePopupRef.current.remove();
        linePopupRef.current = null;
      }

      // 2. Kullanıcı Tıklama Noktası Markeri
      const userEl = document.createElement("div");
      userEl.innerHTML = `
        <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
          <span style="padding:2px 7px; font-size:10px; font-weight:bold; border-radius:6px; color:white; background:#2563eb; box-shadow:0 2px 5px rgba(0,0,0,0.3); white-space:nowrap; margin-bottom:2px;">
            Tahminin
          </span>
          <div style="position:relative; display:flex; align-items:center; justify-content:center;">
            <span style="position:absolute; width:28px; height:28px; border-radius:9999px; background:rgba(37,99,235,0.35);" class="animate-ping"></span>
            <span style="position:relative; width:14px; height:14px; border-radius:9999px; background:#2563eb; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.4);"></span>
          </div>
        </div>
      `;
      const userMarker = new maplibregl.Marker({ element: userEl, anchor: "bottom" })
        .setLngLat([clickedLng, clickedLat])
        .addTo(map);
      activeMarkersRef.current.push(userMarker);

      // 3. Gerçek Orijinal Hedef Noktası Markeri
      const targetColor =
        evaluation.score >= 600 ? "#10b981" : evaluation.score >= 300 ? "#f59e0b" : "#ef4444";

      const targetEl = document.createElement("div");
      targetEl.innerHTML = `
        <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
          <span style="padding:3px 9px; font-size:11px; font-weight:800; border-radius:8px; color:white; background:${targetColor}; box-shadow:0 4px 8px rgba(0,0,0,0.4); white-space:nowrap; border:1px solid rgba(255,255,255,0.3); margin-bottom:2px;">
            🎯 ${currentItem.name} (Gerçek Yer)
          </span>
          <div style="position:relative; display:flex; align-items:center; justify-content:center;">
            <span style="position:absolute; width:34px; height:34px; border-radius:9999px; background:${targetColor}; opacity:0.35;" class="animate-ping"></span>
            <span style="width:16px; height:16px; border-radius:9999px; background:${targetColor}; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.4);"></span>
          </div>
        </div>
      `;
      const targetMarker = new maplibregl.Marker({ element: targetEl, anchor: "bottom" })
        .setLngLat([targetLng, targetLat])
        .addTo(map);
      activeMarkersRef.current.push(targetMarker);

      // 4. Bağlantı Çizgisi (GeoJSON Source Güncellemesi)
      const lineSource = map.getSource("guess-line") as maplibregl.GeoJSONSource;
      if (lineSource) {
        lineSource.setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: [
                  [clickedLng, clickedLat],
                  [targetLng, targetLat],
                ],
              },
              properties: {
                color: targetColor,
              },
            },
          ],
        });
      }

      // 5. Çizginin Ortasındaki Sapma Rozeti
      const midLng = (clickedLng + targetLng) / 2;
      const midLat = (clickedLat + targetLat) / 2;

      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        anchor: "bottom",
        offset: [0, -5],
      })
        .setLngLat([midLng, midLat])
        .setHTML(
          `<div style="padding:4px 10px; font-size:11px; font-weight:bold; color:#0f172a; background:rgba(255,255,255,0.96); border-radius:12px; border:1px solid #cbd5e1; box-shadow:0 4px 8px rgba(0,0,0,0.2); white-space:nowrap; text-align:center;">
             Sapma: <strong style="color:${targetColor}; font-size:12px;">${distanceKm} km</strong>
           </div>`
        )
        .addTo(map);

      linePopupRef.current = popup;

      // 6. Her İki Noktayı Kadraja Alma (Fit Bounds)
      if (distanceKm > 20) {
        const bounds = new maplibregl.LngLatBounds();
        bounds.extend([clickedLng, clickedLat]);
        bounds.extend([targetLng, targetLat]);
        map.fitBounds(bounds, { padding: 90, maxZoom: 8, duration: 800 });
      }

      onGuessComplete?.({
        item: currentItem,
        distanceKm,
        score: evaluation.score,
        isCorrect: evaluation.isPassed,
        accuracyLabel: evaluation.label,
        attemptsUsed: 1,
      });
    },
    [mode, allowGuess, currentItem, soundEnabled, onGuessComplete]
  );

  // Harita Tıklama Dinleyicisi
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [handleMapClick]);

  // Yeni Soruya Geçildiğinde Çizgileri Temizle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (allowGuess && mode === "blind") {
      const lineSource = map.getSource("guess-line") as maplibregl.GeoJSONSource;
      if (lineSource) {
        lineSource.setData({
          type: "FeatureCollection",
          features: [],
        });
      }
      if (linePopupRef.current) {
        linePopupRef.current.remove();
        linePopupRef.current = null;
      }
    }
  }, [allowGuess, mode]);

  // Mod veya Nesneler Değiştiğinde Markerları Güncelle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Önceki markerları temizle
    activeMarkersRef.current.forEach((m) => m.remove());
    activeMarkersRef.current = [];

    if (mode === "study") {
      // Keşfet & Çalış Modu
      items.forEach((item) => {
        const isCurrent = currentItem?.id === item.id;
        const el = document.createElement("div");
        el.className = "cursor-pointer transition-transform duration-200 hover:scale-125";
        el.innerHTML = `
          <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
            <span style="padding:2px 8px; font-size:11px; font-weight:700; border-radius:6px; color:white; white-space:nowrap; box-shadow:0 2px 4px rgba(0,0,0,0.4); background:${
              isCurrent ? "#f59e0b" : "rgba(15,23,42,0.92)"
            };">
              ${item.name}
            </span>
            <div style="width:14px; height:14px; border-radius:9999px; background:${
              isCurrent ? "#f59e0b" : "#3b82f6"
            }; border:2px solid white; box-shadow:0 2px 4px rgba(0,0,0,0.3); margin-top:-2px;"></div>
          </div>
        `;

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onSelectItem?.(item);
        });

        const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([item.coordinates.lng, item.coordinates.lat])
          .addTo(map);

        activeMarkersRef.current.push(marker);
      });
    } else if (mode === "pinpoint") {
      // İşaretçiyi Bul Modu
      items.forEach((item) => {
        const isWrong = wrongItemIds.includes(item.id);
        const isAnswered = !allowGuess;
        const isTarget = currentItem?.id === item.id;

        const el = document.createElement("div");

        if (isWrong) {
          el.innerHTML = `
            <div style="position:relative; display:flex; align-items:center; justify-content:center; opacity:0.6; cursor:not-allowed;">
              <div style="width:18px; height:18px; border-radius:9999px; background:#ef4444; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; color:white; font-size:10px; font-weight:bold;">
                ✕
              </div>
            </div>
          `;
        } else if (isAnswered && isTarget) {
          el.innerHTML = `
            <div style="position:relative; display:flex; flex-direction:column; align-items:center; cursor:default;">
              <span style="position:absolute; width:36px; height:36px; border-radius:9999px; background:rgba(16,185,129,0.4);" class="animate-ping"></span>
              <span style="padding:2px 8px; font-size:11px; font-weight:bold; border-radius:6px; color:white; background:#10b981; box-shadow:0 2px 6px rgba(0,0,0,0.4); white-space:nowrap;">
                ${item.name}
              </span>
              <div style="width:16px; height:16px; border-radius:9999px; background:#10b981; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.4); margin-top:2px;"></div>
            </div>
          `;
        } else {
          el.className = "cursor-pointer group";
          el.innerHTML = `
            <div style="position:relative; display:flex; align-items:center; justify-content:center;">
              <span style="position:absolute; width:28px; height:28px; border-radius:9999px; background:rgba(6,182,212,0.25);"></span>
              <div style="width:18px; height:18px; border-radius:9999px; background:#0284c7; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; color:white; font-size:10px; font-weight:bold;">
                •
              </div>
            </div>
          `;

          el.addEventListener("click", (e) => {
            e.stopPropagation();
            if (!allowGuess || !currentItem) return;
            if (wrongItemIds.includes(item.id)) return;

            const isCorrect = item.id === currentItem.id;

            if (isCorrect) {
              if (soundEnabled) soundEffects.playSuccess();
              const scoreMultiplier = currentAttempt === 1 ? 1.0 : currentAttempt === 2 ? 0.6 : 0.3;
              const finalScore = Math.round(1000 * scoreMultiplier);
              const label =
                currentAttempt === 1 ? "Doğru Nokta! (1. Hakta)" : `Doğru Nokta! (${currentAttempt}. Hakta)`;

              onGuessComplete?.({
                item: currentItem,
                distanceKm: 0,
                score: finalScore,
                isCorrect: true,
                accuracyLabel: label,
                attemptsUsed: currentAttempt,
              });
            } else {
              if (currentAttempt < maxAttempts) {
                if (soundEnabled) soundEffects.playClose();
                onWrongAttempt?.({
                  clickedItem: item,
                  attemptsUsed: currentAttempt,
                  remainingAttempts: maxAttempts - currentAttempt,
                });
              } else {
                if (soundEnabled) soundEffects.playMiss();
                onGuessComplete?.({
                  item: currentItem,
                  distanceKm: 50,
                  score: 0,
                  isCorrect: false,
                  accuracyLabel: "Yanlış! Haklar Tükendi",
                  attemptsUsed: maxAttempts,
                });
              }
            }
          });
        }

        const marker = new maplibregl.Marker({
          element: el,
          anchor: isAnswered && isTarget ? "bottom" : "center",
        })
          .setLngLat([item.coordinates.lng, item.coordinates.lat])
          .addTo(map);

        activeMarkersRef.current.push(marker);
      });
    }
  }, [
    mode,
    items,
    currentItem,
    allowGuess,
    currentAttempt,
    maxAttempts,
    wrongItemIds,
    onSelectItem,
    onGuessComplete,
    onWrongAttempt,
    soundEnabled,
  ]);

  // Seçilen öğeye kamera geçişi (Pan)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (currentItem && map && (mode === "study" || (!allowGuess && mode !== "blind"))) {
      map.flyTo({
        center: [currentItem.coordinates.lng, currentItem.coordinates.lat],
        zoom: mode === "study" ? 8 : 7.5,
        speed: 1.2,
      });
    }
  }, [currentItem, mode, allowGuess]);

  return (
    <div
      className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 flex flex-col"
    >
      {/* Harita Konteyneri */}
      <div
        ref={mapContainerRef}
        className="w-full h-full flex-1 z-0"
      />

      {/* Üst Sağ Harita Kontrolleri (Zorluk/Katman Ayarları & Ses) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2.5 rounded-2xl backdrop-blur-xl border transition-all duration-200 shadow-lg ${
            soundEnabled
              ? "bg-slate-900/90 text-emerald-400 border-emerald-500/30 hover:bg-slate-800"
              : "bg-slate-900/90 text-slate-400 border-slate-700/50 hover:bg-slate-800"
          }`}
          title={soundEnabled ? "Sesi Kapat" : "Sesi Aç"}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        {/* Katman & Zorluk Kontrol Butonu */}
        <button
          onClick={() => setShowSettingsModal(!showSettingsModal)}
          className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 text-slate-200 text-xs font-semibold shadow-lg hover:bg-slate-800 transition-all"
        >
          <SlidersHorizontal size={15} className="text-cyan-400" />
          <span>Katman & Zorluk</span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/20 text-cyan-300 uppercase">
            {settings.difficulty === "easy"
              ? "Kolay"
              : settings.difficulty === "medium"
              ? "Orta"
              : settings.difficulty === "hard"
              ? "Zor"
              : "Özel"}
          </span>
        </button>
      </div>

      {/* Zorluk & Vektör Katman Ayarları Modalı */}
      {showSettingsModal && (
        <div className="absolute top-16 right-4 w-72 rounded-3xl bg-slate-900/95 backdrop-blur-2xl border border-slate-700/90 p-4 shadow-2xl z-30 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Shield size={14} className="text-cyan-400" /> Zorluk Seviyesi
            </span>
            <button
              onClick={() => setShowSettingsModal(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Zorluk Hazır Ayarları (Presets) */}
          <div className="grid grid-cols-3 gap-1.5 mb-4">
            <button
              onClick={() => handleDifficultyPreset("easy")}
              className={`py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                settings.difficulty === "easy"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/30"
                  : "bg-slate-800/80 text-slate-400 hover:bg-slate-800"
              }`}
            >
              Kolay
            </button>
            <button
              onClick={() => handleDifficultyPreset("medium")}
              className={`py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                settings.difficulty === "medium"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-500/30"
                  : "bg-slate-800/80 text-slate-400 hover:bg-slate-800"
              }`}
            >
              Orta
            </button>
            <button
              onClick={() => handleDifficultyPreset("hard")}
              className={`py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                settings.difficulty === "hard"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-500/30"
                  : "bg-slate-800/80 text-slate-400 hover:bg-slate-800"
              }`}
            >
              Zor
            </button>
          </div>

          {/* İnce Ayar / Vektör Katman Checkbox'ları */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
              Katman Görünürlüğü
            </span>

            {/* İl Sınırları */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 border border-slate-800 cursor-pointer hover:bg-slate-800 text-xs">
              <span className="text-slate-200">İl Sınır Çizgileri</span>
              <input
                type="checkbox"
                checked={settings.showProvinces}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    difficulty: "custom",
                    showProvinces: e.target.checked,
                  }))
                }
                className="w-4 h-4 rounded text-cyan-600 bg-slate-900 border-slate-700 focus:ring-0"
              />
            </label>

            {/* Şehir İsimleri */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 border border-slate-800 cursor-pointer hover:bg-slate-800 text-xs">
              <span className="text-slate-200">Şehir & İl İsimleri</span>
              <input
                type="checkbox"
                checked={settings.showCityNames}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    difficulty: "custom",
                    showCityNames: e.target.checked,
                  }))
                }
                className="w-4 h-4 rounded text-cyan-600 bg-slate-900 border-slate-700 focus:ring-0"
              />
            </label>

            {/* Göl ve Akarsu İsimleri */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 border border-slate-800 cursor-pointer hover:bg-slate-800 text-xs">
              <span className="text-slate-200">Göl & Akarsu İsimleri</span>
              <input
                type="checkbox"
                checked={settings.showWaterLabels}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    difficulty: "custom",
                    showWaterLabels: e.target.checked,
                  }))
                }
                className="w-4 h-4 rounded text-cyan-600 bg-slate-900 border-slate-700 focus:ring-0"
              />
            </label>
          </div>

          {/* Stil Teması */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1.5">
              Harita Teması
            </span>
            <div className="flex gap-1">
              {(Object.keys(VECTOR_STYLES) as Array<keyof typeof VECTOR_STYLES>).map((key) => (
                <button
                  key={key}
                  onClick={() => handleStyleChange(key)}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    settings.stylePreset === key
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "text-slate-400 bg-slate-800/60 hover:text-white"
                  }`}
                >
                  {key === "positron" ? "Sade" : key === "liberty" ? "Fiziki" : "Canlı"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Körleme Modunda Bilgilendirme Rozeti */}
      {mode === "blind" && allowGuess && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 text-cyan-300 text-xs font-medium shadow-xl">
            <MapPin size={14} className="text-cyan-400 animate-bounce" />
            <span>Türkiye haritasında tahmin ettiğin yere doğrudan tıkla!</span>
          </div>
        </div>
      )}
    </div>
  );
}
