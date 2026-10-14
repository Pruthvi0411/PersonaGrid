# Workspace Governance & Frozen UI Policy

## 🔒 FROZEN UI BOUNDARY (STRICT)

The user has explicitly FROZEN the UI for the **Landing Page** and the **Login Page**.
**DO NOT modify any of the following files unless the user explicitly requests changes to them:**

### 1. Landing Page UI (FROZEN)
* `src/app/page.tsx`
* `src/components/ui/prisma-hero.tsx`

### 2. Login Page UI (FROZEN)
* `src/app/login/page.tsx`
* `src/components/ui/auth-fuse.tsx`
* `src/components/ui/glass-radio-group.tsx`

### 3. Global Theme & Styles (LOCKED)
* `src/app/globals.css` (Do not alter existing tokens/styles for the landing page or login page)

---

### Permitted Editing Areas:
* **Persona Studio**: `src/app/studio/`, `src/components/ui/persona-studio.tsx`, `src/components/ui/draggable-widget-grid.tsx`, `src/components/ui/demo.tsx`
* **Backend Services & APIs**: `main.py`, `vector_service.py`, `ledger_service.py`, database schemas, etc.
* Any new pages or features specifically requested by the user.
