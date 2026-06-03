import { useEffect, useState } from 'react';
import { branchService } from '../services/branchService';
import { dealService } from '../services/dealService';
import { orderService } from '../services/orderService';
import { productService } from '../services/productService';

const COLORS = ['#f97316', '#a855f7', '#3b82f6', '#10b981', '#64748b'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function toDate(value) {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function buildPopularProducts(orders, products) {
  const counts = new Map();

  orders.forEach(order => {
    const items = order.items || order.products || [];
    items.forEach(item => {
      const key = item.productId || item.id || item.name;
      if (!key) return;
      const current = counts.get(key) || { id: key, name: item.name, value: 0 };
      current.value += Number(item.quantity || item.qty || 1);
      counts.set(key, current);
    });
  });

  return [...counts.values()]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map((entry, i) => {
      const product = products.find(p => p.id === entry.id || p.name === entry.name);
      return {
        id: product?.id || entry.id,
        name: product?.name || entry.name || 'Product',
        value: entry.value,
        color: COLORS[i],
        image: product?.image,
        category: product?.category,
        rating: product?.rating,
      };
    });
}

export function useDashboardStats() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecent] = useState([]);
  const [topProducts, setTopProds] = useState([]);
  const [products, setProducts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [baseBranches, setBaseBranches] = useState([]);
  const [branches, setBranches] = useState([]);
  const [chartData, setChartData] = useState({ weekly: [], monthly: [], popular: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productService.getAll(),
      dealService.getAll(),
      branchService.getAll(),
    ]).then(([productList, dealList, branchList]) => {
      setProducts(productList);
      setDeals(dealList);
      setBaseBranches(branchList);
      setBranches(branchList);
    }).catch(() => {
      setProducts([]);
      setDeals([]);
      setBaseBranches([]);
      setBranches([]);
    });
  }, []);

  useEffect(() => {
    const unsub = orderService.subscribeDetailed(orders => {
      const total = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
      const pending = orders.filter(order => order.status === 'processing').length;

      const dayCounts = { Mon:0, Tue:0, Wed:0, Thu:0, Fri:0, Sat:0, Sun:0 };
      const dayRevenue = { Mon:0, Tue:0, Wed:0, Thu:0, Fri:0, Sat:0, Sun:0 };
      const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);

      orders.forEach(order => {
        const date = toDate(order.createdAt);
        if (!date || date < weekAgo) return;
        const key = dayNames[date.getDay()];
        if (!(key in dayCounts)) return;
        dayCounts[key] += 1;
        dayRevenue[key] += order.total || 0;
      });

      const weekly = Object.entries(dayCounts).map(([day, sales]) => ({
        day,
        sales,
        revenue: Math.round(dayRevenue[day]),
      }));

      const monthly = MONTHS.map(month => ({ month, revenue: 0 }));
      orders.forEach(order => {
        const date = toDate(order.createdAt);
        if (date) monthly[date.getMonth()].revenue += order.total || 0;
      });

      const popular = buildPopularProducts(orders, products);
      const branchesWithMetrics = baseBranches.map(branch => {
        const branchOrders = orders.filter(order => {
          const branchId = order.branchId || order.branch?.id;
          const branchName = order.branchName || order.branch?.name;
          return branchId === branch.id || branchName === branch.location || branchName === branch.name;
        });
        return {
          ...branch,
          ordersToday: branchOrders.length,
          totalRevenue: branchOrders.reduce((sum, order) => sum + (order.total || 0), 0),
        };
      });

      setStats({
        total,
        totalRevenue,
        pending,
        productCount: products.length,
        activeDeals: deals.filter(deal => deal.isActive).length,
      });
      setRecent(orders.slice(0, 5));
      setTopProds(popular);
      setBranches(branchesWithMetrics);
      setChartData({
        weekly,
        monthly: monthly.map(month => ({ ...month, revenue: Math.round(month.revenue) })),
        popular,
      });
      setLoading(false);
    });

    return () => unsub();
  }, [baseBranches, deals, products]);

  return { stats, recentOrders, topProducts, branches, chartData, loading };
}
