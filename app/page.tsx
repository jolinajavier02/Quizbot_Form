'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Download, RefreshCw } from 'lucide-react'
import { Question, QuizResult } from './types'

export default function QuizPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<{ [key: number]: string }>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [userName, setUserName] = useState('')
  const [showNameInput, setShowNameInput] = useState(true)

  useEffect(() => {
    loadLatestQuiz()
  }, [])

  const loadLatestQuiz = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/quiz/latest')
      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions || [])
      }
    } catch (error) {
      console.error('Error loading quiz:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!userName.trim()) {
      alert('Please enter your name before submitting.')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName,
          answers,
          questions
        })
      })

      if (response.ok) {
        const result = await response.json()
        setResult(result)
        setIsSubmitted(true)
      }
    } catch (error) {
      console.error('Error submitting quiz:', error)
      alert('Error submitting quiz. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadResults = async (format: 'pdf' | 'csv') => {
    try {
      const response = await fetch(`/api/quiz/download?format=${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ result, userName })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `quiz-results-${userName}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading results:', error)
    }
  }

  const resetQuiz = () => {
    setCurrentQuestionIndex(0)
    setAnswers({})
    setIsSubmitted(false)
    setResult(null)
    setShowNameInput(true)
    setUserName('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No Quiz Available</h2>
        <p className="text-gray-600 mb-6">Please ask an admin to generate a quiz first.</p>
        <button
          onClick={loadLatestQuiz}
          className="btn-primary inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>
    )
  }

  if (showNameInput) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Welcome to QuizBot Form</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
                Enter your name to start the quiz:
              </label>
              <input
                type="text"
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="input-field"
                placeholder="Your name"
                onKeyPress={(e) => e.key === 'Enter' && userName.trim() && setShowNameInput(false)}
              />
            </div>
            <button
              onClick={() => userName.trim() && setShowNameInput(false)}
              disabled={!userName.trim()}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Quiz ({questions.length} questions)
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isSubmitted && result) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card mb-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Results</h2>
            <p className="text-lg text-gray-600">Hello {userName}!</p>
          </div>
          
          <div className="bg-primary-50 rounded-lg p-6 mb-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">
                {result.score}/{result.totalQuestions}
              </div>
              <div className="text-lg text-gray-700">
                {Math.round((result.score / result.totalQuestions) * 100)}% Correct
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {questions.map((question, index) => {
              const userAnswer = answers[index]
              const isCorrect = userAnswer === question.correctAnswer
              
              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-success-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-error-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-2">
                        {index + 1}. {question.question}
                      </h3>
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => {
                          let optionClass = 'quiz-option'
                          if (option === question.correctAnswer) {
                            optionClass += ' correct'
                          } else if (option === userAnswer && !isCorrect) {
                            optionClass += ' incorrect'
                          }
                          
                          return (
                            <div key={optionIndex} className={optionClass}>
                              {option}
                              {option === question.correctAnswer && (
                                <span className="ml-2 text-success-600 font-medium">(Correct)</span>
                              )}
                              {option === userAnswer && option !== question.correctAnswer && (
                                <span className="ml-2 text-error-600 font-medium">(Your answer)</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => handleDownloadResults('pdf')}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <button
              onClick={() => handleDownloadResults('csv')}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>
            <button
              onClick={resetQuiz}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Take New Quiz
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const allAnswered = Object.keys(answers).length === questions.length

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Quiz for {userName}</h2>
            <span className="text-sm text-gray-500">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {currentQuestion.question}
          </h3>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                onClick={() => handleAnswerSelect(option)}
                className={`quiz-option ${
                  answers[currentQuestionIndex] === option ? 'selected' : ''
                }`}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name={`question-${currentQuestionIndex}`}
                    value={option}
                    checked={answers[currentQuestionIndex] === option}
                    onChange={() => handleAnswerSelect(option)}
                    className="mr-3"
                  />
                  <span>{option}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex gap-2">
            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={!allAnswered || loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Quiz'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={currentQuestionIndex === questions.length - 1}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}