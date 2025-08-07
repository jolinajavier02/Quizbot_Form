'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CheckCircle, ArrowLeft, Send, Loader2 } from 'lucide-react'
import { Quiz, Question, QuizResult } from '../../types'
import { getQuizById, saveQuizResultToStorage } from '../../utils/storage'
import Link from 'next/link'

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.quizId as string
  
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<{ [key: number]: string }>({})
  const [userName, setUserName] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showUserForm, setShowUserForm] = useState(true)
  const [result, setResult] = useState<QuizResult | null>(null)

  useEffect(() => {
    if (quizId) {
      loadQuiz()
    }
  }, [quizId])

  const loadQuiz = async () => {
    try {
      setLoading(true)
      const quizData = await getQuizById(quizId)
      if (quizData) {
        setQuiz(quizData)
      } else {
        setError('Quiz not found')
      }
    } catch (err) {
      setError('Failed to load quiz')
      console.error('Error loading quiz:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (userName.trim()) {
      setShowUserForm(false)
    }
  }

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const calculateScore = () => {
    if (!quiz) return { score: 0, percentage: 0, detailedAnswers: [] }
    
    let correctAnswers = 0
    const detailedAnswers = quiz.questions.map((question, index) => {
      const userAnswer = answers[index] || ''
      let isCorrect = false
      
      if (question.type === 'enumeration') {
        const correctAnswers = Array.isArray(question.correctAnswer) 
          ? question.correctAnswer 
          : [question.correctAnswer]
        const userAnswers = userAnswer.split(',').map(a => a.trim().toLowerCase())
        isCorrect = correctAnswers.every(ca => 
          userAnswers.some(ua => ua === ca.toLowerCase())
        ) && userAnswers.length === correctAnswers.length
      } else {
        isCorrect = userAnswer.toLowerCase() === (question.correctAnswer as string).toLowerCase()
      }
      
      if (isCorrect) correctAnswers++
      
      return {
        questionId: question.id,
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        options: question.options || []
      }
    })
    
    const percentage = Math.round((correctAnswers / quiz.questions.length) * 100)
    
    return {
      score: correctAnswers,
      percentage,
      detailedAnswers
    }
  }

  const handleSubmit = async () => {
    if (!quiz || !userName.trim()) return
    
    setSubmitting(true)
    try {
      const { score, percentage, detailedAnswers } = calculateScore()
      
      const quizResult: QuizResult = {
        id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        quizId: quiz.id,
        quizTitle: quiz.title,
        quizDescription: quiz.description,
        userName: userName.trim(),
        answers,
        detailedAnswers,
        score,
        totalQuestions: quiz.questions.length,
        percentage,
        submittedAt: new Date().toISOString(),
        isApproved: false
      }
      
      await saveQuizResultToStorage(quizResult)
      setResult(quizResult)
      setIsSubmitted(true)
    } catch (error) {
      console.error('Error submitting quiz:', error)
      setError('Failed to submit quiz. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const isQuizComplete = () => {
    if (!quiz) return false
    return quiz.questions.every((_, index) => answers[index]?.trim())
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-semibold text-red-800 mb-2">Quiz Not Found</h1>
            <p className="text-red-600 mb-4">{error || 'The quiz you\'re looking for doesn\'t exist or has been removed.'}</p>
            <Link 
              href="/take-quiz" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Browse Available Quizzes
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (isSubmitted && result) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Thank you for your response!</h1>
            <p className="text-gray-600 mb-6">Your quiz has been submitted successfully.</p>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Your Results</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Score:</span>
                  <p className="font-semibold">{result.score} / {result.totalQuestions}</p>
                </div>
                <div>
                  <span className="text-gray-500">Percentage:</span>
                  <p className="font-semibold">{result.percentage}%</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <Link 
                href="/take-quiz" 
                className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Take Another Quiz
              </Link>
              <button 
                onClick={() => window.location.reload()} 
                className="block w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Retake This Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showUserForm) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header */}
            <div className="border-b border-gray-200 p-6">
              <h1 className="text-2xl font-semibold text-gray-900">{quiz.title}</h1>
              {quiz.description && (
                <p className="text-gray-600 mt-2">{quiz.description}</p>
              )}
            </div>
            
            {/* User Info Form */}
            <form onSubmit={handleUserSubmit} className="p-6">
              <div className="mb-6">
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!userName.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Start Quiz
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold text-gray-900">{quiz.title}</h1>
              <span className="text-sm text-gray-500">
                {currentQuestionIndex + 1} of {quiz.questions.length}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          
          {/* Question */}
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              {currentQuestion.question}
            </h2>
            
            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.type === 'multiple-choice' && (
                currentQuestion.options.map((option, optionIndex) => (
                  <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name={`question-${currentQuestionIndex}`}
                      value={option}
                      checked={answers[currentQuestionIndex] === option}
                      onChange={(e) => handleAnswerChange(currentQuestionIndex, e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))
              )}
              
              {currentQuestion.type === 'true-false' && (
                ['True', 'False'].map((option) => (
                  <label key={option} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name={`question-${currentQuestionIndex}`}
                      value={option}
                      checked={answers[currentQuestionIndex] === option}
                      onChange={(e) => handleAnswerChange(currentQuestionIndex, e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))
              )}
              
              {currentQuestion.type === 'enumeration' && (
                <div>
                  <textarea
                    value={answers[currentQuestionIndex] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestionIndex, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    rows={3}
                    placeholder="Enter your answers separated by commas"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Separate multiple answers with commas
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Navigation */}
          <div className="border-t border-gray-200 p-6">
            <div className="flex justify-between items-center">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              <div className="flex space-x-3">
                {currentQuestionIndex < quiz.questions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    disabled={!answers[currentQuestionIndex]}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!isQuizComplete() || submitting}
                    className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}