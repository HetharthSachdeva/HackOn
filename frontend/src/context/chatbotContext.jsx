import React, { createContext, useContext, useState } from 'react';

const ChatbotContext = createContext();

export const ChatbotProvider = ({ children }) => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            text: '👋 Hi! I\'m your shopping assistant. Tell me what you need, and I\'ll help you find it instantly!',
            timestamp: new Date()
        }
    ]);
    const [isOpen, setIsOpen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [suggestedProducts, setSuggestedProducts] = useState([]);

    // Add message to chat
    const addMessage = (type, text, products = null, quickReplies = null) => {
        const newMessage = {
            id: Date.now(),
            type,
            text,
            products,
            quickReplies,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);
    };

    // Toggle chat window
    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    // Clear chat history
    const clearChat = () => {
        setMessages([
            {
                id: 1,
                type: 'bot',
                text: '👋 Hi! I\'m your shopping assistant. Tell me what you need, and I\'ll help you find it instantly!',
                timestamp: new Date()
            }
        ]);
        setSuggestedProducts([]);
    };

    return (
        <ChatbotContext.Provider 
            value={{ 
                messages, 
                addMessage, 
                isOpen, 
                toggleChat, 
                isTyping, 
                setIsTyping,
                suggestedProducts,
                setSuggestedProducts,
                clearChat
            }}
        >
            {children}
        </ChatbotContext.Provider>
    );
};

export const useChatbot = () => {
    const context = useContext(ChatbotContext);
    if (!context) {
        throw new Error('useChatbot must be used within a ChatbotProvider');
    }
    return context;
};
