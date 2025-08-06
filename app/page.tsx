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
            An intelligent quiz platform designed to enhance learning through interactive assessments and comprehensive feedback.
          </p>
          <Link 
            href="/take-quiz"
            className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            <Play className="w-6 h-6" />
            Take the Quiz
          </Link>
        </div>

        {/* About Section */}
        <div className="bg-white rounded-2xl p-12 shadow-xl mb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">About QuizBot</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">What is QuizBot?</h3>
                <p className="text-gray-600 mb-6">
                  QuizBot is an innovative quiz platform designed to make learning engaging and effective. Our system provides interactive quizzes with instant feedback, helping users test their knowledge across various topics.
                </p>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Features</h3>
                <ul className="text-gray-600 space-y-2">
                  <li>• Interactive multiple-choice questions</li>
                  <li>• Instant scoring and detailed feedback</li>
                  <li>• Admin dashboard for quiz management</li>
                  <li>• User-friendly interface</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">How It Works</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">1</div>
                    <div>
                      <h4 className="font-medium text-gray-900">Choose a Quiz</h4>
                      <p className="text-gray-600 text-sm">Browse available quizzes and select one that interests you</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">2</div>
                    <div>
                      <h4 className="font-medium text-gray-900">Answer Questions</h4>
                      <p className="text-gray-600 text-sm">Work through multiple-choice questions at your own pace</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">3</div>
                    <div>
                      <h4 className="font-medium text-gray-900">Get Results</h4>
                      <p className="text-gray-600 text-sm">Receive instant feedback and see your performance</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Features */}
        <div className="bg-white rounded-2xl p-12 shadow-xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Choose QuizBot?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Comprehensive Learning</h3>
              <p className="text-gray-600">
                Access a wide variety of quizzes covering multiple topics and difficulty levels to enhance your knowledge.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Instant Results</h3>
              <p className="text-gray-600">
                Get immediate feedback on your performance with detailed explanations and scoring analytics.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Admin Management</h3>
              <p className="text-gray-600">
                Powerful admin dashboard for creating, managing, and reviewing quiz submissions with approval workflows.
              </p>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link 
              href="/take-quiz"
              className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              <Play className="w-5 h-5" />
              Explore Available Quizzes
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}