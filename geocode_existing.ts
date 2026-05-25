import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

async function geocodeContact(contact: any) {
  console.log(`Geocoding contact: ${contact.name}`)
  const { data, error } = await supabase.functions.invoke('geocode-cep', {
    body: { 
      cep: contact.cep,
      address: contact.address,
      city: contact.city,
      state: contact.state
    }
  })

  if (error || !data || !data.latitude) {
    console.error(`Failed to geocode ${contact.name}:`, error || data?.error)
    return
  }

  const { error: updateError } = await supabase
    .from('contacts')
    .update({ 
      latitude: data.latitude, 
      longitude: data.longitude,
      // Also update address if we got it and it was missing
      address: contact.address || data.address,
      neighborhood: contact.neighborhood || data.neighborhood
    })
    .eq('id', contact.id)

  if (updateError) {
    console.error(`Failed to update ${contact.name}:`, updateError)
  } else {
    console.log(`Successfully geocoded ${contact.name}`)
  }
}

async function main() {
  const { data: contacts, error } = await supabase
    .from('contacts_decrypted')
    .select('*')
    .is('deleted_at', null)
    .or('latitude.is.null,longitude.is.null')

  if (error) {
    console.error('Error fetching contacts:', error)
    return
  }

  console.log(`Found ${contacts?.length} contacts to geocode`)

  for (const contact of (contacts || [])) {
    await geocodeContact(contact)
  }
}

main()
