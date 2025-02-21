# Eligibility Engine API Documentation

## Overview

The Eligibility Engine API is designed to streamline the process of
verifying the eligibility of healthcare providers. The API provides
functionalities to check billing provider status based on comprehensive
federal and state monitoring and credentialed data. This document
provides detailed instructions for developers on how to integrate and
utilize the API effectively.

## API Purpose

The Eligibility Engine API aims to automate eligibility checks for
healthcare providers, solving the key challenge of ensuring providers
are compliant and authorized to deliver services and receive
remuneration. Primary use cases include:

- Credentialing verification for healthcare networks

- Continuous monitoring of provider statuses

- Eligibility determination for HR onboarding processes

## Core Functionalities

- **Profile Search:** Retrieve healthcare provider profiles using the
  /profile/search endpoint.

- **Eligibility Check:** Utilize the /eligibility/check endpoint to
  determine the current eligibility status of providers based on NPIs.

- **Real-time Data Verification:** Integrates with federal and state
  databases for up-to-date verification capabilities.

## Architecture Overview

The API's architecture is built following RESTful principles, ensuring
robustness and scalability. Core components include:

- Request handling via HTTP methods (GET, POST)

- Authentication via secure token mechanisms

- Dependencies on external data sources for verification

## API Authentication

### Authentication Methods

- **API Keys:** Secure access to the API endpoints using API keys
  provided to registered users.

- **OAuth 2.0:** Supports OAuth 2.0 for secure and authenticated access.

### Token Management

- Obtain tokens through the /auth/token endpoint.

- Tokens have a standard expiration time of 24 hours.

- Best practices for secure token storage include encrypting tokens and
  regularly refreshing them.

## Common Issues and Troubleshooting

Addressing common pitfalls associated with authentication:

- Ensure API keys are correctly configured in the request header.

- Renewal of expired tokens should be automated in client-side
  applications.

## Error Messages

### Error Code List

| Error Code | Message | Description |
|------------|--------------------------|---------------------------------------|
| 401 | Unauthorized | Invalid API key or expired token. | | 404 | Not
Found | Profile or endpoint not found. | | 400 | Bad Request | Malformed
request parameters. | | 500 | Internal Server Error | Server error.
Contact support. |

### Troubleshooting Guide

- Validate API keys before usage.

- Refer to comprehensive endpoint documentation for parameter details.

## Support and Resources

- Developer forums and FAQs at
  <a href="http://support.providertrust.com" class="tiptap-link"
  target="_blank" rel="noopener noreferrer nofollow">ProviderTrust
  Support</a>

- Contact support at support@providertrust.com for advanced
  troubleshooting.

- Utilize external tools like Postman for API testing and debugging.

## API Endpoints and Operations

### GET: /profile/search

- **Base URL:** https://api.providertrust.com

- **Purpose:** Retrieve provider profiles by search criteria.

- **Parameters:**

  - query (required): Search terms.

- **Example Request:** GET /profile/search?query=John+Doe

- **Sample Response:** JSON object containing a list of matching
  provider profiles.

### POST: /eligibility/check

- **Purpose:** Check eligibility status of a provider.

- **Parameters:**

  - npi (required): Provider's National Provider Identifier.

  - credentialData (optional): Supplementary credential information.

- **Example Request:**

  POST /eligibility/check { "npi": "1234567890", "credentialData": {} }

- **Sample Response:** JSON with eligibility status and supporting data.

## Eligibility Admin & Backend

Build out the backend functionalities to support eligibility checks
fully. Specific values will be provided later for a comprehensive
development strategy.

## Conclusion

The Eligibility Engine API provides healthcare organizations with
reliable and efficient tools for verifying provider credentials and
eligibility. Integration with industry-standard security and
authentication practices ensures the API is suitable for enterprise
applications. For more information, refer to our additional resources or
contact support.
