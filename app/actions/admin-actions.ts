"use server"

import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { sendEmail, getInviteEmailTemplate } from "@/lib/email"

/**
 * Generates a random alphanumeric string for the link ID
 */
function generateLinkId(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Generates a unique test link for a registered candidate
 */
export async function generateTestLinkAction(registrationId: string, domain: string) {
  const session = await getSession()
  if (!session || !session.admin) {
    return { success: false, error: "Unauthorized" }
  }

  const supabase = await createClient()
  
  // 1. Generate unique link ID
  const link_id = generateLinkId(20)
  
  // 2. Set expiry (1 hour from now)
  const expires_at = new Date()
  expires_at.setHours(expires_at.getHours() + 1)

  // 3. Insert into test_sessions
  const { error: sessionError } = await supabase
    .from("test_sessions")
    .insert({
      registration_id: registrationId,
      link_id,
      domain,
      expires_at: expires_at.toISOString(),
    })

  if (sessionError) {
    console.error("Error generating test link:", sessionError)
    // Check if it's a constraint error (e.g. session already exists)
    if (sessionError.code === '23505') {
       return { success: false, error: "A test link already exists for this registration." }
    }
    return { success: false, error: "Failed to create test session in database." }
  }

  // 4. Update registration status
  const { error: regError } = await supabase
    .from("registrations")
    .update({ status: 'invited' })
    .eq("id", registrationId)

  if (regError) {
    console.error("Error updating registration status:", regError)
    // IMPORTANT: Return failure if status update failed, so admin knows
    return { 
      success: false, 
      error: `Link created, but failed to update candidate status: ${regError.message}. Code: ${regError.code}` 
    }
  }

  revalidatePath("/admin")
  return { success: true, linkId: link_id }
}

/**
 * Fetches all test sessions with candidate details
 */
export async function getTestSessionsAction() {
  const session = await getSession()
  if (!session || !session.admin) {
    throw new Error("Unauthorized")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("test_sessions")
    .select(`
      *,
      registrations (
        full_name,
        email,
        campus_id,
        status,
        answers
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching test sessions:", error)
    throw error
  }
  return data
}

/**
 * Deletes a test session
 */
export async function deleteTestSessionAction(sessionId: string, registrationId?: string) {
  const session = await getSession()
  if (!session || !session.admin) {
    return { success: false, error: "Unauthorized" }
  }

  const supabase = await createClient()
  
  const { error } = await supabase
    .from("test_sessions")
    .delete()
    .eq("id", sessionId)

  if (error) return { success: false, error: error.message }

  // Optionally reset registration status
  if (registrationId) {
    await supabase
      .from("registrations")
      .update({ status: 'registered' })
      .eq("id", registrationId)
  }

  revalidatePath("/admin")
  return { success: true }
}

/**
 * Deletes a candidate registration and any associated test sessions
 */
export async function deleteRegistrationAction(registrationId: string) {
  const session = await getSession()
  if (!session || !session.admin) {
    return { success: false, error: "Unauthorized" }
  }

  const supabase = await createClient()

  console.log(`[DELETE] Attempting to delete registration: ${registrationId}`)

  // 1. Delete associated test sessions first (to handle FK constraints)
  const { data: sessions, error: sessionError } = await supabase
    .from("test_sessions")
    .delete()
    .eq("registration_id", registrationId)
    .select()

  if (sessionError) {
    console.error(`[DELETE] Error deleting test sessions:`, sessionError)
    return { success: false, error: `Database Error (Sessions): ${sessionError.message}` }
  }

  console.log(`[DELETE] Successfully deleted ${sessions?.length || 0} associated test sessions.`)

  // 2. Delete the registration
  const { error: regError } = await supabase
    .from("registrations")
    .delete()
    .eq("id", registrationId)

  if (regError) {
    console.error(`[DELETE] Error deleting registration:`, regError)
    return { success: false, error: `Database Error (Registration): ${regError.message}` }
  }

  console.log(`[DELETE] Successfully deleted registration: ${registrationId}`)
  revalidatePath("/admin")
  return { success: true }
}

/**
 * Sends an individual invite email to a candidate
 */
export async function sendInviteEmailAction(registrationId: string) {
  const session = await getSession()
  if (!session || !session.admin) {
    return { success: false, error: "Unauthorized" }
  }

  const supabase = await createClient()

  // 1. Fetch registration details
  const { data: reg, error: regError } = await supabase
    .from("registrations")
    .select("*")
    .eq("id", registrationId)
    .single()

  if (regError || !reg) {
    return { success: false, error: "Registration not found" }
  }

  // Removed safety filter for Test User to enable production candidate invites

  // 3. Get or generate test link
  let linkId = ""
  const { data: testSession } = await supabase
    .from("test_sessions")
    .select("link_id")
    .eq("registration_id", registrationId)
    .maybeSingle()

  if (testSession) {
    linkId = testSession.link_id
  } else {
    const res = await generateTestLinkAction(registrationId, reg.domain)
    if (!res.success) return res
    linkId = res.linkId!
  }

  // 4. Send email
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const testLink = `${baseUrl}/test/${linkId}`
  const html = getInviteEmailTemplate(reg.full_name, reg.domain, testLink)
  
  const emailRes = await sendEmail({
    to: reg.email,
    subject: `(New v1.1) Assessment Invite: ${reg.domain} Role | Yentech`,
    html,
  })

  if (!emailRes.success) {
    return { success: false, error: `Email failed: ${emailRes.error}` }
  }

  return { success: true }
}

/**
 * Bulk sends invite emails to all candidates (filtered for Test User currently)
 */
export async function bulkSendExamLinksAction() {
  const session = await getSession()
  if (!session || !session.admin) {
    return { success: false, error: "Unauthorized" }
  }

  const supabase = await createClient()

  // 1. Fetch all registrations
  const { data: registrations, error } = await supabase
    .from("registrations")
    .select("*")

  if (error) return { success: false, error: error.message }

  // 2. Filter for candidates who are in 'registered' status (not yet invited or completed)
  const targets = (registrations || []).filter(
    r => r.status === 'registered'
  )

  if (targets.length === 0) {
    return { success: false, error: "No matching Test User found (Test User / triallogin18@gmail.com)" }
  }

  let count = 0
  for (const reg of targets) {
    const res = await sendInviteEmailAction(reg.id)
    if (res.success) count++
  }

  revalidatePath("/admin")
  return { success: true, summary: `Successfully shared links with ${count} candidate(s).` }
}
