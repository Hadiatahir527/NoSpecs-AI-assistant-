# NoSpecs 👓

**NoSpecs** is an advanced AI-powered visual assistant designed to help individuals with refractive errors (myopia, hyperopia) and low vision read the world around them without corrective eyewear. 

By leveraging state-of-the-art Generative AI, NoSpecs captures physical text, simplifies the semantic structure, translates it to the user's preferred language, and presents it in a hyper-readable, personalized format with high-fidelity audio synthesis.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-MVP-green)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

## 🚀 Features

### 👁️ Intelligent Vision & OCR
*   **Gemini 2.5 Flash Integration**: Utilizes Google's latest multimodal models for near-instant text recognition in varying lighting conditions.
*   **Smart Simplification**: Automatically lowers the reading grade level of complex texts (e.g., medical instructions, legal notices) to reduce cognitive load.
*   **Instant Translation**: seamless text-to-text translation supporting 8+ major global languages.

### 🎨 Hyper-Personalized Accessibility
*   **Dynamic Refraction Correction**: Simulates prescription lenses via digital zoom and clarity adjustments (Diopter input support).
*   **Adaptive Contrast**: Includes presets for High Contrast (Yellow/Black), Photophobia (Blue/Yellow), and Dark Mode.
*   **Legibility First**: Built with **Atkinson Hyperlegible**, a typeface specifically designed for readers with low vision.

### 🔊 Auditory Assistance
*   **Neural TTS**: Converts processed text into natural-sounding speech using the `gemini-2.5-flash-preview-tts` model.
*   **Audio Caching**: Smart caching mechanism for instant playback without re-fetching audio data.

### 🔐 Enterprise Ecosystem
*   **Opus ID Authentication**: Secure, token-based user session management.
*   **Qdrant Vector Sync**: User preferences are vectorized and synced to a remote Qdrant database for persistent personalized experiences across devices.
*   **Safety Audit**: Integrated workflow for flagging critical medical/safety text for human review via the Opus Audit Queue.

## 🛠️ Tech Stack

*   **Frontend**: React 19, TypeScript
*   **Styling**: Tailwind CSS (Custom Design System with Glassmorphism)
*   **AI Provider**: Google GenAI SDK (`gemini-2.5-flash`)
*   **State Management**: React Hooks & Context
*   **Icons**: Lucide React

## 📦 Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Hadiatahir527/NoSpecs-AI-assistant-.git
    
    cd nospecs
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file in the root directory and add your Gemini API key:
    ```env
    REACT_APP_API_KEY=your_google_gemini_api_key
    ```
    *(Note: For this MVP, the key is handled via process.env)*

4.  **Run the application**
    ```bash
    npm start
    ```
    The app will launch at `http://localhost:3000`.

## 📱 Usage Guide

1.  **Authentication**: Log in using your Opus ID credentials.
2.  **Capture**:
    *   Use **Live Camera** to snap a photo of text.
    *   Use **Upload** to process an existing image from your gallery.
3.  **Reading View**:
    *   **Captured Tab**: View the raw text extracted from the image.
    *   **Simplified Tab**: Read the AI-summarized version.
    *   **Translated Tab**: Select your language and read the translation.
4.  **Audio**: Click the "Read Aloud" button on any card to hear the text.
5.  **Settings**: Tap the gear icon to adjust font size, color themes, and input your vision prescription (Diopters).

## 🛡️ Privacy & Security

*   **Ephemeral Processing**: Images are processed in memory and sent to the AI provider solely for extraction; no images are permanently stored on the server in this version.
*   **Audit Logs**: Critical safety information submissions are hashed before being queued for review.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Designed with ❤️ for inclusive technology.*