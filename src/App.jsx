import React, { useState, useRef, useEffect } from 'react';
import CodeBlock from './components/CodeBlock';
import TypingAnimation from './components/TypingAnimation';
import aiService from './services/aiService';
import './App.css';

function App() {
    // State management
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'dark';
    });
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [chatHistory, setChatHistory] = useState(() => {
        const savedHistory = localStorage.getItem('chatHistory');
        return savedHistory ? JSON.parse(savedHistory) : [];
    });
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [selectedAI, setSelectedAI] = useState('DeepSeek');
    const [showAIOptions, setShowAIOptions] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);

    // Refs
    const messageEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Derived values
    const aiOptions = Object.keys(aiService.AI_PROVIDERS);

    // Side effects
    // Persist theme and chat history
    useEffect(() => {
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    }, [chatHistory]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Add an effect to save current conversation before unloading
    useEffect(() => {
        const handleBeforeUnload = () => {
            saveCurrentConversation();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [messages, selectedChatId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Theme toggle
    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
    };

    // File handling
    const handleFileUpload = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setUploadedFiles(prev => [...prev, ...files]);
        }
        e.target.value = null;
    };

    const removeUploadedFile = (fileToRemove) => {
        setUploadedFiles(prev => prev.filter(file => file !== fileToRemove));
    };

    const clearUploadedFiles = () => {
        setUploadedFiles([]);
    };

    // Helper function to automatically save current conversation
    const saveCurrentConversation = () => {
        // Don't save if there are no messages or it's already selected from history
        if (messages.length === 0 || selectedChatId !== null) {
            return;
        }

        // Create a new chat object
        const newChat = {
            id: Date.now(),
            title: messages[0]?.content || 'Nova conversa',
            messages: [...messages],
            timestamp: new Date().toISOString()
        };

        // Add to history
        setChatHistory(prev => [newChat, ...prev]);

        // Update selected chat ID
        setSelectedChatId(newChat.id);
    };

    // Chat history management
    const startNewChat = () => {
        // Save current conversation first if it has messages
        if (messages.length > 0) {
            // Only save if it's not already in the history
            if (selectedChatId === null) {
                const currentChat = {
                    id: Date.now(),
                    title: messages[0]?.content || 'Nova conversa',
                    messages: [...messages],
                    timestamp: new Date().toISOString()
                };
                setChatHistory(prev => [currentChat, ...prev]);
            } else {
                // Update the existing chat in history
                setChatHistory(prev =>
                    prev.map(chat =>
                        chat.id === selectedChatId
                            ? { ...chat, messages: [...messages], timestamp: new Date().toISOString() }
                            : chat
                    )
                );
            }
        }

        // Start a fresh conversation
        setMessages([]);
        setSelectedChatId(null);
        setUploadedFiles([]);
    };

    const loadChatFromHistory = (chat) => {
        // Save current conversation first if it has messages and isn't already in history
        if (messages.length > 0 && selectedChatId === null) {
            const currentChat = {
                id: Date.now(),
                title: messages[0]?.content || 'Nova conversa',
                messages: [...messages],
                timestamp: new Date().toISOString()
            };
            setChatHistory(prev => [currentChat, ...prev]);
        }

        // Now load the selected chat
        setMessages(chat.messages);
        setSelectedChatId(chat.id);
        setUploadedFiles([]);
    };

    const deleteChat = (chatId) => {
        const updatedHistory = chatHistory.filter(chat => chat.id !== chatId);
        setChatHistory(updatedHistory);

        if (selectedChatId === chatId) {
            setMessages([]);
            setSelectedChatId(null);
            setUploadedFiles([]);
        }
    };

    // Message sending
    const sendMessage = async () => {
        // Validate input
        if (input.trim() === '' && uploadedFiles.length === 0) return;

        // Prepare message content
        let messageContent = input.trim();
        if (uploadedFiles.length > 0) {
            const fileNames = uploadedFiles.map(file => file.name).join(", ");
            messageContent = `Files uploaded: ${fileNames}${messageContent ? ` - Message: ${messageContent}` : ''}`;
        }

        // Create user message
        const newUserMessage = {
            id: messages.length + 1,
            content: messageContent,
            sender: 'user',
            timestamp: new Date().toLocaleTimeString(),
            files: uploadedFiles
        };

        // Update messages and clear input
        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);
        setInput('');
        setUploadedFiles([]);

        // Add loading state
        const loadingMessage = {
            id: 'loading',
            content: 'Thinking...',
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString(),
            isLoading: true
        };
        setMessages([...updatedMessages, loadingMessage]);

        try {
            // Send message to AI
            const aiResponse = await aiService.sendMessageToAI(updatedMessages, selectedAI);

            // Remove loading message
            const updatedMessagesWithoutLoading = updatedMessages.filter(msg => msg.id !== 'loading');

            // Create bot response
            const botResponse = {
                id: updatedMessagesWithoutLoading.length + 1,
                content: aiResponse.text,
                text: aiResponse.text,
                codeBlocks: aiResponse.codeBlocks,
                sender: 'bot',
                timestamp: new Date().toLocaleTimeString()
            };

            // Update messages
            const finalMessages = [...updatedMessagesWithoutLoading, botResponse];
            setMessages(finalMessages);

            // Auto-save the conversation if this is first message exchange
            if (messages.length === 0 && selectedChatId === null) {
                // This is a new conversation with the first message, auto-save it
                const newChat = {
                    id: Date.now(),
                    title: newUserMessage.content || 'Nova conversa',
                    messages: finalMessages,
                    timestamp: new Date().toISOString()
                };
                setChatHistory(prev => [newChat, ...prev]);
                setSelectedChatId(newChat.id);
            } else if (selectedChatId !== null) {
                // Update existing chat in history
                setChatHistory(prev =>
                    prev.map(chat =>
                        chat.id === selectedChatId
                            ? { ...chat, messages: finalMessages, timestamp: new Date().toISOString() }
                            : chat
                    )
                );
            }

        } catch (error) {
            console.error("Error getting AI response:", error);

            // Error response
            const errorResponse = {
                id: messages.length + 1,
                content: `Sorry, I encountered an error: ${error.message}`,
                sender: 'bot',
                timestamp: new Date().toLocaleTimeString(),
                isError: true
            };

            setMessages(prevMessages => prevMessages.filter(msg => msg.id !== 'loading').concat(errorResponse));
        }
    };

    // Handle key press for sending message
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Helper function to render inline code with backticks
    // Enhanced renderInlineCode function to skip empty backticks
    const renderInlineCode = (text) => {
        if (!text) return '';

        // Split the text by backtick characters
        const parts = text.split(/(`.*?`)/);

        if (parts.length === 1) {
            return text; // No backticks found, return the original text
        }

        return parts.map((part, index) => {
            // Check if this part is wrapped in backticks and contains actual content
            if (part.startsWith('`') && part.endsWith('`')) {
                // Extract the content between backticks
                const codeContent = part.slice(1, -1);

                // Only render as inline code if there's actual content
                if (codeContent.trim() !== '') {
                    return <span key={index} className="inline-code">{codeContent}</span>;
                } else {
                    // Just return an empty string for empty backticks
                    return '';
                }
            }
            return part;
        });
    };

    // Render message content with code blocks
    const renderMessageContent = (message) => {
        if (message.isLoading) return <TypingAnimation />;

        if (message.codeBlocks && message.codeBlocks.length > 0) {
            return (
                <>
                    {message.text.split(/\[CODE_BLOCK_\d+\]/).map((textPart, index) => (
                        <React.Fragment key={index}>
                            {renderInlineCode(textPart)}
                            {message.codeBlocks[index] && (
                                <CodeBlock
                                    code={message.codeBlocks[index].code}
                                    language={message.codeBlocks[index].language}
                                    explanation={message.codeBlocks[index].explanation}
                                />
                            )}
                        </React.Fragment>
                    ))}
                    {message.files && message.files.length > 0 && (
                        <div className="message-files">
                            <div className="files-header">Attached Files:</div>
                            <div className="files-list">
                                {message.files.map((file, index) => (
                                    <div key={index} className="message-file-item">
                                        📎 {file.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            );
        }

        return (
            <>
                {renderInlineCode(message.content)}
                {message.files && message.files.length > 0 && (
                    <div className="message-files">
                        <div className="files-header">Attached Files:</div>
                        <div className="files-list">
                            {message.files.map((file, index) => (
                                <div key={index} className="message-file-item">
                                    📎 {file.name}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </>
        );
    };

    return (
        <div className={`app ${theme}`}>
            {/* Header */}
            <header className="header">
                <div className="logo">
                    <h1>ENRIC'S AI</h1>
                </div>
                <div className="header-controls">
                    <button
                        className="new-chat-btn"
                        onClick={startNewChat}
                        aria-label="Start new chat"
                    >
                        + Nova conversa
                    </button>
                    <button
                        className="theme-toggle"
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                </div>
            </header>

            <div className="main-container">
                {/* Sidebar */}
                <aside className={`sidebar ${showSidebar ? 'open' : 'closed'}`}>
                    <div className="sidebar-header">
                        <h2>Historial de converses</h2>
                    </div>
                    <div className="chat-history">
                        {chatHistory.map(chat => (
                            <div
                                key={chat.id}
                                className={`history-item ${selectedChatId === chat.id ? 'selected' : ''}`}
                            >
                                <div
                                    className="history-content"
                                    onClick={() => loadChatFromHistory(chat)}
                                >
                                    {chat.title}
                                </div>
                                <button
                                    className="delete-chat-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteChat(chat.id);
                                    }}
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Toggle sidebar button */}
                <button
                    className="toggle-sidebar"
                    onClick={() => setShowSidebar(!showSidebar)}
                    aria-label={showSidebar ? "Hide sidebar" : "Show sidebar"}
                >
                    {showSidebar ? '◀' : '▶'}
                </button>

                {/* Chat content */}
                <main
                    className="chat-container"
                    style={{width: showSidebar ? 'calc(100% - 250px)' : '100%'}}
                >
                    {messages.length === 0 ? (
                        <div className="welcome-message">
                            <h2>Benvingut al chat del Enric ;)</h2>
                            <p>Pregunta qualsevol cosa per començar la conversa.</p>
                        </div>
                    ) : (
                        <div className="messages">
                            {messages.map(message => (
                                <div
                                    className={`message ${message.sender} ${message.isLoading ? 'isLoading' : ''} ${message.isError ? 'isError' : ''}`}
                                    key={message.id}
                                >
                                    <div className="message-content">
                                        {renderMessageContent(message)}
                                    </div>
                                    <div className="message-timestamp">{message.timestamp}</div>
                                </div>
                            ))}
                            <div ref={messageEndRef} />
                        </div>
                    )}
                </main>
            </div>

            {/* Input area */}
            <footer className="input-container">
                {/* File upload preview */}
                {uploadedFiles.length > 0 && (
                    <div className="file-upload-preview">
                        <div className="file-list">
                            {uploadedFiles.map((file, index) => (
                                <div key={index} className="file-item">
                                    <span className="file-name">{file.name}</span>
                                    <button
                                        className="remove-file-btn"
                                        onClick={() => removeUploadedFile(file)}
                                    >
                                        ✖
                                    </button>
                                </div>
                            ))}
                        </div>
                        {uploadedFiles.length > 1 && (
                            <button
                                className="clear-all-files-btn"
                                onClick={clearUploadedFiles}
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                )}

                <div className="input-wrapper">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type your message here..."
                        rows="1"
                    />

                    <div className="input-buttons">
                        <div className="ai-selector">
                            <button
                                className="ai-select-btn"
                                onClick={() => setShowAIOptions(!showAIOptions)}
                            >
                                {aiService.AI_PROVIDERS[selectedAI]?.name || selectedAI} ▼
                            </button>

                            {showAIOptions && (
                                <div className="ai-options">
                                    {aiOptions.map(option => (
                                        <div
                                            key={option}
                                            className="ai-option"
                                            onClick={() => {
                                                setSelectedAI(option);
                                                setShowAIOptions(false);
                                            }}
                                        >
                                            {aiService.AI_PROVIDERS[option].name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="upload-btn-container">
                            <button
                                className="upload-btn"
                                onClick={handleFileUpload}
                                aria-label="Upload file"
                            >
                                📎
                            </button>
                            {uploadedFiles.length > 0 && (
                                <span className="file-counter">{uploadedFiles.length}</span>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            multiple
                            style={{ display: 'none' }}
                        />

                        <button
                            className="send-btn"
                            onClick={sendMessage}
                            disabled={input.trim() === '' && uploadedFiles.length === 0}
                            aria-label="Send message"
                        >
                            ➤
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;