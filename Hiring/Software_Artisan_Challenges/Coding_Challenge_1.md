# Coding Challenge

## Note

- Please estimate and give us your timeline.
- If you have any issues don't hesitate to contact us.
- The requirements below are must-haves, but adding more features or stuff you like is very nice.

## Problem

There is a Partner's Webhook that you have to integrate with. The webhook is a POST request that sends a JSON payload to your server.
Their webhook will send 3 types of event payload to your only endpoint `/webhook`.
There are 3 types of event payloads:

- Claim Submitted

    ```json
    {
        "event": "CLAIM_SUBMITTED",
        "data": {
            "id": "123456",
            "policy_id": "123456",
            "claim_number": "CLM-123",
            "event_date": "2021-01-01",
            "request_amount": 1000000
        }
    }
    ```

- Policy Created

    ```json
    {
        "event": "POLICY_CREATED",
        "data": {
            "id": "123456",
            "policy_number": "POL-123",
            "policy_holder": "John Doe",
            "premium": 10000000
        }
    }
    ```

- Payout Paid

    ```json
    {
        "event": "PAYOUT_PAID",
        "data": {
            "id": "123456",
            "claim_id": "123456",
            "policy_id": "123456",
            "amount": 50000
        }
    }
    ```

What is the best practice to handle this webhook payload in TypeScript?

Implement a TypeScript helper library/function to handle the webhook payload. The library should have the following features

- Parse the webhook payload from JSON to a TypeScript object
- Validate the webhook payload base on each event type
- Infer the correct TypeScript type of data field base on event type

## Technical requirements

- Unit tests should be written and green
- Using [TypeScript](https://www.typescriptlang.org/)
- Can use any libraries of your choice

## Non-technical requirements

- Give some description and explaination about your solution.
- Give some explaination about the exteral libraries you used if any.

## Submission

- Push your project onto a Github repository
