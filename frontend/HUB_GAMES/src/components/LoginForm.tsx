import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { login, register } from '../lib/api';
import { setSession } from '../lib/auth';

type Mode = 'login' | 'register';

const isBrowser = typeof window !== 'undefined';
const useIsoLayoutEffect = isBrowser ? useLayoutEffect : useEffect;

export default function LoginForm() {
    const [mode, setMode] = useState<Mode>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({ username: '', email: '', password: '' });

    const cardRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLAnchorElement>(null);
    const subtitleRef = useRef<HTMLParagraphElement>(null);
    const tabsRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const socialRef = useRef<HTMLDivElement>(null);
    const footerRef = useRef<HTMLParagraphElement>(null);
    const fieldsetRef = useRef<HTMLDivElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        if (mode === 'register' && !form.username.trim()) {
            setError('El nombre de usuario es requerido');
            setLoading(false);
            return;
        }
        try {
            const result = await (mode === 'login'
                ? login(form.email, form.password)
                : register(form.username, form.email, form.password));
            setSession(result.user, result.access_token);
            window.location.href = '/';
        } catch (e: any) {
            setError(e.message ?? 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    // ── GSAP: page-load choreography ──────────────────────────────────────
    useIsoLayoutEffect(() => {
        if (!isBrowser) return;

        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (reduce) return;

        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        if (cardRef.current) {
            gsap.set(cardRef.current, { opacity: 0, y: 40, scale: 0.96 });
        }
        if (titleRef.current) gsap.set(titleRef.current, { opacity: 0, y: 20 });
        if (subtitleRef.current) gsap.set(subtitleRef.current, { opacity: 0, y: 10 });
        if (tabsRef.current) gsap.set(tabsRef.current, { opacity: 0, y: 10 });
        if (footerRef.current) gsap.set(footerRef.current, { opacity: 0 });

        tl.to(cardRef.current, { opacity: 1, y: 0, scale: 1, duration: 1.15 })
            .to(titleRef.current, { opacity: 1, y: 0, duration: 0.65 }, '-=0.65')
            .to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.5 }, '-=0.4')
            .to(tabsRef.current, { opacity: 1, y: 0, duration: 0.5 }, '-=0.32')
            .to(footerRef.current, { opacity: 1, duration: 0.5 }, '-=0.25');

        // Stagger de los inputs del form actual
        const inputs = formRef.current?.querySelectorAll<HTMLElement>('.form-field');
        if (inputs && inputs.length) {
            gsap.from(inputs, {
                opacity: 0,
                x: -16,
                duration: 0.6,
                stagger: 0.1,
                ease: 'power2.out',
                delay: 0.9,
            });
        }
    }, []);

    // ── GSAP: re-animar campos al cambiar de tab ──────────────────────────
    useEffect(() => {
        if (!isBrowser) return;
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (reduce) return;

        const inputs = formRef.current?.querySelectorAll<HTMLElement>('.form-field');
        if (inputs && inputs.length) {
            gsap.from(inputs, {
                opacity: 0,
                x: -12,
                duration: 0.5,
                stagger: 0.08,
                ease: 'power2.out',
            });
        }
    }, [mode]);

    // ── GSAP: hover + ripple en social buttons ────────────────────────────
    useEffect(() => {
        if (!isBrowser) return;
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (reduce) return;

        const buttons = socialRef.current?.querySelectorAll<HTMLButtonElement>('.gamer-social-btn');
        if (!buttons) return;

        const cleanups: Array<() => void> = [];

        buttons.forEach((btn) => {
            const onEnter = () => {
                gsap.to(btn, {
                    scale: 1.04,
                    duration: 0.32,
                    ease: 'power2.out',
                });
            };
            const onLeave = () => {
                gsap.to(btn, {
                    scale: 1,
                    duration: 0.38,
                    ease: 'power2.out',
                });
            };
            const onDown = () => {
                gsap.to(btn, { scale: 0.97, duration: 0.15, ease: 'power2.out' });
            };
            const onUp = () => {
                gsap.to(btn, { scale: 1.04, duration: 0.25, ease: 'back.out(2)' });
            };
            const onClick = (ev: MouseEvent) => createRipple(btn, ev);

            btn.addEventListener('mouseenter', onEnter);
            btn.addEventListener('mouseleave', onLeave);
            btn.addEventListener('mousedown', onDown);
            btn.addEventListener('mouseup', onUp);
            btn.addEventListener('click', onClick as EventListener);

            cleanups.push(() => {
                btn.removeEventListener('mouseenter', onEnter);
                btn.removeEventListener('mouseleave', onLeave);
                btn.removeEventListener('mousedown', onDown);
                btn.removeEventListener('mouseup', onUp);
                btn.removeEventListener('click', onClick as EventListener);
            });
        });

        return () => cleanups.forEach((fn) => fn());
    }, []);

    return (
        <div className="w-full max-w-md">
            {/* Logo */}
            <div className="text-center mb-8">
                <a
                    ref={titleRef}
                    href="/"
                    className="inline-block text-4xl font-black italic tracking-tighter text-[#e0e8ff] title-glow"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                    HUB GAMES
                </a>
                <p ref={subtitleRef} className="text-[#8b92a8] mt-3 text-sm">
                    {mode === 'login' ? 'Bienvenido de vuelta, gamer' : 'Crea tu cuenta y empieza a jugar'}
                </p>
            </div>

            {/* Card */}
            <div ref={cardRef} className="gamer-card p-7 sm:p-8">
                {/* Tabs */}
                <div
                    ref={tabsRef}
                    className="flex gap-2 p-1 mb-7 rounded-xl"
                    style={{
                        background: 'rgba(5, 8, 22, 0.55)',
                        border: '1px solid rgba(0, 217, 255, 0.12)',
                    }}
                    role="tablist"
                >
                    {(['login', 'register'] as const).map((m) => (
                        <button
                            key={m}
                            type="button"
                            role="tab"
                            aria-selected={mode === m}
                            onClick={() => {
                                if (m === mode) return;
                                setMode(m);
                                setError(null);
                            }}
                            className={`gamer-tab ${mode === m ? 'is-active' : ''}`}
                        >
                            {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
                        </button>
                    ))}
                </div>

                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                    <div ref={fieldsetRef} className="space-y-4">
                        {mode === 'register' && (
                            <div className="form-field">
                                <label
                                    htmlFor="username"
                                    className="block text-[0.7rem] font-semibold text-[#8b92a8] mb-2 uppercase tracking-[0.12em]"
                                >
                                    Nombre de usuario
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    name="username"
                                    value={form.username}
                                    onChange={handleChange}
                                    required
                                    placeholder="gamer42"
                                    autoComplete="username"
                                    className="gamer-input w-full rounded-xl px-4 py-3 text-sm"
                                />
                            </div>
                        )}

                        <div className="form-field">
                            <label
                                htmlFor="email"
                                className="block text-[0.7rem] font-semibold text-[#8b92a8] mb-2 uppercase tracking-[0.12em]"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                placeholder="tu@email.com"
                                autoComplete="email"
                                className="gamer-input w-full rounded-xl px-4 py-3 text-sm"
                            />
                        </div>

                        <div className="form-field">
                            <label
                                htmlFor="password"
                                className="block text-[0.7rem] font-semibold text-[#8b92a8] mb-2 uppercase tracking-[0.12em]"
                            >
                                Contraseña
                            </label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                required
                                placeholder="••••••••"
                                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                className="gamer-input w-full rounded-xl px-4 py-3 text-sm"
                            />
                        </div>
                    </div>

                    {error && (
                        <div
                            className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl"
                            style={{
                                color: '#ffb4ab',
                                background: 'rgba(147, 0, 10, 0.25)',
                                border: '1px solid rgba(255, 180, 171, 0.25)',
                            }}
                            role="alert"
                        >
                            <span
                                className="material-symbols-outlined"
                                style={{ fontSize: '18px' }}
                            >
                                error
                            </span>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="gamer-btn-primary w-full py-3.5 rounded-xl text-sm mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading
                            ? 'Cargando...'
                            : mode === 'login'
                              ? 'Iniciar sesión'
                              : 'Crear cuenta'}
                    </button>
                </form>

                {/* Divider */}
                <div className="gamer-divider my-6">o continúa con</div>

                {/* OAuth buttons */}
                <div ref={socialRef} className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        className="gamer-social-btn"
                        onClick={(e) => oauthStub(e, 'Google')}
                        aria-label="Iniciar sesión con Google"
                    >
                        <GoogleIcon />
                        <span>Google</span>
                    </button>
                    <button
                        type="button"
                        className="gamer-social-btn"
                        onClick={(e) => oauthStub(e, 'Apple')}
                        aria-label="Iniciar sesión con Apple"
                    >
                        <AppleIcon />
                        <span>Apple</span>
                    </button>
                </div>
            </div>

            <p ref={footerRef} className="text-center mt-7">
                <a href="/" className="gamer-link">
                    ← Explorar sin cuenta
                </a>
            </p>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────
   Iconos
   ───────────────────────────────────────────────────────────────────────── */

function GoogleIcon() {
    return (
        <svg
            className="w-5 h-5 shrink-0"
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
            />
            <path
                fill="#FF3D00"
                d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
            />
            <path
                fill="#4CAF50"
                d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
            />
            <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
            />
        </svg>
    );
}

function AppleIcon() {
    return (
        <svg
            className="w-5 h-5 shrink-0"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            aria-hidden="true"
        >
            <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12-1.06.396-2.2 1.012-2.95.687-.85 1.864-1.51 2.96-1.55l.192.85zm3.594 16.62c-.7 1.61-1.04 2.33-1.945 3.75-1.262 1.98-3.04 4.45-5.25 4.47-1.96.02-2.46-1.28-5.12-1.27-2.66.01-3.21 1.29-5.17 1.27-2.21-.02-3.9-2.25-5.16-4.23-3.54-5.55-3.91-12.07-1.73-15.54 1.55-2.47 4.01-3.92 6.32-3.92 2.34 0 3.81 1.28 5.74 1.28 1.88 0 3.02-1.28 5.73-1.28 2.05 0 4.22 1.12 5.77 3.05-5.07 2.78-4.24 10.02-1.19 12.42z" />
        </svg>
    );
}

/* ─────────────────────────────────────────────────────────────────────────
   Ripple effect
   ───────────────────────────────────────────────────────────────────────── */

function createRipple(button: HTMLElement, ev: MouseEvent) {
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement('span');

    Object.assign(ripple.style, {
        position: 'absolute',
        left: `${ev.clientX - rect.left - size / 2}px`,
        top: `${ev.clientY - rect.top - size / 2}px`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,217,255,0.45) 0%, rgba(0,217,255,0) 60%)',
        transform: 'scale(0)',
        opacity: '1',
        pointerEvents: 'none',
    } as CSSStyleDeclaration);

    button.appendChild(ripple);
    if (!isBrowser) return;
    gsap.to(ripple, {
        scale: 2.4,
        opacity: 0,
        duration: 0.85,
        ease: 'power2.out',
        onComplete: () => ripple.remove(),
    });
}

/* ─────────────────────────────────────────────────────────────────────────
   OAuth placeholder handler
   ───────────────────────────────────────────────────────────────────────── */

function oauthStub(ev: React.MouseEvent<HTMLButtonElement>, provider: 'Google' | 'Apple') {
    ev.preventDefault();
    const reduce =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
        console.info(`[auth] OAuth con ${provider} (placeholder)`);
        return;
    }

    const btn = ev.currentTarget;
    gsap.fromTo(
        btn,
        { boxShadow: '0 0 0 0 rgba(0,217,255,0.6)' },
        {
            boxShadow: '0 0 0 14px rgba(0,217,255,0)',
            duration: 0.9,
            ease: 'power2.out',
        },
    );
    console.info(`[auth] OAuth con ${provider} (placeholder — pendiente de integración)`);
}
