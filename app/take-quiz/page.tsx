'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Download, RefreshCw, Play, BookOpen, Users, ArrowLeft } from 'lucide-react'
import { Question, QuizResult, Quiz } from '../types'
import Link from 'next/link'

export default function TakeQuizPage() {
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([])
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<{ [key: number]: string }>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [userName, setUserName] = useState('Anonymous User')
  const [quizTitle, setQuizTitle] = useState('')
  const [quizDescription, setQuizDescription] = useState('')
  const [currentView, setCurrentView] = useState<'quizList' | 'userInfo' | 'quiz' | 'result'>('quizList')
  const [userInfo, setUserInfo] = useState({
    fullName: '',
    age: '',
    email: '',
    country: '',
    gender: ''
  })

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

  const getUserQuizStatus = (quizId: string) => {
    if (!userName) return 'not_taken'
    
    const existingResults = JSON.parse(localStorage.getItem('quizResults') || '[]') as QuizResult[]
    const userResult = existingResults.find(
      result => result.quizId === quizId && result.userName.toLowerCase() === userName.toLowerCase()
    )
    
    if (!userResult) return 'not_taken'
    if (userResult.isApproved) return 'completed'
    return 'pending'
  }

  const selectQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz)
    setQuestions(quiz.questions)
    setQuizTitle(quiz.title)
    setQuizDescription(quiz.description)
    setCurrentQuestionIndex(0)
    setAnswers({})
    setResult(null)
    setIsSubmitted(false)
    setCurrentView('userInfo')
  }

  const viewResult = (quiz: Quiz) => {
    if (!userName) return
    
    const existingResults = JSON.parse(localStorage.getItem('quizResults') || '[]') as QuizResult[]
    const userResult = existingResults.find(
      result => result.quizId === quiz.id && result.userName.toLowerCase() === userName.toLowerCase()
    )
    
    if (userResult && userResult.isApproved) {
      setSelectedQuiz(quiz)
      setQuestions(quiz.questions)
      setQuizTitle(quiz.title)
      setQuizDescription(quiz.description)
      setResult(userResult)
      setIsSubmitted(true)
      setCurrentView('result')
      
      // Reconstruct answers from result
      const reconstructedAnswers: { [key: number]: string } = {}
      userResult.detailedAnswers.forEach((detail, index) => {
        reconstructedAnswers[index] = detail.userAnswer
      })
      setAnswers(reconstructedAnswers)
    }
  }

  const backToQuizList = () => {
    setCurrentView('quizList')
    setSelectedQuiz(null)
    setQuestions([])
    setCurrentQuestionIndex(0)
    setAnswers({})
    setIsSubmitted(false)
    setResult(null)
    setUserInfo({
      fullName: '',
      age: '',
      email: '',
      country: '',
      gender: ''
    })
  }

  const handleUserInfoSubmit = () => {
    if (!userInfo.fullName || !userInfo.age || !userInfo.email || !userInfo.country || !userInfo.gender) {
      alert('Please fill in all required fields.')
      return
    }
    setUserName(userInfo.fullName)
    setCurrentView('quiz')
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
        submittedAt: new Date().toISOString(),
        isApproved: false
      }
      
      // Save to localStorage
      const existingResults = localStorage.getItem('quizResults')
      const results = existingResults ? JSON.parse(existingResults) : []
      results.push(result)
      localStorage.setItem('quizResults', JSON.stringify(results))
      
      // Show submission confirmation
      alert('Quiz submitted successfully! Your results will be available after admin approval.')
      
      // Show "Done" button functionality
      setCurrentView('quizList')
      setSelectedQuiz(null)
      setQuestions([])
    } catch (error) {
      console.error('Error submitting quiz:', error)
      alert('Error submitting quiz. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadResults = async (format: 'pdf' | 'csv') => {
    try {
      if (!result || !selectedQuiz) return
      
      let content = ''
      let mimeType = ''
      let fileExtension: string = format
      
      if (format === 'csv') {
        // Generate CSV content
        const headers = ['Question', 'Your Answer', 'Correct Answer', 'Result']
        const csvRows = [headers.join(',')]
        
        result.detailedAnswers.forEach((answerDetail, index) => {
          const question = selectedQuiz.questions[index]
          if (question && answerDetail) {
            const row = [
              '"' + question.question.replace(/"/g, '""') + '"',
              '"' + answerDetail.userAnswer.replace(/"/g, '""') + '"',
              '"' + (Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer.toString()).replace(/"/g, '""') + '"',
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
        content += `Quiz: ${selectedQuiz.title || 'Unknown Quiz'}\n`
        content += `Date: ${new Date(result.submittedAt).toLocaleDateString()}\n`
        content += `Score: ${result.score}/${result.totalQuestions} (${((result.score / result.totalQuestions) * 100).toFixed(1)}%)\n\n`
        content += 'Detailed Results:\n'
        content += '='.repeat(50) + '\n\n'
        
        result.detailedAnswers.forEach((answerDetail, index) => {
          const question = selectedQuiz.questions[index]
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

  // Loading state
  if (loading && currentView === 'quizList') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Quiz List View
  if (currentView === 'quizList') {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Available Quizzes</h1>
            <p className="text-xl text-gray-600">Choose a quiz to test your knowledge</p>
          </div>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>



        <div className="mb-6">
          <button
            onClick={loadAvailableQuizzes}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
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
            {availableQuizzes.map((quiz) => {
              const status = userName ? getUserQuizStatus(quiz.id) : 'not_taken'
              
              return (
                <div key={quiz.id} className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow duration-200">
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
                  
                  {status === 'completed' ? (
                    <button
                      onClick={() => viewResult(quiz)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                    >
                      <CheckCircle className="w-4 h-4" />
                      View Result
                    </button>
                  ) : status === 'pending' ? (
                    <button
                      disabled
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg cursor-not-allowed"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Pending Approval
                    </button>
                  ) : (
                    <button
                      onClick={() => selectQuiz(quiz)}
                      disabled={!userName}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play className="w-4 h-4" />
                      Start Quiz
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // User Info View
  if (currentView === 'userInfo') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg p-8 shadow-sm border">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Personal Information Required
              </h2>
              <p className="text-gray-600">
                Please provide your details before starting the quiz: {quizTitle}
              </p>
            </div>
            <button
              onClick={backToQuizList}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={(e) => { e.preventDefault(); handleUserInfoSubmit(); }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={userInfo.fullName}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                  Age *
                </label>
                <input
                  type="number"
                  id="age"
                  value={userInfo.age}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, age: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your age"
                  min="1"
                  max="120"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                id="email"
                value={userInfo.email}
                onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email address"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  id="country"
                  value={userInfo.country}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your country"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  id="gender"
                  value={userInfo.gender}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={backToQuizList}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Start Quiz ({questions.length} questions)
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // Result View
  if (currentView === 'result' && isSubmitted && result) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
          <div className="flex justify-between items-start mb-6">
            <div className="text-center flex-1">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Results</h2>
            </div>
            <button
              onClick={backToQuizList}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
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
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-2">
                        {index + 1}. {question.question}
                      </h3>
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => {
                          let optionClass = 'p-3 rounded border '
                          if (option === question.correctAnswer) {
                            optionClass += 'bg-green-50 border-green-200 text-green-800'
                          } else if (option === userAnswer && !isCorrect) {
                            optionClass += 'bg-red-50 border-red-200 text-red-800'
                          } else {
                            optionClass += 'bg-gray-50 border-gray-200 text-gray-700'
                          }
                          
                          return (
                            <div key={optionIndex} className={optionClass}>
                              {option}
                              {option === question.correctAnswer && (
                                <span className="ml-2 text-green-600 font-medium">(Correct)</span>
                              )}
                              {option === userAnswer && option !== question.correctAnswer && (
                                <span className="ml-2 text-red-600 font-medium">(Your answer)</span>
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
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <button
              onClick={() => handleDownloadResults('csv')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>
            <button
              onClick={backToQuizList}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Quiz Taking View
  if (currentView === 'quiz' && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex]
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100
    const allAnswered = Object.keys(answers).length === questions.length

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
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
                  onClick={backToQuizList}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-500">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
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
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    answers[currentQuestionIndex] === option 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
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
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex gap-2">
              {currentQuestionIndex === questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={!allAnswered || loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Quiz'}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
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

  // Fallback loading state
  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  )
}