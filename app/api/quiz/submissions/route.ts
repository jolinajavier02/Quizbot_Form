import { NextRequest, NextResponse } from 'next/server'
import { getAllQuizResultsFromStorage } from '../../../utils/storage'

export async function GET(request: NextRequest) {
  try {
    const results = await getAllQuizResultsFromStorage()
    
    return NextResponse.json({
      success: true,
      submissions: results.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    })

  } catch (error) {
    console.error('Error fetching quiz submissions:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch quiz submissions' 
      },
      { status: 500 }
    )
  }
}