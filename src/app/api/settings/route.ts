import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user from the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { username, firstName, lastName } = body

    // Validate required fields
    if (!username?.trim()) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    // Check if username is already taken by another user
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username.trim())
      .neq('id', session.user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking username:', checkError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 409 }
      )
    }

    // Update user profile
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        username: username.trim(),
        first_name: firstName?.trim() || null,
        last_name: lastName?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id)
      .select('id, username, first_name, last_name, role')
      .single()

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    // Return the updated user data
    return NextResponse.json({
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        role: updatedUser.role,
        email: session.user.email
      }
    })

  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}