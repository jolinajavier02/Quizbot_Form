'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Download, RefreshCw, Play, BookOpen, Users } from 'lucide-react'
import { Question, QuizResult, Quiz } from './types'

export default function QuizPage() {
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([])
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<{ [key: number]: string }>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [userName, setUserName] = useState('')
  const [showNameInput, setShowNameInput] = useState(true)
  const [quizTitle, setQuizTitle] = useState('')
  const [quizDescription, setQuizDescription] = useState('')
  const [currentView, setCurrentView] = useState<'landing' | 'quiz'>('landing')

  useEffect(() => {
    loadAvailableQuizzes()
    // Set up polling to check for new quizzes every 30 seconds
    const interval = setInterval(loadAvailableQuizzes, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadAvailableQuizzes = () => {
    try {
      setLoading(true)
      // Load quizzes from localStorage
      const storedQuizzes = localStorage.getItem('quizzes')
      if (storedQuizzes) {
        const quizzes = JSON.parse(storedQuizzes)
        setAvailableQuizzes(Array.isArray(quizzes) ? quizzes : [])
      } else {
        setAvailableQuizzes([])
      }
    } catch (error) {
      console.error('Error loading quizzes:', error)
      setAvailableQuizzes([])
    } finally {
      setLoading(false)
    }
  }

  const selectQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz)
    setQuestions(quiz.questions)
    setQuizTitle(quiz.title)
    setQuizDescription(quiz.description)
    setCurrentView('quiz')
  }

  const backToLanding = () => {
    setCurrentView('landing')
    setSelectedQuiz(null)
    setQuestions([])
    setCurrentQuestionIndex(0)
    setAnswers({})
    setIsSubmitted(false)
    setResult(null)
    setShowNameInput(true)
    setUserName('')
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

  const handleSubmit = () => {
    if (!userName.trim()) {
      alert('Please enter your name before submitting.')
      return
    }

    try {
      setLoading(true)
      
      // Calculate results client-side
      let score = 0
      const detailedAnswers = questions.map((question, index) => {
        const userAnswer = answers[index] || ''
        const isCorrect = userAnswer === question.correctAnswer
        if (isCorrect) score++
        
        return {
          questionId: question.id,
          question: question.question,
          userAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          options: question.options || []
        }
      })
      
      const percentage = Math.round((score / questions.length) * 100)
      
      const result: QuizResult = {
        id: `result_${Date.now()}`,
        quizId: selectedQuiz?.id || '',
        quizTitle: selectedQuiz?.title || '',
        quizDescription: selectedQuiz?.description || '',
        userName,
        answers,
        detailedAnswers,
        score,
        totalQuestions: questions.length,
        percentage,
        submittedAt: new Date().toISOString()
      }
      
      // Save to localStorage
      const existingResults = localStorage.getItem('quizResults')
      const results = existingResults ? JSON.parse(existingResults) : []
      results.push(result)
      localStorage.setItem('quizResults', JSON.stringify(results))
      
      setResult(result)
      setIsSubmitted(true)
    } catch (error) {
      console.error('Error submitting quiz:', error)
      alert('Error submitting quiz. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadResults = async (format: 'pdf' | 'csv') => {
    try {
      if (!result || !currentQuiz) return
      
      let content = ''
      let mimeType = ''
      let fileExtension = format
      
      if (format === 'csv') {
        // Generate CSV content
        const headers = ['Question', 'Your Answer', 'Correct Answer', 'Result']
        const csvRows = [headers.join(',')]
        
        result.detailedAnswers.forEach((answerDetail, index) => {
          const question = currentQuiz.questions[index]
          if (question && answerDetail) {
            const row = [
              `"${question.question.replace(/"/g, '""')}"`,
              `"${answerDetail.userAnswer.replace(/"/g, '""')}"`,
              `"${Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer.toString().replace(/"/g, '""')}"`,
              answerDetail.isCorrect ? 'Correct' : 'Incorrect'
            ]
            csvRows.push(row.join(','))
          }
        })
        
        csvRows.push('')
        csvRows.push(`Total Score,${result.score},${result.totalQuestions},${((result.score / result.totalQuestions) * 100).toFixed(1)}%`)
        
        content = csvRows.join('\n')
        mimeType = 'text/csv'
      } else {
        // Generate simple text content for PDF (since we can't generate actual PDF client-side easily)
        content = `Quiz Results for ${userName}\n\n`
        content += `Quiz: ${currentQuiz.title || 'Unknown Quiz'}\n`
        content += `Date: ${new Date(result.submittedAt).toLocaleDateString()}\n`
        content += `Score: ${result.score}/${result.totalQuestions} (${((result.score / result.totalQuestions) * 100).toFixed(1)}%)\n\n`
        content += 'Detailed Results:\n'
        content += '='.repeat(50) + '\n\n'
        
        result.detailedAnswers.forEach((answerDetail, index) => {
          const question = currentQuiz.questions[index]
          if (question && answerDetail) {
            content += `Question ${index + 1}: ${question.question}\n`
            content += `Your Answer: ${answerDetail.userAnswer}\n`
            content += `Correct Answer: ${Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer}\n`
            content += `Result: ${answerDetail.isCorrect ? 'Correct ✓' : 'Incorrect ✗'}\n\n`
          }
        })
        
        mimeType = 'text/plain'
        fileExtension = 'txt' // Change extension since we're generating text, not PDF
      }
      
      // Create and download file
      const blob = new Blob([content], { type: mimeType })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `quiz-results-${userName}.${fileExtension}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
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
    setCurrentView('landing')
    setSelectedQuiz(null)
    setQuestions([])
  }

  if (loading && currentView === 'landing') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  // Landing page - show available quizzes
  if (currentView === 'landing') {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">QuizBot Form</h1>
          <p className="text-xl text-gray-600 mb-6">Choose a quiz to test your knowledge</p>
          <button
            onClick={loadAvailableQuizzes}
            disabled={loading}
            className="btn-secondary inline-flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Quizzes
          </button>
        </div>

        {availableQuizzes.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Quizzes Available</h2>
            <p className="text-gray-600 mb-6">Please ask an admin to create a quiz first.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableQuizzes.map((quiz) => (
              <div key={quiz.id} className="card hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{quiz.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{quiz.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{quiz.questions.length} questions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>Multiple choice</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-400 mb-4">
                  Created: {new Date(quiz.createdAt).toLocaleDateString()}
                </div>
                
                <button
                  onClick={() => selectQuiz(quiz)}
                  className="btn-primary w-full inline-flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Start Quiz
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Quiz taking logic starts here
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
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No Quiz Selected</h2>
        <p className="text-gray-600 mb-6">Please select a quiz from the landing page.</p>
        <button
          onClick={backToLanding}
          className="btn-primary inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Back to Quizzes
        </button>
      </div>
    )
  }

  if (showNameInput) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {quizTitle || 'Welcome to QuizBot Form'}
              </h2>
              {quizDescription && (
                <p className="text-gray-600 text-sm">{quizDescription}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={backToLanding}
                className="btn-secondary text-sm inline-flex items-center gap-1"
                title="Back to quiz selection"
              >
                ← Back
              </button>
              <button
                onClick={loadAvailableQuizzes}
                disabled={loading}
                className="btn-secondary text-sm inline-flex items-center gap-1 disabled:opacity-50"
                title="Refresh quiz"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
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
              onClick={backToLanding}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Back to Quizzes
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
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {quizTitle ? `${quizTitle} - ${userName}` : `Quiz for ${userName}`}
              </h2>
              {quizDescription && (
                <p className="text-sm text-gray-600 mt-1">{quizDescription}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={backToLanding}
                className="btn-secondary text-xs inline-flex items-center gap-1"
                title="Back to quiz selection"
              >
                ← Back
              </button>
              <button
                onClick={loadAvailableQuizzes}
                disabled={loading}
                className="btn-secondary text-xs inline-flex items-center gap-1 disabled:opacity-50"
                title="Refresh quiz"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <span className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
            </div>
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