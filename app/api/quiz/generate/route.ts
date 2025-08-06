import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { v4 as uuidv4 } from 'uuid'
import { Quiz, Question, GenerateQuizRequest } from '../../../types'
import { saveQuizToStorage } from '../../../utils/storage'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const body: GenerateQuizRequest = await request.json()
    const { prompt, questionCount = 5, questionType = 'multiple-choice' } = body

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Create a detailed prompt for ChatGPT
    const systemPrompt = `You are a quiz generator. Create exactly ${questionCount} ${questionType} questions based on the user's prompt. 

IMPORTANT: Respond ONLY with a valid JSON object in this exact format:
{
  "title": "Quiz Title",
  "description": "Brief description",
  "questions": [
    {
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "type": "multiple-choice"
    }
  ]
}

For true/false questions, use only ["True", "False"] as options.
For multiple choice, use 4 options.
Make sure the correctAnswer exactly matches one of the options.
Do not include any text before or after the JSON.`

    const userPrompt = `${prompt}. Generate ${questionCount} ${questionType} questions.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const responseText = completion.choices[0]?.message?.content?.trim()
    
    if (!responseText) {
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response
    let quizData
    try {
      quizData = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseText)
      throw new Error('Invalid JSON response from OpenAI')
    }

    // Validate the response structure
    if (!quizData.questions || !Array.isArray(quizData.questions)) {
      throw new Error('Invalid quiz structure: missing questions array')
    }

    // Create the quiz object
    const quiz: Quiz = {
      id: uuidv4(),
      title: quizData.title || 'Generated Quiz',
      description: quizData.description || 'AI-generated quiz',
      questions: quizData.questions.map((q: any) => ({
        id: uuidv4(),
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        type: q.type || questionType
      })),
      createdAt: new Date().toISOString(),
      createdBy: 'admin'
    }

    // Validate questions
    for (const question of quiz.questions) {
      if (!question.question || !question.options || !question.correctAnswer) {
        throw new Error('Invalid question structure')
      }
      if (!question.options.includes(question.correctAnswer)) {
        throw new Error(`Correct answer "${question.correctAnswer}" not found in options for question: "${question.question}"`)
      }
    }

    // Save the quiz
    await saveQuizToStorage(quiz)

    return NextResponse.json({
      success: true,
      quiz
    })

  } catch (error) {
    console.error('Error generating quiz:', error)
    
    let errorMessage = 'Failed to generate quiz'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}