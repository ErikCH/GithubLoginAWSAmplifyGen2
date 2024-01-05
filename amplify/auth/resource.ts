import { defineAuth } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: {
    email: true,
    // add social providers
    externalProviders: {
      callbackUrls: ["http://localhost:3000"],
      logoutUrls: ["http://localhost:3000"],
    },
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
    preferredUsername: {
      required: false,
      mutable: true,
    },
    profilePicture: {
      required: false,
      mutable: true,
    },
  },
});
