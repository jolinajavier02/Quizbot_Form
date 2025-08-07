import { Quiz, QuizResult } from '../types'

// Storage keys
const QUIZZES_STORAGE_KEY = 'quizzes'
const QUIZ_RESULTS_STORAGE_KEY = 'quizResults'

// Generate unique ID for quizzes
export function generateQuizId(): string {
  return 'quiz_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// Quiz storage functions
export async function saveQuizToStorage(quiz: Quiz): Promise<void> {
  try {
    const existingQuizzes = await getAllQuizzesFromStorage()
    const updatedQuizzes = [...existingQuizzes, quiz]
    localStorage.setItem(QUIZZES_STORAGE_KEY, JSON.stringify(updatedQuizzes))
  } catch (error) {
    console.error('Error saving quiz to storage:', error)
    throw error
  }
}

export async function getQuizById(quizId: string): Promise<Quiz | null> {
  try {
    const quizzes = await getAllQuizzesFromStorage()
    return quizzes.find(quiz => quiz.id === quizId) || null
  } catch (error) {
    console.error('Error getting quiz by ID:', error)
    return null
  }
}

export async function getLatestQuizFromStorage(): Promise<Quiz | null> {
  try {
    const quizzes = await getAllQuizzesFromStorage()
    return quizzes.length > 0 ? quizzes[quizzes.length - 1] : null
  } catch (error) {
    console.error('Error getting latest quiz:', error)
    return null
  }
}

export async function getAllQuizzesFromStorage(): Promise<Quiz[]> {
  try {
    const storedQuizzes = localStorage.getItem(QUIZZES_STORAGE_KEY)
    return storedQuizzes ? JSON.parse(storedQuizzes) : []
  } catch (error) {
    console.error('Error getting all quizzes:', error)
    return []
  }
}

// Quiz result storage functions
export async function saveQuizResultToStorage(result: QuizResult): Promise<void> {
  try {
    const existingResults = await getAllQuizResultsFromStorage()
    const updatedResults = [...existingResults, result]
    localStorage.setItem(QUIZ_RESULTS_STORAGE_KEY, JSON.stringify(updatedResults))
  } catch (error) {
    console.error('Error saving quiz result to storage:', error)
    throw error
  }
}

export async function getAllQuizResultsFromStorage(): Promise<QuizResult[]> {
  try {
    const storedResults = localStorage.getItem(QUIZ_RESULTS_STORAGE_KEY)
    return storedResults ? JSON.parse(storedResults) : []
  } catch (error) {
    console.error('Error getting all quiz results:', error)
    return []
  }
}

// Generate shareable URL for a quiz
export function generateQuizShareUrl(quizId: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/quiz/${quizId}`
  }
  return `/quiz/${quizId}`
}