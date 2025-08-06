export interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: string | string[] // For enumeration, can be multiple correct answers
  type: 'multiple-choice' | 'true-false' | 'enumeration'
}

export interface Quiz {
  id: string
  title: string
  description: string
  questions: Question[]
  createdAt: string
  createdBy: string
}

export interface QuizResult {
  id: string
  quizId: string
  quizTitle: string
  quizDescription: string
  userName: string
  answers: { [questionIndex: number]: string }
  detailedAnswers: {
    questionId: string
    question: string
    userAnswer: string
    correctAnswer: string | string[]
    isCorrect: boolean
    options: string[]
  }[]
  score: number
  totalQuestions: number
  percentage: number
  submittedAt: string
  timeTaken?: number
  isApproved: boolean
  approvedAt?: string
  approvedBy?: string
}

export interface QuizSubmission {
  userName: string
  answers: { [questionIndex: number]: string }
  questions: Question[]
}

export interface UploadQuizRequest {
  file: File
  title?: string
  description?: string
}

export interface QuizFileData {
  title?: string
  description?: string
  questions: {
    question: string
    options?: string[]
    correctAnswer: string | string[]
    type: 'multiple-choice' | 'true-false' | 'enumeration'
  }[]
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}