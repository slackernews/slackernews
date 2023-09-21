import React, { useEffect, useState } from 'react';
import Cookies from 'cookies';

export default function Logout() {

  return (
    <>
    </>
  );
}

export async function getServerSideProps(ctx) {
  const cookies = new Cookies(ctx.req, ctx.res)

  cookies.set('auth', null, {
    httpOnly: true,
  });

  return {
    redirect: {
      permanent: false,
      destination: "/",
    },
    props: {},
  }
}
