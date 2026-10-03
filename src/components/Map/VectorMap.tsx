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
  isSettingsOpen?: boolean;
  onToggleSettings?: (open: boolean) => void;
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
  isSettingsOpen,
  onToggleSettings,
}: VectorMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const activeMarkersRef = useRef<maplibregl.Marker[]>([]);
  const blindMarkersRef = useRef<maplibregl.Marker[]>([]);
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

  const [internalShowSettings, setInternalShowSettings] = useState<boolean>(false);
  const showSettingsModal = isSettingsOpen !== undefined ? isSettingsOpen : internalShowSettings;
  const setShowSettingsModal = (open: boolean) => {
    if (onToggleSettings) onToggleSettings(open);
    else setInternalShowSettings(open);
  };

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
      blindMarkersRef.current.forEach((m) => m.remove());
      blindMarkersRef.current = [];
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

      // 1. Önceki körleme markerlarını temizle
      blindMarkersRef.current.forEach((m) => m.remove());
      blindMarkersRef.current = [];

      if (linePopupRef.current) {
        linePopupRef.current.remove();
        linePopupRef.current = null;
      }

      // 2. Kullanıcı Tıklama Noktası Markeri (Mavi Klasik İğne / Pin + Nişangah)
      const userEl = document.createElement("div");
      userEl.innerHTML = `
        <div style="position:relative; display:flex; flex-direction:column; align-items:center; cursor:default; user-select:none; z-index:20;">
          <div style="display:inline-flex; align-items:center; gap:4px; padding:2.5px 8px; font-size:11px; font-weight:700; border-radius:9999px; color:#ffffff; background:linear-gradient(135deg, #1d4ed8, #2563eb); border:1.5px solid #93c5fd; box-shadow:0 3px 8px rgba(37,99,235,0.45); white-space:nowrap; margin-bottom:3px; text-shadow:0 1px 2px rgba(0,0,0,0.3);">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="22" y1="12" x2="18" y2="12"/>
              <line x1="6" y1="12" x2="2" y2="12"/>
              <line x1="12" y1="6" x2="12" y2="2"/>
              <line x1="12" y1="22" x2="12" y2="18"/>
            </svg>
            <span>Senin Tahminin</span>
          </div>
          <div style="position:relative; width:30px; height:38px; display:flex; align-items:center; justify-content:center;">
            <span style="position:absolute; bottom:-4px; left:50%; transform:translateX(-50%); width:20px; height:20px; border-radius:9999px; background:rgba(37,99,235,0.45);" class="animate-ping"></span>
            <svg width="30" height="38" viewBox="0 0 30 38" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.45));">
              <path d="M15 1C7.268 1 1 7.268 1 15C1 25.5 15 37 15 37C15 37 29 25.5 29 15C29 7.268 22.732 1 15 1Z" fill="#2563eb" stroke="#ffffff" stroke-width="2"/>
              <circle cx="15" cy="15" r="5.5" fill="#ffffff"/>
              <circle cx="15" cy="15" r="3" fill="#1d4ed8"/>
              <line x1="15" y1="5.5" x2="15" y2="8" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="15" y1="22" x2="15" y2="24.5" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="5.5" y1="15" x2="8" y2="15" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="22" y1="15" x2="24.5" y2="15" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
        </div>
      `;
      const userMarker = new maplibregl.Marker({ element: userEl, anchor: "bottom" })
        .setLngLat([clickedLng, clickedLat])
        .addTo(map);
      blindMarkersRef.current.push(userMarker);

      // 3. Gerçek Orijinal Hedef Noktası Markeri (Zümrüt Yeşili Hedef Tahtası & Radar Rozeti)
      const targetColor =
        evaluation.score >= 600 ? "#10b981" : evaluation.score >= 300 ? "#f59e0b" : "#ef4444";

      const targetEl = document.createElement("div");
      targetEl.innerHTML = `
        <div style="position:relative; display:flex; flex-direction:column; align-items:center; cursor:default; user-select:none; z-index:30;">
          <div style="display:inline-flex; align-items:center; gap:5px; padding:3px 10px; font-size:11px; font-weight:800; border-radius:9999px; color:#ffffff; background:linear-gradient(135deg, #059669, #10b981); border:1.5px solid #6ee7b7; box-shadow:0 3px 10px rgba(5,150,105,0.45); white-space:nowrap; margin-bottom:3px; text-shadow:0 1px 2px rgba(0,0,0,0.3);">
            <span style="font-size:13px; line-height:1;">🎯</span>
            <span>Doğru Konum: <strong>${currentItem.name}</strong></span>
          </div>
          <div style="position:relative; width:36px; height:42px; display:flex; align-items:center; justify-content:center;">
            <span style="position:absolute; top:1px; left:50%; transform:translateX(-50%); width:32px; height:32px; border-radius:9999px; background:rgba(16,185,129,0.5);" class="animate-ping"></span>
            <svg width="36" height="42" viewBox="0 0 36 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));">
              <path d="M18 26V40" stroke="#047857" stroke-width="3" stroke-linecap="round"/>
              <circle cx="18" cy="40.5" r="1.5" fill="#065f46"/>
              <circle cx="18" cy="17" r="15.5" fill="#10b981" stroke="#ffffff" stroke-width="2.5"/>
              <circle cx="18" cy="17" r="10.5" fill="#ffffff"/>
              <circle cx="18" cy="17" r="7" fill="#059669"/>
              <circle cx="18" cy="17" r="3.8" fill="#fbbf24" stroke="#ffffff" stroke-width="1"/>
            </svg>
          </div>
        </div>
      `;
      const targetMarker = new maplibregl.Marker({ element: targetEl, anchor: "bottom" })
        .setLngLat([targetLng, targetLat])
        .addTo(map);
      blindMarkersRef.current.push(targetMarker);

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
        className: "guess-distance-popup",
        closeButton: false,
        closeOnClick: false,
        anchor: "bottom",
        offset: [0, -6],
      })
        .setLngLat([midLng, midLat])
        .setHTML(
          `<div style="display:inline-flex; align-items:center; gap:5px; padding:3px 10px; font-size:11px; font-weight:700; color:#0f172a; background:rgba(255,255,255,0.96); backdrop-filter:blur(6px); border-radius:9999px; border:1.5px solid #cbd5e1; box-shadow:0 4px 10px rgba(0,0,0,0.22); white-space:nowrap; text-align:center;">
             <span style="color:#64748b; font-size:10px; text-transform:uppercase; letter-spacing:0.5px;">Sapma:</span>
             <strong style="color:${targetColor}; font-size:12px; font-weight:800;">${distanceKm} km</strong>
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

  // Yeni Soruya Geçildiğinde Çizgileri ve Körleme Markerlarını Temizle
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
      blindMarkersRef.current.forEach((m) => m.remove());
      blindMarkersRef.current = [];
    }
  }, [allowGuess, mode]);

  // Mod veya Nesneler Değiştiğinde Markerları Güncelle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Önceki tüm aktif markerları (Keşfet, İşaretçi, Ters) DAİMA haritadan temizle
    activeMarkersRef.current.forEach((m) => m.remove());
    activeMarkersRef.current = [];

    // Körleme modundaysak harita tamamen temiz kalmalı (sadece tıklanınca 2 marker eklenir)
    if (mode === "blind") {
      if (allowGuess) {
        blindMarkersRef.current.forEach((m) => m.remove());
        blindMarkersRef.current = [];
      }
      return;
    }

    // Körleme modundan başka bir moda çıkıldıysa körleme markerlarını temizle
    blindMarkersRef.current.forEach((m) => m.remove());
    blindMarkersRef.current = [];

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
    } else if (mode === "reverse") {
      // Ters Mod: Haritada hedef nokta parıldayan soru işareti piniyle gösterilir
      if (currentItem) {
        const el = document.createElement("div");
        el.innerHTML = `
          <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
            <span style="position:absolute; width:48px; height:48px; border-radius:9999px; background:rgba(168,85,247,0.4);" class="animate-ping"></span>
            <div style="width:36px; height:36px; border-radius:9999px; background:linear-gradient(135deg, #9333ea, #4f46e5); border:3px solid white; box-shadow:0 0 20px rgba(147,51,234,0.7); display:flex; align-items:center; justify-content:center; color:white; font-size:18px; font-weight:900; z-index:10;">
              ?
            </div>
            <div style="width:4px; height:8px; background:white; border-radius:2px; margin-top:-2px; box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>
          </div>
        `;

        const marker = new maplibregl.Marker({
          element: el,
          anchor: "bottom",
        })
          .setLngLat([currentItem.coordinates.lng, currentItem.coordinates.lat])
          .addTo(map);

        activeMarkersRef.current.push(marker);

        // Hedefe yumuşakça odaklan
        map.flyTo({
          center: [currentItem.coordinates.lng, currentItem.coordinates.lat],
          zoom: Math.max(map.getZoom(), 6.8),
          duration: 900,
        });
      }
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

      {/* Harita Kontrolleri (Zorluk/Katman Ayarları) - Sadece Keşfet Modunda Gösterilir */}
      {mode === "study" && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
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
      )}

      {/* Zorluk & Vektör Katman Ayarları Modalı (Mobilde ekran ortasında, masaüstünde üst sağda) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm sm:absolute sm:inset-auto sm:top-16 sm:right-4 sm:p-0 sm:bg-transparent animate-in fade-in duration-150">
          {/* Mobilde dışarı tıklayınca kapatma overlay'i */}
          <div
            className="fixed inset-0 sm:hidden -z-10"
            onClick={() => setShowSettingsModal(false)}
          />
          <div className="w-full max-w-xs sm:w-72 rounded-3xl bg-slate-900/98 backdrop-blur-2xl border border-slate-700/90 p-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <SlidersHorizontal size={14} className="text-cyan-400" /> Harita & Oyun Ayarları
              </span>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xs text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Ses Efektleri Aç / Kapat */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 border border-slate-800 mb-3 text-xs">
              <div className="flex items-center gap-2 text-slate-200">
                {soundEnabled ? (
                  <Volume2 size={16} className="text-emerald-400" />
                ) : (
                  <VolumeX size={16} className="text-slate-400" />
                )}
                <span className="font-medium">Ses Efektleri</span>
              </div>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  soundEnabled
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/30"
                    : "bg-slate-700/80 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {soundEnabled ? "Açık" : "Kapalı"}
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
      </div>
      )}
    </div>
  );
}
