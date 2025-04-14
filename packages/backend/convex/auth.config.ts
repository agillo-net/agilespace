export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: process.env.CLERK_APPLICATION_ID,
    },
  ],
};
