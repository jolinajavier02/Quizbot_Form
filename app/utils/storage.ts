import { google } from 'googleapis'
import { Quiz, QuizResult } from '../types'

// Google Sheets configuration
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

// Initialize Google Sheets API
function getGoogleSheetsAuth() {
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || 
      process.env.GOOGLE_CLIENT_EMAIL.trim() === '' || process.env.GOOGLE_PRIVATE_KEY.trim() === '') {
    throw new Error('Google Sheets credentials not configured')
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: SCOPES,
  })

  return auth
}

function getSheets() {
  const auth = getGoogleSheetsAuth()
  return google.sheets({ version: 'v4', auth })
}

// Local storage fallback (for development)
let localQuizzes: Quiz[] = []
let localResults: QuizResult[] = []

export async function saveQuizToStorage(quiz: Quiz): Promise<void> {
  try {
    if (process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_CLIENT_EMAIL && 
        process.env.GOOGLE_SHEET_ID.trim() !== '' && process.env.GOOGLE_CLIENT_EMAIL.trim() !== '') {
      await saveQuizToGoogleSheets(quiz)
    } else {
      // Fallback to local storage for development
      console.warn('Google Sheets not configured, using local storage')
      localQuizzes.push(quiz)
    }
  } catch (error) {
    console.error('Error saving quiz to storage:', error)
    // Fallback to local storage
    localQuizzes.push(quiz)
  }
}

export async function getLatestQuizFromStorage(): Promise<Quiz | null> {
  try {
    if (process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_CLIENT_EMAIL && 
        process.env.GOOGLE_SHEET_ID.trim() !== '' && process.env.GOOGLE_CLIENT_EMAIL.trim() !== '') {
      return await getLatestQuizFromGoogleSheets()
    } else {
      // Fallback to local storage
      console.warn('Google Sheets not configured, using local storage')
      return localQuizzes.length > 0 ? localQuizzes[localQuizzes.length - 1] : null
    }
  } catch (error) {
    console.error('Error getting quiz from storage:', error)
    // Fallback to local storage
    return localQuizzes.length > 0 ? localQuizzes[localQuizzes.length - 1] : null
  }
}

export async function saveQuizResultToStorage(result: QuizResult): Promise<void> {
  try {
    if (process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_CLIENT_EMAIL && 
        process.env.GOOGLE_SHEET_ID.trim() !== '' && process.env.GOOGLE_CLIENT_EMAIL.trim() !== '') {
      await saveQuizResultToGoogleSheets(result)
    } else {
      // Fallback to local storage
      console.warn('Google Sheets not configured, using local storage')
      localResults.push(result)
    }
  } catch (error) {
    console.error('Error saving quiz result to storage:', error)
    // Fallback to local storage
    localResults.push(result)
  }
}

export async function getAllQuizResultsFromStorage(): Promise<QuizResult[]> {
  try {
    if (process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_CLIENT_EMAIL && 
        process.env.GOOGLE_SHEET_ID.trim() !== '' && process.env.GOOGLE_CLIENT_EMAIL.trim() !== '') {
      return await getAllQuizResultsFromGoogleSheets()
    } else {
      // Fallback to local storage
      console.warn('Google Sheets not configured, using local storage')
      return [...localResults]
    }
  } catch (error) {
    console.error('Error getting quiz results from storage:', error)
    // Fallback to local storage
    return [...localResults]
  }
}

export async function getAllQuizzesFromStorage(): Promise<Quiz[]> {
  try {
    if (process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_CLIENT_EMAIL && 
        process.env.GOOGLE_SHEET_ID.trim() !== '' && process.env.GOOGLE_CLIENT_EMAIL.trim() !== '') {
      return await getAllQuizzesFromGoogleSheets()
    } else {
      // Fallback to local storage
      console.warn('Google Sheets not configured, using local storage')
      return [...localQuizzes]
    }
  } catch (error) {
    console.error('Error getting quizzes from storage:', error)
    // Fallback to local storage
    return [...localQuizzes]
  }
}

// Google Sheets implementation
async function saveQuizToGoogleSheets(quiz: Quiz): Promise<void> {
  const sheets = getSheets()
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!

  // Ensure the 'Quizzes' sheet exists
  await ensureSheetExists(sheets, spreadsheetId, 'Quizzes', [
    'Quiz ID', 'Title', 'Description', 'Created At', 'Created By', 'Questions (JSON)'
  ])

  // Prepare the row data
  const values = [[
    quiz.id,
    quiz.title,
    quiz.description,
    quiz.createdAt,
    quiz.createdBy,
    JSON.stringify(quiz.questions)
  ]]

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Quizzes!A:F',
    valueInputOption: 'RAW',
    requestBody: {
      values
    }
  })
}

async function getLatestQuizFromGoogleSheets(): Promise<Quiz | null> {
  const sheets = getSheets()
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Quizzes!A:F'
    })

    const rows = response.data.values
    if (!rows || rows.length <= 1) {
      return null
    }

    // Get the last row (most recent quiz)
    const lastRow = rows[rows.length - 1]
    if (lastRow.length < 6) {
      return null
    }

    const quiz: Quiz = {
      id: lastRow[0],
      title: lastRow[1],
      description: lastRow[2],
      createdAt: lastRow[3],
      createdBy: lastRow[4],
      questions: JSON.parse(lastRow[5])
    }

    return quiz
  } catch (error) {
    console.error('Error getting quiz from Google Sheets:', error)
    return null
  }
}

async function saveQuizResultToGoogleSheets(result: QuizResult): Promise<void> {
  const sheets = getSheets()
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!

  // Ensure the 'Results' sheet exists
  await ensureSheetExists(sheets, spreadsheetId, 'Results', [
    'Result ID', 'Quiz ID', 'Quiz Title', 'Quiz Description', 'User Name', 'Score', 'Total Questions', 'Percentage', 'Submitted At', 'Answers (JSON)', 'Detailed Answers (JSON)', 'Is Approved'
  ])

  // Prepare the row data
  const values = [[
    result.id,
    result.quizId,
    result.quizTitle,
    result.quizDescription,
    result.userName,
    result.score,
    result.totalQuestions,
    result.percentage,
    result.submittedAt,
    JSON.stringify(result.answers),
    JSON.stringify(result.detailedAnswers),
    result.isApproved.toString()
  ]]

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Results!A:L',
    valueInputOption: 'RAW',
    requestBody: {
      values
    }
  })
}

async function getAllQuizResultsFromGoogleSheets(): Promise<QuizResult[]> {
  const sheets = getSheets()
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Results!A:L'
    })

    const rows = response.data.values
    if (!rows || rows.length <= 1) {
      return []
    }

    const results: QuizResult[] = []
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (row.length >= 9) {
        const result: QuizResult = {
          id: row[0],
          quizId: row[1],
          quizTitle: row[2] || 'Unknown Quiz',
          quizDescription: row[3] || '',
          userName: row[4],
          score: parseInt(row[5]) || 0,
          totalQuestions: parseInt(row[6]) || 0,
          percentage: parseFloat(row[7]) || 0,
          submittedAt: row[8],
          answers: row[9] ? JSON.parse(row[9]) : {},
          detailedAnswers: row[10] ? JSON.parse(row[10]) : [],
          isApproved: row[11] === 'true' || false
        }
        results.push(result)
      }
    }

    return results
  } catch (error) {
    console.error('Error getting quiz results from Google Sheets:', error)
    return []
  }
}

async function getAllQuizzesFromGoogleSheets(): Promise<Quiz[]> {
  const sheets = getSheets()
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Quizzes!A:F'
    })

    const rows = response.data.values
    if (!rows || rows.length <= 1) {
      return []
    }

    const quizzes: Quiz[] = []
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (row.length >= 6) {
        const quiz: Quiz = {
          id: row[0],
          title: row[1],
          description: row[2],
          createdAt: row[3],
          createdBy: row[4],
          questions: JSON.parse(row[5])
        }
        quizzes.push(quiz)
      }
    }

    return quizzes
  } catch (error) {
    console.error('Error getting quizzes from Google Sheets:', error)
    return []
  }
}

async function ensureSheetExists(sheets: any, spreadsheetId: string, sheetName: string, headers: string[]): Promise<void> {
  try {
    // Check if sheet exists
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId })
    const sheetExists = spreadsheet.data.sheets.some((sheet: any) => sheet.properties.title === sheetName)

    if (!sheetExists) {
      // Create the sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: sheetName
              }
            }
          }]
        }
      })

      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1:${String.fromCharCode(64 + headers.length)}1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [headers]
        }
      })
    }
  } catch (error) {
    console.error(`Error ensuring sheet ${sheetName} exists:`, error)
    throw error
  }
}