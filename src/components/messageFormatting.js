import React from 'react';

// Utility function to parse inline code
export const parseInlineCode = (text) => {
    // If text is not a string, return it as-is
    if (typeof text !== 'string') return text;

    // Split the text into parts, preserving backtick-enclosed code
    const parts = text.split(/(`[^`]+`)/g);

    return parts.map((part, index) => {
        // Check if the part is enclosed in backticks
        if (part.startsWith('`') && part.endsWith('`')) {
            // Remove the backticks and wrap in a span
            const code = part.slice(1, -1);
            return (
                <span key={index} className="inline-code">
                    {code}
                </span>
            );
        }
        // Return plain text parts as-is
        return part;
    });
};