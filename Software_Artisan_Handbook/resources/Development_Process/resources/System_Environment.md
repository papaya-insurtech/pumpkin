# System Environment

## Overview

## Production Environment

The Production Environment must be the most stable.  
It is set up in a dedicated infrastructure for the best performance and security.

## Staging Environment

Staging Environment is used mainly for regression tests before releasing them to Production.  
Every change has to be tested on Staging before releasing them to Production.

Keep the data as close to the Production environment as possible.  
Using data synced (1-way prod=>staging synced only) from the Production environment.

## Quick Environment

Quick Environment is used for testing and developing features/bugs that need to be released within 2-5 days.
Data in this environment is testing/dumping data only.

## Sprint Environment

Sprint Environment is used for testing and developing features/bugs in the active Sprint.  
Data in this environment is testing/dumping data only.

## Project Environment

Project Environment is used for testing and developing features/bugs in a long-term project that may take several weeks to be done.
Data in this environment is set up related to the project.
