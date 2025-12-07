import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error: 'API temporarily disabled' }, { status: 503 })
}