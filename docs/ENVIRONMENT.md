# Environment Configuration

This document explains the environment variables used in the ABDM SDK and how to configure them.

## Getting Started

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your actual credentials and configuration.

## Required Configuration

### ABDM API Credentials

| Variable | Description | Example |
|----------|-------------|---------|
| `ABDM_CLIENT_ID` | Your ABDM client ID | `your-client-id` |
| `ABDM_CLIENT_SECRET` | Your ABDM client secret | `your-client-secret` |
| `ABDM_ENVIRONMENT` | Environment to use (`sandbox` or `production`) | `sandbox` |

## API Endpoints

### Base URLs

| Variable | Description | Example |
|----------|-------------|---------|
| `ABDM_SANDBOX_BASE_URL` | Base URL for sandbox environment | `https://dev.abdm.gov.in/gateway` |
| `ABDM_PRODUCTION_BASE_URL` | Base URL for production environment | `https://abdm.gov.in/gateway` |

### M1 Service Endpoints

| Variable | Endpoint | Description |
|----------|----------|-------------|
| `ABDM_M1_SESSION_ENDPOINT` | `/v1/sessions` | Create a new session |
| `ABDM_M1_AADHAAR_OTP_ENDPOINT` | `/v1/registration/m1/aadhaar/sendOtp` | Send Aadhaar OTP |
| `ABDM_M1_VERIFY_OTP_ENDPOINT` | `/v1/registration/m1/aadhaar/verifyOtp` | Verify Aadhaar OTP |
| `ABDM_M1_CREATE_ABHA_ENDPOINT` | `/v1/registration/m1/aadhaar/createAbha` | Create ABHA ID |

### M2 Service Endpoints

| Variable | Endpoint | Description |
|----------|----------|-------------|
| `ABDM_M2_FACILITY_SERVICES_ENDPOINT` | `/v1/bridges/MutipleHRPAddUpdateServices` | Update health facility services |
| `ABDM_M2_FACILITY_DETAILS_ENDPOINT` | `/v1/facilities` | Get facility details |
| `ABDM_M2_PROFILE_ENDPOINT` | `/v1/profile` | Manage ABHA profiles |

### M3 Service Endpoints

| Variable | Endpoint | Description |
|----------|----------|-------------|
| `ABDM_M3_SESSION_ENDPOINT` | `/v3/sessions` | Create M3 session |
| `ABDM_M3_BRIDGE_ENDPOINT` | `/v3/bridges` | Manage bridge services |
| `ABDM_M3_SERVICES_ENDPOINT` | `/v3/services` | Manage services |
| `ABDM_M3_CONSENT_ENDPOINT` | `/v0.5/consent-requests` | Handle consent requests |
| `ABDM_M3_HEALTH_INFO_ENDPOINT` | `/v0.5/health-information` | Manage health information |

## Callback URLs

Update these with your actual callback endpoints:

| Variable | Description | Example |
|----------|-------------|---------|
| `ABDM_CONSENT_NOTIFICATION_URL` | URL for consent notifications | `https://your-domain.com/api/consent/notify` |
| `ABDM_HEALTH_DATA_CALLBACK_URL` | URL for health data callbacks | `https://your-domain.com/api/health-data` |
| `ABDM_BRIDGE_CALLBACK_URL` | URL for bridge service callbacks | `https://your-domain.com/api/bridge/callback` |

## Performance Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `ABDM_API_TIMEOUT` | `30000` | API request timeout in milliseconds |
| `ABDM_MAX_RETRIES` | `3` | Maximum number of retries for failed requests |
| `ABDM_RETRY_DELAY` | `1000` | Delay between retries in milliseconds |

## Logging Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Log level (`error`, `warn`, `info`, `debug`, `trace`) |
| `LOG_REQUESTS` | `true` | Enable/disable request/response logging |

## Security Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `ABDM_VERIFY_SSL` | `true` | Verify SSL certificates |
| `JWT_EXPIRES_IN` | `3600` | JWT token expiration in seconds |

## Best Practices

1. **Never commit sensitive data**: The `.env` file is in `.gitignore` for security reasons.
2. **Use environment-specific files**: Create separate `.env` files for different environments (e.g., `.env.development`, `.env.production`).
3. **Rotate credentials regularly**: Regularly update your client ID and secret.
4. **Monitor usage**: Keep an eye on your API usage and set up alerts for unusual activity.
5. **Use secure storage**: Consider using a secrets management service in production.

## Troubleshooting

- If you get authentication errors, double-check your `ABDM_CLIENT_ID` and `ABDM_CLIENT_SECRET`.
- For connection timeouts, verify your network can reach the ABDM endpoints.
- Check the logs for detailed error messages when issues occur.
