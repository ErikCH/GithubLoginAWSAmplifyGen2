import type { APIGatewayProxyHandler } from "aws-lambda";

export const handler: APIGatewayProxyHandler = async (event) => {
  if (!event.headers["Authorization"]) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  try {
    //Authorization: Bearer .....
    const response = await fetch("https://api.github.com/user", {
      method: "GET",
      headers: {
        authorization:
          "token " + event.headers["Authorization"].split("Bearer ")[1],
        accept: "application/json",
      },
    });
    const token = (await response.json()) as { id: string };

    return {
      statusCode: 200,
      body: JSON.stringify({ sub: token.id, ...token }),
    };
  } catch (error) {
    console.log("error", error);
    return {
      statusCode: 500,
      body: JSON.stringify(error),
    };
  }
};
