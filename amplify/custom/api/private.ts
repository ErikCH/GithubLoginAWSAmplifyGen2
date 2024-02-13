import type { APIGatewayProxyWithCognitoAuthorizerHandler } from "aws-lambda";

export const handler: APIGatewayProxyWithCognitoAuthorizerHandler = async (
  event
) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ response: "Works!" }),
    headers: {
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      "content-type": "application/json",
    },
  };
};
