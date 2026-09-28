"use client";

import React from "react";
import { GeoItem } from "@/types/geography";
import { X, Award, MapPin, Compass, Info, Sparkles, Star } from "lucide-react";

interface StudyDrawerProps {
  item: GeoItem | null;
  onClose: () => void;
  onStartQuizOnItem?: (item: GeoItem) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (item: GeoItem) => void;
}

export default function StudyDrawer({
  item,
  onClose,
  onStartQuizOnItem,
  isFavorite = false,
  onToggleFavorite,
}: StudyDrawerProps) {
  if (!item) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-slate-900/95 backdrop-blur-2xl border-l border-slate-700/80 shadow-2xl z-40 p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
      <div>
        {/* Üst Kapatma & Kategori Başlığı & Favori */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            {item.subCategoryTitle}
          </span>
          <div className="flex items-center gap-1.5">
            {onToggleFavorite && (
              <button
                onClick={() => onToggleFavorite(item)}
                title={isFavorite ? "Yıldızlılardan Çıkar" : "Yıldızla / Zorlandıklarıma Ekle"}
                className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
              >
                <Star
                  size={18}
                  className={isFavorite ? "fill-amber-400 text-amber-400" : ""}
                />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Başlık ve Temel Lokasyon */}
        <div className="mb-5">
          <h2 className="text-2xl font-black text-white tracking-tight">
            {item.name}
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-300 mt-1.5 font-medium">
            <span className="flex items-center gap-1 text-cyan-400">
              <MapPin size={13} /> {item.region} Bölgesi
            </span>
            <span>&bull;</span>
            <span className="text-slate-400">
              {item.province.join(", ")}
            </span>
          </div>
        </div>

        {/* KPSS / YKS Altın Hap Notu */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/30 text-amber-200 mb-5 shadow-lg">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-400 mb-2">
            <Award size={18} />
            <span>Sınavda Çıkabilecek Altın Not</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-200">
            {item.examTips}
          </p>
        </div>

        {/* Genel Açıklama */}
        <div className="mb-5">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Info size={14} className="text-blue-400" />
            Genel Coğrafi Özellikler
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed font-normal bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800">
            {item.description}
          </p>
        </div>

        {/* Teknik Coğrafi Detaylar Tablosu */}
        {item.details && (
          <div className="space-y-2 mb-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Compass size={14} className="text-teal-400" />
              Teknik Veriler
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {item.details.waterType && (
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px]">Su Rejimi / Kimyası</span>
                  <strong className="text-slate-200">{item.details.waterType}</strong>
                </div>
              )}
              {item.details.area && (
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px]">Yüzölçümü</span>
                  <strong className="text-slate-200">{item.details.area}</strong>
                </div>
              )}
              {item.details.depth && (
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px]">Derinlik</span>
                  <strong className="text-slate-200">{item.details.depth}</strong>
                </div>
              )}
              {item.details.elevation && (
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px]">Rakım / Uzunluk</span>
                  <strong className="text-slate-200">{item.details.elevation}</strong>
                </div>
              )}
              {item.details.formation && (
                <div className="col-span-2 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px]">Oluşum Şekli / Rezerv</span>
                  <strong className="text-slate-200">{item.details.formation}</strong>
                </div>
              )}
              {item.details.usage && (
                <div className="col-span-2 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px]">Kullanım / Sanayi Alanı</span>
                  <strong className="text-cyan-300">{item.details.usage}</strong>
                </div>
              )}
              {item.details.ranking && (
                <div className="col-span-2 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px]">Türkiye / Dünya Sıralaması</span>
                  <strong className="text-amber-300">{item.details.ranking}</strong>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Alt Aksiyon Butonu */}
      <div className="pt-4 border-t border-slate-800">
        <button
          onClick={() => {
            onStartQuizOnItem?.(item);
            onClose();
          }}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
        >
          <Sparkles size={16} />
          <span>Bu Öğeyi Testte Dene</span>
        </button>
      </div>
    </div>
  );
}
