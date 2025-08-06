'use client'

import { useState } from 'react'
import { Send, Loader2, CheckCircle, AlertCircle, Upload, FileText } from 'lucide-react'
import { GenerateQuizRequest, Quiz } from '../types'

export default function AdminPage() {
  const [prompt, setPrompt] = useState('')
  const [questionCount, setQuestionCount] = useState(5)
  const [questionType, setQuestionType] = useState<'multiple-choice' | 'true-false' | 'enumeration' | 'mixed'>('multiple-choice')
  const [loading, setLoading] = useState(false)
  const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<'generate' | 'upload'>('generate')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadLoading, setUploadLoading] = useState(false)

  const handleGenerateQuiz = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt for quiz generation.')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')
      
      const request: GenerateQuizRequest = {
        prompt: prompt.trim(),
        questionCount,
        questionType
      }

      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      const data = await response.json()

      if (data.success && data.quiz) {
        setGeneratedQuiz(data.quiz)
        setSuccess(`Quiz "${data.quiz.title}" generated successfully with ${data.quiz.questions.length} questions!`)
        setPrompt('')
      } else {
        setError(data.error || 'Failed to generate quiz. Please try again.')
      }
    } catch (error) {
      console.error('Error generating quiz:', error)
      setError('An error occurred while generating the quiz. Please try again.')
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

  const examplePrompts = [
    "Create 5 multiple choice questions about World War II",
    "Generate 7 questions about basic JavaScript programming concepts",
    "Make 4 true/false questions about climate change",
    "Create 6 questions about the solar system and planets",
    "Generate 5 questions about famous historical figures"
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Generator Admin</h1>
        <p className="text-gray-600">
          Generate interactive quizzes using AI. Enter a prompt describing the topic and question type you want.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quiz Generation Form */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Generate New Quiz</h2>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Prompt *
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="input-field h-32 resize-none"
                placeholder="e.g., Create 5 multiple choice questions about World War II"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="questionCount" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Questions
                </label>
                <select
                  id="questionCount"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="input-field"
                  disabled={loading}
                >
                  {[3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num} questions</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="questionType" className="block text-sm font-medium text-gray-700 mb-2">
                  Question Type
                </label>
                <select
                  id="questionType"
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value as any)}
                  className="input-field"
                  disabled={loading}
                >
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="true-false">True/False</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateQuiz}
              disabled={loading || !prompt.trim()}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Quiz...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Generate Quiz
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
        </div>

        {/* Example Prompts */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Example Prompts</h2>
          <div className="space-y-3">
            {examplePrompts.map((example, index) => (
              <div
                key={index}
                onClick={() => !loading && setPrompt(example)}
                className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors duration-200 text-sm text-gray-700"
              >
                {example}
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Tips for Better Prompts:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Be specific about the topic and difficulty level</li>
              <li>• Mention the number of questions you want</li>
              <li>• Specify question type (multiple choice, true/false)</li>
              <li>• Include context like "for high school students" if needed</li>
            </ul>
          </div>
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
                  {question.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className={`p-2 rounded border ${
                        option === question.correctAnswer
                          ? 'bg-success-50 border-success-200 text-success-800'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      {option}
                      {option === question.correctAnswer && (
                        <span className="ml-2 text-xs font-medium">(Correct Answer)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <p className="text-green-800 text-sm">
              ✅ Quiz has been saved and is now available for users to take!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}