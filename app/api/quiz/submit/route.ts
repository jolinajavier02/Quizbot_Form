import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { QuizResult, QuizSubmission } from '../../../types'
import { saveQuizResultToStorage } from '../../../utils/storage'

export async function POST(request: NextRequest) {
  try {
    const body: QuizSubmission = await request.json()
    const { userName, answers, questions } = body

    if (!userName || !userName.trim()) {
      return NextResponse.json(
        { success: false, error: 'User name is required' },
        { status: 400 }
      )
    }

    if (!answers || !questions) {
      return NextResponse.json(
        { success: false, error: 'Answers and questions are required' },
        { status: 400 }
      )
    }

    // Calculate score
    let score = 0
    const totalQuestions = questions.length

    for (let i = 0; i < totalQuestions; i++) {
      const userAnswer = answers[i]
      const correctAnswer = questions[i]?.correctAnswer
      
      if (userAnswer && userAnswer === correctAnswer) {
        score++
      }
    }

    // Create quiz result
    const result: QuizResult = {
      id: uuidv4(),
      quizId: 'latest', // For now, we'll use 'latest' as the quiz ID
      userName: userName.trim(),
      answers,
      score,
      totalQuestions,
      submittedAt: new Date().toISOString()
    }

    // Save the result
    await saveQuizResultToStorage(result)

    return NextResponse.json({
      success: true,
      ...result
    })

  } catch (error) {
    console.error('Error submitting quiz:', error)
    
    let errorMessage = 'Failed to submit quiz'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}