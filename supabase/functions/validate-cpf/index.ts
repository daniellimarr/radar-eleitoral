import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function isValidCpfAlgorithm(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleaned[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleaned[10])) return false;

  return true;
}

export const handler = async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Require authenticated caller and verify JWT to prevent anonymous CPF/PII enumeration
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ valid: false, message: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const token = authHeader.replace('Bearer ', '');
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims?.sub) {
    return new Response(JSON.stringify({ valid: false, message: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { cpf } = await req.json();
    const cleaned = (cpf || '').replace(/\D/g, '');

    if (!isValidCpfAlgorithm(cleaned)) {
      return new Response(JSON.stringify({
        valid: false,
        message: 'CPF inválido. Verifique os dígitos informados.',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Try to validate via Brasil API (free, no key required)
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cpf/v1/${cleaned}`, {
        headers: { 'Accept': 'application/json' },
      });

      if (response.ok) {
        await response.text();
        // Do NOT return holder name (PII from government source)
        return new Response(JSON.stringify({
          valid: true,
          message: 'CPF válido na Receita Federal.',
          source: 'receita_federal',
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // If 404 or other error from Brasil API, the CPF doesn't exist in RF
      if (response.status === 404) {
        await response.text();
        return new Response(JSON.stringify({
          valid: false,
          message: 'CPF não encontrado na Receita Federal.',
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      await response.text();
    } catch {
      // Brasil API unavailable, fall back to algorithmic validation
    }

    // Fallback: algorithmic validation passed
    return new Response(JSON.stringify({
      valid: true,
      message: 'CPF válido (validação algorítmica).',
      source: 'algorithm',
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error validating CPF:', error);
    return new Response(JSON.stringify({
      valid: false,
      message: 'Erro ao validar CPF. Tente novamente.',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
};

if (import.meta.main) {
  Deno.serve(handler);
}
