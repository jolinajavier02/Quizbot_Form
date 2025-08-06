# QuizBot Form 🎯

An interactive quiz web application that mimics Google Forms but with faster question input using AI-generated content. Built with Next.js, React, and integrated with ChatGPT API for automatic quiz generation.

## ✨ Features

- **AI-Powered Quiz Generation**: Generate quizzes instantly using ChatGPT API
- **Interactive Quiz Taking**: Clean, mobile-friendly interface for taking quizzes
- **Auto-Grading**: Immediate scoring and detailed results
- **Multiple Question Types**: Support for multiple choice and true/false questions
- **Data Storage**: Store results in Google Sheets or local storage
- **Export Results**: Download quiz results as PDF or CSV
- **Admin Interface**: Easy quiz generation with customizable prompts
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- OpenAI API key
- Google Sheets API credentials (optional, for data storage)

### Installation

1. **Clone and setup the project:**
   ```bash
   cd QuizBot_Form
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your API keys:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   GOOGLE_CLIENT_EMAIL=your_service_account_email
   GOOGLE_PRIVATE_KEY="your_private_key"
   GOOGLE_SHEET_ID=your_sheet_id
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### OpenAI API Setup

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add it to your `.env.local` file

### Google Sheets API Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Sheets API
4. Create a Service Account:
   - Go to "Credentials" → "Create Credentials" → "Service Account"
   - Download the JSON key file
5. Create a Google Sheet and share it with the service account email
6. Copy the sheet ID from the URL and add credentials to `.env.local`

**Note:** If Google Sheets is not configured, the app will use local storage for development.

## 📱 Usage

### For Admins (Quiz Creation)

1. Navigate to `/admin`
2. Enter a prompt describing the quiz you want (e.g., "Create 5 multiple choice questions about World War II")
3. Select number of questions and question type
4. Click "Generate Quiz"
5. Review the generated quiz
6. The quiz is automatically saved and available for users

### For Users (Taking Quizzes)

1. Go to the home page (`/`)
2. Enter your name
3. Answer the quiz questions
4. Submit to see your results
5. Download results as PDF or CSV if needed

## 🏗️ Project Structure

```
QuizBot_Form/
├── app/
│   ├── admin/              # Admin interface for quiz generation
│   ├── api/                # API routes
│   │   └── quiz/
│   │       ├── generate/   # Quiz generation endpoint
│   │       ├── latest/     # Get latest quiz
│   │       ├── submit/     # Submit quiz answers
│   │       └── download/   # Download results
│   ├── utils/              # Utility functions
│   │   └── storage.ts      # Google Sheets integration
│   ├── types.ts            # TypeScript type definitions
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main quiz interface
├── public/                 # Static assets
├── .env.example           # Environment variables template
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## 🎨 Customization

### Styling

The app uses Tailwind CSS for styling. You can customize:

- Colors in `tailwind.config.js`
- Component styles in `app/globals.css`
- Layout and components in respective `.tsx` files

### Quiz Generation

Customize quiz generation by modifying:

- Prompts in `app/api/quiz/generate/route.ts`
- Question types and validation
- AI model parameters (temperature, max_tokens)

## 🔒 Security Notes

- Never commit API keys to version control
- Use environment variables for all sensitive data
- The Google Sheets service account should have minimal permissions
- Consider rate limiting for production use

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- Heroku
- AWS
- Google Cloud

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. **New Question Types**: Modify the `Question` type in `types.ts` and update the generation logic
2. **Additional Storage Options**: Extend the storage utilities in `app/utils/storage.ts`
3. **Enhanced UI**: Add new components and update styling

## 📊 Data Storage

The app stores two types of data:

1. **Quizzes**: Generated quiz questions and metadata
2. **Results**: User submissions, scores, and timestamps

Data is stored in Google Sheets with the following structure:

- **Quizzes Sheet**: Quiz ID, Title, Description, Created At, Created By, Questions (JSON)
- **Results Sheet**: Result ID, Quiz ID, User Name, Score, Total Questions, Percentage, Submitted At, Answers (JSON)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter any issues:

1. Check the console for error messages
2. Verify your environment variables are set correctly
3. Ensure your API keys have the necessary permissions
4. Check the GitHub issues for similar problems

## 🎯 Roadmap

- [ ] User authentication and profiles
- [ ] Quiz analytics and insights
- [ ] Timed quizzes
- [ ] Question banks and categories
- [ ] Collaborative quiz creation
- [ ] Advanced question types (drag & drop, image-based)
- [ ] Integration with more AI models
- [ ] Mobile app version

---

**Built with ❤️ using Next.js, React, and AI**