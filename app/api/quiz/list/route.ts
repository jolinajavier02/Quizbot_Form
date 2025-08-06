import { NextRequest, NextResponse } from 'next/server'
import { getLatestQuizFromStorage } from '../../../utils/storage'

export async function GET(request: NextRequest) {
  try {
    // For now, we'll return the latest quiz as a single item array
    // In a real implementation, you'd fetch all quizzes from storage
    const latestQuiz = await getLatestQuizFromStorage()
    
    if (!latestQuiz) {
      return NextResponse.json({
        success: true,
        quizzes: []
      })
    }

    return NextResponse.json({
      success: true,
      quizzes: [latestQuiz]
    })
  } catch (error) {
    console.error('Error fetching quizzes:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch quizzes' 
      },
      { status: 500 }
    )
  }
}