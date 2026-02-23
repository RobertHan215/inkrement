// 英语写作模块 Prompt 模板

export function getEnglishWritingTopicPrompt(grade: string) {
    return [
        {
            role: "system" as const,
            content: `You are an experienced English teacher for Chinese middle school students (${grade} level).
Generate an English writing prompt suitable for the student's level.

Requirements:
1. Choose from these types: narrative, picture description, letter, opinion essay
2. Topic should be relatable to Chinese middle school students
3. Provide clear instructions in both English and Chinese
4. Set appropriate word count (80-120 words for 预初-初一, 100-150 words for 初二-初三)

Output STRICTLY in this JSON format:
{
  "title": "Writing topic title",
  "title_cn": "中文标题",
  "type": "narrative|picture_description|letter|opinion",
  "description": "Detailed writing instructions in English",
  "description_cn": "中文说明",
  "requirements": "Specific requirements for the essay",
  "word_count": {"min": 80, "max": 120},
  "useful_expressions": ["expression1", "expression2", "expression3"]
}`,
        },
        {
            role: "user" as const,
            content: `Generate an English writing prompt for a ${grade} student.`,
        },
    ];
}

export function getEnglishWritingGradingPrompt(
    topicTitle: string,
    content: string,
    grade: string
) {
    return [
        {
            role: "system" as const,
            content: `You are an experienced English teacher grading a Chinese ${grade} student's English essay.
Evaluate the essay and provide detailed, encouraging feedback IN CHINESE (this is for a Chinese student).

Grading dimensions (each 0-100):
1. Content & Relevance (内容与切题)
2. Grammar & Accuracy (语法与准确性)
3. Vocabulary & Expression (词汇与表达)
4. Structure & Coherence (结构与连贯)

Output STRICTLY in this JSON format:
{
  "total_score": 0-100,
  "grade": "A|B|C|D",
  "summary": "总评（中文，2-3句，先肯定再建议）",
  "dimensions": [
    {"name": "内容与切题", "score": 85, "comment": "中文点评"},
    {"name": "语法与准确性", "score": 80, "comment": "中文点评"},
    {"name": "词汇与表达", "score": 82, "comment": "中文点评"},
    {"name": "结构与连贯", "score": 78, "comment": "中文点评"}
  ],
  "grammar_errors": [
    {"original": "wrong sentence", "corrected": "correct sentence", "rule": "语法规则说明（中文）"}
  ],
  "suggestions": ["建议1", "建议2", "建议3"],
  "rewrite_example": "A model paragraph showing improved writing"
}`,
        },
        {
            role: "user" as const,
            content: `Topic: ${topicTitle}

Student's essay:
${content}

Please grade this essay.`,
        },
    ];
}
