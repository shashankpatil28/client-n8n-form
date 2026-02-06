import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get n8n webhook URL from environment
    const webhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error('Missing N8N_WEBHOOK_URL environment variable');
      return NextResponse.json(
        { error: 'Webhook URL not configured' },
        { status: 500 }
      );
    }

    console.log('Forwarding contract submission to n8n webhook...');
    console.log('Webhook URL:', webhookUrl);

    // Forward request to n8n webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('n8n response status:', response.status);

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMessage = response.statusText;

      try {
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } else {
          // HTML or other response - just get first 200 chars
          const errorText = await response.text();
          if (errorText.includes('Blocked Access') || errorText.includes('Warning - Restricted')) {
            errorMessage = 'Webhook blocked by firewall/proxy. Please check network access.';
          } else if (errorText.length < 200) {
            errorMessage = errorText;
          }
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
      }

      console.error('n8n webhook returned error:', response.status, errorMessage);

      // Return user-friendly error based on status code
      let friendlyMessage = errorMessage;
      if (response.status === 403) {
        friendlyMessage = 'n8n workflow is not active or webhook access is forbidden. Please activate the workflow in n8n.';
      } else if (response.status === 404) {
        friendlyMessage = 'n8n webhook not found. Please check the webhook URL configuration.';
      } else if (response.status >= 500) {
        friendlyMessage = 'n8n server error. Please try again or check n8n workflow logs.';
      }

      return NextResponse.json(
        {
          error: 'Webhook submission failed',
          message: friendlyMessage,
          status: response.status,
        },
        { status: 500 } // Always return 500 to client
      );
    }

    const data = await response.json();
    console.log('Contract submission successful');

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error submitting contract:', error);
    return NextResponse.json(
      {
        error: 'Failed to submit contract',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
