"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import { GeoItem, QuizMode } from "@/types/geography";
import { calculateDistanceKm, evaluateGuess, soundEffects } from "@/lib/geoUtils";
import { Layers, MapPin, Volume2, VolumeX } from "lucide-react";

interface GeoMapProps {
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

// Tamamen Ücretsiz, API Key Gerektirmeyen Güvenilir Harita Katmanları
const MAP_LAYERS = {
  esriLightNoLabels: {
    name: "Sade Açık (Yazısız - İpuçsuz)",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    subdomains: "abcd",
    attribution: "ESRI Canvas (No-Labels)",
  },
  esriDarkNoLabels: {
    name: "Sade Koyu (Yazısız - Dark Mode)",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    subdomains: "abcd",
    attribution: "ESRI Dark Canvas (No-Labels)",
  },
  physicalRelief: {
    name: "Fiziki Doğa / Kabartı (Yazısız)",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}",
    subdomains: "abcd",
    attribution: "ESRI World Physical Map",
  },
  osmStandard: {
    name: "Klasik Harita (Yazılı - Şehirler)",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    subdomains: "abc",
    attribution: "&copy; OpenStreetMap contributors",
  },
};

export default function GeoMap({
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
}: GeoMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tempDrawingsLayerRef = useRef<L.LayerGroup | null>(null);

  const [activeLayerKey, setActiveLayerKey] = useState<keyof typeof MAP_LAYERS>(
    "esriLightNoLabels"
  );
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  // Harita Başlatma
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Haritayı Türkiye merkezli başlat
    const map = L.map(mapContainerRef.current, {
      center: [39.0, 35.2],
      zoom: 6,
      minZoom: 5,
      maxZoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    const layerConfig = MAP_LAYERS[activeLayerKey] || MAP_LAYERS.esriLightNoLabels;
    const tileLayer = L.tileLayer(layerConfig.url, {
      subdomains: layerConfig.subdomains,
      attribution: layerConfig.attribution,
      maxZoom: 18,
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Katman Grupları
    markersLayerRef.current = L.layerGroup().addTo(map);
    tempDrawingsLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Leaflet boyutunu oturtmak için invalidateSize
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 300);
    const t3 = setTimeout(() => map.invalidateSize(), 600);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener("resize", handleResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Katman Değişimi
  const handleLayerChange = (layerKey: keyof typeof MAP_LAYERS) => {
    setActiveLayerKey(layerKey);
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const config = MAP_LAYERS[layerKey];
    const newLayer = L.tileLayer(config.url, {
      subdomains: config.subdomains,
      attribution: config.attribution,
      maxZoom: 18,
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newLayer;
    setShowLayerMenu(false);
  };

  // Harita Tıklama (Körleme Modu: Tıklandığı Anda Orijinal Yeri Aç ve Çizgi Çek)
  const handleMapClick = useCallback(
    (e: L.LeafletMouseEvent) => {
      if (mode !== "blind" || !allowGuess || !currentItem) return;

      const map = mapInstanceRef.current;
      const clickedLat = e.latlng.lat;
      const clickedLng = e.latlng.lng;
      const targetLat = currentItem.coordinates.lat;
      const targetLng = currentItem.coordinates.lng;

      const distanceKm = calculateDistanceKm(
        clickedLat,
        clickedLng,
        targetLat,
        targetLng
      );

      // Körleme modunda puanlama mesafeye göre yapılır
      const evaluation = evaluateGuess(
        distanceKm,
        currentItem.toleranceKm,
        1
      );

      // Ses efekti
      if (soundEnabled) {
        if (evaluation.score >= 800) {
          soundEffects.playSuccess();
        } else if (evaluation.score >= 300) {
          soundEffects.playClose();
        } else {
          soundEffects.playMiss();
        }
      }

      // Çizim Katmanını Temizle ve Görselleştirmeyi Oluştur
      if (tempDrawingsLayerRef.current) {
        tempDrawingsLayerRef.current.clearLayers();

        // 1. Kullanıcının Tıkladığı Nokta İkonu (Mavi Klasik İğne / Pin + Nişangah)
        const userClickIcon = L.divIcon({
          className: "custom-click-icon",
          html: `
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
          `,
          iconSize: [120, 65],
          iconAnchor: [60, 65],
        });

        L.marker([clickedLat, clickedLng], { icon: userClickIcon }).addTo(
          tempDrawingsLayerRef.current
        );

        // 2. Orijinal Hedef Noktası (Zümrüt Yeşili Hedef Tahtası & Radar Rozeti)
        const targetColor = evaluation.score >= 600 ? "#10b981" : evaluation.score >= 300 ? "#f59e0b" : "#ef4444";
        const targetIcon = L.divIcon({
          className: "custom-target-icon",
          html: `
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
          `,
          iconSize: [220, 70],
          iconAnchor: [110, 70],
        });

        L.marker([targetLat, targetLng], { icon: targetIcon }).addTo(
          tempDrawingsLayerRef.current
        );

        // 3. Kullanıcı Noktası ile Orijinal Yer Arasında Çekilen Çizgi
        L.polyline(
          [
            [clickedLat, clickedLng],
            [targetLat, targetLng],
          ],
          {
            color: targetColor,
            weight: 3.5,
            dashArray: "8, 8",
            opacity: 0.95,
          }
        ).addTo(tempDrawingsLayerRef.current);

        // 4. Çizginin Ortasındaki Sapma Rozeti
        const midLat = (clickedLat + targetLat) / 2;
        const midLng = (clickedLng + targetLng) / 2;
        
        const distanceBadgeIcon = L.divIcon({
          className: "distance-badge-icon",
          html: `
            <div style="display:inline-flex; align-items:center; gap:5px; padding:3px 10px; font-size:11px; font-weight:700; color:#0f172a; background:rgba(255,255,255,0.96); backdrop-filter:blur(6px); border-radius:9999px; border:1.5px solid #cbd5e1; box-shadow:0 4px 10px rgba(0,0,0,0.22); white-space:nowrap; text-align:center;">
              <span style="color:#64748b; font-size:10px; text-transform:uppercase; letter-spacing:0.5px;">Sapma:</span>
              <strong style="color:${targetColor}; font-size:12px; font-weight:800;">${distanceKm} km</strong>
            </div>
          `,
          iconSize: [130, 30],
          iconAnchor: [65, 15],
        });

        L.marker([midLat, midLng], { icon: distanceBadgeIcon }).addTo(
          tempDrawingsLayerRef.current
        );

        // Kullanıcının her iki noktayı ve çizgiyi rahatça görebilmesi için kamera açısını ayarla
        if (map && distanceKm > 20) {
          const bounds = L.latLngBounds([
            [clickedLat, clickedLng],
            [targetLat, targetLng],
          ]);
          map.fitBounds(bounds, { padding: [100, 100], maxZoom: 8, animate: true });
        }
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

  // Harita Event Dinleyicisi
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [handleMapClick]);

  // Mod veya Nesneler Değiştiğinde Markerları Güncelle
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;

    markersLayerRef.current.clearLayers();
    if (tempDrawingsLayerRef.current && allowGuess) {
      tempDrawingsLayerRef.current.clearLayers();
    }

    if (mode === "study") {
      // Keşif / Çalışma Modu: Tüm öğelerin pinlerini göster
      items.forEach((item) => {
        const isCurrent = currentItem?.id === item.id;
        const markerIcon = L.divIcon({
          className: "study-marker",
          html: `
            <div style="position:relative; display:flex; flex-direction:column; align-items:center; cursor:pointer;" class="group">
              <span style="padding:2px 8px; font-size:11px; font-weight:700; border-radius:6px; color:white; white-space:nowrap; box-shadow:0 2px 4px rgba(0,0,0,0.4); background:${
                isCurrent ? "#f59e0b" : "rgba(15,23,42,0.9)"
              };">
                ${item.name}
              </span>
              <div style="width:14px; height:14px; border-radius:9999px; background:${
                isCurrent ? "#f59e0b" : "#3b82f6"
              }; border:2px solid white; box-shadow:0 2px 4px rgba(0,0,0,0.3); margin-top:-2px;"></div>
            </div>
          `,
          iconSize: [120, 36],
          iconAnchor: [60, 28],
        });

        const marker = L.marker([item.coordinates.lat, item.coordinates.lng], {
          icon: markerIcon,
        });

        marker.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectItem?.(item);
        });

        marker.addTo(markersLayerRef.current!);
      });
    } else if (mode === "pinpoint") {
      // Pinpoint Modu: Çoklu Hak ve Yanlış Noktaları Kırmızıya Çevirme Desteği
      items.forEach((item) => {
        const isWrong = wrongItemIds.includes(item.id);
        const isAnswered = !allowGuess;
        const isTarget = currentItem?.id === item.id;

        let markerHtml = "";

        if (isWrong) {
          // Önceden tıklanmış ve yanlış olan marker
          markerHtml = `
            <div style="position:relative; display:flex; align-items:center; justify-content:center; opacity:0.65; cursor:not-allowed;">
              <div style="width:18px; height:18px; border-radius:9999px; background:#ef4444; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; color:white; font-size:10px; font-weight:bold;">
                ✕
              </div>
            </div>
          `;
        } else if (isAnswered && isTarget) {
          // Soru bittiğinde doğru olan hedefi parıldayan yeşille göster
          markerHtml = `
            <div style="position:relative; display:flex; flex-direction:column; align-items:center; cursor:default;">
              <span style="position:absolute; width:36px; height:36px; border-radius:9999px; background:rgba(16,185,129,0.4);" class="animate-ping"></span>
              <span style="padding:2px 8px; font-size:11px; font-weight:bold; border-radius:6px; color:white; background:#10b981; box-shadow:0 2px 6px rgba(0,0,0,0.4); white-space:nowrap;">
                ${item.name}
              </span>
              <div style="width:16px; height:16px; border-radius:9999px; background:#10b981; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.4); margin-top:2px;"></div>
            </div>
          `;
        } else {
          // Normal aktif tıklanabilir soru noktası
          markerHtml = `
            <div style="position:relative; display:flex; align-items:center; justify-content:center; cursor:pointer;" class="group">
              <span style="position:absolute; width:28px; height:28px; border-radius:9999px; background:rgba(6,182,212,0.25);"></span>
              <div style="width:18px; height:18px; border-radius:9999px; background:#0284c7; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; color:white; font-size:10px; font-weight:bold;">
                •
              </div>
            </div>
          `;
        }

        const markerIcon = L.divIcon({
          className: "pinpoint-marker",
          html: markerHtml,
          iconSize: isAnswered && isTarget ? [120, 44] : [28, 28],
          iconAnchor: isAnswered && isTarget ? [60, 36] : [14, 14],
        });

        const marker = L.marker([item.coordinates.lat, item.coordinates.lng], {
          icon: markerIcon,
        });

        marker.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          if (!allowGuess || !currentItem) return;
          if (wrongItemIds.includes(item.id)) return;

          const isCorrect = item.id === currentItem.id;

          if (isCorrect) {
            // Doğru bildi!
            if (soundEnabled) soundEffects.playSuccess();
            const scoreMultiplier = currentAttempt === 1 ? 1.0 : currentAttempt === 2 ? 0.6 : 0.3;
            const finalScore = Math.round(1000 * scoreMultiplier);
            const label = currentAttempt === 1 ? "Doğru Nokta! (1. Hakta)" : `Doğru Nokta! (${currentAttempt}. Hakta)`;

            onGuessComplete?.({
              item: currentItem,
              distanceKm: 0,
              score: finalScore,
              isCorrect: true,
              accuracyLabel: label,
              attemptsUsed: currentAttempt,
            });
          } else {
            // Yanlış seçti!
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

        marker.addTo(markersLayerRef.current!);
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

  // Seçilen öğeye yumuşak kamera geçişi (Pan to)
  useEffect(() => {
    if (currentItem && mapInstanceRef.current && (mode === "study" || (!allowGuess && mode !== "blind"))) {
      mapInstanceRef.current.flyTo(
        [currentItem.coordinates.lat, currentItem.coordinates.lng],
        mode === "study" ? 8 : 7.5,
        { duration: 0.8 }
      );
    }
  }, [currentItem, mode, allowGuess]);

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950"
      style={{ height: "650px", minHeight: "650px" }}
    >
      {/* Harita Konteyneri */}
      <div
        ref={mapContainerRef}
        style={{ width: "100%", height: "100%", minHeight: "650px" }}
        className="z-0"
      />

      {/* Üst Sağ Harita Kontrolleri (Katman Seçici & Ses Aç/Kapa) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2.5 rounded-2xl backdrop-blur-xl border transition-all duration-200 shadow-lg ${
            soundEnabled
              ? "bg-slate-900/90 text-emerald-400 border-emerald-500/30 hover:bg-slate-800"
              : "bg-slate-900/90 text-slate-400 border-slate-700/50 hover:bg-slate-800"
          }`}
          title={soundEnabled ? "Ses Efektlerini Kapat" : "Ses Efektlerini Aç"}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 text-slate-200 text-xs font-medium shadow-lg hover:bg-slate-800 transition-all"
          >
            <Layers size={16} className="text-cyan-400" />
            <span className="hidden sm:inline">Katman:</span>
            <span className="text-cyan-300 font-semibold truncate max-w-[130px]">
              {MAP_LAYERS[activeLayerKey]?.name || "Harita Katmanı"}
            </span>
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 p-2 shadow-2xl z-30 flex flex-col gap-1">
              <span className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Harita Katmanı Seç
              </span>
              {(
                Object.keys(MAP_LAYERS) as Array<keyof typeof MAP_LAYERS>
              ).map((key) => (
                <button
                  key={key}
                  onClick={() => handleLayerChange(key)}
                  className={`text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeLayerKey === key
                      ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {MAP_LAYERS[key].name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
