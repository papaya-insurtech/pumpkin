# Engineer Configuration

## Overview

### Environment Variable

- Using AWS SSM Parameter Store to store environment variables, secrets, and configs for each environment
- Get parameters in real-time or load into Serverless ENV at the build and deploy time

#### Import Parameters to Serverless ENV

[Reference Variables using the SSM Parameter Store](https://www.serverless.com/framework/docs/providers/aws/guide/variables#reference-variables-using-the-ssm-parameter-store)

Using `serverless.yml` file to import parameters from SSM Parameter Store into Serverless ENV

    ```yml
    FLEX_API_DOMAIN: ${ssm(raw):/${opt:stage}/berry/payout/FLEX_API_DOMAIN}
    FLEX_SECRET_KEY: ${ssm(raw):/${opt:stage}/berry/payout/FLEX_SECRET_KEY}
    FLEX_ACCESS_KEY: ${ssm(raw):/${opt:stage}/berry/payout/FLEX_ACCESS_KEY}
    FLEX_PARTNER_ID: ${ssm(raw):/${opt:stage}/berry/payout/FLEX_PARTNER_ID}
    ```

### Feature Flag

- Feature flags for engineers to temporarily use in situations where a Feature Management solution hasn't been developed for the Product team.
- Use AWS SSM Parameter Store to store the feature flags.
- Access the feature flags in real-time rather than caching them.
- Use a JSON object to store a group of related feature flags into a single parameter.
- Write one or more functions to access and parse values for the feature flags used in the backend.
- Write one or more queries to access and parse values for the feature flags used in the front end.
