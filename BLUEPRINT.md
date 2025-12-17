# AmiUnique.io - Ultimate Browser Fingerprinting Platform

> **Mission**: Build the world's most comprehensive browser fingerprinting detection system with 80+ dimensions, surpassing amiunique.org, running on Cloudflare's edge infrastructure at minimal cost ($5/mo or FREE).

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technical Architecture](#2-technical-architecture)
3. [Three-Lock System Design](#3-three-lock-system-design)
4. [Complete 80+ Dimension Data Dictionary](#4-complete-80-dimension-data-dictionary)
5. [Database Schema (Cloudflare D1)](#5-database-schema-cloudflare-d1)
6. [API Design & Worker Logic](#6-api-design--worker-logic)
7. [Frontend Collection Scripts](#7-frontend-collection-scripts)
8. [Sitemap & Page Structure](#8-sitemap--page-structure)
9. [Deployment Guide](#9-deployment-guide)
10. [Cost Analysis](#10-cost-analysis)
11. [Implementation Phases](#11-implementation-phases)
12. [Competitive Analysis](#12-competitive-analysis)

---

## 1. Executive Summary

### What is AmiUnique.io?

AmiUnique.io is a **privacy-focused browser fingerprinting detection platform** that helps users understand how uniquely identifiable their browser is across the internet. Unlike competitors that check 50-55 dimensions, we analyze **80+ fingerprint dimensions** using a proprietary "Three-Lock" system.

### Core Value Proposition

```
"See exactly how websites track you - 80+ detection points,
zero cost infrastructure, world-class accuracy."
```

### Key Differentiators

| Feature | amiunique.org | browserleaks.com | AmiUnique.io |
|---------|---------------|------------------|--------------|
| Detection Dimensions | ~55 | ~40 | **80+** |
| Network Layer Fingerprint | No | Partial | **Full (CF Edge)** |
| TLS/JA3 Fingerprint | No | No | **Yes** |
| Real-time Uniqueness Score | Basic | No | **Advanced 3-Lock** |
| Cross-Browser Tracking Demo | No | No | **Yes (Gold Lock)** |
| Lie Detection | Basic | Basic | **Comprehensive** |
| Infrastructure Cost | Unknown | Unknown | **$0-5/mo** |
| Response Time | ~500ms | ~300ms | **<100ms (Edge)** |

### Tech Stack Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE EDGE                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Pages     │  │   Workers   │  │     D1      │         │
│  │  (Next.js)  │  │  (Hono.js)  │  │  (SQLite)   │         │
│  │  Frontend   │  │    API      │  │  Database   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          │                                  │
│              ┌───────────┴───────────┐                     │
│              │   request.cf object   │                     │
│              │   (Network Fingerprint)│                     │
│              └───────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Technical Architecture

### 2.1 System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                           USER BROWSER                                │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                    JavaScript Collectors                        │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │  │
│  │  │ Canvas  │ │ WebGL   │ │  Audio  │ │  Fonts  │ │  Media  │  │  │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘  │  │
│  │       │           │           │           │           │        │  │
│  │       └───────────┴───────────┴───────────┴───────────┘        │  │
│  │                              │                                  │  │
│  │                    ┌─────────▼─────────┐                       │  │
│  │                    │   JSON Payload    │                       │  │
│  │                    │   (80+ fields)    │                       │  │
│  │                    └─────────┬─────────┘                       │  │
│  └──────────────────────────────┼─────────────────────────────────┘  │
└─────────────────────────────────┼────────────────────────────────────┘
                                  │ HTTPS POST
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE EDGE (Global)                         │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                    Cloudflare Worker                            │  │
│  │  ┌─────────────────────────────────────────────────────────┐   │  │
│  │  │  1. Extract request.cf (Network Fingerprint)            │   │  │
│  │  │     - ASN, Colo, TLS Cipher, HTTP Protocol, RTT         │   │  │
│  │  ├─────────────────────────────────────────────────────────┤   │  │
│  │  │  2. Merge Client Data + Network Data                    │   │  │
│  │  ├─────────────────────────────────────────────────────────┤   │  │
│  │  │  3. Calculate Three-Lock Hashes                         │   │  │
│  │  │     🥇 Gold   = SHA256(Hardware Features)               │   │  │
│  │  │     🥈 Silver = SHA256(Software Features)               │   │  │
│  │  │     🥉 Bronze = SHA256(Gold + Silver + Network)         │   │  │
│  │  ├─────────────────────────────────────────────────────────┤   │  │
│  │  │  4. Query D1 for Uniqueness Statistics                  │   │  │
│  │  ├─────────────────────────────────────────────────────────┤   │  │
│  │  │  5. Store Visit + Return Analysis                       │   │  │
│  │  └─────────────────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                  │                                    │
│                                  ▼                                    │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                     Cloudflare D1 (SQLite)                      │  │
│  │  ┌─────────────────────────────────────────────────────────┐   │  │
│  │  │  visits table                                           │   │  │
│  │  │  - id (UUID)                                            │   │  │
│  │  │  - hardware_hash (Gold Lock Index)                      │   │  │
│  │  │  - software_hash (Silver Lock Index)                    │   │  │
│  │  │  - full_hash (Bronze Lock Index)                        │   │  │
│  │  │  - meta_* (Aggregation Fields)                          │   │  │
│  │  │  - raw_json (Complete 80+ Dimension Payload)            │   │  │
│  │  └─────────────────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow Sequence

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Browser │     │  Pages  │     │ Worker  │     │   D1    │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │  1. Visit /scan               │               │
     │──────────────>│               │               │
     │               │               │               │
     │  2. Load JS Collectors        │               │
     │<──────────────│               │               │
     │               │               │               │
     │  3. Execute 80+ Tests         │               │
     │  (Canvas, WebGL, Audio...)    │               │
     │───────┐       │               │               │
     │       │       │               │               │
     │<──────┘       │               │               │
     │               │               │               │
     │  4. POST /api/analyze (JSON)  │               │
     │───────────────────────────────>               │
     │               │               │               │
     │               │  5. Extract request.cf        │
     │               │  (TLS, ASN, Colo...)          │
     │               │               │───────┐       │
     │               │               │       │       │
     │               │               │<──────┘       │
     │               │               │               │
     │               │  6. Calculate 3 Hashes        │
     │               │               │───────┐       │
     │               │               │       │       │
     │               │               │<──────┘       │
     │               │               │               │
     │               │  7. INSERT + SELECT           │
     │               │               │──────────────>│
     │               │               │               │
     │               │               │  8. Results   │
     │               │               │<──────────────│
     │               │               │               │
     │  9. Return Analysis JSON      │               │
     │<───────────────────────────────               │
     │               │               │               │
     │  10. Render Results UI        │               │
     │───────┐       │               │               │
     │       │       │               │               │
     │<──────┘       │               │               │
```

### 2.3 Technology Stack Details

| Layer | Technology | Purpose | Why This Choice |
|-------|------------|---------|-----------------|
| **Frontend** | Next.js 14 (Static Export) | UI & Collection | SSG = Fast, SEO-friendly, deploys to Pages |
| **Styling** | Tailwind CSS + shadcn/ui | Modern UI | Rapid development, consistent design |
| **API** | Cloudflare Workers + Hono | Edge Computing | <50ms latency, access to request.cf |
| **Database** | Cloudflare D1 | Storage | SQLite at edge, 5GB free, $0.75/million reads |
| **Hashing** | Web Crypto API (SHA-256) | Fingerprint ID | Native, fast, consistent |
| **Analytics** | Cloudflare Analytics | Monitoring | Built-in, free |

---

## 3. Three-Lock System Design

### 3.1 Concept Overview

The "Three-Lock" system creates **layered identity fingerprints** with different stability characteristics:

```
┌─────────────────────────────────────────────────────────────────┐
│                    THREE-LOCK HIERARCHY                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🥇 GOLD LOCK (Hardware Fingerprint)                            │
│  ├── Stability: HIGHEST (survives browser reinstall)            │
│  ├── Purpose: Cross-browser device tracking                     │
│  └── Components: GPU, Audio Stack, Screen, CPU, Memory          │
│                                                                  │
│  🥈 SILVER LOCK (Software Fingerprint)                          │
│  ├── Stability: MEDIUM (changes with browser/OS updates)        │
│  ├── Purpose: Browser instance identification                   │
│  └── Components: Fonts, Plugins, UA, Timezone, Intl APIs        │
│                                                                  │
│  🥉 BRONZE LOCK (Full Session Fingerprint)                      │
│  ├── Stability: LOWEST (changes with network/location)          │
│  ├── Purpose: Complete session identification                   │
│  └── Components: Gold + Silver + Network (TLS, ASN, Colo)       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Hash Calculation Logic

```javascript
// GOLD LOCK - Hardware Features Only (Most Stable)
const goldString = [
  hw_canvas_hash,      // Canvas 2D rendering
  hw_webgl_hash,       // WebGL 3D rendering
  hw_webgl_vendor,     // GPU vendor (unmasked)
  hw_webgl_renderer,   // GPU model (unmasked)
  hw_audio_hash,       // Audio oscillator fingerprint
  hw_cpu_cores,        // Logical CPU cores
  hw_memory,           // Device memory (GB)
  hw_screen_resolution,// Physical screen size
  hw_color_depth,      // Color depth (24/30/32)
  hw_pixel_ratio,      // Device pixel ratio
  hw_touch_points,     // Max touch points
  hw_hdr_support,      // HDR capability
  hw_color_gamut,      // P3/sRGB gamut
  hw_math_precision,   // Float calculation precision
  hw_codec_support,    // Video codec capabilities
  hw_webgl_extensions  // WebGL extension list
].join('|');

const goldHash = await sha256(goldString);

// SILVER LOCK - Software Environment (Medium Stable)
const silverString = [
  sw_fonts_hash,       // Installed fonts
  sw_platform,         // OS platform string
  sw_user_agent,       // Full UA string
  sw_language,         // Primary language
  sw_languages,        // Language list (order matters)
  sw_timezone,         // Timezone name
  sw_timezone_offset,  // Timezone offset
  sw_intl_calendar,    // Default calendar format
  sw_intl_number,      // Number formatting style
  sw_plugins_hash,     // Browser plugins
  sw_mime_types,       // Supported MIME types
  sw_cookies_enabled,  // Cookie status
  sw_canvas_font_hash  // Font rendering metrics
].join('|');

const silverHash = await sha256(silverString);

// BRONZE LOCK - Full Session (Includes Network)
const bronzeString = [
  goldString,
  silverString,
  net_asn,            // ISP identifier
  net_colo,           // CF datacenter
  net_tls_cipher      // TLS cipher suite
].join('|');

const bronzeHash = await sha256(bronzeString);
```

### 3.3 Use Cases by Lock Type

| Scenario | Lock Used | Why |
|----------|-----------|-----|
| "Is this the same physical device?" | Gold | Hardware doesn't change across browsers |
| "Is this the same browser installation?" | Silver | Software config tied to browser instance |
| "Is this the exact same session?" | Bronze | Network factors indicate session context |
| "Did user change browsers but same device?" | Gold match, Silver mismatch | Cross-browser tracking detection |
| "Did user use VPN?" | Bronze mismatch, Gold/Silver match | Network changed but device same |

---

## 4. Complete 80+ Dimension Data Dictionary

### Legend

- 🔒 **LOCK**: Extremely stable, included in hash calculation
- 📊 **STAT**: Stable enough for statistics, may be in hash
- 👁️ **AUX**: Volatile/auxiliary, stored but NOT in hash (prevents fingerprint instability)

---

### 4.1 Hardware & Rendering (20 Dimensions)

| ID | JSON Key | Type | Lock | Source | Description |
|----|----------|------|------|--------|-------------|
| 01 | `hw_canvas_hash` | String | 🥇 | `canvas.toDataURL()` | 2D Canvas rendering fingerprint |
| 02 | `hw_webgl_hash` | String | 🥇 | WebGL draw operations | 3D WebGL rendering fingerprint |
| 03 | `hw_webgl_vendor` | String | 🥇 | `WEBGL_debug_renderer_info` | GPU vendor (unmasked) |
| 04 | `hw_webgl_renderer` | String | 🥇 | `WEBGL_debug_renderer_info` | GPU model (unmasked) |
| 05 | `hw_audio_hash` | String | 🥇 | `OfflineAudioContext` | Audio oscillator waveform hash |
| 06 | `hw_cpu_cores` | Number | 🥇 | `navigator.hardwareConcurrency` | Logical CPU core count |
| 07 | `hw_memory` | Number | 🥇 | `navigator.deviceMemory` | Device memory in GB |
| 08 | `hw_screen_width` | Number | 🥇 | `screen.width` | Physical screen width |
| 09 | `hw_screen_height` | Number | 🥇 | `screen.height` | Physical screen height |
| 10 | `hw_color_depth` | Number | 🥇 | `screen.colorDepth` | Color depth (24/30/32 bits) |
| 11 | `hw_pixel_ratio` | Number | 🥇 | `window.devicePixelRatio` | Retina/HiDPI pixel ratio |
| 12 | `hw_hdr_support` | Boolean | 🥇 | `matchMedia('(dynamic-range: high)')` | HDR display capability |
| 13 | `hw_color_gamut` | String | 🥇 | `matchMedia('(color-gamut: *)')` | Color gamut (srgb/p3/rec2020) |
| 14 | `hw_contrast_pref` | String | 📊 | `matchMedia('(prefers-contrast: *)')` | Contrast preference |
| 15 | `hw_touch_points` | Number | 🥇 | `navigator.maxTouchPoints` | Maximum touch points |
| 16 | `hw_vr_displays` | Boolean | 👁️ | `navigator.getVRDisplays` | VR device connected |
| 17 | `hw_gamepads` | Number | 👁️ | `navigator.getGamepads` | Connected gamepad count |
| 18 | `hw_math_tan` | String | 🥇 | `Math.tan(-1e300)` | Float precision fingerprint |
| 19 | `hw_math_sin` | String | 🥇 | `Math.sin(1)` | Float precision fingerprint |
| 20 | `hw_webgl_extensions` | String | 🥇 | `gl.getSupportedExtensions()` | WebGL extension list hash |

---

### 4.2 System & OS Environment (15 Dimensions)

| ID | JSON Key | Type | Lock | Source | Description |
|----|----------|------|------|--------|-------------|
| 21 | `sys_platform` | String | 🥈 | `navigator.platform` | OS platform identifier |
| 22 | `sys_user_agent` | String | 🥈 | `navigator.userAgent` | Full User-Agent string |
| 23 | `sys_language` | String | 🥈 | `navigator.language` | Primary browser language |
| 24 | `sys_languages` | Array | 🥈 | `navigator.languages` | Language preference list |
| 25 | `sys_timezone` | String | 🥈 | `Intl.DateTimeFormat().resolvedOptions().timeZone` | Timezone name |
| 26 | `sys_tz_offset` | Number | 🥈 | `new Date().getTimezoneOffset()` | Timezone offset (minutes) |
| 27 | `sys_intl_calendar` | String | 🥈 | `Intl.DateTimeFormat().resolvedOptions().calendar` | Default calendar system |
| 28 | `sys_intl_number` | String | 🥈 | `Intl.NumberFormat().resolvedOptions()` | Number formatting locale |
| 29 | `sys_intl_collation` | String | 🥈 | `Intl.Collator().resolvedOptions()` | String collation rules |
| 30 | `sys_fonts_hash` | String | 🥈 | Font enumeration technique | Installed fonts fingerprint |
| 31 | `sys_dark_mode` | Boolean | 📊 | `matchMedia('(prefers-color-scheme: dark)')` | Dark mode enabled |
| 32 | `sys_reduced_motion` | Boolean | 📊 | `matchMedia('(prefers-reduced-motion)')` | Reduced motion preference |
| 33 | `sys_inverted_colors` | Boolean | 📊 | `matchMedia('(inverted-colors)')` | Inverted colors enabled |
| 34 | `sys_forced_colors` | Boolean | 📊 | `matchMedia('(forced-colors)')` | High contrast mode |
| 35 | `sys_pointer_type` | String | 🥈 | `matchMedia('(any-pointer: *)')` | Pointer precision (fine/coarse) |

---

### 4.3 Browser Capabilities (15 Dimensions)

| ID | JSON Key | Type | Lock | Source | Description |
|----|----------|------|------|--------|-------------|
| 36 | `cap_cookies` | Boolean | 🥈 | `navigator.cookieEnabled` | Cookies enabled |
| 37 | `cap_local_storage` | Boolean | 🥈 | `window.localStorage` test | LocalStorage available |
| 38 | `cap_session_storage` | Boolean | 🥈 | `window.sessionStorage` test | SessionStorage available |
| 39 | `cap_indexed_db` | Boolean | 🥈 | `window.indexedDB` test | IndexedDB available |
| 40 | `cap_open_database` | Boolean | 🥈 | `window.openDatabase` test | WebSQL available |
| 41 | `cap_service_worker` | Boolean | 🥈 | `navigator.serviceWorker` | Service Worker support |
| 42 | `cap_web_worker` | Boolean | 🥈 | `window.Worker` | Web Worker support |
| 43 | `cap_wasm` | Boolean | 🥈 | `window.WebAssembly` | WebAssembly support |
| 44 | `cap_shared_array` | Boolean | 🥈 | `window.SharedArrayBuffer` | SharedArrayBuffer (COOP/COEP) |
| 45 | `cap_bluetooth` | Boolean | 👁️ | `navigator.bluetooth` | Web Bluetooth API |
| 46 | `cap_usb` | Boolean | 👁️ | `navigator.usb` | WebUSB API |
| 47 | `cap_permissions` | Object | 👁️ | `navigator.permissions.query()` | Permission states |
| 48 | `cap_plugins_hash` | String | 🥈 | `navigator.plugins` | Plugin list fingerprint |
| 49 | `cap_mime_types` | String | 🥈 | `navigator.mimeTypes` | MIME types fingerprint |
| 50 | `cap_pdf_viewer` | Boolean | 🥈 | `navigator.pdfViewerEnabled` | Built-in PDF viewer |

---

### 4.4 Media Codecs (10 Dimensions)

| ID | JSON Key | Type | Lock | Source | Description |
|----|----------|------|------|--------|-------------|
| 51 | `med_audio_mp3` | String | 🥈 | `audio.canPlayType('audio/mpeg')` | MP3 support |
| 52 | `med_audio_aac` | String | 🥈 | `audio.canPlayType('audio/aac')` | AAC support |
| 53 | `med_audio_ogg` | String | 🥈 | `audio.canPlayType('audio/ogg')` | Ogg Vorbis support |
| 54 | `med_audio_wav` | String | 🥈 | `audio.canPlayType('audio/wav')` | WAV support |
| 55 | `med_audio_opus` | String | 🥈 | `audio.canPlayType('audio/opus')` | Opus support |
| 56 | `med_video_h264` | String | 🥈 | `video.canPlayType('video/mp4; codecs="avc1"')` | H.264 support |
| 57 | `med_video_h265` | String | 🥈 | `video.canPlayType('video/mp4; codecs="hev1"')` | H.265/HEVC support |
| 58 | `med_video_vp8` | String | 🥈 | `video.canPlayType('video/webm; codecs="vp8"')` | VP8 support |
| 59 | `med_video_vp9` | String | 🥈 | `video.canPlayType('video/webm; codecs="vp9"')` | VP9 support |
| 60 | `med_video_av1` | String | 🥈 | `video.canPlayType('video/mp4; codecs="av01"')` | AV1 support |

---

### 4.5 Network & Edge Fingerprint (15 Dimensions)

*Injected by Cloudflare Worker from `request.cf` - Cannot be spoofed by client*

| ID | JSON Key | Type | Lock | Source | Description |
|----|----------|------|------|--------|-------------|
| 61 | `net_ip_hash` | String | 🥉 | `SHA256(request.headers.get('CF-Connecting-IP'))` | IP address hash |
| 62 | `net_asn` | Number | 🥉 | `request.cf.asn` | Autonomous System Number |
| 63 | `net_asn_org` | String | 🥉 | `request.cf.asOrganization` | ISP/Org name |
| 64 | `net_colo` | String | 🥉 | `request.cf.colo` | CF datacenter code |
| 65 | `net_country` | String | 🥉 | `request.cf.country` | ISO country code |
| 66 | `net_city` | String | 👁️ | `request.cf.city` | City name |
| 67 | `net_region` | String | 👁️ | `request.cf.region` | Region/State |
| 68 | `net_postal` | String | 👁️ | `request.cf.postalCode` | Postal code |
| 69 | `net_latitude` | Number | 👁️ | `request.cf.latitude` | Latitude |
| 70 | `net_longitude` | Number | 👁️ | `request.cf.longitude` | Longitude |
| 71 | `net_tls_version` | String | 🥉 | `request.cf.tlsVersion` | TLS version (1.2/1.3) |
| 72 | `net_tls_cipher` | String | 🥉 | `request.cf.tlsCipher` | TLS cipher suite (JA3 partial) |
| 73 | `net_http_protocol` | String | 🥉 | `request.cf.httpProtocol` | HTTP protocol (h2/h3) |
| 74 | `net_tcp_rtt` | Number | 👁️ | `request.cf.clientTcpRtt` | TCP round-trip time |
| 75 | `net_bot_score` | Number | 👁️ | `request.cf.botManagement.score` | Bot detection score |

---

### 4.6 Behavior & Lie Detection (5+ Dimensions)

| ID | JSON Key | Type | Lock | Source | Description |
|----|----------|------|------|--------|-------------|
| 76 | `aux_battery_level` | Number | 👁️ | `navigator.getBattery()` | Battery percentage |
| 77 | `aux_battery_charging` | Boolean | 👁️ | `navigator.getBattery()` | Charging status |
| 78 | `aux_window_width` | Number | 👁️ | `window.innerWidth` | Browser window width |
| 79 | `aux_window_height` | Number | 👁️ | `window.innerHeight` | Browser window height |
| 80 | `aux_webrtc_ip` | String | 👁️ | WebRTC ICE candidates | Local/Public IP leak |
| 81 | `lie_os_mismatch` | Boolean | 👁️ | UA vs platform check | OS spoofing detected |
| 82 | `lie_browser_mismatch` | Boolean | 👁️ | UA vs features check | Browser spoofing detected |
| 83 | `lie_resolution_mismatch` | Boolean | 👁️ | Screen vs available check | Resolution spoofing |
| 84 | `lie_timezone_mismatch` | Boolean | 👁️ | TZ vs offset check | Timezone spoofing |
| 85 | `lie_webgl_mismatch` | Boolean | 👁️ | Renderer vs UA check | GPU spoofing |

---

## 5. Database Schema (Cloudflare D1)

### 5.1 Main Schema

```sql
-- ============================================
-- AmiUnique.io Database Schema for Cloudflare D1
-- ============================================

-- Main visits table
CREATE TABLE IF NOT EXISTS visits (
    -- Primary Key
    id TEXT PRIMARY KEY,                    -- UUID v4

    -- Timestamps
    created_at INTEGER NOT NULL,            -- Unix timestamp (ms)

    -- Three-Lock Hash Indexes (Core Identity)
    hardware_hash TEXT NOT NULL,            -- Gold Lock (device fingerprint)
    software_hash TEXT NOT NULL,            -- Silver Lock (browser fingerprint)
    full_hash TEXT NOT NULL,                -- Bronze Lock (session fingerprint)

    -- Quick Aggregation Fields (avoid JSON parsing for stats)
    meta_browser TEXT,                      -- Chrome, Firefox, Safari, etc.
    meta_browser_version TEXT,              -- Major version
    meta_os TEXT,                           -- Windows, macOS, Linux, iOS, Android
    meta_os_version TEXT,                   -- OS version
    meta_device_type TEXT,                  -- desktop, mobile, tablet
    meta_country TEXT,                      -- ISO country code
    meta_screen TEXT,                       -- "1920x1080" format
    meta_gpu_vendor TEXT,                   -- GPU vendor

    -- Full Payload (Cold Storage)
    raw_json TEXT NOT NULL                  -- Complete 85-dimension JSON
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_visits_full_hash ON visits(full_hash);
CREATE INDEX IF NOT EXISTS idx_visits_hardware_hash ON visits(hardware_hash);
CREATE INDEX IF NOT EXISTS idx_visits_software_hash ON visits(software_hash);
CREATE INDEX IF NOT EXISTS idx_visits_created_at ON visits(created_at);
CREATE INDEX IF NOT EXISTS idx_visits_browser ON visits(meta_browser);
CREATE INDEX IF NOT EXISTS idx_visits_os ON visits(meta_os);
CREATE INDEX IF NOT EXISTS idx_visits_country ON visits(meta_country);
CREATE INDEX IF NOT EXISTS idx_visits_device_type ON visits(meta_device_type);

-- ============================================
-- Statistics Cache Table (Pre-aggregated)
-- ============================================

CREATE TABLE IF NOT EXISTS stats_cache (
    id TEXT PRIMARY KEY,                    -- 'global' or date string
    updated_at INTEGER NOT NULL,
    total_fingerprints INTEGER DEFAULT 0,
    unique_full_hash INTEGER DEFAULT 0,
    unique_hardware_hash INTEGER DEFAULT 0,
    browser_distribution TEXT,              -- JSON: {"Chrome": 45.2, "Firefox": 12.1}
    os_distribution TEXT,                   -- JSON: {"Windows": 65.3, "macOS": 20.1}
    country_distribution TEXT,              -- JSON: {"US": 30.5, "DE": 8.2}
    screen_distribution TEXT,               -- JSON: {"1920x1080": 35.2}
    device_distribution TEXT                -- JSON: {"desktop": 72.1, "mobile": 25.3}
);

-- ============================================
-- Daily Aggregation Table
-- ============================================

CREATE TABLE IF NOT EXISTS daily_stats (
    date TEXT PRIMARY KEY,                  -- YYYY-MM-DD format
    total_visits INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,      -- Unique hardware_hash
    new_fingerprints INTEGER DEFAULT 0,     -- First-time full_hash
    returning_visitors INTEGER DEFAULT 0
);
```

### 5.2 Query Patterns

```sql
-- Check uniqueness of a fingerprint
SELECT COUNT(*) as count FROM visits WHERE full_hash = ?;

-- Check if device seen before (cross-browser tracking)
SELECT COUNT(*) as count FROM visits WHERE hardware_hash = ?;

-- Get browser distribution for stats page
SELECT meta_browser, COUNT(*) as count
FROM visits
GROUP BY meta_browser
ORDER BY count DESC
LIMIT 10;

-- Get recent fingerprint samples for comparison
SELECT raw_json FROM visits
WHERE created_at > ?
ORDER BY created_at DESC
LIMIT 100;

-- Calculate uniqueness ratio
SELECT
    (SELECT COUNT(DISTINCT full_hash) FROM visits) as unique_count,
    (SELECT COUNT(*) FROM visits) as total_count;
```

---

## 6. API Design & Worker Logic

### 6.1 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analyze` | Submit fingerprint, get analysis |
| `GET` | `/api/stats` | Get global statistics |
| `GET` | `/api/stats/distribution/:type` | Get specific distribution data |
| `GET` | `/api/health` | Health check endpoint |

### 6.2 Main Worker Code

```typescript
// /functions/api/analyze.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono<{ Bindings: { DB: D1Database } }>();

app.use('/*', cors());

// SHA-256 Hash Helper
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message || '');
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Generate UUID v4
function uuidv4(): string {
  return crypto.randomUUID();
}

// Parse User-Agent for meta fields
function parseUserAgent(ua: string): { browser: string; version: string; os: string } {
  // Simplified parser - use ua-parser-js in production
  let browser = 'Unknown';
  let version = '';
  let os = 'Unknown';

  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';

  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return { browser, version, os };
}

app.post('/api/analyze', async (c) => {
  const db = c.env.DB;
  const request = c.req.raw;

  try {
    // 1. Get client-side fingerprint data
    const clientData = await c.req.json();

    // 2. Extract Cloudflare network fingerprint (cannot be spoofed!)
    const cf = (request as any).cf || {};
    const netData = {
      net_ip_hash: await sha256(request.headers.get('CF-Connecting-IP') || ''),
      net_asn: cf.asn,
      net_asn_org: cf.asOrganization,
      net_colo: cf.colo,
      net_country: cf.country,
      net_city: cf.city,
      net_region: cf.region,
      net_postal: cf.postalCode,
      net_latitude: cf.latitude,
      net_longitude: cf.longitude,
      net_tls_version: cf.tlsVersion,
      net_tls_cipher: cf.tlsCipher,
      net_http_protocol: cf.httpProtocol,
      net_tcp_rtt: cf.clientTcpRtt,
      net_bot_score: cf.botManagement?.score
    };

    // 3. Calculate Three-Lock Hashes

    // 🥇 GOLD LOCK - Hardware Features (Most Stable)
    const goldComponents = [
      clientData.hw_canvas_hash,
      clientData.hw_webgl_hash,
      clientData.hw_webgl_vendor,
      clientData.hw_webgl_renderer,
      clientData.hw_audio_hash,
      clientData.hw_cpu_cores,
      clientData.hw_memory,
      clientData.hw_screen_width,
      clientData.hw_screen_height,
      clientData.hw_color_depth,
      clientData.hw_pixel_ratio,
      clientData.hw_touch_points,
      clientData.hw_hdr_support,
      clientData.hw_color_gamut,
      clientData.hw_math_tan,
      clientData.hw_math_sin,
      clientData.hw_webgl_extensions
    ].join('|');
    const hardwareHash = await sha256(goldComponents);

    // 🥈 SILVER LOCK - Software Environment (Medium Stable)
    const silverComponents = [
      clientData.sys_fonts_hash,
      clientData.sys_platform,
      clientData.sys_user_agent,
      clientData.sys_language,
      JSON.stringify(clientData.sys_languages),
      clientData.sys_timezone,
      clientData.sys_tz_offset,
      clientData.sys_intl_calendar,
      clientData.sys_intl_number,
      clientData.cap_plugins_hash,
      clientData.cap_mime_types,
      clientData.cap_cookies,
      // Media codecs
      clientData.med_video_h264,
      clientData.med_video_h265,
      clientData.med_video_av1
    ].join('|');
    const softwareHash = await sha256(silverComponents);

    // 🥉 BRONZE LOCK - Full Session (Gold + Silver + Network)
    const bronzeComponents = [
      goldComponents,
      silverComponents,
      netData.net_asn,
      netData.net_colo,
      netData.net_tls_cipher
    ].join('|');
    const fullHash = await sha256(bronzeComponents);

    // 4. Prepare full report
    const fullReport = { ...clientData, ...netData };
    const visitId = uuidv4();
    const now = Date.now();

    // Parse UA for meta fields
    const uaInfo = parseUserAgent(clientData.sys_user_agent || '');
    const deviceType = clientData.hw_touch_points > 0 ? 'mobile' : 'desktop';
    const screenRes = `${clientData.hw_screen_width}x${clientData.hw_screen_height}`;

    // 5. Parallel database operations
    const [insertResult, uniqueCheck, hardwareCheck, totalCount] = await Promise.all([
      // Insert new visit
      db.prepare(`
        INSERT INTO visits (
          id, created_at, hardware_hash, software_hash, full_hash,
          meta_browser, meta_browser_version, meta_os, meta_device_type,
          meta_country, meta_screen, meta_gpu_vendor, raw_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        visitId,
        now,
        hardwareHash,
        softwareHash,
        fullHash,
        uaInfo.browser,
        uaInfo.version,
        uaInfo.os,
        deviceType,
        netData.net_country,
        screenRes,
        clientData.hw_webgl_vendor,
        JSON.stringify(fullReport)
      ).run(),

      // Check full hash uniqueness
      db.prepare('SELECT COUNT(*) as count FROM visits WHERE full_hash = ?')
        .bind(fullHash).first(),

      // Check hardware hash (cross-browser tracking)
      db.prepare('SELECT COUNT(*) as count FROM visits WHERE hardware_hash = ?')
        .bind(hardwareHash).first(),

      // Get total fingerprint count
      db.prepare('SELECT COUNT(*) as count FROM visits').first()
    ]);

    // 6. Calculate results
    const exactMatchCount = (uniqueCheck as any)?.count || 1;
    const hardwareMatchCount = (hardwareCheck as any)?.count || 1;
    const totalFingerprints = (totalCount as any)?.count || 1;

    const isUnique = exactMatchCount === 1;
    const uniquenessRatio = 1 / exactMatchCount;
    const isDeviceTracked = hardwareMatchCount > exactMatchCount;

    // 7. Generate analysis message
    let message = '';
    let trackingRisk = 'low';

    if (isUnique) {
      message = 'Your browser fingerprint is UNIQUE in our database!';
      trackingRisk = 'high';
    } else if (isDeviceTracked) {
      message = `We detected ${hardwareMatchCount} browser sessions from this device.`;
      trackingRisk = 'critical';
    } else {
      message = `${exactMatchCount} identical fingerprints found in our database.`;
      trackingRisk = exactMatchCount < 10 ? 'high' : 'medium';
    }

    // 8. Return comprehensive response
    return c.json({
      success: true,
      meta: {
        id: visitId,
        timestamp: now,
        processing_time_ms: Date.now() - now
      },
      hashes: {
        gold: hardwareHash,      // Hardware fingerprint
        silver: softwareHash,    // Software fingerprint
        bronze: fullHash         // Full session fingerprint
      },
      result: {
        is_unique: isUnique,
        uniqueness_ratio: uniquenessRatio,
        uniqueness_display: isUnique ? '1 in 1' : `1 in ${exactMatchCount.toLocaleString()}`,
        exact_match_count: exactMatchCount,
        hardware_match_count: hardwareMatchCount,
        total_fingerprints: totalFingerprints,
        tracking_risk: trackingRisk,
        message: message,
        cross_browser_detected: isDeviceTracked
      },
      // Return full data for frontend visualization
      details: fullReport,
      // Lie detection results
      lies: {
        os_mismatch: clientData.lie_os_mismatch || false,
        browser_mismatch: clientData.lie_browser_mismatch || false,
        resolution_mismatch: clientData.lie_resolution_mismatch || false,
        timezone_mismatch: clientData.lie_timezone_mismatch || false,
        webgl_mismatch: clientData.lie_webgl_mismatch || false
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return c.json({
      success: false,
      error: 'Failed to analyze fingerprint',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Stats endpoint
app.get('/api/stats', async (c) => {
  const db = c.env.DB;

  const [total, uniqueFull, uniqueHardware] = await Promise.all([
    db.prepare('SELECT COUNT(*) as count FROM visits').first(),
    db.prepare('SELECT COUNT(DISTINCT full_hash) as count FROM visits').first(),
    db.prepare('SELECT COUNT(DISTINCT hardware_hash) as count FROM visits').first()
  ]);

  return c.json({
    total_fingerprints: (total as any)?.count || 0,
    unique_sessions: (uniqueFull as any)?.count || 0,
    unique_devices: (uniqueHardware as any)?.count || 0,
    updated_at: Date.now()
  });
});

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() });
});

export default app;
```

### 6.3 Wrangler Configuration

```toml
# wrangler.toml
name = "amiunique-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "amiunique-db"
database_id = "YOUR_D1_DATABASE_ID"

[vars]
ENVIRONMENT = "production"

# Rate limiting (optional, requires paid plan)
# [[unsafe.bindings]]
# name = "RATE_LIMITER"
# type = "ratelimit"
# namespace_id = "1234"
# simple = { limit = 100, period = 60 }
```

---

## 7. Frontend Collection Scripts

### 7.1 Main Fingerprint Collector

```typescript
// lib/collectors/index.ts

export interface FingerprintData {
  // Hardware (20)
  hw_canvas_hash: string;
  hw_webgl_hash: string;
  hw_webgl_vendor: string;
  hw_webgl_renderer: string;
  hw_audio_hash: string;
  hw_cpu_cores: number;
  hw_memory: number;
  hw_screen_width: number;
  hw_screen_height: number;
  hw_color_depth: number;
  hw_pixel_ratio: number;
  hw_hdr_support: boolean;
  hw_color_gamut: string;
  hw_contrast_pref: string;
  hw_touch_points: number;
  hw_vr_displays: boolean;
  hw_gamepads: number;
  hw_math_tan: string;
  hw_math_sin: string;
  hw_webgl_extensions: string;

  // System (15)
  sys_platform: string;
  sys_user_agent: string;
  sys_language: string;
  sys_languages: string[];
  sys_timezone: string;
  sys_tz_offset: number;
  sys_intl_calendar: string;
  sys_intl_number: string;
  sys_intl_collation: string;
  sys_fonts_hash: string;
  sys_dark_mode: boolean;
  sys_reduced_motion: boolean;
  sys_inverted_colors: boolean;
  sys_forced_colors: boolean;
  sys_pointer_type: string;

  // Capabilities (15)
  cap_cookies: boolean;
  cap_local_storage: boolean;
  cap_session_storage: boolean;
  cap_indexed_db: boolean;
  cap_open_database: boolean;
  cap_service_worker: boolean;
  cap_web_worker: boolean;
  cap_wasm: boolean;
  cap_shared_array: boolean;
  cap_bluetooth: boolean;
  cap_usb: boolean;
  cap_permissions: object;
  cap_plugins_hash: string;
  cap_mime_types: string;
  cap_pdf_viewer: boolean;

  // Media (10)
  med_audio_mp3: string;
  med_audio_aac: string;
  med_audio_ogg: string;
  med_audio_wav: string;
  med_audio_opus: string;
  med_video_h264: string;
  med_video_h265: string;
  med_video_vp8: string;
  med_video_vp9: string;
  med_video_av1: string;

  // Auxiliary (volatile)
  aux_battery_level?: number;
  aux_battery_charging?: boolean;
  aux_window_width: number;
  aux_window_height: number;
  aux_webrtc_ip?: string;

  // Lie detection
  lie_os_mismatch: boolean;
  lie_browser_mismatch: boolean;
  lie_resolution_mismatch: boolean;
  lie_timezone_mismatch: boolean;
  lie_webgl_mismatch: boolean;
}

// Simple hash function for client-side use
async function hashString(str: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ========== HARDWARE COLLECTORS ==========

export async function getCanvasFingerprint(): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'unsupported';

    // Draw complex shapes for uniqueness
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('AmiUnique.io', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('AmiUnique.io', 4, 17);

    // Add gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, 'red');
    gradient.addColorStop(0.5, 'green');
    gradient.addColorStop(1, 'blue');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 30, 200, 20);

    return await hashString(canvas.toDataURL());
  } catch {
    return 'error';
  }
}

export async function getWebGLFingerprint(): Promise<{
  hash: string;
  vendor: string;
  renderer: string;
  extensions: string;
}> {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return { hash: 'unsupported', vendor: '', renderer: '', extensions: '' };

    const glAny = gl as any;

    // Get debug info
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
      : gl.getParameter(gl.VENDOR);
    const renderer = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER);

    // Get extensions
    const extensions = gl.getSupportedExtensions()?.sort().join(',') || '';

    // Create hash from various WebGL parameters
    const params = [
      gl.getParameter(gl.VERSION),
      gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
      gl.getParameter(gl.MAX_VARYING_VECTORS),
      gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
      gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
      gl.getParameter(gl.MAX_TEXTURE_SIZE),
      gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
      vendor,
      renderer
    ].join('|');

    return {
      hash: await hashString(params),
      vendor: vendor || '',
      renderer: renderer || '',
      extensions: await hashString(extensions)
    };
  } catch {
    return { hash: 'error', vendor: '', renderer: '', extensions: '' };
  }
}

export async function getAudioFingerprint(): Promise<string> {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return 'unsupported';

    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const analyser = context.createAnalyser();
    const gainNode = context.createGain();
    const compressor = context.createDynamicsCompressor();

    // Configure nodes
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(10000, context.currentTime);

    compressor.threshold.setValueAtTime(-50, context.currentTime);
    compressor.knee.setValueAtTime(40, context.currentTime);
    compressor.ratio.setValueAtTime(12, context.currentTime);
    compressor.attack.setValueAtTime(0, context.currentTime);
    compressor.release.setValueAtTime(0.25, context.currentTime);

    gainNode.gain.setValueAtTime(0, context.currentTime);

    // Connect nodes
    oscillator.connect(compressor);
    compressor.connect(analyser);
    analyser.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(0);

    // Analyze
    const dataArray = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(dataArray);

    oscillator.stop();
    await context.close();

    // Create fingerprint from frequency data
    const sum = dataArray.slice(0, 30).reduce((a, b) => a + b, 0);
    return await hashString(sum.toString());
  } catch {
    return 'error';
  }
}

export function getScreenInfo(): {
  width: number;
  height: number;
  colorDepth: number;
  pixelRatio: number;
} {
  return {
    width: screen.width,
    height: screen.height,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio || 1
  };
}

export function getHardwareInfo(): {
  cpuCores: number;
  memory: number;
  touchPoints: number;
} {
  return {
    cpuCores: navigator.hardwareConcurrency || 0,
    memory: (navigator as any).deviceMemory || 0,
    touchPoints: navigator.maxTouchPoints || 0
  };
}

export function getMathFingerprint(): { tan: string; sin: string } {
  return {
    tan: Math.tan(-1e300).toString(),
    sin: Math.sin(1).toString()
  };
}

// ========== CSS MEDIA QUERIES ==========

export function getMediaFeatures(): {
  hdr: boolean;
  colorGamut: string;
  contrast: string;
  darkMode: boolean;
  reducedMotion: boolean;
  invertedColors: boolean;
  forcedColors: boolean;
  pointerType: string;
} {
  const matchMedia = window.matchMedia;

  // Color gamut detection
  let colorGamut = 'srgb';
  if (matchMedia('(color-gamut: rec2020)').matches) colorGamut = 'rec2020';
  else if (matchMedia('(color-gamut: p3)').matches) colorGamut = 'p3';

  // Contrast preference
  let contrast = 'no-preference';
  if (matchMedia('(prefers-contrast: more)').matches) contrast = 'more';
  else if (matchMedia('(prefers-contrast: less)').matches) contrast = 'less';
  else if (matchMedia('(prefers-contrast: custom)').matches) contrast = 'custom';

  // Pointer type
  let pointerType = 'none';
  if (matchMedia('(any-pointer: fine)').matches) pointerType = 'fine';
  else if (matchMedia('(any-pointer: coarse)').matches) pointerType = 'coarse';

  return {
    hdr: matchMedia('(dynamic-range: high)').matches,
    colorGamut,
    contrast,
    darkMode: matchMedia('(prefers-color-scheme: dark)').matches,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    invertedColors: matchMedia('(inverted-colors: inverted)').matches,
    forcedColors: matchMedia('(forced-colors: active)').matches,
    pointerType
  };
}

// ========== SYSTEM COLLECTORS ==========

export function getNavigatorInfo(): {
  platform: string;
  userAgent: string;
  language: string;
  languages: string[];
} {
  return {
    platform: navigator.platform,
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: [...navigator.languages]
  };
}

export function getTimezoneInfo(): {
  timezone: string;
  offset: number;
} {
  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    offset: new Date().getTimezoneOffset()
  };
}

export function getIntlInfo(): {
  calendar: string;
  numberFormat: string;
  collation: string;
} {
  const dateOpts = Intl.DateTimeFormat().resolvedOptions();
  const numOpts = Intl.NumberFormat().resolvedOptions();
  const collOpts = Intl.Collator().resolvedOptions();

  return {
    calendar: dateOpts.calendar || 'gregory',
    numberFormat: `${numOpts.locale}-${numOpts.numberingSystem}`,
    collation: collOpts.collation || 'default'
  };
}

export async function getFontsFingerprint(): Promise<string> {
  // Font detection using canvas measurement
  const testFonts = [
    'Arial', 'Arial Black', 'Arial Narrow', 'Calibri', 'Cambria',
    'Cambria Math', 'Comic Sans MS', 'Consolas', 'Courier', 'Courier New',
    'Georgia', 'Helvetica', 'Impact', 'Lucida Console', 'Lucida Sans Unicode',
    'Microsoft Sans Serif', 'Palatino Linotype', 'Segoe UI', 'Tahoma',
    'Times', 'Times New Roman', 'Trebuchet MS', 'Verdana',
    // Chinese fonts
    'Microsoft YaHei', 'SimHei', 'SimSun', 'NSimSun', 'FangSong', 'KaiTi',
    // Japanese fonts
    'MS Gothic', 'MS Mincho', 'Meiryo',
    // Korean fonts
    'Malgun Gothic', 'Gulim', 'Dotum',
    // Mac fonts
    'Menlo', 'Monaco', 'SF Pro', 'Helvetica Neue', 'Apple Color Emoji'
  ];

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'unsupported';

  const baseFont = 'monospace';
  const testString = 'mmmmmmmmmmlli';

  ctx.font = `72px ${baseFont}`;
  const baseWidth = ctx.measureText(testString).width;

  const detected: string[] = [];

  for (const font of testFonts) {
    ctx.font = `72px '${font}', ${baseFont}`;
    const width = ctx.measureText(testString).width;
    if (width !== baseWidth) {
      detected.push(font);
    }
  }

  return await hashString(detected.sort().join(','));
}

// ========== CAPABILITY COLLECTORS ==========

export function getStorageCapabilities(): {
  cookies: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  openDatabase: boolean;
} {
  let localStorage = false;
  let sessionStorage = false;

  try {
    localStorage = !!window.localStorage;
    window.localStorage.setItem('test', 'test');
    window.localStorage.removeItem('test');
  } catch { localStorage = false; }

  try {
    sessionStorage = !!window.sessionStorage;
    window.sessionStorage.setItem('test', 'test');
    window.sessionStorage.removeItem('test');
  } catch { sessionStorage = false; }

  return {
    cookies: navigator.cookieEnabled,
    localStorage,
    sessionStorage,
    indexedDB: !!window.indexedDB,
    openDatabase: !!(window as any).openDatabase
  };
}

export function getAPICapabilities(): {
  serviceWorker: boolean;
  webWorker: boolean;
  wasm: boolean;
  sharedArray: boolean;
  bluetooth: boolean;
  usb: boolean;
  pdfViewer: boolean;
} {
  return {
    serviceWorker: 'serviceWorker' in navigator,
    webWorker: typeof Worker !== 'undefined',
    wasm: typeof WebAssembly !== 'undefined',
    sharedArray: typeof SharedArrayBuffer !== 'undefined',
    bluetooth: 'bluetooth' in navigator,
    usb: 'usb' in navigator,
    pdfViewer: (navigator as any).pdfViewerEnabled ?? false
  };
}

export async function getPluginsFingerprint(): Promise<string> {
  const plugins: string[] = [];
  for (let i = 0; i < navigator.plugins.length; i++) {
    plugins.push(navigator.plugins[i].name);
  }
  return await hashString(plugins.sort().join(','));
}

export async function getMimeTypesFingerprint(): Promise<string> {
  const mimes: string[] = [];
  for (let i = 0; i < navigator.mimeTypes.length; i++) {
    mimes.push(navigator.mimeTypes[i].type);
  }
  return await hashString(mimes.sort().join(','));
}

// ========== MEDIA CODEC COLLECTORS ==========

export function getCodecSupport(): {
  mp3: string;
  aac: string;
  ogg: string;
  wav: string;
  opus: string;
  h264: string;
  h265: string;
  vp8: string;
  vp9: string;
  av1: string;
} {
  const audio = document.createElement('audio');
  const video = document.createElement('video');

  return {
    mp3: audio.canPlayType('audio/mpeg') || 'no',
    aac: audio.canPlayType('audio/aac') || 'no',
    ogg: audio.canPlayType('audio/ogg; codecs="vorbis"') || 'no',
    wav: audio.canPlayType('audio/wav') || 'no',
    opus: audio.canPlayType('audio/ogg; codecs="opus"') || 'no',
    h264: video.canPlayType('video/mp4; codecs="avc1.42E01E"') || 'no',
    h265: video.canPlayType('video/mp4; codecs="hev1"') || 'no',
    vp8: video.canPlayType('video/webm; codecs="vp8"') || 'no',
    vp9: video.canPlayType('video/webm; codecs="vp9"') || 'no',
    av1: video.canPlayType('video/mp4; codecs="av01.0.00M.08"') || 'no'
  };
}

// ========== LIE DETECTION ==========

export function detectLies(data: Partial<FingerprintData>): {
  os: boolean;
  browser: boolean;
  resolution: boolean;
  timezone: boolean;
  webgl: boolean;
} {
  const ua = data.sys_user_agent || '';
  const platform = data.sys_platform || '';
  const renderer = data.hw_webgl_renderer || '';

  // OS mismatch detection
  let osMismatch = false;
  if (ua.includes('Windows') && !platform.includes('Win')) osMismatch = true;
  if (ua.includes('Mac') && !platform.includes('Mac')) osMismatch = true;
  if (ua.includes('Linux') && !platform.includes('Linux')) osMismatch = true;

  // Browser mismatch (basic)
  let browserMismatch = false;
  if (ua.includes('Chrome') && typeof (window as any).chrome === 'undefined') {
    browserMismatch = true;
  }

  // Resolution mismatch
  const resolutionMismatch =
    screen.availWidth > screen.width ||
    screen.availHeight > screen.height;

  // Timezone mismatch
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offset = new Date().getTimezoneOffset();
  // This is simplified - real detection would compare offset with expected for timezone
  const timezoneMismatch = false;

  // WebGL mismatch
  let webglMismatch = false;
  if (renderer) {
    // If UA says Mac but GPU is NVIDIA (rare on Mac)
    if (ua.includes('Mac') && renderer.includes('NVIDIA') && !renderer.includes('Apple')) {
      webglMismatch = true;
    }
    // If UA says mobile but renderer is desktop GPU
    if ((ua.includes('iPhone') || ua.includes('Android')) &&
        (renderer.includes('GeForce') || renderer.includes('Radeon'))) {
      webglMismatch = true;
    }
  }

  return {
    os: osMismatch,
    browser: browserMismatch,
    resolution: resolutionMismatch,
    timezone: timezoneMismatch,
    webgl: webglMismatch
  };
}

// ========== MAIN COLLECTOR ==========

export async function collectFingerprint(): Promise<FingerprintData> {
  // Run all collectors in parallel where possible
  const [
    canvasHash,
    webglData,
    audioHash,
    fontsHash,
    pluginsHash,
    mimeTypesHash
  ] = await Promise.all([
    getCanvasFingerprint(),
    getWebGLFingerprint(),
    getAudioFingerprint(),
    getFontsFingerprint(),
    getPluginsFingerprint(),
    getMimeTypesFingerprint()
  ]);

  const screenInfo = getScreenInfo();
  const hardwareInfo = getHardwareInfo();
  const mathFp = getMathFingerprint();
  const mediaFeatures = getMediaFeatures();
  const navInfo = getNavigatorInfo();
  const tzInfo = getTimezoneInfo();
  const intlInfo = getIntlInfo();
  const storageCapabilities = getStorageCapabilities();
  const apiCapabilities = getAPICapabilities();
  const codecs = getCodecSupport();

  const partialData: Partial<FingerprintData> = {
    hw_webgl_vendor: webglData.vendor,
    hw_webgl_renderer: webglData.renderer,
    sys_user_agent: navInfo.userAgent,
    sys_platform: navInfo.platform
  };

  const lies = detectLies(partialData);

  return {
    // Hardware (20)
    hw_canvas_hash: canvasHash,
    hw_webgl_hash: webglData.hash,
    hw_webgl_vendor: webglData.vendor,
    hw_webgl_renderer: webglData.renderer,
    hw_audio_hash: audioHash,
    hw_cpu_cores: hardwareInfo.cpuCores,
    hw_memory: hardwareInfo.memory,
    hw_screen_width: screenInfo.width,
    hw_screen_height: screenInfo.height,
    hw_color_depth: screenInfo.colorDepth,
    hw_pixel_ratio: screenInfo.pixelRatio,
    hw_hdr_support: mediaFeatures.hdr,
    hw_color_gamut: mediaFeatures.colorGamut,
    hw_contrast_pref: mediaFeatures.contrast,
    hw_touch_points: hardwareInfo.touchPoints,
    hw_vr_displays: false, // Deprecated API
    hw_gamepads: 0,
    hw_math_tan: mathFp.tan,
    hw_math_sin: mathFp.sin,
    hw_webgl_extensions: webglData.extensions,

    // System (15)
    sys_platform: navInfo.platform,
    sys_user_agent: navInfo.userAgent,
    sys_language: navInfo.language,
    sys_languages: navInfo.languages,
    sys_timezone: tzInfo.timezone,
    sys_tz_offset: tzInfo.offset,
    sys_intl_calendar: intlInfo.calendar,
    sys_intl_number: intlInfo.numberFormat,
    sys_intl_collation: intlInfo.collation,
    sys_fonts_hash: fontsHash,
    sys_dark_mode: mediaFeatures.darkMode,
    sys_reduced_motion: mediaFeatures.reducedMotion,
    sys_inverted_colors: mediaFeatures.invertedColors,
    sys_forced_colors: mediaFeatures.forcedColors,
    sys_pointer_type: mediaFeatures.pointerType,

    // Capabilities (15)
    cap_cookies: storageCapabilities.cookies,
    cap_local_storage: storageCapabilities.localStorage,
    cap_session_storage: storageCapabilities.sessionStorage,
    cap_indexed_db: storageCapabilities.indexedDB,
    cap_open_database: storageCapabilities.openDatabase,
    cap_service_worker: apiCapabilities.serviceWorker,
    cap_web_worker: apiCapabilities.webWorker,
    cap_wasm: apiCapabilities.wasm,
    cap_shared_array: apiCapabilities.sharedArray,
    cap_bluetooth: apiCapabilities.bluetooth,
    cap_usb: apiCapabilities.usb,
    cap_permissions: {},
    cap_plugins_hash: pluginsHash,
    cap_mime_types: mimeTypesHash,
    cap_pdf_viewer: apiCapabilities.pdfViewer,

    // Media (10)
    med_audio_mp3: codecs.mp3,
    med_audio_aac: codecs.aac,
    med_audio_ogg: codecs.ogg,
    med_audio_wav: codecs.wav,
    med_audio_opus: codecs.opus,
    med_video_h264: codecs.h264,
    med_video_h265: codecs.h265,
    med_video_vp8: codecs.vp8,
    med_video_vp9: codecs.vp9,
    med_video_av1: codecs.av1,

    // Auxiliary
    aux_window_width: window.innerWidth,
    aux_window_height: window.innerHeight,

    // Lies
    lie_os_mismatch: lies.os,
    lie_browser_mismatch: lies.browser,
    lie_resolution_mismatch: lies.resolution,
    lie_timezone_mismatch: lies.timezone,
    lie_webgl_mismatch: lies.webgl
  };
}
```

---

## 8. Sitemap & Page Structure

### 8.1 URL Structure

```
amiunique.io/
│
├── /                           # Homepage with hero + live counter
│
├── /scan                       # Main fingerprinting app
│   ├── /scan/loading           # Animated scanning progress
│   └── /scan/result            # Results dashboard
│       ├── Uniqueness Card
│       ├── Three-Lock Display
│       ├── 80-Dimension Grid
│       └── Lie Detection Panel
│
├── /stats                      # Live statistics
│   ├── /stats/browsers         # Browser distribution
│   ├── /stats/operating-systems # OS distribution
│   ├── /stats/screens          # Screen resolution stats
│   └── /stats/geography        # Geographic distribution
│
├── /learn                      # Educational content
│   ├── /learn/what-is-fingerprinting
│   ├── /learn/how-tracking-works
│   ├── /learn/protect-yourself
│   └── /learn/dimension/[id]   # Individual dimension explainer
│
├── /api                        # Developer docs
│   └── /api/docs               # API documentation
│
└── /legal
    ├── /legal/privacy          # Privacy policy
    ├── /legal/terms            # Terms of service
    └── /legal/opt-out          # Data deletion request
```

### 8.2 Page Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        HOMEPAGE (/)                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    HERO SECTION                          │    │
│  │  "Are You Unique?"                                       │    │
│  │  [Live Counter: 1,234,567 fingerprints analyzed]        │    │
│  │  [   SCAN MY FINGERPRINT   ] <- Primary CTA             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 THREE-LOCK PREVIEW                       │    │
│  │  🥇 Gold    🥈 Silver    🥉 Bronze                        │    │
│  │  Hardware   Software    Full Session                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │               FEATURE HIGHLIGHTS                         │    │
│  │  [80+ Dimensions] [Edge Computing] [Privacy First]      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 LIVE STATISTICS                          │    │
│  │  Browser Distribution Pie | OS Distribution | Screens   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    RESULT PAGE (/scan/result)                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 UNIQUENESS CARD                          │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │  🎯 YOU ARE UNIQUE!                              │    │    │
│  │  │  Your fingerprint: 1 in 1,000,000               │    │    │
│  │  │  Tracking Risk: ████████░░ HIGH                 │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │               THREE-LOCK HASHES                         │    │
│  │  🥇 Gold:   a1b2c3d4e5f6...  [Device ID]              │    │
│  │  🥈 Silver: f6e5d4c3b2a1...  [Browser ID]             │    │
│  │  🥉 Bronze: 1a2b3c4d5e6f...  [Session ID]             │    │
│  │                                                         │    │
│  │  ⚠️ Cross-Browser Tracking Detected!                   │    │
│  │  "3 different browsers seen from this device"          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                80+ DIMENSION GRID                        │    │
│  │  ┌──────────────────────────────────────────────────┐   │    │
│  │  │ HARDWARE (20)                                     │   │    │
│  │  │ ├─ 🔒 Canvas Hash: a1b2c3...        Unique: 1/50K │   │    │
│  │  │ ├─ 🔒 WebGL Hash: d4e5f6...         Unique: 1/30K │   │    │
│  │  │ ├─ 🔒 GPU: NVIDIA GeForce RTX 3080  Unique: 1/200 │   │    │
│  │  │ └─ ...                                            │   │    │
│  │  ├──────────────────────────────────────────────────┤   │    │
│  │  │ SOFTWARE (15)                                     │   │    │
│  │  │ ├─ 📊 Fonts: 245 detected           Unique: 1/5K  │   │    │
│  │  │ ├─ 📊 Timezone: Asia/Shanghai       Common: 15%   │   │    │
│  │  │ └─ ...                                            │   │    │
│  │  ├──────────────────────────────────────────────────┤   │    │
│  │  │ NETWORK (15)                                      │   │    │
│  │  │ ├─ 🌐 ASN: 4134 (China Telecom)     Common: 8%    │   │    │
│  │  │ ├─ 🌐 TLS: TLS 1.3                  Common: 45%   │   │    │
│  │  │ └─ ...                                            │   │    │
│  │  └──────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 LIE DETECTION                           │    │
│  │  ✅ OS Match: User-Agent matches platform               │    │
│  │  ⚠️ GPU Anomaly: Mac user with NVIDIA GPU detected     │    │
│  │  ✅ Timezone: Consistent with IP location              │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Deployment Guide

### 9.1 Prerequisites

```bash
# Required tools
node --version  # >= 18.0.0
pnpm --version  # >= 8.0.0
wrangler --version  # >= 3.0.0

# Cloudflare account with:
# - Pages enabled
# - Workers enabled
# - D1 database access
```

### 9.2 Project Initialization

```bash
# 1. Create project structure
mkdir amiunique
cd amiunique

# 2. Initialize monorepo
pnpm init

# 3. Create workspace config
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF

# 4. Create apps
mkdir -p apps/web apps/api packages/core

# 5. Initialize Next.js frontend
cd apps/web
pnpm create next-app . --typescript --tailwind --eslint --app --src-dir

# 6. Initialize Worker API
cd ../api
pnpm init
pnpm add hono
pnpm add -D wrangler typescript @cloudflare/workers-types
```

### 9.3 D1 Database Setup

```bash
# 1. Login to Cloudflare
wrangler login

# 2. Create D1 database
wrangler d1 create amiunique-db

# Output:
# Created D1 database amiunique-db
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# 3. Apply schema
wrangler d1 execute amiunique-db --file=./schema.sql

# 4. Verify tables
wrangler d1 execute amiunique-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

### 9.4 Deploy Worker API

```bash
cd apps/api

# 1. Configure wrangler.toml
cat > wrangler.toml << 'EOF'
name = "amiunique-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "amiunique-db"
database_id = "YOUR_DATABASE_ID"  # Replace with actual ID
EOF

# 2. Deploy
wrangler deploy

# Output:
# Published amiunique-api
# https://amiunique-api.YOUR_SUBDOMAIN.workers.dev
```

### 9.5 Deploy Frontend to Pages

```bash
cd apps/web

# 1. Build static export
# In next.config.js, add: output: 'export'

pnpm build

# 2. Deploy to Pages
wrangler pages deploy out --project-name=amiunique

# Or connect GitHub repo for automatic deployments
```

### 9.6 Custom Domain Setup

```bash
# In Cloudflare Dashboard:

# 1. Add custom domain to Pages
# Settings > Custom domains > Add domain
# Enter: amiunique.io

# 2. Add custom route for API
# Workers > amiunique-api > Triggers > Custom Domains
# Add: api.amiunique.io

# 3. Update DNS records (automatic if domain is on Cloudflare)
```

### 9.7 Environment Variables

```bash
# For Worker (secrets)
wrangler secret put API_SECRET

# For Pages (in dashboard)
# Settings > Environment variables
# Add: NEXT_PUBLIC_API_URL = https://api.amiunique.io
```

---

## 10. Cost Analysis

### 10.1 Cloudflare Pricing Breakdown

| Service | Free Tier | Paid Tier ($5/mo Workers Paid) |
|---------|-----------|-------------------------------|
| **Workers** | 100K requests/day | 10M requests/month |
| **D1** | 5GB storage, 5M reads/day | 25GB, 50B reads/month |
| **Pages** | Unlimited sites | Unlimited |
| **Analytics** | Basic | Advanced |

### 10.2 Projected Usage (Month 1-3)

| Metric | Estimate | Cost |
|--------|----------|------|
| Daily visitors | 1,000 | $0 |
| API requests/day | 1,500 | $0 (within free tier) |
| D1 reads/day | 3,000 | $0 (within free tier) |
| D1 writes/day | 1,000 | $0 (within free tier) |
| Storage | <100MB | $0 |
| **Total** | | **$0/month** |

### 10.3 Scaling Projections

| Daily Visitors | Monthly Cost | Notes |
|----------------|--------------|-------|
| 1,000 | $0 | Free tier sufficient |
| 10,000 | $5 | Workers Paid recommended |
| 100,000 | $5-25 | May need D1 paid tier |
| 1,000,000 | $25-100 | Enterprise features needed |

---

## 11. Implementation Phases

### Phase 1: Foundation (Week 1-2)

```
┌─────────────────────────────────────────────────────────┐
│ PHASE 1: FOUNDATION                                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ □ Project Setup                                          │
│   ├─ Initialize monorepo structure                       │
│   ├─ Configure TypeScript, ESLint, Prettier              │
│   └─ Set up CI/CD with GitHub Actions                    │
│                                                          │
│ □ Database                                               │
│   ├─ Create D1 database                                  │
│   ├─ Apply schema                                        │
│   └─ Test queries locally                                │
│                                                          │
│ □ Core Collectors                                        │
│   ├─ Canvas fingerprint                                  │
│   ├─ WebGL fingerprint                                   │
│   ├─ Audio fingerprint                                   │
│   ├─ Screen/Hardware info                                │
│   └─ Navigator/System info                               │
│                                                          │
│ □ Basic Worker API                                       │
│   ├─ POST /api/analyze endpoint                          │
│   ├─ Three-Lock hash calculation                         │
│   └─ D1 insert/select operations                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Phase 2: Full Collection (Week 3-4)

```
┌─────────────────────────────────────────────────────────┐
│ PHASE 2: FULL COLLECTION                                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ □ Complete 80+ Collectors                                │
│   ├─ Font detection                                      │
│   ├─ CSS media queries                                   │
│   ├─ Media codec detection                               │
│   ├─ Storage capability tests                            │
│   └─ Intl API fingerprints                               │
│                                                          │
│ □ Network Fingerprinting                                 │
│   ├─ Extract request.cf data                             │
│   ├─ TLS cipher suite capture                            │
│   ├─ ASN/Colo/Country injection                          │
│   └─ IP hashing (privacy-safe)                           │
│                                                          │
│ □ Lie Detection                                          │
│   ├─ OS consistency check                                │
│   ├─ Browser consistency check                           │
│   ├─ GPU/Platform cross-validation                       │
│   └─ Timezone verification                               │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Phase 3: Frontend UI (Week 5-6)

```
┌─────────────────────────────────────────────────────────┐
│ PHASE 3: FRONTEND UI                                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ □ Homepage                                               │
│   ├─ Hero section with live counter                      │
│   ├─ Three-Lock explanation cards                        │
│   ├─ Feature highlights                                  │
│   └─ Statistics preview                                  │
│                                                          │
│ □ Scan Flow                                              │
│   ├─ Animated loading/scanning UI                        │
│   ├─ Progress indicator (80 dimensions)                  │
│   └─ Smooth transition to results                        │
│                                                          │
│ □ Results Dashboard                                      │
│   ├─ Uniqueness score card                               │
│   ├─ Three-Lock hash display                             │
│   ├─ 80-dimension grid view                              │
│   ├─ Lie detection panel                                 │
│   └─ Share/export functionality                          │
│                                                          │
│ □ Statistics Pages                                       │
│   ├─ Browser distribution charts                         │
│   ├─ OS distribution charts                              │
│   ├─ Screen resolution stats                             │
│   └─ Geographic heatmap                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Phase 4: Polish & Launch (Week 7-8)

```
┌─────────────────────────────────────────────────────────┐
│ PHASE 4: POLISH & LAUNCH                                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ □ Performance Optimization                               │
│   ├─ Parallel collector execution                        │
│   ├─ Response time < 100ms                               │
│   ├─ Bundle size optimization                            │
│   └─ Lighthouse score > 95                               │
│                                                          │
│ □ Educational Content                                    │
│   ├─ "What is fingerprinting" page                       │
│   ├─ Individual dimension explainers                     │
│   ├─ Privacy protection guide                            │
│   └─ FAQ section                                         │
│                                                          │
│ □ Legal & Compliance                                     │
│   ├─ Privacy policy                                      │
│   ├─ Terms of service                                    │
│   ├─ GDPR compliance                                     │
│   ├─ Cookie consent banner                               │
│   └─ Opt-out mechanism                                   │
│                                                          │
│ □ Launch Checklist                                       │
│   ├─ Custom domain setup                                 │
│   ├─ SSL/TLS configuration                               │
│   ├─ Error monitoring (Sentry)                           │
│   ├─ Analytics setup                                     │
│   └─ Social sharing meta tags                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 12. Competitive Analysis

### 12.1 Feature Comparison Matrix

| Feature | AmiUnique.org | BrowserLeaks | Panopticlick | **AmiUnique.io** |
|---------|--------------|--------------|--------------|-----------------|
| Detection Dimensions | ~55 | ~40 | ~25 | **80+** |
| Canvas Fingerprint | ✅ | ✅ | ✅ | ✅ |
| WebGL Fingerprint | ✅ | ✅ | ❌ | ✅ |
| Audio Fingerprint | ✅ | ✅ | ❌ | ✅ |
| Font Detection | ✅ | ✅ | ✅ | ✅ |
| TLS/JA3 Fingerprint | ❌ | ❌ | ❌ | **✅** |
| Network Layer (ASN/Colo) | ❌ | Partial | ❌ | **✅** |
| HTTP/2/3 Protocol Detection | ❌ | ❌ | ❌ | **✅** |
| Video Codec Detection | ❌ | ❌ | ❌ | **✅** |
| CSS Media Query FP | ❌ | ❌ | ❌ | **✅** |
| Cross-Browser Tracking | ❌ | ❌ | ❌ | **✅** |
| Lie Detection | Basic | Basic | ❌ | **Advanced** |
| Real-time Stats | ✅ | ❌ | ✅ | ✅ |
| API Access | ❌ | ❌ | ❌ | **✅** |
| Response Time | ~500ms | ~300ms | ~400ms | **<100ms** |
| Open Source | ✅ | ❌ | ✅ | ✅ |

### 12.2 Unique Selling Points

1. **80+ Detection Dimensions** - Most comprehensive in the market
2. **Three-Lock System** - Novel approach to identity persistence
3. **Edge Computing** - <100ms response time globally
4. **Network Layer Fingerprinting** - Impossible to spoof from client
5. **Cross-Browser Tracking Demo** - Educational feature showing device tracking
6. **Minimal Cost** - $0-5/month infrastructure
7. **Privacy-First** - GDPR compliant with clear data handling

---

## Appendix A: Quick Start Commands

```bash
# Clone and setup
git clone https://github.com/your-org/amiunique.git
cd amiunique
pnpm install

# Development
pnpm dev              # Start all services
pnpm dev:web          # Frontend only
pnpm dev:api          # API only

# Build
pnpm build            # Build all
pnpm build:web        # Build frontend
pnpm build:api        # Build worker

# Deploy
pnpm deploy:db        # Apply D1 schema
pnpm deploy:api       # Deploy worker
pnpm deploy:web       # Deploy pages

# Test
pnpm test             # Run all tests
pnpm test:e2e         # E2E tests
```

## Appendix B: Environment Variables

```bash
# apps/web/.env.local
NEXT_PUBLIC_API_URL=https://api.amiunique.io
NEXT_PUBLIC_SITE_URL=https://amiunique.io

# apps/api (via wrangler secrets)
# wrangler secret put API_SECRET
```

## Appendix C: Cloudflare API Token Scopes

Required permissions for deployment:
- Account: Cloudflare Pages:Edit
- Account: Workers Scripts:Edit
- Account: D1:Edit
- Zone: DNS:Edit (for custom domains)

---

**Document Version**: 1.0.0
**Last Updated**: 2024-01-XX
**Author**: AmiUnique.io Team

---

*This document serves as the complete technical specification for AmiUnique.io. All implementation should follow this blueprint to ensure consistency and completeness.*
