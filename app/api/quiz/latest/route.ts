import { NextResponse } from 'next/server'
import { getLatestQuizFromStorage } from '../../../utils/storage'

export async function GET() {
  try {
    const quiz = await getLatestQuizFromStorage()
    
    if (!quiz) {
      return NextResponse.json({
        success: true,
        questions: []
      })
    }

    return NextResponse.json({
      success: true,
      questions: quiz.questions,
      title: quiz.title,
      description: quiz.description
    })

  } catch (error) {
    console.error('Error fetching latest quiz:', error)
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quiz' },
      { status: 500 }
    )
  }
}