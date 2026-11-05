import { createClient } from '@/lib/supabase/server'

export type BrandingDefault = 'logo' | 'headshot' | 'both' | 'none'

export type ProfessionalProfile = {
  full_name: string
  company: string
  nmls: string
  company_nmls: string
  phone: string
  email: string
  website: string
  business_address: string
  license_state: string
  license_number: string
  tagline: string
  disclosure: string
  logo_url: string
  headshot_url: string
  branding_default: BrandingDefault
}

export const emptyProfessionalProfile: ProfessionalProfile = {
  full_name: '', company: '', nmls: '', company_nmls: '', phone: '', email: '',
  website: '', business_address: '', license_state: '', license_number: '',
  tagline: '', disclosure: '', logo_url: '', headshot_url: '', branding_default: 'logo'
}

/** Read the current user's common branding for server-rendered forms and exports.
 * The caller's authenticated Supabase session enforces ownership through RLS.
 */
export async function getProfessionalProfile(): Promise<ProfessionalProfile> {
  const db = await createClient()
  const { data: { user }, error:authError } = await db.auth.getUser()
  if (authError || !user) throw new Error('Authentication required')
  const { data, error } = await db.from('toolbox_profiles').select('*').eq('user_id',user.id).maybeSingle()
  if (error) throw new Error('Unable to load professional profile')
  return { ...emptyProfessionalProfile, ...(data ?? {}) }
}

export function visibleBrandImages(profile:ProfessionalProfile, override?:BrandingDefault) {
  const preference = override ?? profile.branding_default
  return {
    logo: (preference === 'logo' || preference === 'both') ? profile.logo_url : '',
    headshot: (preference === 'headshot' || preference === 'both') ? profile.headshot_url : ''
  }
}
