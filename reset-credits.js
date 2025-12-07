// reset-credits.js
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function resetCredits() {
  try {
    console.log('🔄 Starting credits reset...\n')
    
    // Show before state
    const { data: before } = await supabase
      .from('users')
      .select('email, credits')
    
    console.log('📋 Before:')
    console.table(before)

    // Reset all credits to 500 and creditsLimit to 500
    const { data, error } = await supabase
      .from('users')
      .update({ credits: 500, creditsLimit: 500 })
      .not('id', 'is', null) // Update everyone
      .select() // CRITICAL: Must have .select() to return data

    if (error) {
      console.error('❌ Error:', error)
      throw error
    }

    console.log(`\n✅ Reset ${data.length} users to 500 credits\n`)
    
    console.log('📋 After:')
    console.table(data.map(u => ({ 
      email: u.email, 
      credits: u.credits 
    })))
    
  } catch (error) {
    console.error('❌ Failed:', error)
    process.exit(1)
  }
}

resetCredits()