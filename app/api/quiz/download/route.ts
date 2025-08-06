import { NextRequest, NextResponse } from 'next/server'
import jsPDF from 'jspdf'
import { createObjectCsvWriter } from 'csv-writer'
import { QuizResult } from '../../../types'
import fs from 'fs'
import path from 'path'
import os from 'os'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format')
    const body = await request.json()
    const { result, userName }: { result: QuizResult; userName: string } = body

    if (!result || !userName) {
      return NextResponse.json(
        { success: false, error: 'Result data and user name are required' },
        { status: 400 }
      )
    }

    if (format === 'pdf') {
      // Generate PDF
      const doc = new jsPDF()
      
      // Title
      doc.setFontSize(20)
      doc.text('Quiz Results', 20, 30)
      
      // User info
      doc.setFontSize(12)
      doc.text(`Name: ${userName}`, 20, 50)
      doc.text(`Date: ${new Date(result.submittedAt).toLocaleDateString()}`, 20, 60)
      doc.text(`Score: ${result.score}/${result.totalQuestions} (${Math.round((result.score / result.totalQuestions) * 100)}%)`, 20, 70)
      
      // Add some spacing
      let yPosition = 90
      
      doc.setFontSize(14)
      doc.text('Detailed Results:', 20, yPosition)
      yPosition += 20
      
      doc.setFontSize(10)
      
      // Add questions and answers (simplified for PDF)
      Object.entries(result.answers).forEach(([questionIndex, userAnswer], index) => {
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 30
        }
        
        doc.text(`Q${parseInt(questionIndex) + 1}: ${userAnswer}`, 20, yPosition)
        yPosition += 10
      })
      
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
      
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="quiz-results-${userName}.pdf"`,
        },
      })
      
    } else if (format === 'csv') {
      // Generate CSV
      const csvData = [
        {
          'User Name': userName,
          'Submission Date': new Date(result.submittedAt).toLocaleDateString(),
          'Score': result.score,
          'Total Questions': result.totalQuestions,
          'Percentage': `${Math.round((result.score / result.totalQuestions) * 100)}%`,
        }
      ]
      
      // Add individual answers
      Object.entries(result.answers).forEach(([questionIndex, userAnswer]) => {
        csvData.push({
          'User Name': '',
          'Submission Date': '',
          'Score': '',
          'Total Questions': '',
          'Percentage': '',
          [`Question ${parseInt(questionIndex) + 1} Answer`]: userAnswer
        } as any)
      })
      
      // Create temporary file
      const tempDir = os.tmpdir()
      const tempFilePath = path.join(tempDir, `quiz-results-${Date.now()}.csv`)
      
      const csvWriter = createObjectCsvWriter({
        path: tempFilePath,
        header: [
          { id: 'User Name', title: 'User Name' },
          { id: 'Submission Date', title: 'Submission Date' },
          { id: 'Score', title: 'Score' },
          { id: 'Total Questions', title: 'Total Questions' },
          { id: 'Percentage', title: 'Percentage' },
        ]
      })
      
      await csvWriter.writeRecords(csvData)
      
      const csvBuffer = fs.readFileSync(tempFilePath)
      
      // Clean up temp file
      fs.unlinkSync(tempFilePath)
      
      return new NextResponse(csvBuffer, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="quiz-results-${userName}.csv"`,
        },
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid format. Use pdf or csv.' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error generating download:', error)
    
    return NextResponse.json(
      { success: false, error: 'Failed to generate download' },
      { status: 500 }
    )
  }
}