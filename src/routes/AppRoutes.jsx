// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';

import LoginPage       from '../pages/auth/LoginPage';
import DashboardPage   from '../pages/dashboard/DashboardPage';

import ProductsPage    from '../pages/products/ProductsPage';
import AddProductPage  from '../pages/products/AddProductPage';
import EditProductPage from '../pages/products/EditProductPage';

import CategoriesPage  from '../pages/categories/CategoriesPage';
import AddCategoryPage from '../pages/categories/AddCategoryPage';

import DealsPage       from '../pages/deals/DealsPage';
import AddDealPage     from '../pages/deals/AddDealPage';

import OffersPage      from '../pages/offers/OffersPage';
import AddOfferPage    from '../pages/offers/AddOfferPage';

import MenuPage        from '../pages/menu/MenuPage';

import OrdersPage      from '../pages/orders/OrdersPage';
import OrderDetailPage from '../pages/orders/OrderDetailPage';

import ReviewsPage     from '../pages/reviews/ReviewsPage';
import BranchesPage    from '../pages/branches/BranchesPage';
import AdminsPage      from '../pages/admins/AdminsPage';
import SettingsPage    from '../pages/settings/SettingsPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected (layout wrapper) */}
      <Route element={<AdminLayout />}>
        <Route path="/dashboard"            element={<DashboardPage />} />

        <Route path="/products"             element={<ProductsPage />} />
        <Route path="/products/add"         element={<AddProductPage />} />
        <Route path="/products/edit/:id"    element={<EditProductPage />} />

        <Route path="/categories"           element={<CategoriesPage />} />
        <Route path="/categories/add"       element={<AddCategoryPage />} />

        <Route path="/deals"                element={<DealsPage />} />
        <Route path="/deals/add"            element={<AddDealPage />} />

        <Route path="/offers"               element={<OffersPage />} />
        <Route path="/offers/add"           element={<AddOfferPage />} />

        <Route path="/menu"                 element={<MenuPage />} />

        <Route path="/orders"               element={<OrdersPage />} />
        <Route path="/orders/:id"           element={<OrderDetailPage />} />

        <Route path="/reviews"              element={<ReviewsPage />} />
        <Route path="/branches"             element={<BranchesPage />} />
        <Route path="/admins"               element={<AdminsPage />} />
        <Route path="/settings"             element={<SettingsPage />} />
      </Route>

      {/* Fallbacks */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
