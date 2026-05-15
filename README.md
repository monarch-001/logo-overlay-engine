# Dynamic Logo Overlay Engine

A production-ready, AI-powered full-stack tool for batch branding and watermarking.

## Features

- **AI Logo Processing**: Automatically remove backgrounds from logos using in-browser WebAssembly AI (`@imgly/background-removal`).
- **Batch Processing**: Upload dozens of images and process them in a single click.
- **Interactive Editor**: Drag, scale, rotate, and adjust logo opacity in a live `react-konva` preview.
- **High-Quality Compositing**: Uses the high-performance `Sharp` library on the backend for professional-grade image merging.
- **One-Click Export**: Processed images are bundled into a `.zip` archive for easy download.
- **Premium UI**: Modern dark-themed dashboard with glassmorphism, framer-motion animations, and shadcn/ui components.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS 4
- **State Management**: Zustand
- **Canvas**: react-konva / Konva.js
- **Image Processing**: Sharp (Backend), @imgly/background-removal (Client AI)
- **Animations**: Framer Motion
- **UI Components**: shadcn/ui, Lucide Icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd logo-overlay-engine
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture

- **Client-Side AI**: The logo background removal runs entirely in the user's browser, ensuring privacy and reducing server costs.
- **API Orchestration**: The frontend sends images one-by-one to the `/api/process` endpoint to avoid payload limits and timeouts during batch operations.
- **Mathematical Precision**: Canvas percentage-based coordinates are mapped precisely to pixel coordinates on the server for identical results between preview and export.

## License

MIT
