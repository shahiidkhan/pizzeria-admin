# 🍕 Pizzeria Admin Panel

A **production-quality React.js Admin Dashboard** for a professional Pizzeria Management System. Built with modern tooling, scalable architecture, and a premium SaaS-style UI.

---

## 🚀 Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React.js | 18+ | UI Framework |
| Vite | 8+ | Build Tool & Dev Server |
| React Router DOM | 6+ | Client-side Routing |
| Tailwind CSS | 3 | Utility-first Styling |
| TanStack Table | 8 | Data Tables |
| Recharts | Latest | Analytics Charts |
| React Hook Form | Latest | Form Management |
| Zod | Latest | Schema Validation |
| Lucide React | Latest | Icon Library |

---

## ✨ Features

### 📊 Dashboard
- 6 KPI stat cards (Orders, Revenue, Products, Deals, Branches, Pending)
- Weekly Sales area chart with dual series (orders + revenue)
- Monthly Revenue bar chart with peak-month highlighting
- Popular Products donut chart
- Recent orders mini-table
- Top products by rating
- Branch performance progress bars

### 📦 Products Module
- Full TanStack Table with sorting, pagination, global filter
- Category filter chips
- Inline availability toggle
- Image preview in table
- Add/Edit forms with React Hook Form + Zod validation
- Delete confirmation modal

### 🏷️ Categories Module
- Image cards with hover scale animations
- Active/inactive status badges
- Search filtering
- Edit & delete actions

### 🎁 Deals Module
- Deal cards with product image previews
- Original vs. deal price with discount badge
- Toggle active/inactive per deal
- Multi-product selection grid in Add Deal form

### 💸 Offers Module
- Full table with expiry date coloring (red when expired)
- Discount percentage badges
- Add offer form with product selector

### 🍽️ Menu Management
- Drag-handle UI for menu ordering
- Eye toggle per item (show/hide on menu)
- Type badges (Product / Deal / Offer)
- Live visible-count summary

### 🛒 Orders Module
- Filter by status (Processing / On The Way / Delivered / Cancelled)
- Full TanStack Table with all order fields
- Detailed order page with:
  - Visual status timeline
  - Itemized bill with tax/delivery breakdown
  - Customer contact info
  - Branch info

### ⭐ Reviews Module
- Star rating filter (1–5 stars)
- Average rating display
- Customer avatar + name
- Delete review action

### 🏪 Branches Module
- 4 branch cards with detailed info
- Live open/closed toggle with animated pulse indicator
- Orders today + revenue metrics
- Branch manager profile

### 👤 Admin Users Module
- Summary stat cards (Total / Super Admin / Branch Manager)
- Full admin table with role badges and last login

### ⚙️ Settings Page
- **Profile** tab — avatar, name, email, phone, password change
- **Notifications** tab — granular toggle controls
- **Theme** tab — accent color picker + density selector
- **Preferences** tab — app behavior toggles

### 🔐 Login Page
- Split-panel design (branding left / form right)
- React Hook Form + Zod validation
- Show/hide password toggle
- Remember me checkbox
- Forgot password link
- Demo credentials pre-filled

---

## 📁 Project Structure

```
src/
├── assets/
├── components/
│   ├── charts/          # WeeklySalesChart, MonthlyRevenueChart, PopularProductsChart
│   ├── common/          # StatCard, StatusBadge, PageHeader, LoadingSpinner, EmptyState, ConfirmDialog
│   ├── forms/           # FormInput, FormSelect, FormTextarea, FormToggle, ImageUpload
│   ├── layout/          # Sidebar, Navbar
│   └── tables/          # DataTable (TanStack Table wrapper)
├── constants/
│   └── navigation.js    # Nav items + branch list
├── data/                # Mock data files (products, categories, deals, offers, orders, reviews, branches, admins)
├── hooks/
│   ├── useTheme.js      # Dark/light mode with localStorage
│   └── useSidebar.js    # Sidebar collapse + mobile drawer
├── layouts/
│   └── AdminLayout.jsx  # Sidebar + Navbar + Outlet wrapper
├── pages/
│   ├── auth/            # LoginPage
│   ├── admins/          # AdminsPage
│   ├── branches/        # BranchesPage
│   ├── categories/      # CategoriesPage, AddCategoryPage
│   ├── dashboard/       # DashboardPage
│   ├── deals/           # DealsPage, AddDealPage
│   ├── menu/            # MenuPage
│   ├── offers/          # OffersPage, AddOfferPage
│   ├── orders/          # OrdersPage, OrderDetailPage
│   ├── products/        # ProductsPage, AddProductPage, EditProductPage
│   ├── reviews/         # ReviewsPage
│   └── settings/        # SettingsPage
├── routes/
│   └── AppRoutes.jsx    # All route definitions
├── services/
│   └── apiPlaceholders.js # Firebase-ready CRUD stubs
├── utils/
│   └── cn.js            # Tailwind class merger
├── App.jsx
└── main.jsx
```

---

## 🔗 Route Map

| Path | Page |
|------|------|
| `/login` | Login Page |
| `/dashboard` | Dashboard |
| `/products` | Products List |
| `/products/add` | Add Product |
| `/products/edit/:id` | Edit Product |
| `/categories` | Categories |
| `/categories/add` | Add Category |
| `/deals` | Deals |
| `/deals/add` | Add Deal |
| `/offers` | Offers |
| `/offers/add` | Add Offer |
| `/menu` | Menu Management |
| `/orders` | Orders List |
| `/orders/:id` | Order Detail |
| `/reviews` | Reviews |
| `/branches` | Branches |
| `/admins` | Admin Users |
| `/settings` | Settings |

---

## 🛠️ Setup Instructions

```bash
# 1. Navigate into the project
cd pizzeria-admin

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev

# 4. Open in browser
# http://localhost:5173
```

**Demo login credentials (pre-filled):**
- Email: `superadmin@pizzeria.com`
- Password: `admin123`

---

## 🔥 Architecture Notes

### Separation of Concerns
- **Mock data** is isolated in `src/data/` — never inline in components
- **Service layer** in `src/services/apiPlaceholders.js` provides CRUD stubs ready for Firebase
- **Reusable components** in `src/components/` are generic and data-agnostic
- **Hooks** encapsulate UI state (sidebar, theme) independently

### Scalability
- Each page module is self-contained in its own folder
- TanStack Table is wrapped in a single `DataTable` component — one upgrade point
- Forms use Zod schemas that can be extended or composed
- CSS variables power the entire theme system — one file to update

---

## 🔮 Future Firebase Integration Plan

Replace mock data with Firestore by updating `src/services/apiPlaceholders.js`:

```js
// Before (mock):
export const ProductService = {
  getAll: () => Promise.resolve(products),
};

// After (Firebase):
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export const ProductService = {
  getAll: () => getDocs(collection(db, 'products'))
    .then(snap => snap.docs.map(d => ({ id: d.id, ...d.data() }))),
};
```

Steps:
1. Install `firebase` package
2. Create `src/firebase/config.js` with your Firebase project config
3. Update each service in `apiPlaceholders.js` with Firestore queries
4. Replace mock data imports in pages with service calls + `useState/useEffect`

---

## 📱 Responsive Design

| Breakpoint | Behavior |
|-----------|---------|
| Mobile (`< 1024px`) | Sidebar hidden, hamburger menu opens a slide-in drawer |
| Tablet (`768–1024px`) | Collapsible sidebar, responsive grid layouts |
| Desktop (`> 1024px`) | Full sidebar, collapsible to icon-only mode |

---

*Built with ❤️ using React + Vite + Tailwind CSS*
"# pizzeria-admin" 
