'use client'

import Link from 'next/link'
import { Play, BookOpen, Users, Trophy } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-blue-600">QuizBot</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Test your knowledge with our interactive quiz platform. Take quizzes, track your progress, and challenge yourself with AI-generated questions.
          </p>
          <Link 
            href="/take-quiz"
            className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            <Play className="w-6 h-6" />
            Take the Quiz
          </Link>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-6 mx-auto">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Multiple Choice Questions</h3>
            <p className="text-gray-600 text-center">
              Engage with carefully crafted multiple-choice questions designed to test your knowledge effectively.
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-lg mb-6 mx-auto">
              <Trophy className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Instant Results</h3>
            <p className="text-gray-600 text-center">
              Get immediate feedback on your performance with detailed results and explanations for each question.
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-lg mb-6 mx-auto">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Track Progress</h3>
            <p className="text-gray-600 text-center">
              Monitor your learning journey and see how you improve over time with our progress tracking system.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-white rounded-2xl p-12 shadow-xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Test Your Knowledge?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of learners who have already started their quiz journey with us.
          </p>
          <Link 
            href="/take-quiz"
            className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            <Play className="w-5 h-5" />
            Start Your First Quiz
          </Link>
        </div>
      </div>
    </div>
  )
}