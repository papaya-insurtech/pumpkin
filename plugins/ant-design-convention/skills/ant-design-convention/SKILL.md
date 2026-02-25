---
name: ant-design-convention
description: Ant Design notification, modal, and component usage conventions for Papaya projects
version: 1.0.0
---

# Ant Design Convention

Apply these conventions when using Ant Design components in Papaya projects.

## Notifications

- Use the [notification component](https://ant.design/components/notification) instead of [message](https://ant.design/components/message) unless you are absolutely certain. Notification offers more control and flexibility.
- Use [notification hooks](https://ant.design/components/notification#notification-demo-update) for progress indicators. Use cases include mutating data with multiple sequential queries (creating a claim case, uploading documents, sending Slack notifications, sending emails, assigning users).

### Notification Best Practices

- The last notification content should display a concise message of the whole process, e.g., "Claim case DB-21-00141221 created successfully".
- Clicking the notification should redirect the user to the created resource.
- The claim case code (e.g., DB-21-00141221) should be hyperlinked to the claim case page.
- After a period of time (golden number: 1 second), the notification should auto-redirect to the created resource, unless the resource is part of the current screen.

```ts
const [notificationApi, notificationApiContextHolder] = notification.useNotification();

// Progress notification
notificationApi.info({
  message: "Creating claim case",
  description: "Please wait",
  key: NOTIFICATION_KEY,
});

// Error notification
notificationApi.error({
  message: "Error creating claim",
  description: "Selected card has no insurer info",
  key: NOTIFICATION_KEY,
});

// Success notification with auto-redirect
notificationApi.success({
  message: "Claim created successfully",
  description: `Claim code: ${claimCode}`,
  key: NOTIFICATION_KEY,
  duration: 1,
  onClick: () => navigate(`${generatePath(PORTAL_PATH.CLAIM_CASE, { claimCaseId })}/${CLAIM_CASE_PATH.CLAIM_CASE_INFO}`),
  onClose: () => navigate(`${generatePath(PORTAL_PATH.CLAIM_CASE, { claimCaseId })}/${CLAIM_CASE_PATH.CLAIM_CASE_INFO}`),
});
```

## Modals

### Loading Indicator for Form Submission

AntD Modal shows a loading indicator for the submit button automatically when `onOk` returns a Promise. This prevents double-clicks. Applies to all modal types: `info`, `success`, `error`, `warning`, `confirm`.

```ts
Modal.confirm({
  content: "This modal shows loading indicator on submit",
  onOk: async () =>
    new Promise((resolve) => {
      setTimeout(() => resolve(true), 5000);
    }),
  title: "Modal with loading indicator",
});
```

With GraphQL -- simply return the mutation:

```ts
Modal.confirm({
  content: "Confirm update",
  onOk: () =>
    updateInsuredCertificateMutation({
      variables: {
        id: insuredCertificate.id,
        input: { status: "approved" },
      },
    }),
  title: "Update status",
});
```

### Three Modal Usage Patterns (in order of preference)

1. **Static method** (preferred) -- `Modal.confirm({...})`, `Modal.info({...})`
   - Simplest, least clutter in JSX.
   - [Ant Design docs: Static method](https://ant.design/components/modal#components-modal-demo-static-info)

2. **Hooks** -- `const [modal, contextHolder] = Modal.useModal()`
   - Use when modal content requires React contexts (Apollo Client, Claim Context, etc.).
   - [Ant Design docs: Hooks](https://ant.design/components/modal#components-modal-demo-hooks)

3. **Component-based** -- `<Modal open={visible} onOk={...}>`
   - Use only when updating modal data causes re-rendering that makes the modal disappear unexpectedly.
   - Least preferred due to JSX clutter.
   - [Ant Design docs: Basic](https://ant.design/components/modal#components-modal-demo-basic)
