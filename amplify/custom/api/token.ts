import type { APIGatewayProxyHandler } from "aws-lambda";
import parser from "lambda-multipart-parser";

export const handler: APIGatewayProxyHandler = async (e) => {
  const event = await parser.parse(e);
  const url = `https://github.com/login/oauth/access_token?client_id=${event.client_id}&client_secret=${event.client_secret}&code=${event.code}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        accept: "application/json",
      },
    });
    const token = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(token),
    };
  } catch (e) {
    console.log("error", e);
    return {
      statusCode: 500,
      body: JSON.stringify(e),
    };
  }
};
