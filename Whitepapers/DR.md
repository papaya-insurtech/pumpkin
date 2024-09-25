# Disaster Recovery (DR)

## Overview

This Disaster Recovery (DR) outlines the procedures and guidelines for restoring critical databases, and files in the event of a disaster. This document focuses on leveraging AWS cloud services, including RDS, S3 to achieve our DR objectives.

## Objectives

- **Minimize downtime:** Ensure that our services are restored as quickly as possible in the event of a disaster.
- **Data integrity:** Protect and recover data to prevent loss or corruption.
- **Compliance:** Meet regulatory requirements for data recovery and business continuity.

## Disaster Recovery Team

- **DR Manager:** Oversees the DR process and ensures all procedures are followed.
- **DevOps:** Responsible for the recovery.

## DR Plan

### RDS (Relational Database Service)

1. **Multi-AZ Deployment:**
   - Use Multi-AZ deployments for high availability and automatic failover.
   - Multi-AZ deployment (near DR) is an AWS managed near-DR solution that provides synchronous replication of your RDS database to a standby instance in a different Availability Zone within the same Region. If the primary database becomes unavailable because of an outage at the Availability Zone level, AWS automatically promotes the standby database to the primary role. This ensures minimal data loss and downtime. However, it's important to note that Multi-AZ deployment does not protect against Region-level outages. It also doesn't provide any DR capabilities outside of the AWS Cloud.
   - RPO: 0
   - RTO: 1-2 minutes

2. **AWS Backup:**
   - Enable automated snapshots and set a 90 days retention period.
   - Take manual snapshots before major changes.
   - Regularly test backup restoration twice per year to ensure data integrity.
   - AWS Backup is an active-passive DR option because you have to manually initiate the restore process in the case of a primary database failure. You can use AWS Backup in conjunction with a Multi-AZ deployment, combining synchronous and asynchronous solutions to provide an additional layer of protection against data loss.
   - RPO: 1 hour
   - RTO: 30 minutes

### S3 (Simple Storage Service)

1. **Versioning:**
   - Enable versioning on critical S3 buckets to protect against accidental deletions and overwrites.

2. **Lifecycle Policies:**
   - Implement lifecycle policies to transition data to different storage classes and delete outdated versions.

3. **Cross-Region Replication:**
   - Enable cross-region replication for critical data to ensure availability in case of a regional disaster.

4. **Recovery Steps:**
   - In the event of data loss, use S3 versioning to restore the previous versions of the objects.
   - If a regional outage occurs, access the replicated data in the alternate region.
