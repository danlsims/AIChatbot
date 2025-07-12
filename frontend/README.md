# Bedrock Agent Chatbot Frontend

This is a React-based frontend for the Bedrock Agent chatbot application. It provides a modern, responsive web interface for interacting with your Amazon Bedrock Agent.

## Features

- **Modern Chat Interface**: Clean, responsive design optimized for conversations
- **Real-time Messaging**: Streaming responses from the Bedrock Agent
- **Conversation Management**: Create, select, and manage multiple conversations
- **AWS Integration**: Direct integration with Amazon Bedrock Agent Runtime
- **Authentication**: Simple authentication system (can be extended with AWS Cognito)
- **CloudFront Distribution**: Fast, global content delivery

## Architecture

The frontend consists of:
- **React Application**: Modern React 18 with functional components and hooks
- **AWS SDK Integration**: Direct calls to Bedrock Agent Runtime API
- **Cognito Identity Pool**: For unauthenticated access to AWS services
- **S3 + CloudFront**: Static hosting with global CDN
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- Node.js 16+ and npm
- AWS CLI configured with appropriate permissions
- Terraform infrastructure deployed (see main README)

## Quick Start

1. **Deploy Infrastructure**: First, deploy the main Terraform infrastructure:
   ```bash
   cd ..
   terraform apply
   terraform output -json > terraform-output.json
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Update Configuration**:
   ```bash
   npm run update-config
   ```

4. **Start Development Server**:
   ```bash
   npm start
   ```

5. **Deploy to Production**:
   ```bash
   ./deploy.sh
   ```

## Configuration

The application configuration is automatically generated from Terraform outputs. Key configuration values include:

- **AWS Region**: The region where your Bedrock Agent is deployed
- **Agent ID**: The ID of your Bedrock Agent
- **Agent Alias ID**: The alias ID for your Bedrock Agent
- **Cognito Identity Pool ID**: For AWS authentication

## Development

### Available Scripts

- `npm start`: Start development server
- `npm run build`: Build for production
- `npm test`: Run tests
- `npm run update-config`: Update configuration from Terraform outputs

### Project Structure

```
src/
├── components/          # React components
│   ├── ChatInterface.js    # Main chat interface
│   ├── ConversationList.js # Conversation sidebar
│   ├── MessageList.js      # Message display
│   ├── MessageBubble.js    # Individual message bubbles
│   └── Login.js           # Authentication component
├── services/           # Business logic
│   └── bedrockAgentService.js # Bedrock Agent integration
├── auth/              # Authentication
│   ├── authService.js     # Auth service
│   └── PrivateRoute.js    # Route protection
├── config.js          # Application configuration
└── App.js            # Main application component
```

## Deployment

### Automatic Deployment

Use the provided deployment script:

```bash
./deploy.sh
```

This script will:
1. Update configuration from Terraform outputs
2. Install dependencies
3. Build the React application
4. Deploy to S3
5. Invalidate CloudFront cache

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to S3:
   ```bash
   aws s3 sync build/ s3://YOUR_BUCKET_NAME --delete
   ```

3. Invalidate CloudFront (optional):
   ```bash
   aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
   ```

## Authentication

The current implementation uses a simple authentication system for demonstration purposes. For production use, consider integrating with:

- **AWS Cognito User Pools**: For user registration and authentication
- **AWS IAM Identity Center**: For enterprise SSO
- **Third-party providers**: Auth0, Okta, etc.

## Customization

### Styling

The application uses CSS modules and can be customized by modifying the CSS files in the components directory.

### Branding

Update the application title and branding in:
- `src/config.js`: Application metadata
- `public/index.html`: Page title and meta tags
- `src/App.css`: Main styling

### Features

To add new features:
1. Create new components in `src/components/`
2. Add business logic to `src/services/`
3. Update routing in `src/App.js`

## Troubleshooting

### Common Issues

1. **Configuration not found**: Run `npm run update-config` after deploying infrastructure
2. **AWS permissions**: Ensure Cognito Identity Pool has proper Bedrock permissions
3. **CORS errors**: Check that your Bedrock Agent allows requests from your domain
4. **Build failures**: Ensure Node.js version is 16 or higher

### Debug Mode

Enable debug logging by setting:
```javascript
localStorage.setItem('debug', 'true');
```

## Security Considerations

- The application uses Cognito Identity Pool for unauthenticated access
- All communication with AWS services is over HTTPS
- Consider implementing proper user authentication for production
- Review and restrict IAM permissions as needed

## Performance

- The application is optimized for fast loading with code splitting
- CloudFront provides global CDN for static assets
- Streaming responses provide real-time chat experience
- Local state management minimizes API calls

## Support

For issues related to:
- **Frontend**: Check browser console for errors
- **AWS Integration**: Verify IAM permissions and service availability
- **Infrastructure**: Review Terraform configuration and AWS resources

## License

This project is licensed under the MIT-0 License. See the main project LICENSE file for details.
