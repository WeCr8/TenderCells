import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.38.4';
import { SmtpClient } from 'npm:@orama/smtp-client@1.0.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface MagicLinkRequest {
  email: string;
  redirectUrl: string;
  createUser?: boolean;
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

    const { email, redirectUrl, createUser = false } = await req.json() as MagicLinkRequest;

    // Validate required parameters
    if (!email || !redirectUrl) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Check if user exists
    const { data: existingUser } = await supabase.auth.admin.listUsers({
      filters: {
        email: email
      }
    });

    const userExists = existingUser && existingUser.users.length > 0;

    if (!userExists && !createUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // Generate verification token
    const { data: tokenData } = await supabase.rpc('create_verification_token', {
      email_param: email,
      type_param: 'magic_link',
      expires_in_seconds: 3600 // 1 hour
    });

    const token = tokenData as string;
    if (!token) {
      return new Response(JSON.stringify({ error: 'Failed to generate token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Send magic link email
    const magicLinkUrl = `${redirectUrl}?token=${token}&type=magic_link`;
    await sendMagicLinkEmail(email, magicLinkUrl);

    return new Response(JSON.stringify({ success: true }), {
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

async function sendMagicLinkEmail(email: string, magicLinkUrl: string) {
  const smtpHost = Deno.env.get('SMTP_HOST') || '';
  const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587');
  const smtpUser = Deno.env.get('SMTP_USER') || '';
  const smtpPass = Deno.env.get('SMTP_PASS') || '';
  const fromEmail = Deno.env.get('FROM_EMAIL') || 'no-reply@chickentender.com';
  const appName = 'Chicken Tender';

  const smtp = new SmtpClient({
    connection: {
      hostname: smtpHost,
      port: smtpPort,
      tls: true,
      auth: {
        username: smtpUser,
        password: smtpPass,
      },
    },
  });

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f772d;">Sign in to ${appName}</h2>
      <p>Click the link below to sign in to your account. This link will expire in 1 hour.</p>
      <a href="${magicLinkUrl}" style="display: inline-block; background-color: #4f772d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 20px 0;">Sign In</a>
      <p>If you didn't request this email, you can safely ignore it.</p>
      <p>Thanks,<br>The ${appName} Team</p>
    </div>
  `;

  await smtp.send({
    from: `${appName} <${fromEmail}>`,
    to: email,
    subject: `Sign in to ${appName}`,
    content: 'Please use an email client that supports HTML content.',
    html: emailContent,
  });

  await smtp.close();
}