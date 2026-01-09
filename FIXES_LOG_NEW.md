# Fixes Log

## Analysis History & Dashboard - January 9, 2026

### Changes

1. **Frontend (`frontend/src/app/analysis-history/page.tsx`)**
    * Removed "JSON yuklash" (Download JSON) button.
    * Kept "CSV yuklash" functionality.

2. **Backend (`backend/handlers/ai.go`)**
    * Fixed `GetAnalysisHistory` function to include missing columns:
        * `text_length`
        * `rhythm_score`
        * `personality_score`
        * `naturalness_score`
        * `document_type`
    * This ensures "O'rtacha ball ko'rsatkichlari" (Average scores) charts on the frontend work correctly instead of showing 0.
    * Verified that student data access is restricted by `user_id` (Security).

### Verification

* **Security**: Students cannot access others' history (filtered by `user_id` in SQL).
* **Data Integrity**: Frontend now receives all necessary score fields to render charts.
* **UI**: Export options simplified to CSV only as requested.
