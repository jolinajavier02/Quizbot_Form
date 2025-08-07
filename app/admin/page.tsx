'use client'

import { useState, useEffect } from 'react'
import { Send, Loader2, CheckCircle, AlertCircle, Upload, FileText, Clipboard, Users, Calendar, Trophy, Eye, MoreVertical, Edit, Archive, Plus, Lock, User, Trash2, Share, Copy } from 'lucide-react'
import { Quiz, QuizResult } from '../types'
import { generateQuizId, generateQuizShareUrl, saveQuizToStorage, getAllQuizzesFromStorage } from '../utils/storage'

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [pastedText, setPastedText] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<'quizzes' | 'submissions' | 'create'>('quizzes')
  const [submissions, setSubmissions] = useState<QuizResult[]>([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<QuizResult | null>(null)
  const [quizTitle, setQuizTitle] = useState('')
  const [quizDescription, setQuizDescription] = useState('')
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [doneQuizzes, setDoneQuizzes] = useState<Quiz[]>([])
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)
  const [showDropdown, setShowDropdown] = useState<string | null>(null)
  const [chatGptPrompt, setChatGptPrompt] = useState('')
  const [generatingWithAI, setGeneratingWithAI] = useState(false)
  const [copiedQuizId, setCopiedQuizId] = useState<string | null>(null)

  // Admin password (in a real app, this would be handled securely)
  const ADMIN_PASSWORD = 'admin123'

  useEffect(() => {
    // Check if admin is already logged in
    const adminLoggedIn = localStorage.getItem('adminLoggedIn')
    if (adminLoggedIn === 'true') {
      setIsLoggedIn(true)
      loadQuizzes()
      loadSubmissions()
    }
  }, [])

  const handleLogin = () => {
    if (loginPassword === ADMIN_PASSWORD) {
      setIsLoggedIn(true)
      setLoginError('')
      localStorage.setItem('adminLoggedIn', 'true')
      loadQuizzes()
      loadSubmissions()
    } else {
      setLoginError('Invalid password. Please try again.')
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    localStorage.removeItem('adminLoggedIn')
    setLoginPassword('')
  }

  const handleCopyShareUrl = async (quizId: string) => {
    try {
      const shareUrl = generateQuizShareUrl(quizId)
      await navigator.clipboard.writeText(shareUrl)
      setCopiedQuizId(quizId)
      setTimeout(() => setCopiedQuizId(null), 2000)
    } catch (error) {
      console.error('Failed to copy URL:', error)
      // Fallback for browsers that don't support clipboard API
      const shareUrl = generateQuizShareUrl(quizId)
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedQuizId(quizId)
      setTimeout(() => setCopiedQuizId(null), 2000)
    }
  }

  const loadQuizzes = async () => {
    try {
      const allQuizzes = await getAllQuizzesFromStorage()
      setQuizzes(allQuizzes)
      
      const storedDoneQuizzes = localStorage.getItem('doneQuizzes')
      if (storedDoneQuizzes) {
        const doneQuizzesData = JSON.parse(storedDoneQuizzes)
        setDoneQuizzes(Array.isArray(doneQuizzesData) ? doneQuizzesData : [])
      }
    } catch (error) {
      console.error('Error loading quizzes:', error)
      setQuizzes([])
      setDoneQuizzes([])
    }
  }

  const loadSubmissions = () => {
    try {
      setSubmissionsLoading(true)
      const storedResults = localStorage.getItem('quizResults')
      if (storedResults) {
        const results = JSON.parse(storedResults)
        setSubmissions(Array.isArray(results) ? results : [])
      } else {
        setSubmissions([])
      }
    } catch (error) {
      console.error('Error loading submissions:', error)
      setSubmissions([])
    } finally {
      setSubmissionsLoading(false)
    }
  }

  const handleApproveSubmission = (submissionId: string) => {
    try {
      const storedResults = localStorage.getItem('quizResults')
      if (storedResults) {
        const results = JSON.parse(storedResults)
        const updatedResults = results.map((result: QuizResult) => {
          if (result.id === submissionId) {
            return {
              ...result,
              isApproved: true,
              approvedAt: new Date().toISOString(),
              approvedBy: 'admin'
            }
          }
          return result
        })
        
        localStorage.setItem('quizResults', JSON.stringify(updatedResults))
        setSubmissions(updatedResults)
        
        if (selectedSubmission && selectedSubmission.id === submissionId) {
          setSelectedSubmission({
            ...selectedSubmission,
            isApproved: true,
            approvedAt: new Date().toISOString(),
            approvedBy: 'admin'
          })
        }
        
        setSuccess('Quiz results approved successfully!')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (error) {
      console.error('Error approving submission:', error)
      setError('Failed to approve submission. Please try again.')
      setTimeout(() => setError(''), 3000)
    }
  }

  const parseQuizFromText = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim())
    const questions = []
    let currentQuestion = null
    let currentOptions = []
    let correctAnswer = ''
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (line.startsWith('Part ') || line === '') continue
      
      if (!line.match(/^[a-d]\)/) && !line.startsWith('✅')) {
        if (currentQuestion && currentOptions.length > 0 && correctAnswer) {
          questions.push({
             id: `q${questions.length + 1}`,
             question: currentQuestion,
             options: currentOptions,
             correctAnswer: correctAnswer,
             type: 'multiple-choice' as const
           })
        }
        
        currentQuestion = line
        currentOptions = []
        correctAnswer = ''
      }
      else if (line.match(/^[a-d]\)/)) {
        const option = line.substring(3).trim()
        currentOptions.push(option)
      }
      else if (line.startsWith('✅ Correct Answer:')) {
        const answerLetter = line.split(':')[1].trim()
        const answerIndex = answerLetter.charCodeAt(0) - 97
        if (answerIndex >= 0 && answerIndex < currentOptions.length) {
          correctAnswer = currentOptions[answerIndex]
        }
      }
    }
    
    if (currentQuestion && currentOptions.length > 0 && correctAnswer) {
      questions.push({
         id: `q${questions.length + 1}`,
         question: currentQuestion,
         options: currentOptions,
         correctAnswer: correctAnswer,
         type: 'multiple-choice' as const
       })
    }
    
    return questions
  }

  const handleCreateQuiz = () => {
    if (!quizTitle.trim()) {
      setError('Please enter a quiz title.')
      return
    }

    if (!pastedText.trim()) {
      setError('Please paste your quiz content.')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')
      
      const questions = parseQuizFromText(pastedText)
      
      if (questions.length === 0) {
        setError('No valid questions found in the pasted text. Please check the format.')
        setLoading(false)
        return
      }
      
      const quiz: Quiz = {
        id: editingQuiz ? editingQuiz.id : generateQuizId(),
        title: quizTitle.trim(),
        description: quizDescription.trim() || 'Quiz created from pasted content',
        questions: questions,
        createdAt: editingQuiz ? editingQuiz.createdAt : new Date().toISOString(),
        createdBy: 'admin'
      }

      if (editingQuiz) {
        // Update existing quiz
        const existingQuizzes = await getAllQuizzesFromStorage()
        const updatedQuizzes = existingQuizzes.map((q: Quiz) => q.id === editingQuiz.id ? quiz : q)
        localStorage.setItem('quizzes', JSON.stringify(updatedQuizzes))
        setQuizzes(updatedQuizzes)
        setSuccess(`Quiz "${quiz.title}" updated successfully!`)
      } else {
        // Create new quiz
        await saveQuizToStorage(quiz)
        const allQuizzes = await getAllQuizzesFromStorage()
        setQuizzes(allQuizzes)
        setSuccess(`Quiz "${quiz.title}" created successfully with ${quiz.questions.length} questions!`)
      }
      
      setGeneratedQuiz(quiz)
      setPastedText('')
      setQuizTitle('')
      setQuizDescription('')
      setEditingQuiz(null)
      setActiveTab('quizzes')
    } catch (error) {
      console.error('Error creating quiz:', error)
      setError('An error occurred while creating the quiz. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateWithChatGPT = async () => {
    if (!chatGptPrompt.trim()) {
      setError('Please enter a prompt for ChatGPT.')
      return
    }

    setGeneratingWithAI(true)
    setError('')
    
    // Simulate ChatGPT API call (in a real app, you'd call the actual API)
    setTimeout(() => {
      const sampleQuiz = `What is the capital of France?
a) London
b) Berlin
c) Paris
d) Madrid
✅ Correct Answer: c

Which planet is known as the Red Planet?
a) Venus
b) Mars
c) Jupiter
d) Saturn
✅ Correct Answer: b`
      
      setPastedText(sampleQuiz)
      setQuizTitle(`AI Generated Quiz: ${chatGptPrompt.slice(0, 50)}...`)
      setQuizDescription(`Generated from prompt: ${chatGptPrompt}`)
      setChatGptPrompt('')
      setGeneratingWithAI(false)
      setSuccess('Quiz generated successfully! Review and create it below.')
    }, 2000)
  }

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz)
    setQuizTitle(quiz.title)
    setQuizDescription(quiz.description)
    
    // Convert quiz back to text format
    const textFormat = quiz.questions.map((q, index) => {
      const questionText = q.question
      const optionsText = q.options?.map((opt, i) => `${String.fromCharCode(97 + i)}) ${opt}`).join('\n') || ''
      const correctIndex = q.options?.indexOf(q.correctAnswer as string) || 0
      const correctLetter = String.fromCharCode(97 + correctIndex)
      return `${questionText}\n${optionsText}\n✅ Correct Answer: ${correctLetter}`
    }).join('\n\n')
    
    setPastedText(textFormat)
    setActiveTab('create')
    setShowDropdown(null)
  }

  const handleMarkAsDone = (quizId: string) => {
    try {
      const quizToMove = quizzes.find(q => q.id === quizId)
      if (quizToMove) {
        const updatedQuizzes = quizzes.filter(q => q.id !== quizId)
        const updatedDoneQuizzes = [...doneQuizzes, quizToMove]
        
        setQuizzes(updatedQuizzes)
        setDoneQuizzes(updatedDoneQuizzes)
        
        localStorage.setItem('quizzes', JSON.stringify(updatedQuizzes))
        localStorage.setItem('doneQuizzes', JSON.stringify(updatedDoneQuizzes))
        
        setSuccess('Quiz moved to Done section!')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (error) {
      console.error('Error marking quiz as done:', error)
      setError('Failed to mark quiz as done.')
      setTimeout(() => setError(''), 3000)
    }
    setShowDropdown(null)
  }

  const handleDeleteQuiz = (quizId: string) => {
    if (window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      try {
        const updatedQuizzes = quizzes.filter(q => q.id !== quizId)
        setQuizzes(updatedQuizzes)
        localStorage.setItem('quizzes', JSON.stringify(updatedQuizzes))
        
        setSuccess('Quiz deleted successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } catch (error) {
        console.error('Error deleting quiz:', error)
        setError('Failed to delete quiz.')
        setTimeout(() => setError(''), 3000)
      }
    }
    setShowDropdown(null)
  }

  const handleRestoreQuiz = (quizId: string) => {
    try {
      const quizToRestore = doneQuizzes.find(q => q.id === quizId)
      if (quizToRestore) {
        const updatedDoneQuizzes = doneQuizzes.filter(q => q.id !== quizId)
        const updatedQuizzes = [...quizzes, quizToRestore]
        
        setDoneQuizzes(updatedDoneQuizzes)
        setQuizzes(updatedQuizzes)
        
        localStorage.setItem('doneQuizzes', JSON.stringify(updatedDoneQuizzes))
        localStorage.setItem('quizzes', JSON.stringify(updatedQuizzes))
        
        setSuccess('Quiz restored to active quizzes!')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (error) {
      console.error('Error restoring quiz:', error)
      setError('Failed to restore quiz.')
      setTimeout(() => setError(''), 3000)
    }
  }

  // Login screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Lock className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Admin Access</h2>
            <p className="mt-2 text-sm text-gray-600">Enter the admin password to continue</p>
          </div>
          <div className="mt-8 space-y-6">
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Admin password"
              />
            </div>
            {loginError && (
              <div className="text-red-600 text-sm text-center">{loginError}</div>
            )}
            <div>
              <button
                onClick={handleLogin}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <User className="w-4 h-4 mr-2" />
                Sign in as Admin
              </button>
            </div>

          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-xl text-gray-600">Manage quizzes and review submissions</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
        >
          Logout
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800">{success}</span>
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'quizzes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Quiz Management
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'submissions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Submissions ({submissions.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'create'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Create Quiz
          </button>
        </nav>
      </div>

      {/* Quiz Management Tab */}
      {activeTab === 'quizzes' && (
        <div className="space-y-8">
          {/* Active Quizzes */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Quizzes</h2>
            {quizzes.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No active quizzes</h3>
                <p className="text-gray-600 mb-4">Create your first quiz to get started.</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  Create Quiz
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzes.map((quiz) => (
                  <div key={quiz.id} className="bg-white rounded-lg p-6 shadow-sm border">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{quiz.title}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{quiz.description}</p>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => setShowDropdown(showDropdown === quiz.id ? null : quiz.id)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        {showDropdown === quiz.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10">
                            <button
                              onClick={() => handleEditQuiz(quiz)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleMarkAsDone(quiz.id)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Archive className="w-4 h-4" />
                              Mark as Done
                            </button>
                            <button
                              onClick={() => handleDeleteQuiz(quiz.id)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{quiz.questions.length} questions</span>
                      <span>{new Date(quiz.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <a
                        href={generateQuizShareUrl(quiz.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        View Quiz
                      </a>
                      
                      <button
                        onClick={() => handleCopyShareUrl(quiz.id)}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          copiedQuizId === quiz.id
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {copiedQuizId === quiz.id ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Share className="w-4 h-4" />
                            Share
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Done Quizzes */}
          {doneQuizzes.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Done Quizzes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doneQuizzes.map((quiz) => (
                  <div key={quiz.id} className="bg-gray-50 rounded-lg p-6 shadow-sm border">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">{quiz.title}</h3>
                        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{quiz.description}</p>
                      </div>
                      <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">Done</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{quiz.questions.length} questions</span>
                      <span>{new Date(quiz.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    <button
                      onClick={() => handleRestoreQuiz(quiz.id)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Restore to Active
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submissions Tab */}
      {activeTab === 'submissions' && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quiz Submissions</h2>
          
          {submissionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
              <p className="text-gray-600">Quiz submissions will appear here once users start taking quizzes.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {submissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{submission.quizTitle}</div>
                          <div className="text-sm text-gray-500">{submission.totalQuestions} questions</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{submission.userName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {submission.score}/{submission.totalQuestions}
                          </div>
                          <div className="text-sm text-gray-500">{submission.percentage}%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {submission.isApproved ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => setSelectedSubmission(submission)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </button>
                          {!submission.isApproved && (
                            <button
                              onClick={() => handleApproveSubmission(submission.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Quiz Tab */}
      {activeTab === 'create' && (
        <div className="space-y-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}
            </h2>
            
            {/* AI Generation Section */}
            <div className="mb-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Generate with ChatGPT</h3>
              <div className="space-y-4">
                <textarea
                  value={chatGptPrompt}
                  onChange={(e) => setChatGptPrompt(e.target.value)}
                  placeholder="Enter a prompt to generate quiz questions (e.g., 'Create 5 questions about JavaScript basics')..."
                  className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
                <button
                  onClick={handleGenerateWithChatGPT}
                  disabled={generatingWithAI || !chatGptPrompt.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingWithAI ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {generatingWithAI ? 'Generating...' : 'Generate Questions'}
                </button>
              </div>
            </div>
            
            {/* Manual Input Section */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quiz Title *</label>
                  <input
                    type="text"
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    placeholder="Enter quiz title"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quiz Description</label>
                  <input
                    type="text"
                    value={quizDescription}
                    onChange={(e) => setQuizDescription(e.target.value)}
                    placeholder="Enter quiz description"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quiz Content *</label>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste your quiz content here...\n\nExample format:\nWhat is the capital of France?\na) London\nb) Berlin\nc) Paris\nd) Madrid\n✅ Correct Answer: c"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={12}
                />
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={handleCreateQuiz}
                  disabled={loading || !quizTitle.trim() || !pastedText.trim()}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {loading ? 'Creating...' : editingQuiz ? 'Update Quiz' : 'Create Quiz'}
                </button>
                
                {editingQuiz && (
                  <button
                    onClick={() => {
                      setEditingQuiz(null)
                      setQuizTitle('')
                      setQuizDescription('')
                      setPastedText('')
                    }}
                    className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Format Guide */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiz Format Guide</h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
{`What is the capital of France?
a) London
b) Berlin
c) Paris
d) Madrid
✅ Correct Answer: c

Which planet is known as the Red Planet?
a) Venus
b) Mars
c) Jupiter
d) Saturn
✅ Correct Answer: b`}
              </pre>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p><strong>Important:</strong></p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Each question should be on its own line</li>
                <li>Options should start with a), b), c), d)</li>
                <li>Correct answer should be marked with ✅ Correct Answer: [letter]</li>
                <li>Make sure each question has exactly 4 options</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Submission Details Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedSubmission.quizTitle}</h3>
                  <p className="text-gray-600">Submitted by {selectedSubmission.userName}</p>
                </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{selectedSubmission.score}</div>
                    <div className="text-sm text-gray-600">Score</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{selectedSubmission.totalQuestions}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{selectedSubmission.percentage}%</div>
                    <div className="text-sm text-gray-600">Percentage</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedSubmission.isApproved ? 'Approved' : 'Pending'}
                    </div>
                    <div className="text-sm text-gray-600">Status</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {selectedSubmission.detailedAnswers.map((detail, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      {detail.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-2">
                          {index + 1}. {detail.question}
                        </h4>
                        <div className="space-y-2">
                          <div className={`p-2 rounded ${detail.isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                            <span className="font-medium">User Answer: </span>{detail.userAnswer}
                          </div>
                          {!detail.isCorrect && (
                            <div className="p-2 rounded bg-green-50 text-green-800">
                              <span className="font-medium">Correct Answer: </span>{detail.correctAnswer}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex justify-end gap-4">
                {!selectedSubmission.isApproved && (
                  <button
                    onClick={() => handleApproveSubmission(selectedSubmission.id)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                  >
                    Approve Submission
                  </button>
                )}
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}