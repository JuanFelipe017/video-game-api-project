import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const CHAT_STORAGE_KEY = 'gamehub_chat_history';
const BUBBLE_SHOWN_KEY = 'gamehub_bubble_shown_session';

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: '¡Hola! Soy GameBot 🎮 ¿No sabes qué jugar? ¡Cuéntame qué tipo de juego te gusta y te recomiendo algo!' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showBubble, setShowBubble] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Inicializar: cargar historial y verificar si el bubble ya se mostró
    useEffect(() => {
        // Cargar mensajes desde sessionStorage
        const savedMessages = sessionStorage.getItem(CHAT_STORAGE_KEY);
        if (savedMessages) {
            try {
                setMessages(JSON.parse(savedMessages));
            } catch {
                setMessages([
                    { role: 'assistant', content: '¡Hola! Soy GameBot 🎮 ¿No sabes qué jugar? ¡Cuéntame qué tipo de juego te gusta y te recomiendo algo!' }
                ]);
            }
        }

        // Verificar si el bubble ya se mostró en esta sesión
        const bubbleShown = sessionStorage.getItem(BUBBLE_SHOWN_KEY);
        if (bubbleShown === 'true') {
            setShowBubble(false);
        } else {
            setShowBubble(true);
        }

        setIsInitialized(true);
    }, []);

    // Guardar historial en sessionStorage cuando cambia
    useEffect(() => {
        if (isInitialized && messages.length > 1) {
            sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
        }
    }, [messages, isInitialized]);

    useEffect(() => {
        if (isOpen) {
            setShowBubble(false);
            // Marcar que el bubble ya se mostró en esta sesión
            sessionStorage.setItem(BUBBLE_SHOWN_KEY, 'true');
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setLoading(true);

        const history = messages.slice(1); 
        const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
        setMessages(newMessages);

        try {
            const response = await fetch(`${API_URL}/api/chat/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    history: history,
                }),
            });

            const data = await response.json();
            setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
            // Restaurar el focus al input después de la respuesta
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        } catch {
            setMessages([...newMessages, {
                role: 'assistant',
                content: 'Ups, tuve un problema conectándome. ¿Puedes intentarlo de nuevo?'
            }]);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

            {showBubble && !isOpen && (
                <div
                    className="flex items-end gap-2 cursor-pointer animate-bounce-slow"
                    onClick={() => setIsOpen(true)}
                >
                    <div
                        className="rounded-2xl rounded-br-none px-4 py-3 max-w-[180px] shadow-lg"
                        style={{ background: 'rgba(19,27,46,0.95)', border: '1px solid rgba(173,198,255,0.2)' }}
                    >
                        <p className="text-sm text-on-surface leading-snug">
                            ¿No sabes qué jugar? 🎮<br />
                            <span className="text-primary font-medium">¡Yo te puedo ayudar!</span>
                        </p>
                    </div>
                </div>
            )}

            {isOpen && (
                <div
                    className="flex flex-col rounded-2xl overflow-hidden shadow-2xl"
                    style={{
                        width: '320px',
                        height: '460px',
                        background: 'rgba(19,27,46,0.97)',
                        border: '1px solid rgba(173,198,255,0.15)',
                    }}
                >

                    <div
                        className="flex items-center gap-3 px-4 py-3 shrink-0"
                        style={{ background: 'rgba(173,198,255,0.08)', borderBottom: '1px solid rgba(173,198,255,0.1)' }}
                    >
                        <img src="/chatbot.gif" alt="GameBot" className="w-10 h-10 rounded-full object-cover" />
                        <div className="flex-1">
                            <p className="text-sm font-bold text-on-surface">GameBot</p>
                            <p className="text-xs text-primary">● En línea</p>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-on-surface-variant hover:text-on-surface transition-colors"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'assistant' && (
                                    <img src="/chatbot.gif" alt="bot" className="w-7 h-7 rounded-full object-cover mr-2 self-end shrink-0" />
                                )}
                                <div
                                    className="px-3 py-2 rounded-2xl text-sm leading-relaxed max-w-[75%]"
                                    style={{
                                        background: msg.role === 'user'
                                            ? 'rgba(173,198,255,0.2)'
                                            : 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(173,198,255,0.1)',
                                        borderRadius: msg.role === 'user'
                                            ? '16px 16px 4px 16px'
                                            : '4px 16px 16px 16px',
                                        color: 'var(--md-sys-color-on-surface, #e2e8f0)',
                                    }}
                                >
                                    {msg.role === 'assistant' ? (
                                        <ReactMarkdown
                                            components={{
                                                strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                                                em: ({node, ...props}) => <em className="italic" {...props} />,
                                                p: ({node, ...props}) => <p {...props} />,
                                                ul: ({node, ...props}) => <ul className="list-disc list-inside" {...props} />,
                                                ol: ({node, ...props}) => <ol className="list-decimal list-inside" {...props} />,
                                                li: ({node, ...props}) => <li {...props} />,
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start items-end gap-2">
                                <img src="/chatbot.gif" alt="bot" className="w-7 h-7 rounded-full object-cover shrink-0" />
                                <div
                                    className="px-4 py-3 rounded-2xl"
                                    style={{
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(173,198,255,0.1)',
                                        borderRadius: '4px 16px 16px 16px',
                                    }}
                                >
                                    <div className="flex gap-1 items-center">
                                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div
                        className="px-4 py-3 flex gap-2 items-center shrink-0"
                        style={{ borderTop: '1px solid rgba(173,198,255,0.1)' }}
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Escribe un mensaje..."
                            disabled={loading}
                            className="flex-1 bg-transparent outline-none text-sm text-on-surface placeholder-outline"
                            style={{ color: '#e2e8f0' }}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={loading || !input.trim()}
                            className="text-primary hover:text-on-surface transition-colors disabled:opacity-40"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>send</span>
                        </button>
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-16 h-16 rounded-full overflow-hidden shadow-2xl border-2 border-primary/30 hover:border-primary/60 transition-all hover:scale-110 active:scale-95"
                style={{ background: 'rgba(19,27,46,0.95)' }}
                aria-label="Abrir GameBot"
            >
                <img src="/chatbot.gif" alt="GameBot" className="w-full h-full object-cover" />
            </button>
        </div>
    );
}