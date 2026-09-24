# NDL Staff Applications Announcement — TikTok Shot List & Production Package

**Theme:** Dark Mode Only  
**Target Format:** Vertical 9:16 (1080 × 1920 @ 60 FPS)  
**Total Production Duration:** ~25.0 seconds  
**Recorded Against:** NDL v1.6.0 Local High-Fidelity Production Environment  

---

## 1. Raw Clips Manifest (`/video/application-announcement/raw/`)

| Filename | Duration | Page URL | Action Performed | Demo Account | Suggested Overlay Text |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`01_home_hook.mp4`** | 1.8s | `/` | Static branding pause (0.4s) then smooth downward glide revealing top Demonlist thumbnails. | None | `NDL STAFF APPLICATIONS` |
| **`02_applications_open.mp4`** | 3.0s | `/applications` | Header framing then smooth scroll revealing the 3 open role cards with cyan 'Apply Now' buttons. | Guest / Logged out | `APPLICATIONS ARE OPEN` |
| **`03_roles.mp4`** | 3.0s | `/applications` | Slow scroll across List Reviewer, List Moderator, and Beta Tester cards with readable requirements. | Guest / Logged out | `REVIEWERS • MODS • BETA TESTERS` |
| **`04_reviewer_form.mp4`** | 2.3s | `/applications` → `/applications/list-reviewer` | Mouse moves to 'Apply Now' button on List Reviewer card, clicks, and transitions into the application form. | Guest / Logged out | `QUICK & CLEAN APPLICATION` |
| **`05_application_questions.mp4`** | 4.5s | `/applications/list-reviewer` | Smooth scroll through scenario questions, rules familiarity choice, conflict of interest, and availability. | `@nexusgd` (Draft) | `APPLY DIRECTLY ON WEBSITE` |
| **`06_autosave.mp4`** | 2.8s | `/applications/list-reviewer` | Applicant types answer into question textarea; pauses; debounced autosave completes showing saved status. | `@nexusgd` (Draft) | `INSTANT DRAFT AUTOSAVE` |
| **`07_my_applications.mp4`** | 2.8s | `/applications/mine` | User dashboard displaying submitted application, submission timestamp, and 'SUBMITTED' status badge. | `@aerogd` (Submitted) | `TRACK YOUR STATUS LIVE` |
| **`08_admin_dashboard.mp4`** | 3.5s | `/admin/applications` | Admin management view displaying openings, applicant counts, and status breakdowns (Submitted, Shortlisted). | `@cattw` (Admin) | `REAL APPLICATION SYSTEM` |
| **`09_review_application.mp4`** | 3.5s | `/admin/applications/[id]/submissions/[vortexId]` | Admin inspecting shortlisted applicant VortexGD, reading scenario responses, and viewing private notes. | `@vortexgd` (Demo) | `THOROUGH CANDIDATE EVALUATION` |
| **`10_compare_candidates.mp4`** | 3.5s | `/admin/applications/[id]/compare?ids=...` | Side-by-side response comparison between candidate submissions for direct evaluation. | VortexGD & Solaris_GD | `SIDE-BY-SIDE REVIEW` |
| **`11_accept_role.mp4`** | 3.0s | `/admin/applications/[id]/submissions/[novaId]` | Admin clicks 'Accept & Grant Role', confirmation dialog appears, confirms accept, and role status updates. | `@novagd` (Demo) | `ONE-CLICK ROLE ONBOARDING` |
| **`12_beta_feedback.mp4`** | 3.0s | `/beta/feedback` | Beta Tester feedback hub showcasing bug reports, feature suggestions, and workflow tracking. | `@cattw` (Staff) | `DEDICATED BETA HUB` |
| **`13_final_cta.mp4`** | 2.5s | `/applications` | Applications overview framing all three open positions with clear call-to-action hold. | Guest / Logged out | `APPLY NOW: nerfeddemonlist.net` |

---

## 2. B-Roll Footage (`/video/application-announcement/broll/`)

| Filename | Duration | Viewport | Subject / Focus |
| :--- | :--- | :--- | :--- |
| **`B1_demonlist_scroll.mp4`** | 2.0s | 430 × 764 (9:16) | Smooth dark mode Demonlist scroll showcasing large responsive 16:9 thumbnails. |
| **`B2_mobile_applications.mp4`** | 3.0s | 375 × 667 | Mobile viewport scroll of the staff applications page. |
| **`B3_mobile_form.mp4`** | 3.0s | 375 × 667 | Mobile viewport scroll of the interactive application question form. |
| **`B4_admin_create_opening.mp4`** | 3.0s | 430 × 764 (9:16) | Admin opening creation interface showing role template picker. |
| **`B5_question_builder.mp4`** | 3.0s | 430 × 764 (9:16) | Question builder interface showing custom question prompts and order controls. |
| **`B6_statuses.mp4`** | 2.0s | 430 × 764 (9:16) | Close-up view of status pills across submitted and shortlisted candidates. |

---

## 3. Edited TikTok Preview (`ndl-applications-tiktok-preview.mp4`)

- **Duration:** 25.0 seconds
- **Resolution:** 1080 × 1920 (Vertical 9:16)
- **Framerate:** 60 FPS
- **Color Profile:** Dark Mode Native, yuv420p
- **Audio:** Clean website footage (music to be added inside TikTok / editor)
- **Editing Structure:**
  - `0.0s – 1.5s`: Hook — Brand title card over Demonlist header
  - `1.5s – 4.0s`: Announcement — Applications open headline & card intro
  - `4.0s – 6.5s`: Role Showcase — Reviewers, Moderators, Beta Testers
  - `6.5s – 10.0s`: Form Polish — Scenario questions & single choice options
  - `10.0s – 12.0s`: Autosave — Applicant live response typing and saved indicator
  - `12.0s – 15.0s`: Staff System — Admin dashboard & applicant counts
  - `15.0s – 18.0s`: Evaluation — Side-by-side candidate comparison
  - `18.0s – 20.5s`: Decision — 'Accept & Grant Role' confirmation
  - `20.5s – 22.5s`: Beta System — Bug reporting and feature testing hub
  - `22.5s – 25.0s`: Final Call-to-Action — Applications open now hold

---

## 4. Safety & Privacy Compliance

- [x] **Zero Real Emails:** Only verified mock addresses (`*@demo.local`, `*@demonlist.local`) used.
- [x] **Zero Real Tokens / Passwords:** Session tokens injected via Playwright HTTP context cookies.
- [x] **Realistic Geometry Dash Content:** Real community terminology (TPS bypass, audible clicks, frame cuts, Geode mods).
- [x] **No Browser UI / DevTools:** Clean headless rendering with native device scale factor 2.5.
- [x] **No Light Mode Regressions:** Forced dark theme via localStorage and document dataset.
