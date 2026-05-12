import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEMO_EMAIL = "demo@radareleitoral.com.br";
const DEMO_PASSWORD = "demo123456";
const DEMO_TENANT_NAME = "Gabinete Demonstração";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if demo user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const demoUser = existingUsers?.users?.find((u) => u.email === DEMO_EMAIL);

    if (demoUser) {
      // Demo user exists - just return credentials
      return new Response(
        JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD, message: "Demo já configurado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create demo user
    const { data: newUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Usuário Demo" },
    });

    if (userError) throw userError;
    const userId = newUser.user.id;

    // Wait a moment for the trigger to create tenant/profile
    await new Promise((r) => setTimeout(r, 2000));

    // Get the tenant created by the trigger
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("tenant_id")
      .eq("user_id", userId)
      .single();

    if (!profile?.tenant_id) throw new Error("Tenant not created");
    const tenantId = profile.tenant_id;

    // Activate tenant for demo
    await supabaseAdmin
      .from("tenants")
      .update({ name: DEMO_TENANT_NAME, status: "ativo", contact_limit: 10000 })
      .eq("id", tenantId);

    // Create demo subscription so system doesn't block
    await supabaseAdmin.from("subscriptions").insert({
      tenant_id: tenantId,
      user_id: userId,
      plan_name: "Demonstração",
      status: "active",
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // Insert demo contacts
    const contacts = [
      { name: "Maria Silva", phone: "(69) 99812-3456", neighborhood: "Centro", city: "Boa Vista", state: "RR", engagement: "conquistado", is_leader: true, gender: "feminino", email: "maria@demo.com", tenant_id: tenantId },
      { name: "João Pereira", phone: "(69) 99834-5678", neighborhood: "Vila Nova", city: "Boa Vista", state: "RR", engagement: "em_prospeccao", is_leader: false, gender: "masculino", email: "joao@demo.com", tenant_id: tenantId },
      { name: "Ana Costa", phone: "(69) 99856-7890", neighborhood: "Jardim América", city: "Boa Vista", state: "RR", engagement: "criando_envolvimento", is_leader: true, gender: "feminino", email: "ana@demo.com", tenant_id: tenantId },
      { name: "Carlos Souza", phone: "(69) 99878-9012", neighborhood: "São José", city: "Boa Vista", state: "RR", engagement: "conquistado", is_leader: false, gender: "masculino", email: "carlos@demo.com", tenant_id: tenantId },
      { name: "Fernanda Lima", phone: "(69) 99890-1234", neighborhood: "Boa Vista", city: "Boa Vista", state: "RR", engagement: "nao_trabalhado", is_leader: false, gender: "feminino", email: "fernanda@demo.com", tenant_id: tenantId },
      { name: "Roberto Santos", phone: "(69) 99801-2345", neighborhood: "Caimbé", city: "Boa Vista", state: "RR", engagement: "conquistado", is_leader: true, gender: "masculino", email: "roberto@demo.com", tenant_id: tenantId },
      { name: "Patricia Oliveira", phone: "(69) 99823-4567", neighborhood: "Mecejana", city: "Boa Vista", state: "RR", engagement: "em_prospeccao", is_leader: false, gender: "feminino", email: "patricia@demo.com", tenant_id: tenantId },
      { name: "Marcos Almeida", phone: "(69) 99845-6789", neighborhood: "Pintolândia", city: "Boa Vista", state: "RR", engagement: "criando_envolvimento", is_leader: false, gender: "masculino", email: "marcos@demo.com", tenant_id: tenantId },
      { name: "Luciana Ferreira", phone: "(69) 99867-8901", neighborhood: "Aparecida", city: "Boa Vista", state: "RR", engagement: "conquistado", is_leader: false, gender: "feminino", email: "luciana@demo.com", tenant_id: tenantId },
      { name: "Pedro Nascimento", phone: "(69) 99889-0123", neighborhood: "Buritis", city: "Boa Vista", state: "RR", engagement: "falta_trabalhar", is_leader: true, gender: "masculino", email: "pedro@demo.com", tenant_id: tenantId },
    ];

    const { data: insertedContacts } = await supabaseAdmin.from("contacts").insert(contacts).select("id, name, is_leader");

    // Create leaders from leader contacts
    if (insertedContacts) {
      const leaderContacts = insertedContacts.filter((c) => c.is_leader);
      for (const lc of leaderContacts) {
        await supabaseAdmin.from("leaders").insert({
          contact_id: lc.id,
          tenant_id: tenantId,
          total_contacts: Math.floor(Math.random() * 50) + 20,
          engagement_score: Math.floor(Math.random() * 40) + 60,
        });
      }
    }

    // Insert demo demands
    const contactIds = insertedContacts?.map((c) => c.id) || [];
    await supabaseAdmin.from("demands").insert([
      { title: "Conserto de bueiro na Rua Principal", description: "Bueiro entupido causando alagamento", status: "aberta", priority: "alta", tenant_id: tenantId, contact_id: contactIds[0] },
      { title: "Iluminação pública na Vila Nova", description: "Lâmpadas queimadas na rua principal", status: "em_andamento", priority: "normal", tenant_id: tenantId, contact_id: contactIds[1] },
      { title: "Limpeza de terreno baldio", description: "Terreno com mato alto e lixo acumulado", status: "concluida", priority: "baixa", tenant_id: tenantId, contact_id: contactIds[2] },
      { title: "Instalação de lombada na Av. Norte", description: "Veículos em alta velocidade", status: "aberta", priority: "alta", tenant_id: tenantId, contact_id: contactIds[3] },
      { title: "Poda de árvores no Jardim América", description: "Galhos interferindo na fiação", status: "em_andamento", priority: "normal", tenant_id: tenantId, contact_id: contactIds[4] },
    ]);

    // Insert demo appointments
    const now = new Date();
    await supabaseAdmin.from("appointments").insert([
      { title: "Reunião com líderes do Centro", start_time: new Date(now.getTime() + 86400000).toISOString(), status: "confirmado", tenant_id: tenantId, created_by: userId, location: "Sede da Campanha" },
      { title: "Visita à comunidade Vila Nova", start_time: new Date(now.getTime() + 86400000 * 2).toISOString(), status: "a_confirmar", tenant_id: tenantId, created_by: userId, location: "Associação Vila Nova" },
      { title: "Encontro com moradores Boa Vista", start_time: new Date(now.getTime() + 86400000 * 3).toISOString(), status: "confirmado", tenant_id: tenantId, created_by: userId, location: "Praça Central" },
    ]);

    // Insert demo campaign
    await supabaseAdmin.from("campaigns").insert({
      nome_campanha: "Campanha Demo 2026",
      cargo: "vereador",
      cidade: "Boa Vista",
      estado: "RR",
      partido: "DEMO",
      numero: "12345",
      meta_votos: 10000,
      limite_gastos: 200000,
      status: "pre_campanha",
      tenant_id: tenantId,
    });

    // Insert demo donations & expenses
    await supabaseAdmin.from("donations").insert([
      { nome_doador: "Maria Silva", valor: 500, forma_pagamento: "PIX", tipo: "PF", tenant_id: tenantId },
      { nome_doador: "Empresa ABC Ltda", valor: 5000, forma_pagamento: "Transferência", tipo: "PJ", tenant_id: tenantId },
      { nome_doador: "Carlos Souza", valor: 200, forma_pagamento: "PIX", tipo: "PF", tenant_id: tenantId },
    ]);

    await supabaseAdmin.from("expenses").insert([
      { descricao: "Santinhos 10.000 un", valor: 1200, categoria: "Material gráfico", tenant_id: tenantId },
      { descricao: "Combustível veículos", valor: 800, categoria: "Transporte", tenant_id: tenantId },
      { descricao: "Aluguel sede campanha", valor: 2500, categoria: "Infraestrutura", tenant_id: tenantId },
    ]);

    // Insert demo vehicles
    await supabaseAdmin.from("vehicles").insert([
      { plate: "ABC-1D23", brand: "Fiat", model: "Strada", year: 2023, color: "Branca", status: "disponivel", driver_name: "Carlos Souza", tenant_id: tenantId },
      { plate: "DEF-4G56", brand: "Honda", model: "CG 160", year: 2024, color: "Preta", status: "em_uso", driver_name: "João Pereira", tenant_id: tenantId },
    ]);

    // Insert demo materials
    await supabaseAdmin.from("campaign_materials").insert([
      { name: "Santinhos 10x15", type: "Impresso", quantity: 50000, quantity_distributed: 32000, storage_location: "Galpão Central", tenant_id: tenantId },
      { name: "Adesivos para carro", type: "Adesivo", quantity: 5000, quantity_distributed: 3200, storage_location: "Sede", tenant_id: tenantId },
      { name: "Bandeiras 2m", type: "Bandeira", quantity: 200, quantity_distributed: 145, storage_location: "Galpão Central", tenant_id: tenantId },
    ]);

    // Insert demo visit requests
    await supabaseAdmin.from("visit_requests").insert([
      { title: "Visita ao Bairro São José", description: "Reunião com moradores", requested_by: userId, tenant_id: tenantId, status: "pendente", needs_sound: true, chairs_needed: 50 },
      { title: "Evento na Praça Central", description: "Evento comunitário", requested_by: userId, tenant_id: tenantId, status: "aprovada", needs_sound: true, chairs_needed: 100 },
    ]);

    return new Response(
      JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD, message: "Demo configurado com sucesso!" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
