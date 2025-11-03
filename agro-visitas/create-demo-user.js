import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://tzysklyyduyxbbgyjxda.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6eXNrbHl5ZHV5eGJiZ3lqeGRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE4ODUzNiwiZXhwIjoyMDc3NzY0NTM2fQ.pDwdW9M2uE1QxgjYLRiGgGIBbuUVijSgluYfO18zhIg'
)

async function createDemoUser() {
  // Criar usuário demo usando service role key (auto-confirmado)
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'demo@agrovisitas.com',
    password: 'demo123456',
    email_confirm: true // Confirmar email automaticamente
  })
  
  if (error) {
    console.error('Erro ao criar usuário:', error)
  } else {
    console.log('Usuário demo criado com sucesso:', data.user.email)
    console.log('Email confirmado:', data.user.email_confirmed_at)
  }
}

createDemoUser()
