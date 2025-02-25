// app/lib/tokens/tokenManager.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const RAMP_TOKEN_URL = "https://demo-api.ramp.com/developer/v1/token";
const RAMP_AUTH = "Basic cmFtcF9pZF83QlYyWGoyNG1HSnZkV3BJVEZmOWc5dnRueGJRSXdQMThLYmJ2clFlOnJhbXBfc2VjX01tUnZlVmVjQlBJNE9YeXF3Wk94NE1BTUlaUk5IaDJEMXpQcVQ1TmluSmpoN2U1QQ==";

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export class TokenManager {
  private static instance: TokenManager;
  
  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  async getToken(scope: string): Promise<string> {
    try {
      const existingToken = await prisma.apiTokens.findFirst({
        where: {
          scope,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      if (existingToken) {
        return existingToken.token;
      }

      return this.generateNewToken(scope);
    } catch (error) {
      console.error('Error in getToken:', error);
      throw error;
    }
  }

  private async generateNewToken(scope: string): Promise<string> {
    try {
      const response = await fetch(RAMP_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Authorization': RAMP_AUTH,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'grant_type': 'client_credentials',
          'scope': scope
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate token: ${response.status} ${errorText}`);
      }

      const data: TokenResponse = await response.json();
      
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in - 3600); // Subtract 1 hour for safety

      await prisma.apiTokens.upsert({
        where: {
          scope: scope
        },
        update: {
          token: data.access_token,
          expiresAt
        },
        create: {
          scope,
          token: data.access_token,
          expiresAt
        }
      });

      return data.access_token;
    } catch (error) {
      console.error('Error generating token:', error);
      throw error;
    }
  }
}