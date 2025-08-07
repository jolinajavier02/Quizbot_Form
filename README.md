# QuizBot Form 🎯

An interactive quiz web application that mimics Google Forms with fast question input and local quiz generation. Built with Next.js, React, and TypeScript with a focus on simplicity and performance.

## 🆕 Latest Updates (v2.0)

- **Enhanced Type Safety**: Fixed all TypeScript compilation errors across API routes
- **Improved Validation**: Added comprehensive quiz submission validation
- **Better Error Handling**: Enhanced error handling in upload and generation routes
- **Robust Quiz Flow**: Improved quiz completion validation and user experience
- **Production Ready**: All builds now compile successfully without errors

## ✨ Features

- **📝 Quiz Creation**: Create quizzes by pasting formatted text or uploading files
- **🔗 Quiz Sharing**: Generate unique shareable links for each quiz (Google Forms-like)
- **🎯 Multiple Question Types**: Support for multiple-choice, true/false, and enumeration questions
- **👥 Simplified Registration**: Just name required for quiz taking (streamlined experience)
- **📊 Results Tracking**: Comprehensive scoring and detailed answer analysis
- **🔐 Admin Dashboard**: Secure admin interface for quiz and submission management
- **💾 Persistent Storage**: Quiz data persisted across browser sessions
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
- **🎨 Google Forms-Like UI**: Clean, intuitive interface for quiz taking
- **📋 One-Click Sharing**: Copy shareable quiz links with a single click

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
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

- Mock quiz templates in the admin interface
- Question types and validation logic
- Local quiz generation parameters

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
- `npm run build` - Build for production (now with zero TypeScript errors)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Recent Improvements (v2.0)

- **Fixed TypeScript Errors**: Resolved all compilation issues in API routes
- **Enhanced Validation**: Added proper type checking for quiz generation and upload
- **Improved Error Handling**: Better fallback values for undefined data
- **Quiz Flow Validation**: Enhanced user experience with completion checks

### Adding New Features

1. **New Question Types**: Modify the `Question` type in `types.ts` and update the generation logic
2. **Additional Storage Options**: Extend the storage utilities in `app/utils/storage.ts`
3. **Enhanced UI**: Add new components and update styling
4. **Type Safety**: All new features should maintain strict TypeScript compliance

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

### ✅ Recently Completed (v2.0)
- [x] TypeScript error resolution across all API routes
- [x] Enhanced quiz validation and error handling
- [x] Improved user experience with completion checks
- [x] Production-ready build process

### 🔄 In Progress
- [ ] User authentication and profiles
- [ ] Quiz analytics and insights
- [ ] Enhanced admin dashboard

### 📋 Future Features
- [ ] Timed quizzes
- [ ] Question banks and categories
- [ ] Collaborative quiz creation
- [ ] Advanced question types (drag & drop, image-based)
- [ ] Integration with more AI models
- [ ] Mobile app version
- [ ] Real-time quiz collaboration
- [ ] Advanced analytics and reporting

---

**Built with ❤️ using Next.js, React, and AI**