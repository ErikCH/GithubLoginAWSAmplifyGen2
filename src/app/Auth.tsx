"use client";

import React from "react";
import { Amplify } from "aws-amplify";
import config from "@/../amplifyconfiguration.json";

Amplify.configure(
  {
    Auth: {
      Cognito: {
        userPoolId: config.aws_user_pools_id,
        userPoolClientId: config.aws_user_pools_web_client_id,
        identityPoolId: config.aws_cognito_identity_pool_id,
        allowGuestAccess: true,
        passwordFormat: {
          minLength:
            config.aws_cognito_password_protection_settings
              .passwordPolicyMinLength,
          // below are all defaults, for the sake of the demo
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialCharacters: true,
          requireUppercase: true,
        },
        userAttributes: {
          email: {
            required: true,
          },
        },
        signUpVerificationMethod: "code",
        loginWith: {
          oauth: {
            domain: "",
            scopes: [
              "email",
              "profile",
              "openid",
              "aws.cognito.signin.user.admin",
            ],
            redirectSignIn: ["http://localhost:3000"],
            redirectSignOut: ["http://localhost:3000"],
            responseType: "token",
          },
        },
      },
    },
    API: {
      REST: {
        api: {
          endpoint: "",
        },
      },
    },
  },

  { ssr: true }
);

const Auth = ({ children }: { children: React.ReactNode }) => {
  return children;
};

export default Auth;
