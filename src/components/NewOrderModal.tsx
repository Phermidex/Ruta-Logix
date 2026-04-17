import React, { useState } from 'react';
import { X, MapPin, Package, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { firestoreService } from '../lib/firestoreService';
import { Order } from '../lib/types';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewOrderModal({ isOpen, onClose }: NewOrderModalProps) {
  const { currentUser } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    description: '',
    pickup: '',
    delivery: '',
    weight: 'Menos de 1kg'
  });

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!currentUser) return;
    setIsSubmitting(true);
    
    try {
      const orderId = `ORD-${Date.now()}`;
      const newOrder: Order = {
        id: orderId,
        clientId: currentUser.uid,
        clientName: currentUser.displayName,
        description: form.description,
        pickupAddress: form.pickup,
        deliveryAddress: form.delivery,
        status: 'pending',
        weight: form.weight,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await firestoreService.setDocument('orders', orderId, newOrder);
      onClose();
      // Reset form
      setStep(1);
      setForm({ description: '', pickup: '', delivery: '', weight: 'Menos de 1kg' });
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
        >
          <div className="bg-primary p-6 text-white flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black">Nuevo Envío</h2>
              <p className="text-xs opacity-70">Completa los detalles del paquete</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex justify-between mb-4">
              {[1, 2].map((s) => (
                <div key={s} className={`h-1 flex-1 mx-1 rounded-full ${step >= s ? 'bg-primary' : 'bg-slate-200'}`} />
              ))}
            </div>

            {step === 1 ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase">Descripción</label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input 
                      type="text" 
                      placeholder="Ej: Documentos, Repuestos..." 
                      className="w-full pl-10 pr-4 py-3 bg-bg-app border border-border-subtle rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm"
                      value={form.description}
                      onChange={e => setForm({...form, description: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase">Peso Aproximado</label>
                  <select 
                    className="w-full px-4 py-3 bg-bg-app border border-border-subtle rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm"
                    value={form.weight}
                    onChange={e => setForm({...form, weight: e.target.value})}
                  >
                    <option>Menos de 1kg</option>
                    <option>1kg - 5kg</option>
                    <option>Más de 5kg</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase">Dirección de Recogida</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input 
                      type="text" 
                      placeholder="C. Principal 123..." 
                      className="w-full pl-10 pr-4 py-3 bg-bg-app border border-border-subtle rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm"
                      value={form.pickup}
                      onChange={e => setForm({...form, pickup: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase">Dirección de Destino</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={18} />
                    <input 
                      type="text" 
                      placeholder="Av. Libertad 456..." 
                      className="w-full pl-10 pr-4 py-3 bg-bg-app border border-border-subtle rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm"
                      value={form.delivery}
                      onChange={e => setForm({...form, delivery: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            <button 
              disabled={isSubmitting}
              onClick={() => step === 1 ? setStep(2) : handleSubmit()}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {step === 1 ? 'Siguiente' : 'Solicitar Envio'}
                  {step === 2 && <Send size={18} />}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
