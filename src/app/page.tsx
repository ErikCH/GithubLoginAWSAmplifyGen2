/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
"use client";
import { get } from "aws-amplify/api";
import {
  fetchAuthSession,
  fetchUserAttributes,
  signInWithRedirect,
} from "aws-amplify/auth";
import { useState } from "react";

export default function Home() {
  const [userInfo, setUserInfo] = useState<{
    picture: string;
    email: string;
    preferred_username: string;
  } | null>(null);
  const signInWithGitHub = async () => {
    await signInWithRedirect({
      provider: {
        custom: "GitHub",
      },
    });
  };

  const getPrivateInfo = async () => {
    const { tokens } = await fetchAuthSession();
    const response = await get({
      apiName: "api",
      path: "/private",
      options: {
        headers: {
          Authorization: `${tokens?.idToken?.toString()}`,
        },
      },
    }).response;
    console.log("response", await response.body.json());
  };

  const getCurrentUserInfo = async () => {
    const session = await fetchUserAttributes();
    setUserInfo({
      picture: session.picture!,
      email: session.email!,
      preferred_username: session.preferred_username!,
    });
  };

  return (
    <>
      <h1>Hello And Login</h1>
      <button onClick={signInWithGitHub}>Sign In With Github</button>
      <button onClick={getCurrentUserInfo}>Get Current user Info</button>
      <button onClick={getPrivateInfo}>Get Private info</button>
      {userInfo?.email !== null ? (
        <>
          <img
            src={userInfo?.picture}
            style={{ borderRadius: "50%" }}
            height="100"
            width="100"
          />
          <div>{userInfo?.email}</div>
          <div>{userInfo?.preferred_username}</div>
        </>
      ) : null}
    </>
  );
}
