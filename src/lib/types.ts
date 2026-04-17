export type UserRole = 'admin' | 'employee' | 'driver' | 'client';

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  photoURL?: string;
  createdAt: string;
}

export type OrderStatus = 'pending' | 'assigned' | 'collected' | 'delivering' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  description: string;
  pickupAddress: string;
  deliveryAddress: string;
  status: OrderStatus;
  routeId?: string;
  driverId?: string;
  createdAt: string;
  updatedAt: string;
  weight?: string;
}

export type RouteStatus = 'preparing' | 'in_route' | 'completed';

export interface Route {
  id: string;
  driverId: string;
  driverName: string;
  status: RouteStatus;
  orderIds: string[];
  createdAt: string;
  updatedAt: string;
}
