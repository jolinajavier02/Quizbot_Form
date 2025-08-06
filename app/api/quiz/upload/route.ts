import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { Quiz, Question, QuizFileData } from '../../../types'
import { saveQuizToStorage } from '../../../utils/storage'

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let quizData: Quiz | QuizFileData
    let title: string
    let description: string

    // Handle JSON data (from paste functionality)
    if (contentType.includes('application/json')) {
      const jsonData = await request.json()
      
      // If it's already a complete Quiz object, use it directly
      if (jsonData.id && jsonData.title && jsonData.questions) {
        quizData = jsonData as Quiz
        title = quizData.title
        description = quizData.description || ''
      } else {
        return NextResponse.json(
          { success: false, error: 'Invalid quiz data structure' },
          { status: 400 }
        )
      }
    }
    // Handle form data (from file upload)
    else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File
      title = formData.get('title') as string
      description = formData.get('description') as string

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No file provided' },
          { status: 400 }
        )
      }

      if (!file.name.endsWith('.json')) {
        return NextResponse.json(
          { success: false, error: 'Only JSON files are allowed' },
          { status: 400 }
        )
      }

      // Read and parse the JSON file
      const fileContent = await file.text()
      
      try {
        quizData = JSON.parse(fileContent) as QuizFileData
      } catch (parseError) {
        return NextResponse.json(
          { success: false, error: 'Invalid JSON format' },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported content type' },
        { status: 400 }
      )
    }

    // Handle Quiz object (from JSON/paste) vs QuizFileData (from file upload)
    let finalQuiz: Quiz
    
    if ('id' in quizData && 'createdAt' in quizData) {
      // It's already a complete Quiz object from paste functionality
      finalQuiz = quizData as Quiz
    } else {
      // It's QuizFileData from file upload, need to validate and convert
      const fileData = quizData as QuizFileData
      
      // Validate the quiz data structure
      if (!fileData.questions || !Array.isArray(fileData.questions)) {
        return NextResponse.json(
          { success: false, error: 'Invalid quiz structure: questions array is required' },
          { status: 400 }
        )
      }

      if (fileData.questions.length < 1 || fileData.questions.length > 100) {
        return NextResponse.json(
          { success: false, error: 'Quiz must contain between 1 and 100 questions' },
          { status: 400 }
        )
      }

      // Validate and process questions
      const processedQuestions: Question[] = []
      
      for (let i = 0; i < fileData.questions.length; i++) {
        const q = fileData.questions[i]
        
        if (!q.question || !q.type) {
          return NextResponse.json(
            { success: false, error: `Question ${i + 1}: Missing question text or type` },
            { status: 400 }
          )
        }

        if (!['multiple-choice', 'true-false', 'enumeration'].includes(q.type)) {
          return NextResponse.json(
            { success: false, error: `Question ${i + 1}: Invalid question type. Must be 'multiple-choice', 'true-false', or 'enumeration'` },
            { status: 400 }
          )
        }

        let options: string[] = []
        let correctAnswer: string | string[] = q.correctAnswer

        // Validate based on question type
        if (q.type === 'multiple-choice') {
          if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
            return NextResponse.json(
              { success: false, error: `Question ${i + 1}: Multiple choice questions must have at least 2 options` },
              { status: 400 }
            )
          }
          options = q.options
          
          if (typeof correctAnswer !== 'string' || !options.includes(correctAnswer)) {
            return NextResponse.json(
              { success: false, error: `Question ${i + 1}: Correct answer must be one of the provided options` },
              { status: 400 }
            )
          }
        } else if (q.type === 'true-false') {
          options = ['True', 'False']
          
          if (typeof correctAnswer !== 'string' || !['True', 'False', 'true', 'false'].includes(correctAnswer)) {
            return NextResponse.json(
              { success: false, error: `Question ${i + 1}: True/False questions must have 'True' or 'False' as correct answer` },
              { status: 400 }
            )
          }
          
          // Normalize to proper case
          correctAnswer = correctAnswer.toLowerCase() === 'true' ? 'True' : 'False'
        } else if (q.type === 'enumeration') {
          if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
            return NextResponse.json(
              { success: false, error: `Question ${i + 1}: Enumeration questions must have at least 2 options` },
              { status: 400 }
            )
          }
          options = q.options
          
          // For enumeration, correctAnswer can be string or array
          if (Array.isArray(correctAnswer)) {
            if (correctAnswer.length === 0) {
              return NextResponse.json(
                { success: false, error: `Question ${i + 1}: At least one correct answer is required` },
                { status: 400 }
              )
            }
            
            for (const answer of correctAnswer) {
              if (!options.includes(answer)) {
                return NextResponse.json(
                  { success: false, error: `Question ${i + 1}: Correct answer '${answer}' not found in options` },
                  { status: 400 }
                )
              }
            }
          } else {
            if (!options.includes(correctAnswer)) {
              return NextResponse.json(
                { success: false, error: `Question ${i + 1}: Correct answer must be one of the provided options` },
                { status: 400 }
              )
            }
          }
        }

        processedQuestions.push({
          id: uuidv4(),
          question: q.question.trim(),
          options,
          correctAnswer,
          type: q.type
        })
      }

      // Create the quiz object from file data
      finalQuiz = {
        id: uuidv4(),
        title: title || fileData.title || 'Uploaded Quiz',
        description: description || fileData.description || 'Quiz uploaded from file',
        questions: processedQuestions,
        createdAt: new Date().toISOString(),
        createdBy: 'admin'
      }
    }

    // Save the quiz
    await saveQuizToStorage(finalQuiz)

    return NextResponse.json({
      success: true,
      quiz: finalQuiz,
      message: `Successfully saved quiz with ${finalQuiz.questions.length} questions`
    })

  } catch (error) {
    console.error('Error uploading quiz:', error)
    
    let errorMessage = 'Failed to upload quiz'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}