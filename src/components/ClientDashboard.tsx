import React, { useState, useEffect } from 'react';
import { Package, MapPin, CheckCircle2, Clock, Bike, Plus, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, OrderStatus } from '../lib/types';
import { NewOrderModal } from './NewOrderModal';
import { useAuth } from '../lib/AuthContext';
import { firestoreService } from '../lib/firestoreService';
import { query, where, orderBy } from 'firebase/firestore';
import { cn } from '../lib/utils';

export function ClientDashboard() {
  const { currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const unsub = firestoreService.subscribeToCollection<Order>(
      'orders',
      (data) => {
        setOrders(data);
        setLoading(false);
      },
      [where('clientId', '==', currentUser.uid), orderBy('createdAt', 'desc')]
    );

    return () => unsub();
  }, [currentUser]);

  const activeOrder = orders.find(o => o.status !== 'delivered' && o.status !== 'cancelled');
  const history = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');
// ...
// ...

  const getStatusStep = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 1;
      case 'assigned': return 1;
      case 'collected': return 2;
      case 'delivering': return 2;
      case 'delivered': return 3;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 pb-20 overflow-y-auto h-screen scrollbar-hide">
      <header className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Mis Envíos</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white p-3 rounded-2xl shadow-lg shadow-primary/40 active:scale-95 transition-transform"
        >
          <Plus size={20} />
        </button>
      </header>

      <NewOrderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {activeOrder ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-border-subtle"
        >
          <div className="text-center space-y-2">
            <span className="text-xs text-text-muted">Pedido #{activeOrder.id}</span>
            <h2 className="text-2xl font-black text-text-main capitalize">
              {activeOrder.status === 'delivering' ? 'En Camino' : 
               activeOrder.status === 'collected' ? 'Recogido' :
               activeOrder.status === 'assigned' ? 'Asignado' : 'Preparando'}
            </h2>
            
            <div className="client-track-bar">
              <div 
                className="client-track-progress" 
                style={{ width: `${(getStatusStep(activeOrder.status) / 3) * 100}%` }} 
              />
            </div>

            <div className="flex justify-between text-[10px] text-text-muted font-bold uppercase">
              <span className={getStatusStep(activeOrder.status) >= 1 ? 'text-primary' : ''}>Preparado</span>
              <span className={getStatusStep(activeOrder.status) >= 2 ? 'text-primary' : ''}>En Reparto</span>
              <span className={getStatusStep(activeOrder.status) >= 3 ? 'text-primary' : ''}>Entregado</span>
            </div>
          </div>

          <div className="mt-8 bg-bg-app rounded-xl p-4 border border-dashed border-border-subtle">
            <div className="flex items-start gap-3">
              <div className="bg-amber-100 p-2 rounded-full text-amber-600">
                <Bike size={20} />
              </div>
              <div className="text-sm">
                <p className="font-semibold text-text-main">Info del envío</p>
                <p className="text-text-muted leading-tight">
                  {activeOrder.status === 'pending' 
                    ? 'Esperando asignación de mensajero...' 
                    : activeOrder.driverId ? `El conductor está gestionando tu paquete.` : 'Buscando repartidor...'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-text-muted mt-1" />
              <div>
                <p className="text-[10px] uppercase font-bold text-text-muted">Recogida</p>
                <p className="text-sm font-medium">{activeOrder.pickupAddress}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-primary mt-1" />
              <div>
                <p className="text-[10px] uppercase font-bold text-text-muted">Entrega</p>
                <p className="text-sm font-medium">{activeOrder.deliveryAddress}</p>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-4">
          <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-sm text-slate-400">
            <Package size={32} />
          </div>
          <p className="text-text-muted font-medium">No tienes envíos activos</p>
          <button 
             onClick={() => setIsModalOpen(true)}
             className="text-primary font-bold text-sm hover:underline"
          >
            Solicitar primer envío
          </button>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-bold text-sm text-text-muted uppercase">Historial Reciente</h3>
        {history.length > 0 ? history.map((order) => (
          <div key={order.id} className="bg-white p-4 rounded-xl flex justify-between items-center border border-border-subtle shadow-sm">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                order.status === 'delivered' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
              )}>
                {order.status === 'delivered' ? <CheckCircle2 size={18} /> : <X size={18} />}
              </div>
              <div>
                <p className="text-sm font-semibold truncate max-w-[120px]">{order.description}</p>
                <p className="text-xs text-text-muted">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <span className={cn(
              "status-pill capitalize",
              order.status === 'delivered' ? "status-entregado" : "bg-red-100 text-red-700"
            )}>
              {order.status === 'delivered' ? 'Completado' : 'Cancelado'}
            </span>
          </div>
        )) : (
          <p className="text-xs text-center text-text-muted italic py-4">No hay historial disponible</p>
        )}
      </div>
    </div>
  );
}
