// src/services/index.js
// Barrel export — import all services from one place
// e.g.  import { productService, orderService } from '../services';

export { productService }  from './productService';
export { categoryService } from './categoryService';
export { orderService, ORDER_STATUS_CONFIG } from './orderService';
export { offerService }    from './offerService';
export { dealService }     from './dealService';
export { reviewService }   from './reviewService';
export { branchService }   from './branchService';
export { adminService }    from './adminService';
export { menuService }     from './menuService';
export { authService }     from './authService';
export { settingsService } from './settingsService';
export { notificationService } from './notificationService';
export { pushNotificationService } from './pushNotificationService';
export { storageService } from './storageService';
