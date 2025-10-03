import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface VerifyRequest {
  token: string;
  type: 'email' | 'phone' | 'totp' | 'magic_link';
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      });
    }

    const { token, type } = await req.json() as VerifyRequest;

    // Validate required parameters
    if (!token || !type) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Verify token
    const { data: userId } = await supabase.rpc('verify_token', {
      token_param: token,
      type_param: type
    });

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Get user information
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // Create device record
    const userAgent = req.headers.get('user-agent') || '';
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || '';
    
    const { data: deviceData } = await supabase.rpc('create_device', {
      name_param: getBrowserName(userAgent),
      type_param: getDeviceType(userAgent),
      browser_param: getBrowserName(userAgent),
      os_param: getOSName(userAgent),
      ip_param: clientIp
    });

    const deviceId = deviceData as string;

    // Generate session tokens
    const { data: session, error: sessionError } = await supabase.auth.admin.createSession({
      user_id: userId,
      expires_in: 604800 // 7 days
    });

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: 'Failed to create session' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Store refresh token in database
    await supabase.rpc('create_session', {
      device_id_param: deviceId,
      refresh_token_param: session.refresh_token,
      expires_in_seconds: 604800
    });

    return new Response(JSON.stringify({
      success: true,
      session: {
        user: {
          id: userData.user.id,
          email: userData.user.email,
          name: userData.user.user_metadata?.name,
          avatarUrl: userData.user.user_metadata?.avatar_url,
          role: 'user',
          emailVerified: !!userData.user.email_confirmed_at
        },
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: Math.floor(Date.now() / 1000) + session.expires_in,
        provider: 'email',
        deviceId,
        lastActive: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Helper functions for device detection
function getBrowserName(userAgent: string): string {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) return 'Internet Explorer';
  return 'Unknown Browser';
}

function getOSName(userAgent: string): string {
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac OS')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  return 'Unknown OS';
}

function getDeviceType(userAgent: string): string {
  if (userAgent.includes('Mobile')) return 'mobile';
  if (userAgent.includes('Tablet') || userAgent.includes('iPad')) return 'tablet';
  return 'desktop';
}