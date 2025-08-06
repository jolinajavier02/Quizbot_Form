'use client'

import { useState, useEffect } from 'react'
import { Send, Loader2, CheckCircle, AlertCircle, Upload, FileText, Clipboard, Users, Calendar, Trophy, Eye } from 'lucide-react'
import { Quiz, QuizResult } from '../types'

export default function AdminPage() {
  const [pastedText, setPastedText] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<'paste' | 'upload' | 'submissions'>('paste')
  const [submissions, setSubmissions] = useState<QuizResult[]>([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<QuizResult | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadLoading, setUploadLoading] = useState(false)
  const [quizTitle, setQuizTitle] = useState('')
  const [quizDescription, setQuizDescription] = useState('')

  const loadSubmissions = async () => {
    try {
      setSubmissionsLoading(true)
      const response = await fetch('/api/quiz/submissions')
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data.submissions || [])
      }
    } catch (error) {
      console.error('Error loading submissions:', error)
    } finally {
      setSubmissionsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'submissions') {
      loadSubmissions()
    }
  }, [activeTab])

  const parseQuizFromText = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim())
    const questions = []
    let currentQuestion = null
    let currentOptions = []
    let correctAnswer = ''
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Skip part headers and empty lines
      if (line.startsWith('Part ') || line === '') continue
      
      // Check if it's a question (doesn't start with a), b), c), d) or ✅)
      if (!line.match(/^[a-d]\)/) && !line.startsWith('✅')) {
        // Save previous question if exists
        if (currentQuestion && currentOptions.length > 0 && correctAnswer) {
          questions.push({
             id: `q${questions.length + 1}`,
             question: currentQuestion,
             options: currentOptions,
             correctAnswer: correctAnswer,
             type: 'multiple-choice' as const
           })
        }
        
        // Start new question
        currentQuestion = line
        currentOptions = []
        correctAnswer = ''
      }
      // Check if it's an option
      else if (line.match(/^[a-d]\)/)) {
        const option = line.substring(3).trim()
        currentOptions.push(option)
      }
      // Check if it's the correct answer
      else if (line.startsWith('✅ Correct Answer:')) {
        const answerLetter = line.split(':')[1].trim()
        const answerIndex = answerLetter.charCodeAt(0) - 97 // Convert a,b,c,d to 0,1,2,3
        if (answerIndex >= 0 && answerIndex < currentOptions.length) {
          correctAnswer = currentOptions[answerIndex]
        }
      }
    }
    
    // Add the last question
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

  const handleCreateQuiz = async () => {
    if (!pastedText.trim()) {
      setError('Please paste your quiz content.')
      return
    }

    if (!quizTitle.trim()) {
      setError('Please enter a quiz title.')
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
        id: `quiz_${Date.now()}`,
        title: quizTitle.trim(),
        description: quizDescription.trim() || 'Quiz created from pasted content',
        questions: questions,
        createdAt: new Date().toISOString(),
        createdBy: 'admin'
      }

      const response = await fetch('/api/quiz/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quiz)
      })

      const data = await response.json()

      if (data.success) {
         setGeneratedQuiz(quiz)
         setSuccess(`Quiz "${quiz.title}" created successfully with ${quiz.questions.length} questions!`)
         setPastedText('')
         setQuizTitle('')
         setQuizDescription('')
      } else {
        setError(data.error || 'Failed to create quiz. Please try again.')
      }
    } catch (error) {
      console.error('Error creating quiz:', error)
      setError('An error occurred while creating the quiz. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async () => {
    if (!uploadFile) {
      setError('Please select a JSON file to upload.')
      return
    }

    try {
      setUploadLoading(true)
      setError('')
      setSuccess('')
      
      const formData = new FormData()
      formData.append('file', uploadFile)
      if (uploadTitle.trim()) formData.append('title', uploadTitle.trim())
      if (uploadDescription.trim()) formData.append('description', uploadDescription.trim())

      const response = await fetch('/api/quiz/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success && data.quiz) {
        setGeneratedQuiz(data.quiz)
        setSuccess(data.message || `Quiz "${data.quiz.title}" uploaded successfully!`)
        setUploadFile(null)
        setUploadTitle('')
        setUploadDescription('')
        // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      } else {
        setError(data.error || 'Failed to upload quiz. Please try again.')
      }
    } catch (error) {
      console.error('Error uploading quiz:', error)
      setError('An error occurred while uploading the quiz. Please try again.')
    } finally {
      setUploadLoading(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.json')) {
        setError('Please select a JSON file.')
        return
      }
      setUploadFile(file)
      setError('')
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Generator Admin</h1>
        <p className="text-gray-600">
          Generate interactive quizzes using AI or upload from JSON files.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('paste')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'paste'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clipboard className="w-4 h-4 inline mr-2" />
              Paste Quiz
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upload'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              File Upload
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'submissions'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              View Submissions
            </button>
          </nav>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quiz Generation/Upload Form */}
        <div className="card">
          {activeTab === 'paste' ? (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Create Quiz from Pasted Content</h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="quiz-title" className="block text-sm font-medium text-gray-700 mb-2">
                  Quiz Title *
                </label>
                <input
                  id="quiz-title"
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  className="input-field"
                  placeholder="Enter quiz title"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="quiz-description" className="block text-sm font-medium text-gray-700 mb-2">
                  Quiz Description (Optional)
                </label>
                <textarea
                  id="quiz-description"
                  value={quizDescription}
                  onChange={(e) => setQuizDescription(e.target.value)}
                  className="input-field h-20 resize-none"
                  placeholder="Enter quiz description"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="pasted-text" className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Content *
              </label>
              <textarea
                id="pasted-text"
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                className="input-field h-64 resize-none font-mono text-sm"
                placeholder="Paste your quiz content here...\n\nExample format:\nPart 1\n\nWhat is the capital of France?\na) London\nb) Berlin\nc) Paris\nd) Madrid\n✅ Correct Answer: c"
                disabled={loading}
              />
            </div>

            <button
              onClick={handleCreateQuiz}
              disabled={loading || !pastedText.trim() || !quizTitle.trim()}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Quiz...
                </>
              ) : (
                <>
                  <Clipboard className="w-4 h-4" />
                  Create Quiz
                </>
              )}
            </button>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-error-50 border border-error-200 rounded-lg text-error-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-success-50 border border-success-200 rounded-lg text-success-700">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{success}</span>
              </div>
            )}
          </div>
            </>
          ) : activeTab === 'upload' ? (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload Quiz from JSON</h2>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
                    JSON File *
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                    <div className="space-y-1 text-center">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            accept=".json"
                            className="sr-only"
                            onChange={handleFileChange}
                            disabled={uploadLoading}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">JSON files only, 10-100 questions</p>
                      {uploadFile && (
                        <p className="text-sm text-green-600 font-medium">
                          Selected: {uploadFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="upload-title" className="block text-sm font-medium text-gray-700 mb-2">
                      Quiz Title (Optional)
                    </label>
                    <input
                      id="upload-title"
                      type="text"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      className="input-field"
                      placeholder="Override title from JSON file"
                      disabled={uploadLoading}
                    />
                  </div>

                  <div>
                    <label htmlFor="upload-description" className="block text-sm font-medium text-gray-700 mb-2">
                      Quiz Description (Optional)
                    </label>
                    <textarea
                      id="upload-description"
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      className="input-field h-24 resize-none"
                      placeholder="Override description from JSON file"
                      disabled={uploadLoading}
                    />
                  </div>
                </div>

                <button
                  onClick={handleFileUpload}
                  disabled={uploadLoading || !uploadFile}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {uploadLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading Quiz...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Quiz
                    </>
                  )}
                </button>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-error-50 border border-error-200 rounded-lg text-error-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 p-3 bg-success-50 border border-success-200 rounded-lg text-success-700">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{success}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Quiz Submissions</h2>
              
              {submissionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                  <span className="ml-2 text-gray-600">Loading submissions...</span>
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No quiz submissions yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{submission.quizTitle || 'Untitled Quiz'}</h3>
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium text-gray-700">{submission.percentage}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(submission.submittedAt).toLocaleDateString()}</span>
                        </div>
                        <span>By: {submission.userName}</span>
                        <span>Score: {submission.score}/{submission.totalQuestions}</span>
                      </div>
                      <button
                        onClick={() => setSelectedSubmission(submission)}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Panel */}
        <div className="card">
          {activeTab === 'submissions' ? (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Submission Details</h2>
              
              {selectedSubmission ? (
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedSubmission.quizTitle}</h3>
                    {selectedSubmission.quizDescription && (
                      <p className="text-gray-600 mb-3">{selectedSubmission.quizDescription}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Submitted by: <strong>{selectedSubmission.userName}</strong></span>
                      <span>Date: {new Date(selectedSubmission.submittedAt).toLocaleString()}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        <span className="text-lg font-semibold text-gray-900">
                          {selectedSubmission.score}/{selectedSubmission.totalQuestions}
                        </span>
                        <span className="text-sm text-gray-600">({selectedSubmission.percentage}%)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Question Details:</h4>
                    {selectedSubmission.detailedAnswers?.map((answer, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-3 mb-3">
                          {answer.isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-success-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-error-500 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900 mb-2">
                              {index + 1}. {answer.question}
                            </h5>
                            <div className="space-y-1 text-sm">
                              <div className="text-gray-600">
                                <span className="font-medium">User Answer: </span>
                                <span className={answer.isCorrect ? 'text-success-700' : 'text-error-700'}>
                                  {Array.isArray(answer.userAnswer) ? answer.userAnswer.join(', ') : answer.userAnswer}
                                </span>
                              </div>
                              {!answer.isCorrect && (
                                <div className="text-gray-600">
                                  <span className="font-medium">Correct Answer: </span>
                                  <span className="text-success-700">
                                    {Array.isArray(answer.correctAnswer) ? answer.correctAnswer.join(', ') : answer.correctAnswer}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            answer.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {answer.isCorrect ? 'Correct' : 'Incorrect'}
                          </div>
                        </div>
                      </div>
                    )) || (
                      <p className="text-gray-500 text-center py-4">No detailed answers available for this submission.</p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="btn-secondary w-full"
                  >
                    Back to Submissions
                  </button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Select a submission to view details.</p>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Example Prompts / JSON Format Guide</h2>
              
              {activeTab === 'paste' ? (
                <div className="space-y-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">Example Quiz Format:</h3>
                    <pre className="text-sm text-blue-800 whitespace-pre-wrap font-mono">
{`Part 1

What is the capital of France?
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
                  
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h3 className="font-medium text-yellow-900 mb-2">Important Notes:</h3>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• Each question should be on its own line</li>
                      <li>• Options should start with a), b), c), d)</li>
                      <li>• Correct answer should be marked with ✅ Correct Answer: [letter]</li>
                      <li>• You can include "Part" headers to organize questions</li>
                      <li>• Make sure each question has exactly 4 options</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">JSON Format Example:</h3>
                    <pre className="text-sm text-blue-800 whitespace-pre-wrap font-mono">
{`{
  "title": "Sample Quiz",
  "description": "A sample quiz",
  "questions": [
    {
      "id": "q1",
      "question": "What is 2+2?",
      "type": "multiple-choice",
      "options": ["3", "4", "5", "6"],
      "correctAnswer": "4"
    },
    {
      "id": "q2",
      "question": "Name two colors",
      "type": "enumeration",
      "correctAnswer": ["red", "blue"]
    }
  ]
}`}
                    </pre>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h3 className="font-medium text-yellow-900 mb-2">Important Notes:</h3>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• File must contain 10-100 questions</li>
                      <li>• Supported types: "multiple-choice", "true-false", "enumeration"</li>
                      <li>• For enumeration: correctAnswer should be an array</li>
                      <li>• For others: correctAnswer should be a string</li>
                      <li>• All fields are required for each question</li>
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Generated Quiz Preview */}
      {generatedQuiz && (
        <div className="mt-8 card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Generated Quiz Preview</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{generatedQuiz.title}</h3>
            {generatedQuiz.description && (
              <p className="text-gray-600 mb-4">{generatedQuiz.description}</p>
            )}
            <div className="text-sm text-gray-500">
              Created: {new Date(generatedQuiz.createdAt).toLocaleString()}
            </div>
          </div>

          <div className="space-y-6">
            {generatedQuiz.questions.map((question, index) => (
              <div key={question.id} className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  {index + 1}. {question.question}
                </h4>
                <div className="space-y-2">
                  {question.type === 'enumeration' ? (
                    <div className="p-2 rounded border bg-success-50 border-success-200 text-success-800">
                      <div className="font-medium text-sm mb-1">Correct Answers:</div>
                      {Array.isArray(question.correctAnswer) ? (
                        <ul className="list-disc list-inside space-y-1">
                          {question.correctAnswer.map((answer, idx) => (
                            <li key={idx} className="text-sm">{answer}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-sm">{question.correctAnswer}</span>
                      )}
                    </div>
                  ) : (
                    <>
                      {question.options?.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className={`p-2 rounded border ${
                            option === question.correctAnswer
                              ? 'bg-success-50 border-success-200 text-success-800'
                              : 'bg-gray-50 border-gray-200 text-gray-700'
                          }`}
                        >
                          <span className="text-sm">
                            {String.fromCharCode(97 + optionIndex)}) {option}
                            {option === question.correctAnswer && (
                              <span className="ml-2 font-medium">✓ Correct</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Total Questions: {generatedQuiz.questions.length}
              </div>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Go to Quiz
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}