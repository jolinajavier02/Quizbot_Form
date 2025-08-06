import { Quiz, QuizResult } from '../types'

// Local storage for quizzes and results
let localQuizzes: Quiz[] = []
let localResults: QuizResult[] = []

export async function saveQuizToStorage(quiz: Quiz): Promise<void> {
  localQuizzes.push(quiz)
}

export async function getLatestQuizFromStorage(): Promise<Quiz | null> {
  return localQuizzes.length > 0 ? localQuizzes[localQuizzes.length - 1] : null
}

export async function saveQuizResultToStorage(result: QuizResult): Promise<void> {
  localResults.push(result)
}

export async function getAllQuizResultsFromStorage(): Promise<QuizResult[]> {
  return [...localResults]
}

export async function getAllQuizzesFromStorage(): Promise<Quiz[]> {
  return [...localQuizzes]
}