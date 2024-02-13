import * as url from "node:url";
// you may need to declare this as a dependency
import { CDKContextKey } from "@aws-amplify/platform-core";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import { secret } from "@aws-amplify/backend";

export type BackendSecret = ReturnType<typeof secret>;

export type GitHubProviderProps = {
  /**
   * Cognito User Pool to attach to
   */
  userPool: cognito.IUserPool;
  /**
   * Cognito User Pool client to use
   */
  userPoolClient: cognito.IUserPoolClient;
  /**
   * GitHub OAuth Client ID
   */
  clientId: BackendSecret;
  /**
   * GitHub OAuth Client Secret
   */
  clientSecret: BackendSecret;
};

// Githubprovider OIDC
// API Gateway
// Lambda Functions
export class GitHubProvider extends Construct {
  public api: apigateway.RestApi;
  public apiUrl: string;
  public provider: cognito.UserPoolIdentityProviderOidc;
  private backendIdentifier = {
    name: this.node.tryGetContext(CDKContextKey.BACKEND_NAME),
    namespace: this.node.tryGetContext(CDKContextKey.BACKEND_NAMESPACE),
    type: this.node.tryGetContext(CDKContextKey.DEPLOYMENT_TYPE),
  };

  constructor(scope: Construct, id: string, props: GitHubProviderProps) {
    super(scope, id);

    // Backend ID To resolve secrets

    // lambda

    const userLambda = new lambda.NodejsFunction(this, "UserLambda", {
      entry: url.fileURLToPath(new URL("./api/user.ts", import.meta.url)),
      runtime: Runtime.NODEJS_18_X,
    });

    const tokenLambda = new lambda.NodejsFunction(this, "TokenLambda", {
      entry: url.fileURLToPath(new URL("./api/token.ts", import.meta.url)),
      runtime: Runtime.NODEJS_18_X,
    });

    const privateLambda = new lambda.NodejsFunction(this, "PrivateLambda", {
      entry: url.fileURLToPath(new URL("./api/private.ts", import.meta.url)),
      runtime: Runtime.NODEJS_18_X,
    });

    // Setup API Gateway

    const apiGithubGateway = new apigateway.RestApi(this, "APIGateway", {
      restApiName: "GitHub API Gateway",
      description: "this is for GitHub API Login",
      deployOptions: {
        stageName: "prod",
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["*"], // Specify allowed headers
      },
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
    });

    // Setup Resource Routes
    const userResource = apiGithubGateway.root.addResource("user");
    const userIntegration = new apigateway.LambdaIntegration(userLambda);
    userResource.addMethod("GET", userIntegration);

    const tokenResource = apiGithubGateway.root.addResource("token");
    const tokenIntegration = new apigateway.LambdaIntegration(tokenLambda);
    tokenResource.addMethod("POST", tokenIntegration);

    const userPoolAuthorizer = new apigateway.CfnAuthorizer(
      this,
      "UserPoolAuthorizerGithub",
      {
        name: "UserPoolAuthorizer",
        restApiId: apiGithubGateway.restApiId,
        type: "COGNITO_USER_POOLS",
        providerArns: [props.userPool.userPoolArn],
        identitySource: "method.request.header.Authorization",
      }
    );

    // protected Private route
    const privateResource = apiGithubGateway.root.addResource("private");
    const privateIntegration = new apigateway.LambdaIntegration(privateLambda);
    privateResource.addMethod("GET", privateIntegration, {
      authorizer: { authorizerId: userPoolAuthorizer.ref },
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // Setup Github Identity Provider
    const githubIdentityProvider = new cognito.UserPoolIdentityProviderOidc(
      this,
      "GitHubProvider",
      {
        // https://github.com/aws-amplify/amplify-backend/blob/6a2f9aa8fe81bf48ac725470a1bd64622966da46/packages/backend-auth/src/translate_auth_props.ts#L138-L154
        clientId: props.clientId
          .resolve(this, this.backendIdentifier)
          .unsafeUnwrap(),
        clientSecret: props.clientSecret
          .resolve(this, this.backendIdentifier)
          .unsafeUnwrap(),
        userPool: props.userPool,
        issuerUrl: "https://github.com",
        attributeRequestMethod: cognito.OidcAttributeRequestMethod.GET,
        name: "GitHub",
        endpoints: {
          authorization: "https://github.com/login/oauth/authorize",
          jwksUri: apiGithubGateway.url + "token",
          token: apiGithubGateway.url + "token",
          userInfo: apiGithubGateway.url + "user",
        },
        attributeMapping: {
          email: cognito.ProviderAttribute.other("email"),
          preferredUsername: cognito.ProviderAttribute.other("name"),
          profilePicture: cognito.ProviderAttribute.other("avatar_url"),
        },
        scopes: ["openid", "user"],
      }
    );

    // add the new identity provider to the user pool client
    const userPoolClient = props.userPoolClient.node
      .defaultChild as cognito.CfnUserPoolClient;
    userPoolClient.supportedIdentityProviders = [
      ...(userPoolClient.supportedIdentityProviders || []),
      githubIdentityProvider.providerName,
    ];
    this.api = apiGithubGateway;
    this.apiUrl = apiGithubGateway.url;
    this.provider = githubIdentityProvider;
  }
}
