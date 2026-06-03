// src/constants/navigation.js
import {
  LayoutDashboard, Package, Tag, Percent, Gift, UtensilsCrossed,
  ShoppingCart, Star, MapPin, Users, Settings,
} from 'lucide-react';

export const NAV_ITEMS = [
  { label: 'Dashboard',   path: '/dashboard',  icon: LayoutDashboard },
  { label: 'Products',    path: '/products',   icon: Package },
  { label: 'Categories',  path: '/categories', icon: Tag },
  { label: 'Deals',       path: '/deals',      icon: Gift },
  { label: 'Offers',      path: '/offers',     icon: Percent },
  { label: 'Menu',        path: '/menu',       icon: UtensilsCrossed },
  { label: 'Orders',      path: '/orders',     icon: ShoppingCart },
  { label: 'Reviews',     path: '/reviews',    icon: Star },
  { label: 'Branches',    path: '/branches',   icon: MapPin },
  { label: 'Admin Users', path: '/admins',     icon: Users },
  { label: 'Settings',    path: '/settings',   icon: Settings },
];

export const BRANCHES = [
  { id: '1', name: 'Downtown Branch' },
  { id: '2', name: 'Gulshan Branch' },
  { id: '3', name: 'Defence Branch' },
  { id: '4', name: 'North Nazimabad Branch' },
];
