A web-based platform that aggregates jobs, internships and scholarships and provides personalized recommendations to university students.

## Setup

```bash
# Database
mysql -u root -p < database/schema.sql

# Backend
cd backend && npm install && npm start

# Frontend
cd frontend && npm install && npm run dev
```

---

## Recommendation Engine

Fursa uses a **weighted scoring model** to rank every active opportunity against a student's profile. Scores are computed on demand when a student visits their Recommendations page, and the results are persisted in the `match_scores` table so they can be queried later.

### How it works

When a student requests recommendations, the engine:

1. **Loads the student's profile** — education level, academic grade, years of experience, location, and their full tag list (skills + interests).
2. **Fetches every active opportunity** — title, requirements, location, and its own tag list.
3. **Scores each opportunity** across five dimensions, then combines them into a single `total_score` (0–100).
4. **Saves the breakdown** to `match_scores` via `INSERT … ON DUPLICATE KEY UPDATE`, so re-running always reflects the latest profile.
5. **Returns opportunities sorted** by `total_score` descending.

### Scoring breakdown

| Component | Weight | How it is calculated |
|---|---|---|
| **Skills** | 50% | Jaccard-style overlap — `matched skill tags / required skill tags`. If an opportunity requires 4 skills and the student has 3 of them, this scores 75. |
| **Education** | 15% | Compares the student's education level and academic grade against the opportunity's minimums using an ordinal rank (`certificate → diploma → undergraduate → graduate` and `pass → second lower → second upper → first class`). Full score if the student meets or exceeds both thresholds. |
| **Location** | 15% | Exact string match = 100, partial substring match (e.g. "Nairobi" within "Nairobi, Kenya") = 60, no match = 0. |
| **Experience** | 10% | Proportional — `student years / required years`, capped at 100. If no minimum is set the score is 100. |
| **Interests** | 10% | Same overlap logic as Skills but applied to interest tags. |

**Formula:**

```
total = (skills × 0.50) + (education × 0.15) + (location × 0.15) + (experience × 0.10) + (interests × 0.10)
```

### Tags and the TagPicker

Both students and opportunities are tagged using a shared `tags` table. Each tag has a `type` of either `skill` or `interest`.

- **Students** select their skills and interests from the TagPicker on their profile page. These are stored in `student_tags`.
- **Organizations** attach required skills and valued interests to each opportunity via the same TagPicker when creating a posting. These are stored in `opportunity_tags`.

Because both sides draw from the same vocabulary, the engine can compute an exact set-overlap score — no fuzzy text matching or NLP required. The more precisely a student labels their profile, the better their recommendations will be.