import { useState } from 'react';
import { login, register } from '../lib/api';
import { setUser } from '../lib/auth';

export default function LoginForm() {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({ username: '', email: '', password: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        // Validación previa: no entrar al try si hay error obvio
        if (mode === 'register' && !form.username.trim()) {
            setError('El nombre de usuario es requerido');
            setLoading(false);
            return;
        }
        try {
            let user;
            if (mode === 'login') {
                user = await login(form.email, form.password);
            } else {
                user = await register(form.username, form.email, form.password);
            }
            setUser(user);
            window.location.href = '/';
        } catch (e: any) {
            setError(e.message ?? 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center px-6">
            {/* Background decorativo 
            Carga imagen de fondo por detras del login 
            */}
            <div className="fixed inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
                <img alt="Sci-fi game character silhouette" className="h-full w-full object-cover object-center" data-alt="dramatic silhouette of a high-tech sci-fi warrior standing in front of a glowing blue portal with ember particles and cinematic lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgYJzTdvYsdDpycRZRSuWliyYtkGTUW89VLd3C_4RLWqQRTR8DTLntUCQtcWNlRnfj-JGDAU3IgKGrRVpUtuqCnSOZOoCzZMqPzSNYGeOZx1Gv1gvgdJe4DxL0Zy9wh0Z35PQ1NerH1wo-DBo4eYx3te8e3YLWUrbGEitwOTCiilb378oMkHo1wFmyHqnP_pTokFIy7fiuL29tiHXyFfK3TCVkx9Kh8DNHIOVG_ZZizKiXpzezGtPa-rX-mFRsJyn-tmtw128RDl0" />
            </div>
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-10">
                    <a href="/" className="text-3xl font-black italic tracking-tighter font-headline text-on-surface">
                        HUB GAMES
                    </a>
                    <p className="text-on-surface-variant mt-2 text-sm">
                        {mode === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
                    </p>
                </div>

                {/* Card */}
                <div className="bg-surface-container rounded-2xl p-8 border border-outline-variant/10 shadow-2xl shadow-black/40">
                    {/* Toggle login/register */}
                    <div className="flex bg-surface-container-lowest rounded-xl p-1 mb-8">
                        {(['login', 'register'] as const).map((m) => (
                            <button
                                key={m}
                                onClick={() => { setMode(m); setError(null); }}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${mode === m
                                    ? 'bg-surface-container-highest text-on-surface shadow-sm'
                                    : 'text-on-surface-variant hover:text-on-surface'
                                    }`}
                            >
                                {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username solo en registro */}
                        {mode === 'register' && (
                            <div>
                                <label className="block text-xs font-medium text-on-surface-variant mb-2 uppercase tracking-wider">
                                    Nombre de usuario
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={form.username}
                                    onChange={handleChange}
                                    required
                                    placeholder="gamer42"
                                    className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface placeholder-outline outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-medium text-on-surface-variant mb-2 uppercase tracking-wider">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                placeholder="tu@email.com"
                                className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface placeholder-outline outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-on-surface-variant mb-2 uppercase tracking-wider">
                                Contraseña
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                required
                                placeholder="••••••••"
                                className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface placeholder-outline outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 text-error text-sm bg-error-container/20 px-4 py-3 rounded-xl">
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-3.5 rounded-xl font-bold text-sm active:scale-[0.98] transition-transform disabled:opacity-70 disabled:cursor-not-allowed mt-2 shadow-lg shadow-primary/20"
                        >
                            {loading
                                ? 'Cargando...'
                                : mode === 'login'
                                    ? 'Iniciar sesión'
                                    : 'Crear cuenta'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-on-surface-variant/50 text-xs mt-8">
                    <a href="/" className="hover:text-primary transition-colors">← Explorar sin cuenta</a>
                </p>
            </div>
        </div>
    );
}
