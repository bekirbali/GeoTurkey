export type GeoCategoryType = 
  | "lakes" 
  | "mountains" 
  | "rivers" 
  | "dams" 
  | "mines" 
  | "agriculture" 
  | "plains_plateaus" 
  | "gulfs_straits" 
  | "national_parks";

export type QuizMode = "study" | "pinpoint" | "blind" | "reverse";

export type DifficultyLevel = "easy" | "medium" | "hard" | "custom";

export interface MapLayerSettings {
  difficulty: DifficultyLevel;
  showProvinces: boolean;     // İl sınırları
  showCityNames: boolean;     // Şehir ve il isimleri
  showWaterLabels: boolean;   // Göl ve akarsu isimleri (testte varsayılan kapalı)
  stylePreset: "positron" | "liberty" | "bright";
}

export interface GeoItem {
  id: string;
  name: string;
  category: GeoCategoryType;
  subCategoryId: string;
  subCategoryTitle: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  toleranceKm: number; // Tıklama toleransı (büyük göller için geniş, küçük dağ zirveleri için dar)
  province: string[];
  region: "Ege" | "Akdeniz" | "İç Anadolu" | "Karadeniz" | "Marmara" | "Doğu Anadolu" | "Güneydoğu Anadolu";
  description: string;
  examTips: string; // KPSS / YKS hap notu
  details?: {
    elevation?: string;
    depth?: string;
    area?: string;
    waterType?: string; // Tatlı, Acı, Sodalı, Tuzlu
    formation?: string; // Oluşum detayı / Rezerv / Havza
    usage?: string;     // Sanayi / Kullanım alanı
    ranking?: string;   // Türkiye veya Dünya sırası / Payı
  };
}

export interface SubCategory {
  id: string;
  title: string;
  categoryId: GeoCategoryType;
  description: string;
  badgeColor: string;
}

export interface CategoryInfo {
  id: GeoCategoryType;
  title: string;
  tabLabel?: string;
  shortDesc: string;
  iconName: string;
  gradient: string;
  subCategories: SubCategory[];
}

export interface GuessResult {
  questionItem: GeoItem;
  clickedCoords?: { lat: number; lng: number };
  distanceKm?: number;
  isCorrect: boolean;
  score: number;
  accuracyLabel: string;
  attemptsUsed?: number;
}
