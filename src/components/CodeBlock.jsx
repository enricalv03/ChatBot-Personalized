import React, { useState } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

const CodeBlock = ({ code, language, explanation }) => {
    const [copied, setCopied] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);

    // Highlight the code
    const highlightedCode = language
        ? hljs.highlight(code, { language }).value
        : hljs.highlightAuto(code).value;

    // Copy code to clipboard
    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Function to add inline code formatting to explanation text
    const formatExplanationText = (text) => {
        // Replace code-like words (enclosed in backticks) with inline code spans
        return text.replace(/`([^`]+)`/g, (match, p1) =>
            `<span class="inline-code">${p1}</span>`
        );
    };

    return (
        <div className="modern-code-block">
            <div className="code-block-header">
                <div className="code-lang-badge">
                    {language || 'Plain Text'}
                </div>
                <div className="code-block-actions">
                    {explanation && explanation.length > 0 && (
                        <button
                            className="explain-code-btn"
                            onClick={() => setShowExplanation(!showExplanation)}
                        >
                            {showExplanation ? '👀 Hide Explanation' : '🤔 Explain Code'}
                        </button>
                    )}
                    <button
                        className={`copy-code-btn ${copied ? 'copied' : ''}`}
                        onClick={handleCopy}
                    >
                        {copied ? '✓ Copied' : '📋 Copy'}
                    </button>
                </div>
            </div>
            <pre className="code-content">
                <code
                    className={`hljs language-${language}`}
                    dangerouslySetInnerHTML={{ __html: highlightedCode }}
                />
            </pre>
            {showExplanation && explanation && explanation.length > 0 && (
                <div className="code-explanation">
                    {explanation.map((line, index) => (
                        <div key={index} className="explanation-line">
                            <span className="explanation-bullet">•</span>
                            <span
                                className="explanation-text"
                                dangerouslySetInnerHTML={{
                                    __html: formatExplanationText(line)
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CodeBlock;