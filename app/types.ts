export interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: string
  type: 'multiple-choice' | 'true-false'
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
  userName: string
  answers: { [questionIndex: number]: string }
  score: number
  totalQuestions: number
  submittedAt: string
  timeTaken?: number
}

export interface QuizSubmission {
  userName: string
  answers: { [questionIndex: number]: string }
  questions: Question[]
}

export interface GenerateQuizRequest {
  prompt: string
  questionCount?: number
  questionType?: 'multiple-choice' | 'true-false' | 'mixed'
}

export interface GenerateQuizResponse {
  success: boolean
  quiz?: Quiz
  error?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}