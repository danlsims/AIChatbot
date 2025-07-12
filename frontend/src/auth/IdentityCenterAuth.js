import { SSOOIDCClient, CreateTokenCommand, StartDeviceAuthorizationCommand } from "@aws-sdk/client-sso-oidc";
import { SSOClient, GetRoleCredentialsCommand, ListAccountsCommand, ListAccountRolesCommand } from "@aws-sdk/client-sso";

class IdentityCenterAuth {
  constructor() {
    this.clientId = 'ejU1EDFN3JEvKk-ZqwfQ9XVzLWVhc3QtMQ';
    this.region = 'us-east-1';
    this.ssoOidcClient = new SSOOIDCClient({ region: this.region });
    this.ssoClient = new SSOClient({ region: this.region });
    this.accessToken = null;
    this.credentials = null;
  }

  async startDeviceAuthorization() {
    try {
      const command = new StartDeviceAuthorizationCommand({
        clientId: this.clientId,
        clientSecret: 'eyJraWQiOiJrZXktMTU2NDAyODA5OSIsImFsZyI6IkhTMzg0In0.eyJzZXJpYWxpemVkIjoie1wiY2xpZW50SWRcIjp7XCJ2YWx1ZVwiOlwiZWpVMUVERk4zSkV2S2stWnF3ZlE5WFZ6TFdWaGMzUXRNUVwifSxcImlkZW1wb3RlbnRLZXlcIjpudWxsLFwidGVuYW50SWRcIjpudWxsLFwiY2xpZW50TmFtZVwiOlwiaW50ZWxsaWdlbnQtcmFnLWJlZHJvY2stY2hhdGJvdFwiLFwiYmFja2ZpbGxWZXJzaW9uXCI6bnVsbCxcImNsaWVudFR5cGVcIjpcIlBVQkxJQ1wiLFwidGVtcGxhdGVBcm5cIjpudWxsLFwidGVtcGxhdGVDb250ZXh0XCI6bnVsbCxcImV4cGlyYXRpb25UaW1lc3RhbXBcIjoxNzU5ODU4NTU1LjU0MjEwMTE4NCxcImNyZWF0ZWRUaW1lc3RhbXBcIjoxNzUyMDgyNTU1LjU0MjEwMTE4NCxcInVwZGF0ZWRUaW1lc3RhbXBcIjoxNzUyMDgyNTU1LjU0MjEwMTE4NCxcImNyZWF0ZWRCeVwiOm51bGwsXCJ1cGRhdGVkQnlcIjpudWxsLFwic3RhdHVzXCI6bnVsbCxcImluaXRpYXRlTG9naW5VcmlcIjpudWxsLFwiZW50aXRsZWRSZXNvdXJjZUlkXCI6bnVsbCxcImVudGl0bGVkUmVzb3VyY2VDb250YWluZXJJZFwiOm51bGwsXCJleHRlcm5hbElkXCI6bnVsbCxcInNvZnR3YXJlSWRcIjpudWxsLFwic2NvcGVzXCI6W10sXCJhdXRoZW50aWNhdGlvbkNvbmZpZ3VyYXRpb25cIjpudWxsLFwiZW5hYmxlZEdyYW50c1wiOm51bGwsXCJlbmZvcmNlQXV0aE5Db25maWd1cmF0aW9uXCI6bnVsbCxcIm93bmVyQWNjb3VudElkXCI6bnVsbCxcInNzb0luc3RhbmNlQWNjb3VudElkXCI6bnVsbCxcInVzZXJDb25zZW50XCI6bnVsbCxcIm5vbkludGVyYWN0aXZlU2Vzc2lvbnNFbmFibGVkXCI6bnVsbCxcImFzc29jaWF0ZWRJbnN0YW5jZUFyblwiOm51bGwsXCJzaG91bGRHZXRWYWx1ZUZyb21UZW1wbGF0ZVwiOnRydWUsXCJoYXNJbml0aWFsU2NvcGVzXCI6ZmFsc2UsXCJoYXNSZXF1ZXN0ZWRTY29wZXNcIjpmYWxzZSxcImFyZUFsbFNjb3Blc0NvbnNlbnRlZFRvXCI6ZmFsc2UsXCJncm91cFNjb3Blc0J5RnJpZW5kbHlJZFwiOnt9LFwiY29udGFpbnNPbmx5U3NvU2NvcGVzXCI6ZmFsc2UsXCJzc29TY29wZXNcIjpbXSxcImlzQmFja2ZpbGxlZFwiOmZhbHNlLFwiaXNFeHBpcmVkXCI6ZmFsc2UsXCJpc1YxQmFja2ZpbGxlZFwiOmZhbHNlLFwiaXNWMkJhY2tmaWxsZWRcIjpmYWxzZSxcImlzVjNCYWNrZmlsbGVkXCI6ZmFsc2V9In0._QfpveuSBh6LNyqBFqOxvitojNHenUNeDJRMMozMAJeiXdRRa_TzieMz2AtmE2oX',
        startUrl: 'https://d-9067b8b8b8.awsapps.com/start'
      });

      const response = await this.ssoOidcClient.send(command);
      return response;
    } catch (error) {
      console.error('Error starting device authorization:', error);
      throw error;
    }
  }

  async createToken(deviceCode) {
    try {
      const command = new CreateTokenCommand({
        clientId: this.clientId,
        clientSecret: 'eyJraWQiOiJrZXktMTU2NDAyODA5OSIsImFsZyI6IkhTMzg0In0.eyJzZXJpYWxpemVkIjoie1wiY2xpZW50SWRcIjp7XCJ2YWx1ZVwiOlwiZWpVMUVERk4zSkV2S2stWnF3ZlE5WFZ6TFdWaGMzUXRNUVwifSxcImlkZW1wb3RlbnRLZXlcIjpudWxsLFwidGVuYW50SWRcIjpudWxsLFwiY2xpZW50TmFtZVwiOlwiaW50ZWxsaWdlbnQtcmFnLWJlZHJvY2stY2hhdGJvdFwiLFwiYmFja2ZpbGxWZXJzaW9uXCI6bnVsbCxcImNsaWVudFR5cGVcIjpcIlBVQkxJQ1wiLFwidGVtcGxhdGVBcm5cIjpudWxsLFwidGVtcGxhdGVDb250ZXh0XCI6bnVsbCxcImV4cGlyYXRpb25UaW1lc3RhbXBcIjoxNzU5ODU4NTU1LjU0MjEwMTE4NCxcImNyZWF0ZWRUaW1lc3RhbXBcIjoxNzUyMDgyNTU1LjU0MjEwMTE4NCxcInVwZGF0ZWRUaW1lc3RhbXBcIjoxNzUyMDgyNTU1LjU0MjEwMTE4NCxcImNyZWF0ZWRCeVwiOm51bGwsXCJ1cGRhdGVkQnlcIjpudWxsLFwic3RhdHVzXCI6bnVsbCxcImluaXRpYXRlTG9naW5VcmlcIjpudWxsLFwiZW50aXRsZWRSZXNvdXJjZUlkXCI6bnVsbCxcImVudGl0bGVkUmVzb3VyY2VDb250YWluZXJJZFwiOm51bGwsXCJleHRlcm5hbElkXCI6bnVsbCxcInNvZnR3YXJlSWRcIjpudWxsLFwic2NvcGVzXCI6W10sXCJhdXRoZW50aWNhdGlvbkNvbmZpZ3VyYXRpb25cIjpudWxsLFwiZW5hYmxlZEdyYW50c1wiOm51bGwsXCJlbmZvcmNlQXV0aE5Db25maWd1cmF0aW9uXCI6bnVsbCxcIm93bmVyQWNjb3VudElkXCI6bnVsbCxcInNzb0luc3RhbmNlQWNjb3VudElkXCI6bnVsbCxcInVzZXJDb25zZW50XCI6bnVsbCxcIm5vbkludGVyYWN0aXZlU2Vzc2lvbnNFbmFibGVkXCI6bnVsbCxcImFzc29jaWF0ZWRJbnN0YW5jZUFyblwiOm51bGwsXCJzaG91bGRHZXRWYWx1ZUZyb21UZW1wbGF0ZVwiOnRydWUsXCJoYXNJbml0aWFsU2NvcGVzXCI6ZmFsc2UsXCJoYXNSZXF1ZXN0ZWRTY29wZXNcIjpmYWxzZSxcImFyZUFsbFNjb3Blc0NvbnNlbnRlZFRvXCI6ZmFsc2UsXCJncm91cFNjb3Blc0J5RnJpZW5kbHlJZFwiOnt9LFwiY29udGFpbnNPbmx5U3NvU2NvcGVzXCI6ZmFsc2UsXCJzc29TY29wZXNcIjpbXSxcImlzQmFja2ZpbGxlZFwiOmZhbHNlLFwiaXNFeHBpcmVkXCI6ZmFsc2UsXCJpc1YxQmFja2ZpbGxlZFwiOmZhbHNlLFwiaXNWMkJhY2tmaWxsZWRcIjpmYWxzZSxcImlzVjNCYWNrZmlsbGVkXCI6ZmFsc2V9In0._QfpveuSBh6LNyqBFqOxvitojNHenUNeDJRMMozMAJeiXdRRa_TzieMz2AtmE2oX',
        grantType: 'urn:ietf:params:oauth:grant-type:device_code',
        deviceCode: deviceCode
      });

      const response = await this.ssoOidcClient.send(command);
      this.accessToken = response.accessToken;
      return response;
    } catch (error) {
      console.error('Error creating token:', error);
      throw error;
    }
  }

  async getAccountsAndRoles() {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    try {
      const accountsCommand = new ListAccountsCommand({
        accessToken: this.accessToken
      });

      const accountsResponse = await this.ssoClient.send(accountsCommand);
      const accounts = accountsResponse.accountList;

      if (accounts && accounts.length > 0) {
        const account = accounts[0]; // Use first account
        
        const rolesCommand = new ListAccountRolesCommand({
          accessToken: this.accessToken,
          accountId: account.accountId
        });

        const rolesResponse = await this.ssoClient.send(rolesCommand);
        const roles = rolesResponse.roleList;

        if (roles && roles.length > 0) {
          const role = roles[0]; // Use first role
          
          const credentialsCommand = new GetRoleCredentialsCommand({
            accessToken: this.accessToken,
            accountId: account.accountId,
            roleName: role.roleName
          });

          const credentialsResponse = await this.ssoClient.send(credentialsCommand);
          this.credentials = credentialsResponse.roleCredentials;
          
          return {
            account,
            role,
            credentials: this.credentials
          };
        }
      }
    } catch (error) {
      console.error('Error getting accounts and roles:', error);
      throw error;
    }
  }

  getCredentials() {
    return this.credentials;
  }

  isAuthenticated() {
    return this.accessToken !== null && this.credentials !== null;
  }

  logout() {
    this.accessToken = null;
    this.credentials = null;
  }
}

export default IdentityCenterAuth;
