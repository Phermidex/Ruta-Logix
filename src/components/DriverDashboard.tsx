import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Package, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';
import { firestoreService } from '../lib/firestoreService';
import { Route, Order, OrderStatus } from '../lib/types';
import { query, where, limit } from 'firebase/firestore';

export function DriverDashboard() {
  const { currentUser } = useAuth();
  const [activeRoute, setActiveRoute] = useState<Route | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    // Listen to driver's active route
    const unsubRoute = firestoreService.subscribeToCollection<Route>(
      'routes',
      (data) => {
        const current = data.find(r => r.status !== 'completed');
        setActiveRoute(current || null);
        if (!current) setLoading(false);
      },
      [where('driverId', '==', currentUser.uid), limit(1)]
    );

    return () => unsubRoute();
  }, [currentUser]);

  useEffect(() => {
    if (!activeRoute) return;

    // Listen to orders in the route
    const unsubOrders = firestoreService.subscribeToCollection<Order>(
      'orders',
      (data) => {
        // Only keep orders that belong to this route
        const routeOrders = data.filter(o => activeRoute.orderIds.includes(o.id));
        // Sort orders as per route orderIds array
        const sorted = [...routeOrders].sort((a, b) => 
          activeRoute.orderIds.indexOf(a.id) - activeRoute.orderIds.indexOf(b.id)
        );
        setOrders(sorted);
        setLoading(false);
      },
      [where('routeId', '==', activeRoute.id)]
    );

    return () => unsubOrders();
  }, [activeRoute]);

  const handleNextStep = async () => {
    const nextOrder = orders.find(o => o.status !== 'delivered' && o.status !== 'cancelled');
    if (!nextOrder || !activeRoute) return;
    
    setIsUpdating(true);
    try {
      let nextStatus: OrderStatus = 'collected';
      if (nextOrder.status === 'collected') nextStatus = 'delivering';
      else if (nextOrder.status === 'delivering') nextStatus = 'delivered';
      else if (nextOrder.status === 'assigned') nextStatus = 'collected';
      else nextStatus = 'collected';

      await firestoreService.updateDocument('orders', nextOrder.id, { 
        status: nextStatus,
        updatedAt: new Date().toISOString()
      });

      // Update route to 'in_route' if it was 'preparing'
      if (activeRoute.status === 'preparing' && nextStatus === 'collected') {
        await firestoreService.updateDocument('routes', activeRoute.id, { 
          status: 'in_route',
          updatedAt: new Date().toISOString()
        });
      }

      // Check if all orders in route are delivered
      const remaining = orders.filter(o => o.id !== nextOrder.id && o.status !== 'delivered');
      if (remaining.length === 0 && nextStatus === 'delivered') {
        await firestoreService.updateDocument('routes', activeRoute.id, { 
          status: 'completed',
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!activeRoute) {
    return (
      <div className="max-w-md mx-auto h-screen flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="bg-slate-100 w-20 h-20 rounded-3xl flex items-center justify-center text-slate-400">
          <Package size={40} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Sin rutas asignadas</h2>
          <p className="text-sm text-text-muted mt-2">Relájate, te avisaremos cuando tengas una nueva ruta de entrega.</p>
        </div>
      </div>
    );
  }

  const nextOrderToProcess = orders.find(o => o.status !== 'delivered' && o.status !== 'cancelled');

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-bg-app">
      <header className="bg-sidebar text-white p-6 pt-12 rounded-b-3xl shadow-xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-xs font-bold text-primary opacity-80 uppercase tracking-widest">En servicio</p>
            <h1 className="text-2xl font-black">Ruta {activeRoute.id}</h1>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl">
            <Package size={24} className="text-primary" />
          </div>
        </div>
        
        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
          <div className="text-center flex-1">
            <p className="text-2xl font-black">{orders.length}</p>
            <p className="text-[10px] uppercase font-bold opacity-60">Paradas</p>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="text-center flex-1">
            <p className="text-2xl font-black">{orders.filter(o => o.status === 'delivered').length}</p>
            <p className="text-[10px] uppercase font-bold opacity-60">Entregados</p>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="text-center flex-1 text-emerald-400">
            <p className="text-2xl font-black">{activeRoute.status === 'in_route' ? 'Activa' : 'Prep'}</p>
            <p className="text-[10px] uppercase font-bold opacity-60">Estado</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
        <AnimatePresence mode="popLayout">
          {orders.map((order, index) => {
            const isCompleted = order.status === 'delivered';
            const isActive = order.id === nextOrderToProcess?.id;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "driver-route-step transition-all duration-300",
                  isCompleted && "opacity-50 grayscale",
                  isActive && "scale-105"
                )}
              >
                <div className={cn(
                  "bg-white p-4 rounded-2xl shadow-sm border border-border-subtle",
                  isActive && "ring-2 ring-primary ring-offset-2 border-transparent"
                )}>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-black uppercase",
                          order.status === 'pending' ? "bg-amber-100 text-amber-700" :
                          order.status === 'delivered' ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {order.status}
                        </span>
                        {isCompleted && <CheckCircle size={14} className="text-emerald-500" />}
                      </div>
                      <h3 className="font-bold text-text-main truncate max-w-[180px]">{order.description}</h3>
                      <p className="text-xs text-text-muted flex items-center gap-1">
                        <MapPin size={12} />
                        {order.status === 'collected' ? order.deliveryAddress : order.pickupAddress}
                      </p>
                    </div>
                    {isActive && (
                      <button className="bg-bg-app p-2 rounded-xl text-primary hover:bg-slate-200">
                        <Navigation size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </main>

      <footer className="p-6 bg-white border-t border-border-subtle">
        {nextOrderToProcess ? (
          <button 
            disabled={isUpdating}
            onClick={handleNextStep}
            className="w-full bg-success text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform disabled:opacity-50"
          >
            {isUpdating ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {nextOrderToProcess.status === 'assigned' ? 'Confirmar Recogida' : 
                 nextOrderToProcess.status === 'collected' ? 'Iniciar Entrega' :
                 nextOrderToProcess.status === 'delivering' ? 'Confirmar Entrega' : 'Procesar'}
                <ArrowRight size={20} />
              </>
            )}
          </button>
        ) : (
          <div className="p-4 text-center text-text-muted font-bold">Ruta Completada</div>
        )}
      </footer>
    </div>
  );
}
