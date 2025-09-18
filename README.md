# FarmX
An intelligent agricultural platform that uses machine learning to predict local market demand, prevent crop oversupply, and optimize farmer decision-making through smart forecasting and distribution recommendations.
# 🌾 FarmX - AI-Driven Crop Demand Forecasting Platform

An intelligent agricultural platform that leverages machine learning and data analytics to predict local market demand, prevent crop oversupply, and optimize farmer decision-making. Built to reduce food waste, stabilize farmer income, and improve agricultural efficiency across India.

## ✨ Features

- 🔮 Smart Demand Forecasting: Predicts crop demand 3-12 months ahead using Google Gemini AI
- 💰 Price Prediction Engine: Forecasts commodity prices with market sentiment analysis
- ⚠️ Risk Assessment Tools: Evaluates market, climate, and financial risks
- 🌱 Crop Recommendation System: Suggests optimal crops, quantities, and planting schedules
- 🚚 Distribution Optimization: Matches farmers with buyers and optimizes supply chains
- 📊 Real-time Market Intelligence: Live updates on market conditions and opportunities
- 🌍 Multi-language Support: Available in Hindi, English, and regional Indian languages
- 📱 Responsive Design: Works seamlessly on desktop, tablet, and mobile devices

## 🛠 Tech Stack

Frontend:
- Next.js 14+ with TypeScript
- React.js 18+ components
- Tailwind CSS for styling
- Lucide React for icons

Backend:
- Node.js with TypeScript
- Google Gemini AI (2.5 Flash model)
- FarmXService for AI integration

Key Libraries:
- @google/genai for AI forecasting
- Custom UI components
- Type-safe API integration

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (version 18.0 or higher) - [Download here](https://nodejs.org/)
- npm or yarn as package manager
- Git for version control - [Download here](https://git-scm.com/)
- Google AI Studio API Key - [Get API Key](https://makersuite.google.com/app/apikey)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/JeetBagdai/FarmX.git
cd FarmX
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# Or using yarn
yarn install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Google AI API Configuration
API_KEY=your_google_ai_studio_api_key_here
NEXT_PUBLIC_API_URL=http://localhost:3000

# Additional Configuration
NODE_ENV=development
```

⚠️ Important: Never commit your API keys to version control. Keep your `.env.local` file secure.

### 4. Get Your Google AI Studio API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key
5. Replace `your_google_ai_studio_api_key_here` in your `.env.local` file

### 5. Run the Development Server

```bash
# Using npm
npm run dev

# Or using yarn
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see FarmX in action!

## 🏗 Project Structure

```
FarmX/
├── components/              # React UI components
│   ├── icons/              # Custom icons (StopIcon, TargetIcon, TrendingUp)
│   ├── ErrorMessage.tsx    # Error handling component
│   ├── ForecastCard.tsx    # Main forecast display
│   ├── Header.tsx          # App header
│   ├── LanguageSelector.tsx # Multi-language support
│   ├── LoadingSpinner.tsx  # Loading states
│   ├── MarketTrends.tsx    # Market trends display
│   ├── SearchableDropdown.tsx # Location/crop selector
│   └── Welcome.tsx         # Welcome screen
├── services/               # Business logic
│   └── FarmXService.tsx    # Google AI integration service
├── constants.ts            # App constants and configurations
├── types.ts               # TypeScript type definitions
├── App.tsx                # Main application component
├── index.tsx              # Application entry point
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm test             # Run tests

# Type checking
npm run type-check   # TypeScript compilation check
```

## 🌐 Core Components

### ForecastCard Component
Displays AI-generated crop forecasts with:
- Historical price data (24 months)
- Demand predictions
- Risk assessments
- Planting/selling recommendations

### LanguageSelector Component
Supports multiple Indian languages:
- English
- Hindi
- Bengali
- Tamil
- Telugu
- And more regional languages

### MarketTrends Component
Shows real-time agricultural market trends and insights.

### SearchableDropdown Component
Smart location and crop selection with search functionality.

## 🤖 AI Integration

The app uses Google's Gemini 2.5 Flash model through the `FarmXService`:

```typescript
// Example API call
const forecast = await getFarmXForecast(
  region: "Maharashtra", 
  crop: "Wheat", 
  language: "English"
);
```

### Supported Regions
- All Indian states and major agricultural districts
- City-level granularity for major agricultural centers

### Supported Crops
- Major food grains (Rice, Wheat, Maize)
- Pulses (Chickpea, Lentils, Pigeon Pea)
- Cash crops (Cotton, Sugarcane, Tea)
- Vegetables and fruits
- Spices and condiments

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Visit [Vercel](https://vercel.com/)
3. Import your GitHub repository
4. Add your `API_KEY` in Vercel environment variables
5. Deploy!

### Deploy to Netlify

```bash
# Build the project
npm run build

# Deploy the build folder to Netlify
```

## 🔑 Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `API_KEY` | Google AI Studio API Key | Yes | `AIza...` |
| `NEXT_PUBLIC_API_URL` | API base URL | Yes | `http://localhost:3000` |
| `NODE_ENV` | Environment mode | No | `development` |

## 🐛 Troubleshooting

### Common Issues

"API_KEY environment variable is not set" error:
```bash
# Make sure your .env.local file exists and contains:
API_KEY=your_actual_api_key_here
# Restart your development server after adding the key
```

"Failed to get forecast from AI" error:
```bash
# Check your API key is valid
# Verify your internet connection
# Check Google AI Studio quota limits
```

TypeScript compilation errors:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run type-check
```

## 📱 Usage

1. Select Region: Choose your state/district from the dropdown
2. Select Crop: Pick the crop you want to analyze
3. Choose Language: Select your preferred language
4. Get Forecast: Click "Get Forecast" to receive AI-powered insights
5. View Results: See demand predictions, price forecasts, and recommendations
6. Check Trends: Browse current market trends for additional insights

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Google AI Studio for powerful Gemini AI capabilities
- Indian farmers and agricultural experts for domain insights
- Open source community for amazing tools and libraries

## 📧 Support

For support and questions:
- Create an [Issue](https://github.com/JeetBagdai/FarmX/issues)
- Check the troubleshooting section above
- Review the code documentation in components

---

Built with ❤️ for Indian Agriculture 🇮🇳

Empowering farmers with AI-driven insights to make smarter crop decisions
