# Custom Setting

## Overview

- Use a database to store user configurations.
- Build a mechanism and feature (without using 3rd party) for users to manage their configurations directly in the PPY product apps.
- Configurations are categorized by module, scope, and priority:
  - Module: Correspondence, Localization, Payment, Claim Assessment, ...
  - Object: User, Company, Plan, Policy, Certificate, Claim, ...
  - There are 2 types of priorities: fallback and override.
    - Fallback: The smaller scope has higher priority. For example, Claim > Certificate > Policy > Company.
    - Override: The larger scope has higher priority. For example, Company > Policy > Certificate > Claim.
  - The priority between 2 types: Override > Fallback
- The database design should reflect these characteristics.
- Build a service to manage custom configurations.
