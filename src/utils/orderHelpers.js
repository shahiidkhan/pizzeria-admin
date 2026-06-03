const DEFAULT_TAX_RATE = 0.08;

export function normalizeOrderItems(order = {}, productsById = {}) {
  const items = order.items || order.products || [];
  return items.map(item => {
    const product = productsById[item.productId || item.id] || {};
    const quantity = Number(item.quantity ?? item.qty ?? 1);
    const price = Number(item.price ?? product.price ?? 0);
    return {
      ...item,
      productId: item.productId || item.id || product.id || '',
      name: item.name || product.name || 'Product',
      image: item.image || product.image || '',
      quantity,
      price,
      subtotal: quantity * price,
    };
  });
}

export function calculateOrderTotals(order = {}, items = normalizeOrderItems(order)) {
  const subtotal = order.subtotal ?? items.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = order.tax ?? Math.round(subtotal * DEFAULT_TAX_RATE);
  const deliveryFee = order.deliveryFee ?? 0;
  const total = order.total ?? subtotal + tax + deliveryFee;

  return {
    subtotal: Number(subtotal || 0),
    tax: Number(tax || 0),
    deliveryFee: Number(deliveryFee || 0),
    total: Number(total || 0),
  };
}

export function getCustomerName(customer) {
  return customer?.name || customer?.fullName || customer?.displayName || '';
}

export function getBranchName(branch) {
  return branch?.location || branch?.name || '';
}

export function getBranchContact(branch) {
  return branch?.contact || branch?.phone || '';
}

export function enrichOrder(order, { usersById = {}, branchesById = {}, productsById = {} } = {}) {
  const user = usersById[order.userId] || {};
  const branch = branchesById[order.branchId] || {};
  const items = normalizeOrderItems(order, productsById);
  const totals = calculateOrderTotals(order, items);

  const customer = {
    ...order.customer,
    ...user,
    name: getCustomerName(user) || order.customer?.name || '',
    email: user.email || order.customer?.email || '',
    phone: user.phone || user.phoneNumber || order.customer?.phone || '',
    address: order.address || user.address || user.location || '',
  };

  const branchDetails = {
    ...order.branch,
    ...branch,
    name: getBranchName(branch) || order.branch?.name || '',
    contact: getBranchContact(branch) || order.branch?.contact || '',
    status: branch.status || order.branch?.status || '',
  };

  return {
    ...order,
    items,
    customer,
    branch: branchDetails,
    branchName: branchDetails.name,
    branchContact: branchDetails.contact,
    branchStatus: branchDetails.status,
    subtotal: totals.subtotal,
    tax: totals.tax,
    deliveryFee: totals.deliveryFee,
    total: totals.total,
  };
}
