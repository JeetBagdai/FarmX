import React, { useState, useEffect, useRef } from 'react';
import { createChatSession, translateChatHistory, ChatSession } from '../services/groqService';
import { FarmXForecast, ChatMessage } from '../types';
import { ChatIcon } from './icons/ChatIcon';
import { CloseIcon } from './icons/CloseIcon';
import { SendIcon } from './icons/SendIcon';
import { BotIcon } from './icons/BotIcon';

// Declare globals for CDN libraries
declare const marked: any;
declare const DOMPurify: any;

interface ChatBotProps {
    forecast: FarmXForecast | null;
    region: string;
    crop: string;
    language: string;
    t: (key: string) => string;
}

const ChatBot: React.FC<ChatBotProps> = ({ forecast, region, crop, language, t }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTranslatingChat, setIsTranslatingChat] = useState(false);

    const chatSessionRef = useRef<ChatSession | null>(null);
    const historyRef = useRef<{ role: 'user' | 'model'; text: string }[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const prevLanguageRef = useRef<string>(language);

    const greetingKey = "Hello! I am FarmX Assistant. Ask me anything about crop care, market trends, or prices.";

    // Auto-scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen, isTranslatingChat]);

    // Initialize chat session on mount (only once)
    useEffect(() => {
        if (!chatSessionRef.current) {
            chatSessionRef.current = createChatSession();

            setMessages([{
                id: Date.now(),
                role: 'model',
                text: t(greetingKey)
            }]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    // Handle Chat Translation when Language Changes
    useEffect(() => {
        const handleTranslation = async () => {
            // If language changed
            if (language !== prevLanguageRef.current) {
                prevLanguageRef.current = language;

                // If we only have the default greeting, use the fast 't' replacement
                // This is faster/cheaper than a full API call for just the static greeting
                if (messages.length === 1 && messages[0].role === 'model' && messages[0].text.includes('FarmX')) {
                    const translatedGreeting = t(greetingKey);
                    setMessages([{ ...messages[0], text: translatedGreeting }]);
                    return;
                }

                // If we have a conversation history, translate it using AI
                if (messages.length > 0 && language !== 'English') {
                    setIsTranslatingChat(true);
                    try {
                        const translatedMessages = await translateChatHistory(messages, language);
                        setMessages(translatedMessages);
                    } catch (error) {
                        console.error("Failed to translate chat history", error);
                    } finally {
                        setIsTranslatingChat(false);
                    }
                } else if (messages.length > 0 && language === 'English') {
                    // Option: Store original English messages to restore? 
                    // For now, we just translate back to English if they switch back, maintaining continuity.
                    setIsTranslatingChat(true);
                    try {
                        const translatedMessages = await translateChatHistory(messages, 'English');
                        setMessages(translatedMessages);
                    } catch (error) {
                        console.error("Failed to translate chat history back to English", error);
                    } finally {
                        setIsTranslatingChat(false);
                    }
                }
            }
        };

        handleTranslation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language, t]); // Trigger when language changes

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim() || !chatSessionRef.current) return;

        const userText = inputValue.trim();
        setInputValue('');

        // Add user message to UI
        setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: userText }]);
        setIsLoading(true);

        try {
            // Construct context string to prepend to the user message
            let context = "";
            if (forecast) {
                context = `[Context: User is viewing a forecast for ${crop} in ${region}. Recommendation: ${forecast.recommendation.decision}. Best selling time: ${forecast.recommendation.bestSellingTime}.] `;
            } else if (region && crop) {
                context = `[Context: User has selected ${crop} in ${region} but hasn't generated a full forecast yet.] `;
            }

            // Add explicit language instruction to the context for this turn
            context += ` [Instruction: The user interface is set to ${language}. Please reply in ${language} unless the user explicitly types in a different language.] `;

            const fullMessage = context + userText;

            // Send message with full history for context (Groq is stateless)
            const botText = await chatSessionRef.current.sendMessage(fullMessage, historyRef.current);

            // Update history ref for next turn
            historyRef.current = [
                ...historyRef.current,
                { role: 'user', text: fullMessage },
                { role: 'model', text: botText },
            ];

            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'model', text: botText }]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'model', text: t("Sorry, something went wrong. Please check your connection.") }]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessageContent = (msg: ChatMessage) => {
        if (msg.role === 'user') {
            return msg.text;
        }

        // For bot messages, use Markdown
        try {
            const rawMarkup = marked.parse(msg.text);
            const cleanMarkup = DOMPurify.sanitize(rawMarkup);
            return (
                <div
                    className="prose prose-sm max-w-none dark:prose-invert 
                           prose-p:my-1 prose-p:leading-snug
                           prose-ul:my-1 prose-ul:pl-4 prose-ul:list-disc
                           prose-ol:my-1 prose-ol:pl-4
                           prose-li:my-0.5
                           prose-headings:my-2 prose-headings:text-sm prose-headings:font-bold
                           prose-strong:font-bold
                           break-words"
                    dangerouslySetInnerHTML={{ __html: cleanMarkup }}
                />
            );
        } catch (e) {
            return msg.text;
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 p-4 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-green-300"
                aria-label={t("Open Chat Assistant")}
            >
                <ChatIcon />
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 w-[90vw] md:w-96 h-[500px] max-h-[80vh] flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-green-600 dark:bg-green-700 rounded-t-2xl text-white">
                <div className="flex items-center gap-2">
                    <BotIcon />
                    <h3 className="font-semibold text-lg">{t("FarmX Assistant")}</h3>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                    aria-label={t("Close Chat")}
                >
                    <CloseIcon />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-900/50 relative">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} ${isTranslatingChat ? 'opacity-50 blur-[1px] transition-all' : ''}`}
                    >
                        <div
                            className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-green-600 text-white rounded-br-none'
                                    : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-slate-600 rounded-bl-none shadow-sm'
                                }`}
                        >
                            {renderMessageContent(msg)}
                        </div>
                    </div>
                ))}

                {/* Loading / Typing Indicators */}
                {(isLoading || isTranslatingChat) && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-slate-700 p-3 rounded-2xl rounded-bl-none border border-gray-200 dark:border-slate-600 shadow-sm flex items-center gap-1">
                            {isTranslatingChat ? (
                                // Translation Spinner
                                <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                // Typing Dots
                                <>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                                </>
                            )}
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-b-2xl">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={t("Ask about crops, prices...")}
                        disabled={isTranslatingChat}
                        className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white rounded-full border border-transparent focus:border-green-500 focus:bg-white dark:focus:bg-slate-600 focus:outline-none transition-colors text-sm disabled:opacity-70"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isLoading || isTranslatingChat}
                        className="p-2.5 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                        aria-label={t("Send Message")}
                    >
                        <SendIcon />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatBot;