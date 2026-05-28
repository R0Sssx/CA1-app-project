# Skincare Routine Log App Plan

## 1. App Title
**FloreceS**

## 2. App Theme
A personal life tracker web application for logging skincare routines.

## 3. Purpose
This app helps users record the skincare products they used, the condition of their skin on that day, and the results they noticed after the routine.

## 4. Coding Languages and Technologies
Based on the CA1 brief, the app will use:
- **Node.js**
- **Express**
- **EJS Template Engine**
- **Bootstrap** (layout utilities; custom CSS for the FloreceS design system)
- **HTML / CSS / JavaScript**
- **Google Fonts** — Cormorant Garamond (display) and DM Sans (UI)
- **Google Gemini API** — AI Skin Advisor (bonus feature; server-side proxy)

## 5. CA1 Brief Compliance
This app follows the CA1 requirements because it:
- Uses a personal life tracker theme.
- Stores data in **in-memory arrays** only.
- Uses **GET and POST** methods only.
- Does **not** use a database.
- Uses **Node.js, Express, and EJS**.
- Includes **multiple web pages** rendered with EJS.
- Includes one **additional feature designed by me**.

## 6. Main User Problem
Many people use skincare products but forget:
- what they applied,
- how their skin felt that day,
- and whether the products helped or caused irritation.

This app solves that by giving them one simple place to track their skincare history.

## 7. Core Data Fields
Each skincare log entry will contain at least three meaningful attributes, such as:
- Date
- Skin condition that day
- Products used
- Results / notes

Optional extra fields:
- Skin type
- Routine time (morning / night)
- Rating
- Irritation level
- Product image (optional file upload)
- Result image (optional file upload)

## 8. Main Pages
Shared chrome across pages: sticky rose-tinted navigation (🌸 + FloreceS brand, Dashboard · Logs · Add), editorial page headers, and custom styling.

### Home Page (Dashboard)
- Introduces the app with editorial headline and subtitle.
- Stats strip: total logs, average rating, logging streak.
- Navigation to the log list and add log form.
- Decorative watermark flower (subtle, low opacity).

### Log List Page (Routines)
- Page header: “Skincare Logs” with italic rose accent on “Logs”, subtitle, and pill-shaped **Add New Log** CTA.
- Stats strip above search (same three cards as dashboard context).
- Search panel: product text, skin condition text, routine type dropdown (All / Morning / Night), **Find** button.
- Logs table: Date · Routine · Condition · Result · Rating · Actions.
- Routine badges (Morning = amber pill, Night = purple pill), star ratings, row hover highlight.
- View / Edit / Delete action buttons per row.
- Logs sorted **newest first** by date.
- **Success messages** after add, edit, or delete (`?saved=1`, `?updated=1`, `?deleted=1`).
- **Delete confirmation** before removing a log (logs table and detail page).

### Add Log Page
- HTML form for creating a new skincare log.
- Optional file uploads: product image, result image (`jpeg`, `png`, `webp`, `gif`).
- Uses POST to submit data (multipart if images included).

### Edit Log Page
- HTML form for updating an existing log.
- Pre-fills the current values; same upload fields as add.
- Uses POST to save changes.

### Detail Page
- Shows full information for one skincare log.
- Displays product and result image previews when attachments exist.

## 9. Additional Feature
### Search and Filter
This is the extra feature designed by me.

Users can:
- search by product name,
- filter by skin condition,
- filter by routine type such as morning or night.

This improves usability and makes the app more personal and useful.

> **Note:** Search & filter is the **CA1 additional feature**. The AI Skin Advisor below is a **bonus extension** beyond the CA1 brief.

## 10. Bonus Feature: AI Skin Advisor

### Overview
An AI-powered **Skin Advisor** chat panel lets users describe skin concerns in text and optionally upload a skin photo. **Google Gemini** analyzes the input and returns a warm, structured reply: skin assessment, product recommendations, and a simple morning/night routine.

This feature is **not** the CA1 “designed by me” feature (that is search & filter). It extends FloreceS with intelligent guidance while keeping log data in the in-memory array.

### UI (implemented)
- **Floating action button (🌸)** — fixed bottom-right on every page; matches header branding
- **Slide-in drawer panel** — chat-style layout, max-width ~420px on mobile
- **Chat thread** — scrollable messages; 🌸 for AI, 👤 for user
- **Image upload** — 📷 button; inline preview before send; remove photo option
- **Text input + Send** — Enter to send (Shift+Enter for new line)
- **Clear chat** — resets conversation and uploaded image
- **Loading state** — pulsing dots while waiting for Gemini
- **Styling** — `public/skin-advisor/skin-advisor.css`; light rose (`#edc4b8`), cream background, Cormorant Garamond + DM Sans

Wired in `views/partials/header.ejs` (CSS) and `views/partials/footer.ejs` (JS).

### Backend (implemented)
- **Route:** `POST /api/skin-advisor` (`routes/skin-advisor.js`)
- **Model:** `gemini-2.5-flash` via Google Generative Language API
- **API key:** `GEMINI_API_KEY` in `.env` (see `.env.example`) — **never** hardcoded in client JS
- **Proxy pattern:** Browser `fetch` → Express route → Gemini; key stays on server

### Request flow
1. User enters text and/or uploads JPG, PNG, or WEBP.
2. Client converts image to **raw base64** (no `data:image/...;base64,` prefix).
3. `POST /api/skin-advisor` with JSON: `{ text, hasImage, imageBase64, mimeType }`.
4. Server builds `system_instruction` + `contents` (image `inline_data` + text when applicable).
5. Server returns `{ reply }` or `{ error }` with appropriate HTTP status.

### AI response format
The system prompt asks Gemini to provide:
1. Brief skin assessment (2–3 sentences)
2. Three product recommendations (cleanser, treatment, moisturizer) with reasons
3. Simple morning + night routine suggestion

Client renders `**bold**` as `<strong>` and newlines as `<br>`.

### Error handling (implemented)
- Missing `GEMINI_API_KEY` → friendly “not configured” message
- Empty text and no image → validation error
- Invalid image MIME type → rejected server-side
- No `candidates` in Gemini response (e.g. blocked image) → user-friendly in-chat error
- Network/API failures → error bubble in chat

### File structure
```bash
public/skin-advisor/
  skin-advisor.js    # FAB, drawer DOM, upload, fetch, render
  skin-advisor.css   # Scoped drawer/FAB styles
routes/
  skin-advisor.js    # Express router, Gemini API call
.env                 # GEMINI_API_KEY (local only, not committed)
.env.example         # Placeholder for setup instructions
```

### Technologies
- Vanilla JavaScript (no React)
- `fetch` from client; `fetch` from server to Gemini REST API
- Express JSON body parser (10mb limit for base64 images)

### Demo notes
- Requires a valid Google AI Studio API key in `.env`
- If the API is unavailable during demo, core CRUD + search/filter still satisfy CA1

## 11. Suggested Item Structure
Each log object in the array can look like this:
```javascript
{
  id: 1,
  date: '2026-05-19',
  routineType: 'Night',
  skinCondition: 'Dry and a little red',
  productsUsed: 'Cleanser, toner, moisturiser',
  result: 'Skin felt calmer after routine',
  rating: 4
}
```

## 12. In-Memory Array Plan
The app will store all skincare logs inside a JavaScript array.

Example:
```javascript
let skincareLogs = [];
```

Because the CA1 brief requires in-memory arrays, this data will reset when the server restarts.

## 13. Proposed File Structure
```bash
FloreceS/
  app.js
  data/
    logs.js
  views/
    home.ejs
    logs.ejs
    add.ejs
    edit.ejs
    detail.ejs
    partials/
      header.ejs      # nav, logo SVG, Google Fonts links
      footer.ejs
  public/
    css/
      style.css       # design tokens, components, animations
    js/
      app.js          # delete confirmation on log forms
    skin-advisor/     # AI Skin Advisor (FAB, drawer, API client)
    uploads/          # stored product/result images
  routes/
    skin-advisor.js   # Gemini API route
```

## 14. Suggested Routes
All routes use GET or POST only.

- `GET /` - Home page
- `GET /logs` - View all logs
- `GET /logs/add` - Show add form
- `POST /logs/add` - Create new log
- `GET /logs/:id` - View log details
- `GET /logs/edit/:id` - Show edit form
- `POST /logs/edit/:id` - Update log
- `POST /logs/delete/:id` - Delete log
- `GET /logs/search` - Search and filter logs
- `POST /api/skin-advisor` - AI Skin Advisor (Gemini)

After add, edit, or delete, the app redirects to `/logs` with a query flag for flash messages: `?saved=1`, `?updated=1`, or `?deleted=1`.

## 15. Implemented Features

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 1 | Add log | ✅ Implemented | Create entry with date, routine, condition, products, result, rating, optional photos |
| 2 | Edit log | ✅ Implemented | Update existing entry; form pre-filled |
| 3 | Delete log | ✅ Implemented | Remove entry; **confirmation dialog** before delete |
| 4 | View all logs | ✅ Implemented | Table on `/logs`; **sorted newest first** |
| 5 | View log detail | ✅ Implemented | Full log view with image previews |
| 6 | Search & filter | ✅ Implemented | By product, skin condition, routine type (CA1 additional feature) |
| 7 | Dashboard (home) | ✅ Implemented | Stats, hero, recent routines (latest 3) |
| 8 | Stats summary | ✅ Implemented | Total logs, average rating, logging streak |
| 9 | Product image upload | ✅ Implemented | Optional on add/edit; preview on detail |
| 10 | Result image upload | ✅ Implemented | Optional on add/edit; preview on detail |
| 11 | Photo badges | ✅ Implemented | Indicators on logs table when images attached |
| 12 | Routine badges | ✅ Implemented | Morning / Night colour pills |
| 13 | Star ratings | ✅ Implemented | ★ display on table, cards, and detail |
| 14 | Formatted dates | ✅ Implemented | Readable dates (e.g. May 18, 2026) |
| 15 | Success messages | ✅ Implemented | Banner after save, update, or delete on logs page |
| 16 | Delete confirmation | ✅ Implemented | `confirm()` via `public/js/app.js` |
| 17 | AI Skin Advisor | ✅ Implemented | Floating 🌸 chat; text + photo analysis (Gemini API) |
| 18 | 404 page | ✅ Implemented | Custom not-found page |
| 19 | In-memory storage | ✅ Implemented | `data/logs.js` array; resets on server restart |

### UX quick wins (implemented)
- **Sort logs newest first** — `sortLogsByDateNewest()` in `app.js` before rendering `/logs` and search results.
- **Flash messages** — Redirect with `?saved=1`, `?updated=1`, or `?deleted=1`; green alert on logs page.
- **Delete confirmation** — Browser confirm on all `.delete-log-form` submits (logs table + detail page).

### Planned but not yet implemented
- Skin type and irritation level form fields
- Insights and Profile navigation pages

## 16. Feature Breakdown (summary)
### View Logs
Shows all skincare entries in a table, newest date first.

### Add Logs
Allows users to record a new skincare routine; redirects with success message.

### Edit Logs
Allows users to correct or update a previous entry; redirects with success message.

### Delete Logs
Allows users to remove an entry after confirming in a dialog.

### Search and Filter
Allows users to find logs based on products, skin condition, or routine type.

### AI Skin Advisor (bonus)
Floating 🌸 chat on all pages; text and optional skin photo sent to Gemini via `POST /api/skin-advisor`; replies shown in the drawer. See **Section 10** for full specification.

## 17. UI Design Specification

# 🌸 FloreceS — UI Redesign Specification

> A modern, organic skincare logging web app with an editorial aesthetic, blooming flower branding, and warm rose-gold palette.

---

### Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Brand Identity](#brand-identity)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Components](#components)
   - [Navigation](#navigation)
   - [Page Header](#page-header)
   - [Stats Strip](#stats-strip)
   - [Search Panel](#search-panel)
   - [Add/Edit Form Uploads](#addedit-form-uploads)
   - [Logs Table](#logs-table)
6. [Motion & Animation](#motion--animation)
7. [Improvements Over Original](#improvements-over-original)

---

### Design Philosophy

FloreceS is a personal skincare companion. The redesign moves away from a generic enterprise look toward something that feels **intentional, warm, and beautiful** — like the skincare ritual itself.

**Core principles:**
- **Organic over corporate** — soft curves, warm tones, natural textures
- **Editorial typography** — serif display fonts paired with clean sans-serif body text
- **Purposeful motion** — subtle animations that delight without distracting
- **Hierarchy through restraint** — whitespace and type weight do the heavy lifting

---

### Brand Identity

#### Logo

The FloreceS logo pairs an animated SVG blooming flower with a serif wordmark.

```
🌸  FloreceS
```

**Flower construction (SVG):**
- 8 overlapping ellipse petals rotated at 45° increments
- Petal colors alternate between `#e8c4b0` (blush) and `#edc4b8` (rose)
- Layered opacity (0.45–0.9) creates depth and translucency
- Gold center circle `#c9a96e` with cream inner dot and rose core
- Five stamens (small circles) arranged around the center

**Logo animation:**
- Slow bloom pulse using CSS `@keyframes`
- Scale: `1.0 → 1.06`, Rotation: `0° → 6°`
- Duration: 3s, direction: alternate, timing: ease-in-out

#### Wordmark

Single wordmark — do not split the name across spans.

| Text | Font | Weight | Size | Color |
|------|------|--------|------|-------|
| FloreceS | Cormorant Garamond | 600 | 2rem (nav) | `#2c2825` (Charcoal) |

---

### Color System

| Token | Hex | Usage |
|-------|-----|-------|
| `--cream` | `#faf7f2` | Page background |
| `--warm-white` | `#f5f0e8` | Input backgrounds |
| `--blush` | `#e8c4b0` | Petal light, accents |
| `--rose` | `#edc4b8` | Primary CTA, active states |
| `--deep-rose` | `#d9a898` | Hover state for CTAs |
| `--petal-pink` | `#f2ddd5` | Table row hover |
| `--sage` | `#8a9e8c` | Secondary text, Find button hover |
| `--deep-sage` | `#5c7060` | Find button default |
| `--charcoal` | `#2c2825` | Primary text |
| `--soft-brown` | `#7a6358` | Labels, secondary text |
| `--gold` | `#c9a96e` | Star ratings, center dot |
| `--light-gold` | `#e8d5b0` | Input borders, dividers |

---

### Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Display / H1 | Cormorant Garamond | 300 (italic for accent) | 3.4rem |
| Logo | Cormorant Garamond | 600 | 1.55rem |
| Date cell | Cormorant Garamond | 400 | 1.05rem |
| Stat values | Cormorant Garamond | 300 | 2.2rem |
| Body / UI | DM Sans | 300–500 | 0.85–0.92rem |
| Labels | DM Sans | 500 (uppercase) | 0.7–0.72rem |

**Font imports (Google Fonts):**
```
Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400
DM+Sans:wght@300;400;500
```

---

### Components

#### Navigation

A sticky frosted-glass top bar that persists on scroll.

**Specs:**
- Height: `68px`
- Background: `rgba(250, 247, 242, 0.88)` with `backdrop-filter: blur(18px)`
- Bottom border: `1px solid rgba(237, 196, 184, 0.15)`
- Padding: `0 2.5rem`

**Contents:**
- Left: Logo (flower icon + wordmark)
- Right: Nav links — Dashboard · Routines · Insights · Profile
  - Font: DM Sans, 0.85rem, uppercase, letter-spacing 0.08em
  - Color: `--soft-brown` → hover `--rose`

---

#### Page Header

Full-width section with editorial headline, subtitle, and CTA.

**Layout:** Flex row, `align-items: flex-end`, `justify-content: space-between`

**Headline:**
```
Skincare Logs       ← "Logs" is italic rose-colored
Search, filter, and review your routine history.
```

**Decorative element:**
- Large 12-petal SVG flower positioned `right: -60px, top: -60px`
- Opacity: `0.07` (very subtle watermark)
- Animated with `slow-spin` — full 360° rotation over 20s

**Add New Log button:**
- Background: `--rose`, border-radius: `50px` (pill shape)
- Box shadow: `0 4px 20px rgba(237, 196, 184, 0.35)`
- Hover: `--deep-rose`, translateY(-2px), stronger shadow
- Includes `+` icon (SVG, 16×16)

---

#### Stats Strip

Three summary cards displayed in a 3-column grid above the search panel.

| Stat | Value | Subtext |
|------|-------|---------|
| Total Logs | 24 | ↑ 3 this week |
| Avg. Rating | 3.8 | out of 5 stars |
| Streak | 7 | days logged in a row 🌸 |

**Card specs:**
- Background: white
- Border-radius: `16px`
- Border: `1px solid rgba(237, 196, 184, 0.1)`
- Box shadow: `0 2px 12px rgba(44, 40, 37, 0.05)`
- Label: DM Sans, uppercase, `--soft-brown`
- Value: Cormorant Garamond, 2.2rem, weight 300

---

#### Search Panel

A single white card containing three filter inputs and a Find button.

**Layout:** CSS Grid, `1fr 1fr 1fr auto`, gap `1rem`

| Field | Type | Placeholder |
|-------|------|-------------|
| Product | Text input | "Cleanser, moisturizer…" |
| Skin Condition | Text input | "Dry, oily, irritated…" |
| Routine Type | Select dropdown | All / Morning / Night |

**Input styles:**
- Border: `1.5px solid --light-gold`
- Border-radius: `10px`
- Background: `--cream` → focus: white
- Focus ring: `0 0 0 3px rgba(237, 196, 184, 0.12)`

**Find button:**
- Background: `--deep-sage`
- Hover: `--sage`, translateY(-1px)
- Includes search icon (SVG)
- Text: uppercase, letter-spacing 0.06em

---

#### Add/Edit Form Uploads

The add and edit log forms include optional image uploads for richer skincare records.

**Upload fields:**
- `Product image` — upload a photo of the products used or routine layout
- `Result image` — upload a visual record of the skin result or notes board

**Field design:**
- Input type: `file`
- Accepts: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Border: `1.5px solid --light-gold`
- Border-radius: `14px`
- Background: `--cream`
- On focus: same focus ring as other inputs

**Attachment display:**
- Show previews on the detail page with rounded corners and soft border
- Use a small badge in the logs table to indicate attached images
- Keep uploads optional so the form remains lightweight

---

#### Logs Table

A `border-collapse: separate` table with rounded corners on first/last cells.

**Columns:** Date · Routine · Condition · Result · Rating · Actions

##### Date Cell
- Font: Cormorant Garamond, 1.05rem
- Format: `Month DD, YYYY` (e.g. "May 18, 2026")

##### Routine Badge
Pill-shaped badge with colour coding:

| Type | Background | Text color |
|------|-----------|------------|
| Night | `#e8e0f5` | `#6b4fa0` (purple) |
| Morning | `#fde8c8` | `#b36a1a` (amber) |

##### Rating Display
- Number in Cormorant Garamond (`/5` in light gray)
- Star row: filled `★` in `--gold`, empty `★` in `#ddd`

##### Action Buttons

| Button | Style |
|--------|-------|
| View | Rose border + text, fills rose on hover |
| Edit | Light gold border, soft-brown text |
| Delete | Transparent border, red text on light red bg |

**Row hover:** background transitions to `--petal-pink`

---

### Motion & Animation

| Animation | Element | Duration | Detail |
|-----------|---------|----------|--------|
| `bloom` | Flower logo | 3s alternate | scale 1→1.06, rotate 0→6° |
| `slow-spin` | Header deco flower | 20s linear loop | Full 360° rotation |
| `fadeUp` | Page sections | 0.5–0.55s | opacity 0→1, translateY 16px→0 |

**Stagger delays (fadeUp):**
```
Page header  → 0s delay
Stats strip  → 0.10s delay
Search panel → 0.18s delay
Logs section → 0.26s delay
```

---

### Improvements Over Original

| Aspect | Before | After |
|--------|--------|-------|
| Color palette | Corporate blue + gray | Warm rose, cream, sage, gold |
| Logo | Plain text "FloreceS" | Animated blooming flower SVG |
| Typography | System fonts | Cormorant Garamond + DM Sans |
| Navigation | Hamburger menu only | Full nav links + frosted glass |
| Data overview | None | Stats strip (logs, rating, streak) |
| Routine badges | Plain text | Color-coded pill badges |
| Date format | `2026-05-18` (ISO) | `May 18, 2026` (readable) |
| Ratings | `4 / 5` text only | Number + star visual |
| Row interaction | None | Blush pink hover highlight |
| Page entrance | Instant | Staggered fade-up animation |
| Decorative elements | None | Watermark flower, petal accents |

---

*FloreceS UI Redesign — May 2026*

## 18. Why This App Fits the CA1 Brief
This app is suitable because it is:
- simple,
- personal,
- easy to demonstrate,
- and clearly related to daily life.

It also gives you enough content to explain your design decisions in the reflection journal.

## 19. Reflection Journal Points
You can explain:
- why you chose skincare tracking,
- how the in-memory array works,
- how each route is connected,
- how EJS templates display logs,
- how your search/filter feature improves the app (CA1 additional feature),
- how the AI Skin Advisor works (bonus: Express proxy, Gemini API, multimodal input),
- and why the UI redesign (palette, typography, stats strip, animations) supports usability and brand identity.

## 20. Summary
FloreceS is a skincare routine log web app that helps users track products, skin condition, and results. It fully matches the CA1 requirements by using Node.js, Express, EJS, Bootstrap, GET/POST methods, and in-memory arrays only. The **additional CA1 feature** is search & filter on logs. The interface follows the warm editorial UI design in Section 17 — light rose palette, FloreceS branding, stats overview, search panel, and an enhanced logs table with badges, stars, and optional image attachments. Implemented UX improvements include newest-first sorting, success messages after CRUD actions, and delete confirmation. The **AI Skin Advisor** (Section 10) adds optional Gemini-powered skincare guidance via a floating 🌸 chat panel with text and photo analysis.