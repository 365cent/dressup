# DressUp

DressUp is a web application that provides real-time fashion analysis and outfit scoring using advanced AI vision models.

## Features

- **Real-time Outfit Analysis**: Get instant feedback on your outfit with numerical scores
- **Multiple Scoring Categories**: Evaluates overall impression, comfort, fit confidence, and color harmony
- **Camera Controls**: Switch between front and rear cameras
- **Responsive Design**: Works on mobile and desktop devices
- **Scenario-based Outfit Scoring**: Analyze how well your outfit matches specific scenarios or occasions
- **Detailed Outfit Analysis**: Get comprehensive breakdown of your outfit including clothing items, materials, colors, and more
- **Personal Wardrobe Management**: Save your analyzed outfits to build a digital wardrobe
- **Outfit Details View**: Explore detailed metrics and clothing item information for each saved outfit
- **Color-coded Match Ratings**: Visual feedback with color-coded ratings (Excellent, Great, Good, Fair, Poor) to quickly assess outfit suitability
- **Expandable Item Details**: Interactive UI to expand and view detailed information about each clothing item
- **Person Attributes Analysis**: AI detection of person attributes like age range, gender, pose, and expression

## Technology Stack

- Next.js for the frontend framework
- React for UI components
- X.AI (Grok) API for AI-powered outfit analysis
- Tailwind CSS for styling
- Framer Motion for smooth animations and transitions

## Environment Variables

The application requires the following environment variables:
- `NEXT_PUBLIC_CF_ACCOUNT_ID`: Your Cloudflare account ID
- `GROK_API_KEY`: Your X.AI API key for accessing the Grok model

You can set these in a `.env` file in the root directory of your project:

```
NEXT_PUBLIC_CF_ACCOUNT_ID=your_cloudflare_account_id
GROK_API_KEY=your_grok_api_key
```


## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/365cent/dressup


2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your environment variables.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000` to access the application.

