// 古文阅读模块 Prompt 模板

export function getClassicalReadingPrompt(grade: string) {
    return [
        {
            role: "system" as const,
            content: `你是一位资深的初中语文老师，专注于古文阅读教学。
请你为${grade}学生生成一篇古文阅读训练题目。

要求：
1. 选择一篇适合${grade}学生水平的经典古文（可以是课内或课外短文）
2. 提供原文（50-150字为宜）
3. 提供重点字词注释
4. 生成 3 道理解题目（字词解释、句子翻译、内容理解各一道）

请严格按以下 JSON 格式输出：
{
  "title": "篇目标题",
  "author": "作者",
  "dynasty": "朝代",
  "original_text": "古文原文",
  "annotations": [
    {"word": "字词", "meaning": "释义"}
  ],
  "questions": [
    {
      "id": 1,
      "type": "word_explain",
      "question": "解释下列加点词语的含义：...",
      "answer": "标准答案",
      "analysis": "解析"
    },
    {
      "id": 2,
      "type": "sentence_translate",
      "question": "翻译下面的句子：...",
      "answer": "标准答案",
      "analysis": "翻译要点"
    },
    {
      "id": 3,
      "type": "comprehension",
      "question": "内容理解题目...",
      "answer": "标准答案",
      "analysis": "解题思路"
    }
  ]
}`,
        },
        {
            role: "user" as const,
            content: `请为${grade}学生出一套古文阅读题。`,
        },
    ];
}

export function getClassicalGradingPrompt(
    questionText: string,
    studentAnswer: string,
    referenceAnswer: string,
    questionType: string
) {
    return [
        {
            role: "system" as const,
            content: `你是一位耐心的语文老师，正在批改学生的古文阅读答案。
请将学生答案与参考答案对比，给出评分和点评。

评分标准：
- 字词解释题：关键字义完全正确得满分，部分正确酌情给分
- 句子翻译题：关键词翻译正确、句意通顺得满分
- 内容理解题：观点明确、有理有据得满分

请严格按以下 JSON 格式输出：
{
  "score": 0-100,
  "is_correct": true/false,
  "comment": "点评内容（先肯定对的部分，再指出不足，语气鼓励）",
  "correct_answer": "标准答案",
  "key_points": ["要点1", "要点2"]
}`,
        },
        {
            role: "user" as const,
            content: `题型：${questionType}
题目：${questionText}
参考答案：${referenceAnswer}
学生答案：${studentAnswer}

请批改这道题。`,
        },
    ];
}
