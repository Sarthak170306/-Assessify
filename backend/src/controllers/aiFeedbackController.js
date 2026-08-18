const prisma = require('../config/prisma');
const { generateDiagnosticFeedback } = require('../../services/aiService');

/**
 * AI Diagnostic Performance & Weak Area Feedback Controller
 */

// Generate or Retrieve AI Diagnostic Feedback for an Attempt
// POST /api/attempts/:attemptId/feedback or GET /api/attempts/:attemptId/feedback
const getAttemptAIFeedback = async (req, res) => {
  try {
    const { attemptId } = req.params;

    if (!attemptId) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'attemptId parameter is required.'
      });
    }

    // 1. Fetch Attempt from Prisma
    let attempt = null;
    try {
      attempt = await prisma.attempt.findUnique({
        where: { id: attemptId },
        include: {
          quiz: {
            select: {
              id: true,
              title: true,
              passingScore: true
            }
          },
          answers: {
            include: {
              question: {
                include: {
                  options: true
                }
              },
              selectedOption: true
            }
          }
        }
      });
    } catch (dbErr) {
      console.warn('Prisma attempt lookup error in aiFeedbackController:', dbErr.message);
    }

    // 2. Caching Check: If aiFeedback already exists, return cached response immediately
    if (attempt && attempt.aiFeedback) {
      const cachedFeedback = typeof attempt.aiFeedback === 'string'
        ? JSON.parse(attempt.aiFeedback)
        : attempt.aiFeedback;

      return res.status(200).json({
        success: true,
        attemptId,
        cached: true,
        feedback: cachedFeedback
      });
    }

    // 3. Data Aggregation for AI Analysis
    const quizTitle = attempt?.quiz?.title || 'Assessment Quiz';
    const scorePercentage = attempt?.score || 0;
    const passingScore = attempt?.quiz?.passingScore || 70;
    const isPassed = scorePercentage >= passingScore;

    const incorrectQuestions = [];
    if (attempt && Array.isArray(attempt.answers)) {
      attempt.answers.forEach((ans) => {
        if (!ans.isCorrect) {
          const qText = ans.question?.text || 'Question statement';
          const selectedText = ans.selectedOption?.text || 'No option selected';
          const correctOpt = ans.question?.options?.find(o => o.isCorrect);
          const correctText = correctOpt ? correctOpt.text : 'N/A';

          incorrectQuestions.push({
            text: qText,
            selectedOptionText: selectedText,
            correctOptionText: correctText
          });
        }
      });
    }

    // 4. Invoke AI Service
    let feedback = await generateDiagnosticFeedback({
      quizTitle,
      scorePercentage,
      isPassed,
      incorrectQuestions
    });

    if (!feedback || !feedback.summary) {
      feedback = {
        summary: isPassed
          ? `Solid performance on "${quizTitle}" with a score of ${scorePercentage}%. You demonstrated strong comprehension of core concepts.`
          : `You scored ${scorePercentage}% on "${quizTitle}". Targeted review of missed concepts will help you pass on your next attempt.`,
        strengths: isPassed
          ? ['Accurate option selection under timed session', 'Strong grasp of foundational principles']
          : ['Completed full evaluation', 'Identified key learning gaps for focused study'],
        weakAreas: isPassed
          ? ['Minor edge case precision']
          : ['Review questions answered incorrectly in the solution breakdown'],
        recommendations: [
          'Review question explanations in the result breakdown tab.',
          'Re-attempt the assessment to reinforce concepts.'
        ]
      };
    }

    // 5. Save Feedback into Database Cache
    if (attempt) {
      try {
        await prisma.attempt.update({
          where: { id: attemptId },
          data: {
            aiFeedback: feedback
          }
        });
      } catch (saveErr) {
        console.warn('Could not save aiFeedback to DB cache:', saveErr.message);
      }
    }

    // 6. Return Structured Response
    return res.status(200).json({
      success: true,
      attemptId,
      cached: false,
      feedback
    });

  } catch (err) {
    console.error('getAttemptAIFeedback error:', err);
    // Heuristic Fallback Response (Never crash with 500)
    return res.status(200).json({
      success: true,
      attemptId: req.params.attemptId || 'fallback-attempt',
      cached: false,
      feedback: {
        summary: 'Completed assessment evaluation with score threshold analysis.',
        strengths: ['Consistent participation and baseline domain knowledge.'],
        weakAreas: ['Review questions answered incorrectly in the solution breakdown.'],
        recommendations: ['Focus on revisiting foundational concepts before re-attempting.']
      }
    });
  }
};

module.exports = {
  getAttemptAIFeedback
};
