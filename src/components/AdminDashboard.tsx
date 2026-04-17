import React, { useEffect, useState } from 'react';
import { Package, User, Star, TrendingUp, Filter, Plus, Bike, Loader2, Clock, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { firestoreService } from '../lib/firestoreService';
import { Order, Route, User as UserType } from '../lib/types';
import { query, orderBy, where } from 'firebase/firestore';
import { AssignDriverModal } from './AssignDriverModal';

export function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [drivers, setDrivers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  useEffect(() => {
    // Listen to orders
    const unsubOrders = firestoreService.subscribeToCollection<Order>(
      'orders',
      (data) => setOrders(data),
      [orderBy('createdAt', 'desc')]
    );

    // Listen to routes
    const unsubRoutes = firestoreService.subscribeToCollection<Route>(
      'routes',
      (data) => setRoutes(data),
      [orderBy('createdAt', 'desc')]
    );

    // Listen to drivers
    const unsubDrivers = firestoreService.subscribeToCollection<UserType>(
      'users',
      (data) => setDrivers(data.filter(u => u.role === 'driver')),
      [where('role', '==', 'driver')]
    );

    setLoading(false);

    return () => {
      unsubOrders();
      unsubRoutes();
      unsubDrivers();
    };
  }, []);

  const pendingRequests = orders.filter(o => o.status === 'pending');
// ... rest of the component

  const stats = [
    { label: 'Envíos Activos', value: orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length.toString(), icon: Package },
    { label: 'Rutas en Curso', value: routes.filter(r => r.status === 'in_route').length.toString(), icon: TrendingUp },
    { label: 'Efectividad', value: '98%', icon: Star },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto h-screen scrollbar-hide">
      <AssignDriverModal 
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        order={selectedOrder}
      />

      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-text-main">Consola de Administración</h1>
          <p className="text-text-muted">Resumen general de operaciones logísticas</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1 rounded-full inline-block mb-1 italic">
              Administrador Master
            </p>
            <p className="text-sm font-bold">Admin Central</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-white shadow-sm" />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label} 
            className="bg-white p-6 rounded-2xl border border-border-subtle shadow-sm flex items-center justify-between"
          >
            <div>
              <p className="text-3xl font-black text-primary">{stat.value}</p>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{stat.label}</p>
            </div>
            <div className="bg-bg-app p-4 rounded-xl text-primary">
              <stat.icon size={24} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Solicitudes Pendientes */}
        <div className="bg-white rounded-2xl border border-border-subtle shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Clock size={20} className="text-amber-500" />
              Solicitudes de Tiendas
            </h2>
            <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-1 rounded-full uppercase">
              {pendingRequests.length} Pendientes
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-text-muted font-bold uppercase tracking-widest bg-bg-app">
                <tr>
                  <th className="px-6 py-4">Tienda / Descripción</th>
                  <th className="px-6 py-4">F. Solicitud</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {pendingRequests.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-text-main">{order.clientName}</p>
                      <p className="text-xs text-text-muted truncate max-w-[150px]">{order.description}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-text-muted">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsAssignModalOpen(true);
                        }}
                        className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                      >
                        Asignar Ruta
                      </button>
                    </td>
                  </tr>
                ))}
                {pendingRequests.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-text-muted italic">
                      No hay solicitudes pendientes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border-subtle shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp size={20} className="text-primary" />
              Rutas Activas
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-text-muted font-bold uppercase tracking-widest bg-bg-app">
                <tr>
                  <th className="px-6 py-4">Ruta</th>
                  <th className="px-6 py-4">Conductor</th>
                  <th className="px-6 py-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {routes.map((route) => (
                  <tr key={route.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono font-bold text-primary">{route.id}</td>
                    <td className="px-6 py-4 font-medium">{route.driverName}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "status-pill",
                        route.status === 'in_route' ? "status-en-ruta" : 
                        route.status === 'completed' ? "status-entregado" : "status-pendiente"
                      )}>{route.status === 'in_route' ? 'En Ruta' : route.status === 'completed' ? 'Completado' : 'Preparando'}</span>
                    </td>
                  </tr>
                ))}
                {routes.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-text-muted italic">No hay rutas activas</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Conductores */}
        <div className="bg-white rounded-2xl border border-border-subtle shadow-sm overflow-hidden flex flex-col xl:col-span-2">
          <div className="p-6 border-b flex justify-between items-center bg-slate-50/30">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Bike size={20} className="text-primary" />
              Mensajeros en el Sistema
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drivers.map((driver) => (
              <div key={driver.uid} className="flex items-center justify-between p-4 bg-bg-app rounded-xl border border-border-subtle shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {driver.displayName[0]}
                  </div>
                  <div>
                    <p className="font-bold text-sm tracking-tight">{driver.displayName}</p>
                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Motorizado</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   Activo
                </div>
              </div>
            ))}
            {drivers.length === 0 && (
              <div className="col-span-full py-12 text-center text-text-muted italic">
                No hay mensajeros registrados en el sistema.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
