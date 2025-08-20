interface BaseTemplateOptions {
  title: string;
  content: string; // HTML content to inject
  preheader?: string; // Preview text for email clients
  showFooter?: boolean;
}

export function createBaseTemplate({
  title,
  content,
  preheader = "Message from PacDuck at Hungry Fools",
  showFooter = true,
}: BaseTemplateOptions): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset styles */
    body, table, td, p, a, li, blockquote { 
      -webkit-text-size-adjust: 100%; 
      -ms-text-size-adjust: 100%; 
    }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    
    /* Base styles */
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #0a0a0a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #ffffff;
    }
    
    /* Container */
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #1a1a1a;
      border: 1px solid #333333;
    }
    
    /* Header */
    .header {
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
      border-bottom: 1px solid #00ff88;
      padding: 32px 24px;
      text-align: center;
    }
    
    .header .logo {
      font-size: 32px;
      margin-bottom: 8px;
    }
    
    .header .brand {
      color: #00ff88;
      font-size: 24px;
      font-weight: 700;
      margin: 0;
      text-decoration: none;
      font-family: 'Courier New', 'Monaco', 'Lucida Console', monospace;
      text-shadow: 0 0 10px #00ff88;
    }
    
    .header .tagline {
      color: #888888;
      font-size: 14px;
      margin: 4px 0 0 0;
    }
    
    /* Content */
    .content {
      padding: 32px 24px;
      line-height: 1.6;
      color: #ffffff;
    }
    
    .content h1 {
      color: #00ff88;
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 24px 0;
      line-height: 1.2;
      font-family: 'Courier New', 'Monaco', 'Lucida Console', monospace;
    }
    
    .content h2 {
      color: #00ff88;
      font-size: 20px;
      font-weight: 600;
      margin: 32px 0 16px 0;
      line-height: 1.3;
    }
    
    .content h3 {
      color: #ffffff;
      font-size: 18px;
      font-weight: 600;
      margin: 24px 0 12px 0;
    }
    
    .content p {
      margin: 0 0 16px 0;
      color: #ffffff;
    }
    
    .content ul, .content ol {
      margin: 16px 0;
      padding-left: 20px;
      color: #ffffff;
    }
    
    .content li {
      margin: 8px 0;
    }
    
    .content blockquote {
      margin: 24px 0;
      padding: 16px 20px;
      background-color: #2a2a2a;
      border-left: 4px solid #00ff88;
      color: #ffffff;
    }
    
    .content a {
      color: #ffc700;
      text-decoration: none;
    }
    
    .content a:hover {
      color: #00ff88;
      text-decoration: underline;
    }
    
    /* Buttons */
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
      color: #000000 !important;
      text-decoration: none !important;
      padding: 14px 28px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      margin: 16px 0;
      box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
      transition: transform 0.2s ease;
    }
    
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 255, 136, 0.4);
    }
    
    /* Footer */
    .footer {
      background-color: #0a0a0a;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #333333;
    }
    
    .footer p {
      color: #888888;
      font-size: 14px;
      margin: 8px 0;
    }
    
    .footer a {
      color: #ffc700;
      text-decoration: none;
    }
    
    .footer a:hover {
      color: #00ff88;
    }
    
    /* Additional branding elements */
    .vibecoder {
      color: #ffc700;
      font-style: italic;
    }
    
    .highlight {
      background-color: #2a2a2a;
      padding: 2px 6px;
      border-radius: 4px;
      color: #00ff88;
    }
    
    /* Mobile responsive */
    @media only screen and (max-width: 640px) {
      .email-container { width: 100% !important; }
      .header { padding: 24px 16px !important; }
      .content { padding: 24px 16px !important; }
      .footer { padding: 20px 16px !important; }
      .content h1 { font-size: 24px !important; }
      .content h2 { font-size: 18px !important; }
      .button { display: block !important; text-align: center !important; }
    }
  </style>
</head>
<body>
  <!-- Preheader text -->
  <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${preheader}
  </div>
  
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <div class="logo">🦆</div>
      <h1 class="brand">hungryfools.dev</h1>
      <p class="tagline">The directory of hungry and foolish vibecoders</p>
    </div>
    
    <!-- Main Content -->
    <div class="content">
      ${content}
    </div>
    
    ${
      showFooter
        ? `
    <!-- Footer -->
    <div class="footer">
      <p>
        <strong>PacDuck 🦆 Chief Vibecoding Officer</strong><br>
        <a href="https://hungryfools.dev">hungryfools.dev</a> - The directory of hungry and foolish vibecoders who ship at superhuman speed
      </p>
      <p>
        <a href="mailto:hello@hungryfools.dev">Contact us</a> • 
        <a href="https://hungryfools.dev/privacy">Privacy</a> • 
        <a href="https://hungryfools.dev/unsubscribe">Unsubscribe</a>
      </p>
    </div>
    `
        : ""
    }
  </div>
</body>
</html>`.trim();
}
