import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { QuizResult, QuizSubmission, Quiz } from '../../../types'
import { saveQuizResultToStorage } from '../../../utils/storage'

export async function POST(request: NextRequest) {
  try {
    const body: QuizSubmission & { quiz?: Quiz } = await request.json()
    const { userName, answers, questions, quiz } = body

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

    // Calculate score and create detailed answers
    let score = 0
    const totalQuestions = questions.length
    const detailedAnswers = []

    for (let i = 0; i < totalQuestions; i++) {
      const question = questions[i]
      const userAnswer = answers[i] || ''
      const correctAnswer = question?.correctAnswer
      
      let isCorrect = false
      if (Array.isArray(correctAnswer)) {
        // For enumeration questions with multiple correct answers
        isCorrect = correctAnswer.includes(userAnswer)
      } else {
        isCorrect = userAnswer === correctAnswer
      }
      
      if (isCorrect) {
        score++
      }

      detailedAnswers.push({
        questionId: question.id,
        question: question.question,
        userAnswer,
        correctAnswer,
        isCorrect,
        options: question.options
      })
    }

    const percentage = Math.round((score / totalQuestions) * 100)

    // Create quiz result
    const result: QuizResult = {
      id: uuidv4(),
      quizId: quiz?.id || 'unknown',
      quizTitle: quiz?.title || 'Unknown Quiz',
      quizDescription: quiz?.description || '',
      userName: userName.trim(),
      answers,
      detailedAnswers,
      score,
      totalQuestions,
      percentage,
      submittedAt: new Date().toISOString(),
      isApproved: false
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