# Profile Storage & Migration Architecture

## 1. Storage Abstraction Layer

Persistent computer profiles are managed via a dedicated storage abstraction layer in `lib/comparison/storage.ts`:
- **Anonymous Local Persistence**: Stored in `localStorage` under key `cbs_saved_comparisons_v1`.
- **Zero Cookie Usage**: Cookies are strictly reserved for consent preferences (`cbs_consent_v1`) and never used for hardware profiles.
- **Provider Agnostic**: The UI components interact exclusively with `getComparisonSet()`, `addComputerToComparison()`, and `subscribeToComparisonSet()`, allowing future seamless migration to authenticated cloud databases (PostgreSQL/Prisma) without UI rewrites.

---

## 2. Hard 3-Slot Quota Enforcement

- Maximum of **3 computer profiles** can be saved simultaneously.
- Attempting to save a 4th computer raises a clear error: `Maximum of 3 computers can be saved for comparison. Please remove or replace an existing computer.`
- Slot management operations supported:
  - **Save Profile**
  - **Restore / Edit Profile**
  - **Rename Profile**
  - **Duplicate Profile**
  - **Delete Profile**
  - **Clear All Profiles**

---

## 3. JSON Export & Import Format

Profiles and comparison sets can be exported and imported as structured JSON:
- Version identifier (`schemaVersion: 1`).
- Validated at every boundary using Zod schemas (`migrateAndValidateComputerProfile`).
- Backward compatibility adapter automatically converts legacy nested `HardwareProfile` payloads into canonical `SavedComparisonHardware`.
