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
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    /* Container */
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    
    /* Header */
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      padding: 32px 24px;
      text-align: center;
    }
    
    .header .logo {
      font-size: 32px;
      margin-bottom: 8px;
    }
    
    .header .brand {
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
      margin: 0;
      text-decoration: none;
    }
    
    .header .tagline {
      color: rgba(255, 255, 255, 0.8);
      font-size: 14px;
      margin: 4px 0 0 0;
    }
    
    /* Content */
    .content {
      padding: 32px 24px;
      line-height: 1.6;
      color: #374151;
    }
    
    .content h1 {
      color: #111827;
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 24px 0;
      line-height: 1.2;
    }
    
    .content h2 {
      color: #374151;
      font-size: 20px;
      font-weight: 600;
      margin: 32px 0 16px 0;
      line-height: 1.3;
    }
    
    .content h3 {
      color: #4b5563;
      font-size: 18px;
      font-weight: 600;
      margin: 24px 0 12px 0;
    }
    
    .content p {
      margin: 0 0 16px 0;
      color: #374151;
    }
    
    .content ul, .content ol {
      margin: 16px 0;
      padding-left: 20px;
    }
    
    .content li {
      margin: 8px 0;
    }
    
    .content blockquote {
      margin: 24px 0;
      padding: 16px 20px;
      background-color: #f3f4f6;
      border-left: 4px solid #6366f1;
      color: #4b5563;
    }
    
    /* Buttons */
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: #ffffff !important;
      text-decoration: none !important;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 16px 0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    .button:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 12px -1px rgba(0, 0, 0, 0.15);
    }
    
    /* Footer */
    .footer {
      background-color: #f9fafb;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    
    .footer p {
      color: #6b7280;
      font-size: 14px;
      margin: 8px 0;
    }
    
    .footer a {
      color: #6366f1;
      text-decoration: none;
    }
    
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      body { background-color: #111827 !important; }
      .email-container { background-color: #1f2937 !important; }
      .content { color: #d1d5db !important; }
      .content h1 { color: #f9fafb !important; }
      .content h2 { color: #e5e7eb !important; }
      .content h3 { color: #d1d5db !important; }
      .content p { color: #d1d5db !important; }
      .footer { background-color: #0f172a !important; border-top-color: #374151 !important; }
      .footer p { color: #9ca3af !important; }
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
      <h1 class="brand">Hungry Fools</h1>
      <p class="tagline">Where AI meets creative code</p>
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
        <a href="https://hungryfools.dev">Hungry Fools</a> - The community for AI-first developers
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
