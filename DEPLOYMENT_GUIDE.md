# Deployment Guide - AWS Bedrock Document Analysis Platform

## Prerequisites

1. **AWS Account with Bedrock Access**
   - Create an AWS IAM user with Bedrock permissions
   - Enable access to Claude 3.5 Sonnet model in your AWS region
   - Note your AWS Access Key ID and Secret Access Key

2. **Vercel Account**
   - Sign up at [vercel.com](https://vercel.com)
   - Install Vercel CLI: `npm i -g vercel`

## Environment Variables

You need to configure the following environment variables in Vercel:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key with Bedrock permissions | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_REGION` | AWS region where Bedrock is enabled | `us-east-1` |
| `APP_ACCESS_TOKEN` | Secure token for application access | `your-secure-random-token-123` |

### Setting Environment Variables in Vercel

#### Option 1: Via Vercel Dashboard
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable with its value
4. Set the environment to "Production", "Preview", and "Development"

#### Option 2: Via Vercel CLI
```bash
vercel env add AWS_ACCESS_KEY_ID
vercel env add AWS_SECRET_ACCESS_KEY
vercel env add AWS_REGION
vercel env add APP_ACCESS_TOKEN
```

## Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Create Local Environment File**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and fill in your credentials.

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Access Application**
   - Open http://localhost:3000
   - Enter your `APP_ACCESS_TOKEN` to log in
   - You'll be redirected to `/dashboard`

## Deployment to Vercel

### Method 1: Git Integration (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/bedrock-chat.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Configure environment variables
   - Click "Deploy"

### Method 2: Vercel CLI

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables**
   Follow the prompts or use `vercel env add` commands

## AWS IAM Policy

Create an IAM user with the following policy for minimal Bedrock access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0"
    }
  ]
}
```

## Security Best Practices

1. **Generate Strong Access Token**
   ```bash
   # Linux/Mac
   openssl rand -base64 32
   
   # Or use a password manager to generate a random string
   ```

2. **Rotate Credentials Regularly**
   - Update AWS keys every 90 days
   - Change APP_ACCESS_TOKEN periodically

3. **Monitor AWS Usage**
   - Set up CloudWatch alarms for Bedrock API calls
   - Enable AWS CloudTrail for audit logging

4. **Use Environment-Specific Tokens**
   - Different tokens for development/staging/production
   - Never commit `.env` files to version control

## Troubleshooting

### "Access Denied" Error
- Verify IAM user has correct Bedrock permissions
- Check that Claude 3.5 Sonnet is enabled in your AWS region
- Confirm environment variables are set correctly in Vercel

### Streaming Not Working
- Ensure Edge Runtime is enabled (it's configured in the API route)
- Check browser console for errors
- Verify Vercel function logs for streaming errors

### 404 on Login
- Confirm `middleware.ts` is properly configured
- Check that `APP_ACCESS_TOKEN` matches between client and server
- Clear browser cookies and try again

## Cost Considerations

- **AWS Bedrock**: Charged per input/output tokens
- **Claude 3.5 Sonnet pricing**: ~$3 per 1M input tokens, ~$15 per 1M output tokens
- **Vercel**: Free tier includes 100GB bandwidth, 100GB-hours serverless function execution
- Monitor usage via AWS Cost Explorer and Vercel Analytics

## Support

For issues:
1. Check Vercel function logs: `vercel logs --follow`
2. Review AWS CloudWatch logs for Bedrock API calls
3. Verify environment variables are correct
4. Test locally first before deploying to production
