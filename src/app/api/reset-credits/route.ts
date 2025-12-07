// reset-credits.js
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function resetCredits() {
  try {
    console.log('🔄 Starting credits reset via stored procedure...')
    
    const { data, error } = await supabase.rpc('admin_reset_credits')

    if (error) {
      console.error('❌ Error:', error)
      throw error
    }

    console.log(`✅ Successfully reset credits for ${data.length} users`)
    console.log(data)
    
  } catch (error) {
    console.error('❌ Failed:', error)
    process.exit(1)
  }
}

resetCredits()