import { NextResponse } from "next/server"
import {
  UNGENAI_SYSTEM_PROMPT,
  buildUserPrompt
} from "@/lib/engine/prompt"

export async function POST(req: Request) {
  try {
    const { text, mode } = await req.json()

    if (!text || !mode) {
      return NextResponse.json({ error: "Missing text or mode" }, { status: 400 })
    }

    const userPrompt = buildUserPrompt(text, mode)

    // Correct Cloudflare AI model slug
    const MODEL = "@cf/meta/llama-3-8b-instruct"

    const url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${MODEL}`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: UNGENAI_SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ]
      })
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("CF_AI_ERROR:", result)
      return NextResponse.json(
        { error: "AI request failed", details: result },
        { status: 500 }
      )
    }

    const output =
      result?.result?.response ??
      result?.result?.message ??
      result?.result?.output_text ??
      ""

    return NextResponse.json({
      success: true,
      output
    })

  } catch (err) {
    console.error("UNG_ERROR:", err)
    return NextResponse.json(
      { error: "Engine failure", details: String(err) },
      { status: 500 }
    )
  }
}
