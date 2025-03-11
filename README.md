# DressUp

DressUp is a web application that provides real-time fashion analysis and outfit scoring using advanced AI vision models.

## Features

- **Real-time Outfit Analysis**: Get instant feedback on your outfit with numerical scores
- **Multiple Scoring Categories**: Evaluates overall impression, comfort, fit confidence, and color harmony
- **Camera Controls**: Switch between front and rear cameras
- **Responsive Design**: Works on mobile and desktop devices

## Technology Stack

- Next.js for the frontend framework
- React for UI components
- X.AI (Grok) API for AI-powered outfit analysis
- Tailwind CSS for styling

## Environment Variables

The application requires the following environment variables:
- `CF_ACCOUNT_ID`: Your Cloudflare account ID
- `API_KEY`: Your X.AI API key for accessing the Grok model

You can set these in a `.env` file in the root directory of your project:

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/365cent/dressup
   cd dressup
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your environment variables:

## Usage

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:3000` to access the application.

    