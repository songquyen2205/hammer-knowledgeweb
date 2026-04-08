import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

type AskResult = {
  answer: string
  source: 'remote-model' | 'local-fallback'
}

const buildPrompt = (question: string, groundingContext: string) => {
  return [
    'Ban la tro ly tri thuc noi bo cua Hammer.',
    'Chi tra loi dua tren grounding context duoi day.',
    'Neu chua co thong tin xac nhan, phai ghi ro (Giả định).',
    '',
    'GROUNDING:',
    groundingContext,
    '',
    `QUESTION: ${question}`,
  ].join('\n')
}

const extractAnswer = (payload: any) => {
  if (typeof payload?.answer === 'string') return payload.answer
  if (typeof payload?.data?.answer === 'string') return payload.data.answer
  if (typeof payload?.output_text === 'string') return payload.output_text
  if (Array.isArray(payload?.choices) && payload.choices[0]?.message?.content) {
    return String(payload.choices[0].message.content)
  }
  return ''
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<AskResult>) {
  if (req.method !== 'POST') {
    res.status(405).json({
      answer: 'Method not allowed',
      source: 'local-fallback',
    })
    return
  }

  const question = String(req.body?.question || '').trim()
  const groundingContext = String(req.body?.groundingContext || '').trim()

  if (!question) {
    res.status(400).json({ answer: 'Question is required', source: 'local-fallback' })
    return
  }

  const modelUrl = process.env.KNOWLEDGE_MODEL_URL
  const modelToken = process.env.KNOWLEDGE_MODEL_TOKEN

  if (!modelUrl || !modelToken) {
    res.status(200).json({
      answer: 'Model API chua cau hinh. Client se dung fallback local rule-based.',
      source: 'local-fallback',
    })
    return
  }

  try {
    const response = await axios.post(
      modelUrl,
      {
        prompt: buildPrompt(question, groundingContext),
        question,
        groundingContext,
      },
      {
        headers: {
          Authorization: `Bearer ${modelToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    )

    const answer = extractAnswer(response.data)
    if (!answer) {
      res.status(200).json({
        answer: 'Model API khong tra ve cau tra loi hop le. Client se fallback local.',
        source: 'local-fallback',
      })
      return
    }

    res.status(200).json({ answer, source: 'remote-model' })
  } catch {
    res.status(200).json({
      answer: 'Model API loi hoac timeout. Client se fallback local.',
      source: 'local-fallback',
    })
  }
}
