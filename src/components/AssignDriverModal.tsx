import React, { useState, useEffect } from 'react';
import { X, User, Bike, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { firestoreService } from '../lib/firestoreService';
import { Order, User as UserType, Route } from '../lib/types';
import { query, where } from 'firebase/firestore';

interface AssignDriverModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AssignDriverModal({ order, isOpen, onClose }: AssignDriverModalProps) {
  const [drivers, setDrivers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const unsub = firestoreService.subscribeToCollection<UserType>(
        'users',
        (data) => {
          setDrivers(data.filter(u => u.role === 'driver'));
          setLoading(false);
        },
        [where('role', '==', 'driver')]
      );
      return () => unsub();
    }
  }, [isOpen]);

  const handleAssign = async () => {
    if (!order || !selectedDriver) return;
    setIsSubmitting(true);

    try {
      const driver = drivers.find(d => d.uid === selectedDriver);
      const routeId = `RT-${Date.now().toString().slice(-4)}`;
      
      // 1. Create Route
      const newRoute: Route = {
        id: routeId,
        driverId: selectedDriver,
        driverName: driver?.displayName || 'Conductor',
        status: 'preparing',
        orderIds: [order.id],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await firestoreService.setDocument('routes', routeId, newRoute);

      // 2. Update Order
      await firestoreService.updateDocument('orders', order.id, {
        status: 'assigned',
        driverId: selectedDriver,
        routeId: routeId,
        updatedAt: new Date().toISOString()
      });

      onClose();
    } catch (error) {
      console.error('Error assigning driver:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          <div className="bg-sidebar p-6 text-white flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black">Asignar Repartidor</h2>
              <p className="text-xs opacity-70">Envío #{order.id} - {order.clientName}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-4">
            <div className="bg-bg-app p-4 rounded-2xl border border-border-subtle">
              <p className="text-[10px] font-bold text-text-muted uppercase mb-1">Detalles de la Tienda</p>
              <p className="font-bold text-sm">{order.clientName}</p>
              <p className="text-xs text-text-muted">{order.description}</p>
              <p className="text-xs text-text-muted mt-1 italic">{order.pickupAddress}</p>
            </div>

            <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">Conductores Disponibles</h3>
            
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-2">
                {drivers.map(driver => (
                  <button
                    key={driver.uid}
                    onClick={() => setSelectedDriver(driver.uid)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                      selectedDriver === driver.uid 
                        ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                        : 'border-border-subtle hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        selectedDriver === driver.uid ? 'bg-primary text-white' : 'bg-slate-100 text-text-muted'
                      }`}>
                        {driver.displayName[0]}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{driver.displayName}</p>
                        <p className="text-xs text-text-muted">Motorizado</p>
                      </div>
                    </div>
                    {selectedDriver === driver.uid && <CheckCircle2 size={20} className="text-primary" />}
                  </button>
                ))}
                {drivers.length === 0 && (
                  <p className="text-center text-sm text-text-muted py-8">No hay conductores registrados</p>
                )}
              </div>
            )}
          </div>

          <div className="p-6 bg-slate-50 border-t border-border-subtle">
            <button
              disabled={!selectedDriver || isSubmitting}
              onClick={handleAssign}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Confirmar Asignación'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
