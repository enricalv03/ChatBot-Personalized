// src/components/TypingAnimation.jsx
import { useState, useEffect } from 'react';

const TypingAnimation = ({ finalText = "AI is thinking..." }) => {
    const [displayText, setDisplayText] = useState("");
    const [isTyping, setIsTyping] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Random phrases the AI might "think" about while generating a response
    const thinkingPhrases = [
        "Processing your request...",
        "Analyzing information...",
        "Generating response...",
        "Considering options...",
        "Thinking deeply...",
        "Connecting ideas...",
        "Formulating thoughts..."
    ];

    // Select a random phrase on component mount
    useEffect(() => {
        const randomPhrase = thinkingPhrases[Math.floor(Math.random() * thinkingPhrases.length)];
        setDisplayText("");
        setCurrentIndex(0);
        setIsTyping(true);
    }, []);

    // Typing effect
    useEffect(() => {
        if (!isTyping) return;

        // Get the phrase to type
        const phrase = thinkingPhrases[Math.floor(Math.random() * thinkingPhrases.length)];

        if (currentIndex < phrase.length) {
            // Type the next character with variable speed
            const typingSpeed = 50 + Math.random() * 50; // Between 50-100ms

            const timer = setTimeout(() => {
                setDisplayText(phrase.substring(0, currentIndex + 1));
                setCurrentIndex(prevIndex => prevIndex + 1);
            }, typingSpeed);

            return () => clearTimeout(timer);
        } else {
            // Pause at the end of the phrase before starting a new one
            const pauseTimer = setTimeout(() => {
                setDisplayText("");
                setCurrentIndex(0);
            }, 1000);

            return () => clearTimeout(pauseTimer);
        }
    }, [currentIndex, isTyping]);

    return (
        <div className="typing-animation">
            <span>{displayText}</span>
            <span className="cursor"></span>
        </div>
    );
};

export default TypingAnimation;