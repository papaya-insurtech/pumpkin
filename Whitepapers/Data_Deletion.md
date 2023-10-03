# Data Deletion

## Introduction

This document provides an overview of the data deletion process in the system. There are two types of data deletion: soft deletion and hard deletion. Soft deletion is performed first, and if the customer requests it, hard deletion can be performed.

## Soft Deletion Data

### Stage 1 - Deletion Request

The system includes a deletion feature for various types of customer data. Only users with the appropriate permissions can perform data deletion. Customers can also request data deletion through the support channel. Soft-deleted data is completely hidden from all users, including those with full permissions.

### Stage 2 - Soft Deletion

The soft deletion process is performed by the system. During this process, the system marks the data as deleted and hides it from all users. The data remains in the system until the customer requests hard deletion. Audit logs are maintained for all deletion actions. Soft-deleted data can be recovered by the technical team with minimal effort.

## Hard Deletion Data

### Stage 3 - Logical Deletion from Active System

The hard deletion process is performed by the technical team. The data is completely removed from the active system, except for the backup system. Hard-deleted data can be recovered by the technical team, but it requires significant effort.

### Stage 4 - Expiration from Backup System

Hard-deleted data is retained in the backup system for a specific period of time. After this period, the data is permanently removed from the backup system. Recovery of hard-deleted data is not possible after this stage.

## Cloud Provider Data Deletion

The Papaya System is hosted on AWS Cloud. For more information on data protection and compliance on AWS, refer to the following documentation:

- [Data protection in Amazon EC2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/data-protection.html)
- [Data protection in Amazon S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/DataDurability.html)
- [Navigating GDPR Compliance on AWS](https://docs.aws.amazon.com/whitepapers/latest/navigating-gdpr-compliance/welcome.html)
