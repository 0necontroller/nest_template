import { DocumentBuilder } from '@nestjs/swagger';

const description = `
### Welcome to the SCI-Label API 🚀

This API manages core business operations for the SCI-Label platform, including:
* **Authentication**: Secure registration, login, JWT rotation, and email verification.
* **Two-Factor Authentication (2FA)**: Time-based One-Time Password (TOTP) setup and verification.
* **Users**: Profile configurations and notification preference controls.
* **Notifications**: Queue-backed async communications.

---

### Response & Exception Conventions 📐

All endpoints return unified JSON envelopes managed by global interceptors and exception filters, ensuring predictable response structures for client integration.

#### 🟢 Success Responses
Success responses are formatted by the \`TransformInterceptor\`:
\`\`\`json
{
  "status": "success",
  "message": "Descriptive success message",
  "data": { ... }, // Payload object or array (null if empty)
  "meta": {
    "timestamp": "2026-07-08T20:30:00.000Z"
  }
}
\`\`\`

#### 🔴 Error Responses
Error responses are formatted by the \`HttpExceptionFilter\`:
\`\`\`json
{
  "status": "error",
  "message": "A summary of the error occurred",
  "error": {
    "code": "VALIDATION_FAILED | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | INTERNAL_SERVER_ERROR",
    "message": "Detailed error message",
    "details": [ // Included for validation errors
      {
        "field": "fieldName",
        "issue": "Validation rule failure description"
      }
    ]
  }
}
\`\`\`

For security details, refer to the **Authorize** section above.
`;

export const swaggerConfig = new DocumentBuilder()
  .setTitle('SCI-Label API')
  .setDescription(description)
  .setVersion('1.0')
  .addBearerAuth()
  .build();
export type SwaggerConfig = typeof swaggerConfig;
