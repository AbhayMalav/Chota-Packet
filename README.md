# Chota-Packet: AI Prompt Enhancement For Noobs

[![Open Source Love](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/AbhayMalav/Chota-Packet)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.2.0-61DAFB.svg?style=flat&logo=React&logoColor=white)](https://react.dev/)

**Chota-Packet** is a lightweight, on-device AI assistant designed to transform rough, fragmented thoughts or voice inputs into structured, high-quality LLM prompts. By leveraging a fine-tuned **mT5-small** model with **LoRA** adapters, it provides powerful prompt engineering capabilities without the need for massive cloud infrastructure. It also supports Openrouter API Keys so it can be used with almost any LLM of you choice.

> [!CAUTION] Vibe Coding Alert

> **This is a vibe coded product.**
> The development process was driven more by vibes than traditional software engineering rigorousness. Use with caution, expect some "unique" behaviors, and always enjoy the ride.

---

## Key Features

- **Intelligent Prompt Enhancement**: Instantly matures rough text into detailed, role-specific prompts.
- **Voice-to-Prompt**: Integrated audio processing via `ffmpeg` for hands-free prompt generation.
- **Privacy First**: Designed for on-device execution, ensuring your ideas stay local.
- **Multi-Level Refinement**: Choose between different enhancement levels (Basic, Standard, Professional).
- **Modern UI**: Sleek, responsive interface built with React 19 and Tailwind CSS 4.

---

## Project Structure

The repository is organized into four main functional areas:

```text
Chota-Packet/
├── 📂 backend/        # FastAPI server, ML logic, and model inference
├── 📂 frontend/       # React 19 + Vite + Tailwind CSS 4 web interface
├── 📂 training/       # Scripts for fine-tuning the mT5-small + LoRA model
└── 📂 Datasets/       # Unified datasets used for model training
```

### Backend Components

- `main.py`: Entry point for the FastAPI server with lifecycle management.
- `models.py`: Handles model loading (mT5-small, LoRA, and audio decoding).
- `routes.py`: API endpoint definitions for enhancement and health checks.
- `services/`: Business logic for prompt processing and system integrations.

### Frontend Components

- `src/hooks/`: Custom hooks like `useEnhance` for seamless API interaction.
- `src/components/`: Modular UI components for a premium user experience.

---

## Tech Stack

### Backend

- **Framework**: FastAPI
- **Model Architecture**: mT5-small (Multilingual T5)
- **Adaptation**: PEFT / LoRA (Low-Rank Adaptation)
- **Deep Learning**: PyTorch & Hugging Face Transformers
- **Audio**: FFmpeg (Decoding) & Whisper Tiny (Inference candidate)

### Frontend

- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS v4.0 (for cutting-edge design flexibility)
- **Communication**: Axios with custom error-handling middleware

---

## Getting Started

### Prerequisites

- Python 3.10 or higher
- Node.js (v18+) & npm
- FFmpeg (on your system PATH for audio support)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. (Optional) For CPU-only environments, follow the specific PyTorch install notes in `requirements.txt`.
4. Start the server:
   ```bash
   python main.py
   ```
   _The API will be available at `http://localhost:8000`_

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file (copy from root or `frontend/` if available):
   ```bash
   VITE_API_BASE=http://localhost:8000
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

---

## Model Training

If you wish to fine-tune the model further, navigate to the `training/` directory.

- `train.py`: Main script for fine-tuning using the `Datasets/Unified_dataset.json`.
- Requires a GPU with at least 8GB VRAM (or use smaller batch sizes for 4GB).

---

## Contributing

This is an open-source project! We welcome contributions to:

- Model quality improvements.
- UI/UX enhancements.
- Bug fixes and documentation.

Please fork the repo and submit a PR.

---

## License

Distributed under the **MIT License**. See `LICENSE` (if added) or this README for details.

---

_Created with ❤️ by [Abhay Malav](https://github.com/AbhayMalav)_
