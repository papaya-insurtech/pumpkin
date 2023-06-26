# Back End Challenge

## Note

- Please estimate and give us your timeline.
- If you have any issues don't hesitate to contact us.
- The requirements below are must-haves, but adding more features or stuff you like is very nice.

## Use case

Design and implement a GraphQL API for a News application that allows:

- Everyone can get news, categories, publisher
- Each news Publisher will be authenticated so they can create/update/delete their news

Unauthenticated requests:

- List of news (search, filter, pagination)
- List of category
- List of publisher
- Detail of a news

Publisher Authenticated request:

- List of their news
- Create news
- Update news
- Delete news

Webhook (Optional):

- Every time news is read by someone, the system will callback to a pre-registered endpoint of the Publisher to notify them.

## Technical requirements

- The API system should be written in [TypeScript](https://www.typescriptlang.org/) with [Strict Mode](https://dev.to/jsdev/strict-mode-typescript-j8p) (you can pick any framework of your choice)
- Should use [GraphQL](https://graphql.org/) with DataLoader pattern
- Unit tests should be written and green

## Submission

- Push your project onto a Github repository
- Deploy the system onto a platform of your choice. Being able to deploy your project to a serverless platform (such as AWS Lambda) is a big plus.
