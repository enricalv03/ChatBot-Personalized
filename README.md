# Enric's AI Chat Application 🤖💬

## Project Overview

A modern, responsive web-based AI chat application built with React, featuring multiple AI provider integrations, theme switching, and rich messaging capabilities.

![Project Demo Screenshot](![image](https://github.com/user-attachments/assets/17af2240-c477-4fce-bf17-02462a8e1484)
)

## 🌟 Features

- **Multi-AI Provider Support**
  - DeepSeek
  - Groq (Llama-3)
- **Dynamic Theme Switching** (Dark/Light)
- **File Upload Integration**
- **Chat History Management**
- **Code Block Rendering**
- **Inline Code Formatting**
- **Responsive Design**

## 🛠 Tech Stack

- **Frontend**: React.js
- **Styling**: CSS with CSS Variables
- **State Management**: React Hooks
- **API Integration**: Axios
- **Code Highlighting**: Highlight.js
- **Build Tool**: Vite

## 📋 Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- API keys for AI providers (OpenRouter, Groq)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/enrics-ai-chat.git
cd enrics-ai-chat
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Configuration
Create a `.env.local` file in the project root with the following variables:
```
VITE_OPENROUTER_KEY=your_openrouter_api_key
VITE_GROQ_KEY=your_groq_api_key
```

**Important Notes:**
- Use `.env.local` instead of `.env` to prevent accidental commits of sensitive information
- `.env.local` is gitignored by default in Vite projects
- Rename the file to `.env.local` to ensure it's not tracked by version control
- Never share your API keys publicly

### 4. Development Server
```bash
npm run dev
# or
yarn dev
```

### 5. Build for Production
```bash
npm run build
# or
yarn build
```

## 🔧 Configuration

### AI Providers
Currently supports:
- DeepSeek
- Groq (Llama-3)

You can add more providers in `aiService.js`

### Theme Customization
Modify theme variables in `App.css`:
- Dark theme: `.app.dark`
- Light theme: `.app.light`

## 📦 Project Structure
```
enrics-ai-chat/
│
├── src/
│   ├── components/
│   │   ├── CodeBlock.jsx
│   │   └── TypingAnimation.jsx
│   ├── services/
│   │   └── aiService.js
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
│
├── .env
├── vite.config.js
└── package.json
```

## 🔒 Security Notes

- **API Keys**: Never commit API keys to version control
- Use environment variables
- Implement proper key rotation and access management

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 🚨 Troubleshooting

- Ensure all API keys are correctly set
- Check browser console for any error messages
- Verify network connectivity
- Ensure you're using a compatible Node.js version

## 📞 Contact

Enric - [Your Email or Contact Info]
Project Link: [https://github.com/yourusername/enrics-ai-chat](https://github.com/yourusername/enrics-ai-chat)
