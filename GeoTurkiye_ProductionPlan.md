# GeoTürkiye — B2C Ürün Haline Getirme Uygulama Planı

> Şu an tamamlanmış olanlar: Harita motoru, 9 kategori/2230+ soru, tüm quiz modları (Keşfet, İşaretçi, Körleme, Ters), KPSS hap notları, puan sistemi, favori kaydetme (localStorage), mobil-responsive layout.

---

## FAZ 1 — PWA (Ana Ekrana Ekle) Altyapısı
*Öncelik: Yüksek | Karmaşıklık: Düşük–Orta*

### 1.1 — İkon Paketi Oluşturma
- [ ] `public/icons/` altına logo'dan `192x192` ve `512x512` PNG ikonları üret (maskable dahil)
- [ ] iOS için `180x180` `apple-touch-icon.png` ekle

### 1.2 — manifest.json Güncelleme
- [ ] `icons` dizisine PNG ikonları ekle (`purpose: "any maskable"`)
- [ ] `orientation: "portrait"`, `scope: "/"`, `display: "standalone"` doğrula
- [ ] `shortcuts` ekle (örn. "İşaretçi Modu" kısayolu)

### 1.3 — Service Worker (sw.js) Kurulumu
- [ ] `next-pwa` paketi kurulumu
- [ ] `next.config.ts` içinde `next-pwa` konfigürasyonu
- [ ] Önbelleğe alınacak varlıklar: Tüm statik dosyalar, harita tile'ları
- [ ] Çevrimdışı fallback sayfası (`/offline`)

### 1.4 — "Uygulamayı Yükle" UI Butonu
- [ ] `beforeinstallprompt` event'ini dinleyen `useInstallPrompt.ts` hook'u
- [ ] `QuizHeader` içine kompakt install butonu (sadece destekleyen cihazlarda görünür)
- [ ] iOS için "Safari > Paylaş > Ana Ekrana Ekle" rehber tooltip'i

---

## FAZ 2 — Kullanıcı Kimlik Doğrulama (Auth) Sistemi
*Öncelik: Yüksek — ödeme için ön koşul | Karmaşıklık: Orta*

> **Önerilen:** Clerk (Next.js native, tek satır kurulum) veya NextAuth + Supabase

### 2.1 — Kurulum
- [ ] Clerk veya NextAuth kurulumu
- [ ] Google ile Giriş + E-posta/Şifre
- [ ] `middleware.ts` ile korumalı PRO route'ları tanımla

### 2.2 — Kullanıcı Profil Sayfası (`/profil`)
- [ ] Kullanıcı adı ve avatar gösterimi
- [ ] Toplam çözülen soru, doğruluk oranı, kazanılan puan özeti
- [ ] PRO üyelik durumu ve bitiş tarihi

### 2.3 — localStorage → Supabase'e Taşıma
- [ ] Favoriler artık sunucu taraflı kaydedilecek
- [ ] Kullanıcı her cihazdan favorilerine erişebilecek

---

## FAZ 3 — İlerleme & İstatistik Sistemi (Supabase)
*Öncelik: Orta–Yüksek | Karmaşıklık: Orta*

### 3.1 — Veritabanı Şeması

```
users            → id, email, created_at, is_pro, pro_expires_at
quiz_sessions    → id, user_id, category, mode, score, accuracy, date
question_results → id, session_id, item_id, is_correct, attempts_used, distance_km
favorites        → id, user_id, item_id
```

### 3.2 — Kişisel İstatistik Sayfası
- [ ] Kategoriye göre doğruluk oranı (çubuk grafik)
- [ ] Günlük/Haftalık puan trendi (çizgi grafik)
- [ ] "En Çok Yanlış Yaptığım Sorular" tablosu
- [ ] KPSS Hazırlık Skoru (0–100 genel hazırlık endeksi)

### 3.3 — Streak Sistemi
- [ ] Günlük giriş serisi (🔥 streak sayacı)
- [ ] "Bugünün Hedefi: 10 Soru Çöz" hatırlatıcısı

---

## FAZ 4 — PRO Paywall & Ödeme Entegrasyonu
*Öncelik: Yüksek — gelir üretimi | Karmaşıklık: Orta*

### 4.1 — Freemium İçerik Stratejisi

| Özellik | Ücretsiz | PRO |
|---|---|---|
| Göller & Dağlar kategorisi | ✅ | ✅ |
| Diğer 7 kategori (Madenler, Barajlar, Ovalar…) | ❌ | ✅ |
| Körleme & Ters Modu | Sınırlı (5 soru) | ✅ Sınırsız |
| KPSS hap notları | ❌ | ✅ |
| Favoriler & İstatistikler | Sadece oturum | ✅ Kalıcı |
| Çevrimdışı erişim (PWA) | ❌ | ✅ |

### 4.2 — Ödeme Entegrasyonu
- [ ] Shopier API entegrasyonu (Türkiye'de en pratik, komisyonsuz başlangıç)
- [ ] Ödeme sonrası webhook → kullanıcı `is_pro = true`
- [ ] Fiyatlandırma: ~149–199 TL / sınav sezonu (Ekim–Haziran)

### 4.3 — PRO UI Elemanları
- [ ] Kilitli kategorilerde 🔒 PRO overlay gösterimi
- [ ] `QuizHeader`'a "PRO Ol" CTA butonu
- [ ] Ödeme sonrası konfetti + hoşgeldin modal'ı

---

## FAZ 5 — Landing Page & SEO
*Öncelik: Orta | Karmaşıklık: Düşük*

> Şu an `/` doğrudan haritaya gidiyor. Yeni ziyaretçi ne gördüğünü anlamadan ayrılıyor.

### 5.1 — Landing Page
- [ ] Hero: "KPSS Coğrafyasında 18 Sorunun Hepsini Doğru Çöz"
- [ ] Ekran görüntüleri / kısa GIF demo
- [ ] Kullanıcı yorumları (sosyal kanıt)
- [ ] "Ücretsiz Başla" CTA butonu

### 5.2 — SEO
- [ ] Kategori bazlı sayfalar (örn. `/golleri-ogren`, `/daglar-testi`) — long-tail SEO
- [ ] JSON-LD yapılandırılmış veri
- [ ] Google Search Console & Analytics kurulumu
- [ ] Sayfa hızı optimizasyonu (LCP, CLS)

---

## FAZ 6 — Küçük UX & Paylaşım Eklemeleri
*Öncelik: Düşük–Orta | Karmaşıklık: Düşük*

### 6.1 — Onboarding
- [ ] İlk girişte 3–4 adımlı "Nasıl Kullanılır?" modal turu
- [ ] Her mod için `?` ikonuyla anlık yardım tooltip'i

### 6.2 — Sonuç Paylaşımı
- [ ] Quiz bitiminde "Sonucumu Paylaş" butonu
- [ ] Twitter/X ve WhatsApp için hazır metin + görsel kart
- [ ] Örn: _"GeoTürkiye'de Göller testinde 850 puan aldım! 🏆 Sen kaç alırsın?"_

### 6.3 — Skor Tablosu (Leaderboard)
- [ ] Haftalık puan sıralaması
- [ ] Arkadaşlarla karşılaştırma paylaşım linki

---

## FAZ 7 — Altyapı & Deployment
*Öncelik: Yüksek — canlıya almak için | Karmaşıklık: Düşük*

### 7.1 — Domain & Hosting
- [ ] Alan adı: `geoturkiye.com` veya `geoturkiye.net`
- [ ] Vercel deploy (`vercel --prod`)
- [ ] Environment variables (Supabase, Shopier, Clerk key'leri)

### 7.2 — E-posta (Opsiyonel)
- [ ] Ödeme sonrası hoşgeldin e-postası (Resend / Brevo ücretsiz tier)
- [ ] KPSS tarihi yaklaşırken hatırlatma kampanyası

---

## Öncelik Özeti

| Faz | Başlık | Öncelik | Tahmini Süre |
|-----|--------|---------|--------------|
| 1 | PWA Altyapısı | 🔴 Yüksek | 2–3 saat |
| 2 | Auth (Giriş Sistemi) | 🔴 Yüksek | 4–6 saat |
| 3 | İstatistik / Supabase | 🟡 Orta | 6–8 saat |
| 4 | PRO Paywall + Ödeme | 🔴 Yüksek | 4–6 saat |
| 5 | Landing Page + SEO | 🟡 Orta | 3–4 saat |
| 6 | UX Eklemeleri | 🟢 Düşük | 3–5 saat |
| 7 | Domain + Deployment | 🔴 Yüksek | 1–2 saat |

**Toplam Tahmini Süre:** ~25–35 saat

> [!IMPORTANT]
> **MVP için zorunlu fazlar: 1 + 2 + 4 + 7** (~12–17 saat)
> Bu 4 faz tamamlandığında site gerçek kullanıcı kabul edip ödeme alabilir hale gelir.
