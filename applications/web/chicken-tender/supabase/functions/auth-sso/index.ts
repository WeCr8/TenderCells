import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface SSORequest {
  provider: string;
  code_challenge: string;
  code_challenge_method: string;
  state: string;
  redirect_uri: string;
  scopes?: string[];
}

interface SSOCallbackRequest {
  provider: string;
  code: string;
  code_verifier: string;
  redirect_uri: string;
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

    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean);
    
    // Handle SSO initiation
    if (path[2] && !path[3]) {
      if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 405,
        });
      }

      const provider = path[2];
      const { code_challenge, code_challenge_method, state, redirect_uri, scopes } = await req.json() as SSORequest;

      // Validate required parameters
      if (!code_challenge || !state || !redirect_uri) {
        return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      // Get provider-specific configuration
      const providerConfig = getProviderConfig(provider);
      if (!providerConfig) {
        return new Response(JSON.stringify({ error: 'Unsupported provider' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      // Build authorization URL
      const authUrl = buildAuthorizationUrl(
        providerConfig,
        code_challenge,
        code_challenge_method,
        state,
        redirect_uri,
        scopes
      );

      return new Response(JSON.stringify({ url: authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    
    // Handle SSO callback
    if (path[2] && path[3] === 'callback') {
      if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 405,
        });
      }

      const provider = path[2];
      const { code, code_verifier, redirect_uri } = await req.json() as SSOCallbackRequest;

      // Validate required parameters
      if (!code || !code_verifier || !redirect_uri) {
        return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      // Get provider-specific configuration
      const providerConfig = getProviderConfig(provider);
      if (!providerConfig) {
        return new Response(JSON.stringify({ error: 'Unsupported provider' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      // Exchange code for tokens
      const tokenResponse = await exchangeCodeForTokens(
        providerConfig,
        code,
        code_verifier,
        redirect_uri
      );

      if (!tokenResponse.access_token) {
        return new Response(JSON.stringify({ error: 'Failed to exchange code for tokens' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      // Get user profile from provider
      const userProfile = await getUserProfile(providerConfig, tokenResponse.access_token);

      if (!userProfile.email) {
        return new Response(JSON.stringify({ error: 'Failed to get user profile' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      // Check if user exists
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userProfile.email)
        .single();

      let userId;

      if (userError || !existingUser) {
        // Create new user
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: userProfile.email,
          email_confirm: true,
          user_metadata: {
            name: userProfile.name,
            avatar_url: userProfile.picture,
            provider
          }
        });

        if (createError || !newUser.user) {
          return new Response(JSON.stringify({ error: 'Failed to create user' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          });
        }

        userId = newUser.user.id;
      } else {
        userId = existingUser.id;
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
            id: userId,
            email: userProfile.email,
            name: userProfile.name,
            avatarUrl: userProfile.picture,
            role: 'user',
            emailVerified: true
          },
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          expiresAt: Math.floor(Date.now() / 1000) + session.expires_in,
          provider,
          deviceId,
          lastActive: new Date().toISOString()
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404,
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Provider configuration
function getProviderConfig(provider: string) {
  const configs = {
    google: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
      clientId: Deno.env.get('GOOGLE_CLIENT_ID'),
      clientSecret: Deno.env.get('GOOGLE_CLIENT_SECRET'),
      scope: 'openid email profile',
    },
    apple: {
      authUrl: 'https://appleid.apple.com/auth/authorize',
      tokenUrl: 'https://appleid.apple.com/auth/token',
      userInfoUrl: '', // Apple doesn't have a userinfo endpoint
      clientId: Deno.env.get('APPLE_CLIENT_ID'),
      clientSecret: Deno.env.get('APPLE_CLIENT_SECRET'),
      scope: 'name email',
    },
    microsoft: {
      authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
      clientId: Deno.env.get('MICROSOFT_CLIENT_ID'),
      clientSecret: Deno.env.get('MICROSOFT_CLIENT_SECRET'),
      scope: 'openid email profile User.Read',
    },
    github: {
      authUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userInfoUrl: 'https://api.github.com/user',
      clientId: Deno.env.get('GITHUB_CLIENT_ID'),
      clientSecret: Deno.env.get('GITHUB_CLIENT_SECRET'),
      scope: 'read:user user:email',
    },
  };

  return configs[provider];
}

// Build authorization URL
function buildAuthorizationUrl(
  config: any,
  codeChallenge: string,
  codeChallengeMethod: string,
  state: string,
  redirectUri: string,
  scopes?: string[]
) {
  const url = new URL(config.authUrl);
  url.searchParams.append('client_id', config.clientId);
  url.searchParams.append('redirect_uri', redirectUri);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('code_challenge', codeChallenge);
  url.searchParams.append('code_challenge_method', codeChallengeMethod);
  url.searchParams.append('state', state);
  url.searchParams.append('scope', scopes?.join(' ') || config.scope);

  return url.toString();
}

// Exchange code for tokens
async function exchangeCodeForTokens(
  config: any,
  code: string,
  codeVerifier: string,
  redirectUri: string
) {
  const params = new URLSearchParams();
  params.append('client_id', config.clientId);
  params.append('client_secret', config.clientSecret);
  params.append('code', code);
  params.append('code_verifier', codeVerifier);
  params.append('redirect_uri', redirectUri);
  params.append('grant_type', 'authorization_code');

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: params.toString(),
  });

  return await response.json();
}

// Get user profile from provider
async function getUserProfile(config: any, accessToken: string) {
  // Apple doesn't have a userinfo endpoint, so we need to decode the ID token
  if (!config.userInfoUrl) {
    // For Apple, we would decode the ID token here
    // This is a simplified implementation
    return {
      email: 'user@example.com',
      name: 'Apple User',
      picture: null,
    };
  }

  const response = await fetch(config.userInfoUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  // Normalize user profile data
  return {
    email: data.email,
    name: data.name || `${data.given_name || ''} ${data.family_name || ''}`.trim(),
    picture: data.picture || data.avatar_url,
  };
}

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