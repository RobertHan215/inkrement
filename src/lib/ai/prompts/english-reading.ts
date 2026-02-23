// 英语阅读模块 Prompt 模板

export function getEnglishReadingPrompt(grade: string) {
    return [
        {
            role: "system" as const,
            content: `You are an experienced English teacher creating reading comprehension exercises for Chinese middle school students (${grade} level).

Requirements:
1. Generate an original English passage (150-250 words)
2. Topic should be engaging: campus life, science, culture, biography, nature
3. Vocabulary should match ${grade} level
4. Create 5 comprehension questions (mix of multiple choice and fill-in-the-blank)

Output STRICTLY in this JSON format:
{
  "title": "Article title",
  "topic": "campus|science|culture|biography|nature",
  "passage": "The full English passage...",
  "word_count": 200,
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "Question text",
      "options": ["A. option1", "B. option2", "C. option3", "D. option4"],
      "answer": "B",
      "analysis": "解析（中文）",
      "evidence": "原文依据"
    },
    {
      "id": 2,
      "type": "fill_blank",
      "question": "Fill in the blank: The boy _____ to school every day.",
      "answer": "walks",
      "analysis": "解析（中文）",
      "evidence": "原文依据"
    }
  ],
  "vocabulary": [
    {"word": "vocabulary", "phonetic": "/vəˈkæbjəlɛri/", "meaning": "词汇", "example": "Example sentence"}
  ]
}`,
        },
        {
            role: "user" as const,
            content: `Generate an English reading comprehension exercise for a ${grade} student.`,
        },
    ];
}

export function getEnglishReadingGradingPrompt(
    questionText: string,
    studentAnswer: string,
    correctAnswer: string,
    questionType: string
) {
    return [
        {
            role: "system" as const,
            content: `You are an English teacher grading a student's reading comprehension answer.
Provide feedback IN CHINESE for a Chinese student.

Output STRICTLY in this JSON format:
{
  "score": 0-100,
  "is_correct": true/false,
  "comment": "中文点评",
  "correct_answer": "正确答案",
  "explanation": "中文解析"
}`,
        },
        {
            role: "user" as const,
            content: `Question type: ${questionType}
Question: ${questionText}
Correct answer: ${correctAnswer}
Student's answer: ${studentAnswer}

Please grade this answer.`,
        },
    ];
}
