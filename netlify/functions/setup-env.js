const { Handler } = require('@netlify/functions');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // בדיקת משתני סביבה
    const envVars = {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      DATABASE_URL: process.env.DATABASE_URL,
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
      NETLIFY_DEV: process.env.NETLIFY_DEV,
      NODE_ENV: process.env.NODE_ENV,
    };

    // בדיקה אילו משתנים חסרים
    const missingVars = [];
    const presentVars = [];

    Object.entries(envVars).forEach(([key, value]) => {
      if (!value || value === 'undefined') {
        missingVars.push(key);
      } else {
        presentVars.push({
          key,
          value: key.includes('KEY') || key.includes('URL') ? 
            value.substring(0, 20) + '...' : value // מסתיר ערכים רגישים
        });
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Environment variables check completed',
        summary: {
          total: Object.keys(envVars).length,
          present: presentVars.length,
          missing: missingVars.length
        },
        presentVars,
        missingVars,
        instructions: {
          hebrew: 'להגדרת משתני סביבה: Site Settings > Environment Variables',
          english: 'To set environment variables: Site Settings > Environment Variables'
        },
        requiredVars: [
          'SUPABASE_URL=https://zftfilbpeltkbbuzxwus.supabase.co',
          'SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmdGZpbGJwZWx0a2JidXp4d3VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2Mjg1MzgsImV4cCI6MjA2NzIwNDUzOH0.kx0GoSoFOlkTWDXsXWnZyYD62nr-xZea3RQS_N3ZD8M',
          'DATABASE_URL=postgresql://postgres.zftfilbpeltkbbuzxwus:qazwsx1122Q@Q@Q@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
          'VITE_SUPABASE_URL=https://zftfilbpeltkbbuzxwus.supabase.co',
          'VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmdGZpbGJwZWx0a2JidXp4d3VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2Mjg1MzgsImV4cCI6MjA2NzIwNDUzOH0.kx0GoSoFOlkTWDXsXWnZyYD62nr-xZea3RQS_N3ZD8M'
        ]
      }),
    };
  } catch (error) {
    console.error('Error checking environment variables:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
}; 