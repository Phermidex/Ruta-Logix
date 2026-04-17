import React, { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, User, Bike, Loader2, CheckCircle, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { loginWithGoogle, loginWithEmail, registerWithEmail, sendVerification, logout } from '../lib/firebase';
import { firestoreService } from '../lib/firestoreService';
import { UserRole, User as UserType } from '../lib/types';
import { useAuth } from '../lib/AuthContext';
import { cn } from '../lib/utils';

export function AuthScreen() {
  const { firebaseUser, currentUser, refreshUser } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>('client');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: '',
    password: '',
    displayName: ''
  });

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    resetMessages();
    try {
      const user = await loginWithGoogle();
      // Check if profile exists
      const profile = await firestoreService.getDocument<UserType>('users', user.uid);
      if (!profile) {
        // Create default client profile for Google users if missing
        const newProfile: UserType = {
          uid: user.uid,
          email: user.email || '',
          role: 'client',
          displayName: user.displayName || 'Usuario Google',
           photoURL: user.photoURL || undefined,
          createdAt: new Date().toISOString()
        };
        await firestoreService.setDocument('users', user.uid, newProfile);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetMessages();
    try {
      if (mode === 'login') {
        await loginWithEmail(form.email, form.password);
      } else {
        if (!form.displayName) throw new Error('Nombre es requerido');
        const user = await registerWithEmail(form.email, form.password);
        
        // Create Profile
        const newProfile: UserType = {
          uid: user.uid,
          email: form.email,
          role: role,
          displayName: form.displayName,
          createdAt: new Date().toISOString()
        };
        await firestoreService.setDocument('users', user.uid, newProfile);
        setSuccess('Cuenta creada. Revisa tu correo para verificar.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Verification Screen
  if (firebaseUser && !firebaseUser.emailVerified && firebaseUser.providerData[0]?.providerId === 'password') {
    return (
      <div className="min-h-screen bg-bg-app flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-3xl shadow-xl border border-border-subtle max-w-sm w-full space-y-6 text-center"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto text-blue-600">
            <Mail size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-text-main">Verifica tu Correo</h2>
            <p className="text-sm text-text-muted">Hemos enviado un enlace a <span className="font-bold text-text-main">{firebaseUser.email}</span>. Debes verificarlo para continuar.</p>
          </div>
          
          <div className="space-y-3 pt-4">
            <button
              onClick={() => refreshUser()}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary-dark transition-all"
            >
              <RefreshCw size={18} />
              Ya lo verifiqué
            </button>
            <button
              onClick={sendVerification}
              className="w-full text-primary py-2 text-sm font-bold hover:underline"
            >
              Reenviar correo
            </button>
            <button
              onClick={logout}
              className="w-full text-text-muted py-2 text-xs font-bold hover:text-red-500"
            >
              Cerrar Sesión
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Profile Selection (Case where Google Login has no profile yet - handled in sync profile but just in case)
  if (firebaseUser && !currentUser && !loading) {
    return (
       <div className="min-h-screen bg-bg-app flex items-center justify-center p-6">
         <div className="bg-white p-8 rounded-3xl shadow-xl border border-border-subtle max-w-sm w-full space-y-6">
            <h2 className="text-xl font-black text-center">Completa tu perfil</h2>
            <p className="text-sm text-center text-text-muted">¿Cómo vas a usar la plataforma?</p>
            <div className="grid grid-cols-2 gap-4">
               <button onClick={() => setRole('client')} className={cn("p-4 rounded-2xl border-2 flex flex-col items-center gap-2", role === 'client' ? 'border-primary bg-primary/5' : 'border-border-subtle')}>
                  <User size={24} />
                  <span className="text-xs font-bold">Cliente</span>
               </button>
               <button onClick={() => setRole('driver')} className={cn("p-4 rounded-2xl border-2 flex flex-col items-center gap-2", role === 'driver' ? 'border-primary bg-primary/5' : 'border-border-subtle')}>
                  <Bike size={24} />
                  <span className="text-xs font-bold">Conductor</span>
               </button>
            </div>
            <button 
              onClick={async () => {
                setLoading(true);
                const prof: UserType = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  role: role,
                  displayName: firebaseUser.displayName || 'Usuario LogiRoute',
                  createdAt: new Date().toISOString()
                };
                await firestoreService.setDocument('users', firebaseUser.uid, prof);
                await refreshUser();
                setLoading(false);
              }}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex justify-center items-center"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Finalizar Registro'}
            </button>
         </div>
       </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-app flex items-center justify-center p-6 bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0]">
      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-[2rem] shadow-2xl border border-border-subtle max-w-md w-full space-y-6 overflow-hidden relative"
      >
        <div className="text-center space-y-2">
           <div className="w-16 h-16 bg-primary p-4 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg shadow-primary/30">
              {mode === 'login' ? <LogIn size={32} /> : <UserPlus size={32} />}
           </div>
           <h1 className="text-3xl font-black text-text-main tracking-tighter">RutaLogix</h1>
           <p className="text-text-muted text-sm font-medium">
             {mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta logística'}
           </p>
        </div>

        {error && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold flex items-center gap-2 border border-red-100">
            <AlertCircle size={14} />
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="bg-emerald-50 text-emerald-600 p-3 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-100">
            <CheckCircle size={14} />
            {success}
          </motion.div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <AnimatePresence mode="wait">
            {mode === 'register' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest pl-1">Nombre Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input 
                      type="text" 
                      required
                      placeholder="Ej: Juan Pérez" 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-border-subtle rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm transition-all"
                      value={form.displayName}
                      onChange={e => setForm({...form, displayName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest pl-1">Tipo de Usuario</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      type="button"
                      onClick={() => setRole('client')}
                      className={cn(
                        "flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all",
                        role === 'client' ? "bg-primary text-white border-primary" : "bg-slate-50 border-border-subtle text-text-muted hover:border-slate-300"
                      )}
                    >
                      <User size={14} /> Tienda
                    </button>
                    <button 
                      type="button"
                      onClick={() => setRole('driver')}
                      className={cn(
                        "flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all",
                        role === 'driver' ? "bg-primary text-white border-primary" : "bg-slate-50 border-border-subtle text-text-muted hover:border-slate-300"
                      )}
                    >
                      <Bike size={14} /> Conductor
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest pl-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input 
                type="email" 
                required
                placeholder="correo@ejemplo.com" 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-border-subtle rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm transition-all"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest pl-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input 
                type="password" 
                required
                minLength={6}
                placeholder="••••••••" 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-border-subtle rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm transition-all"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
              />
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (mode === 'login' ? 'Entrar' : 'Registrarme')}
          </button>
        </form>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-border-subtle"></div>
          <span className="flex-shrink mx-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">o continúa con</span>
          <div className="flex-grow border-t border-border-subtle"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-white border-2 border-border-subtle hover:border-primary hover:bg-primary/5 transition-all group font-bold"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span className="text-sm">Iniciar con Google</span>
        </button>

        <div className="text-center pt-2">
          <button 
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-xs font-bold text-text-muted hover:text-primary transition-colors flex items-center justify-center mx-auto gap-1"
          >
            {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Ingresa'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
