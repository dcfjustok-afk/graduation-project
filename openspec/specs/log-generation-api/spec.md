## Requirements

### Requirement: Backend accepts a single log submission for persistence and optional chain write
The backend SHALL expose an endpoint to submit a single log with a validated payload and return the created log record.

#### Scenario: Valid log submit creates a log record
- **WHEN** a client submits a valid log payload
- **THEN** the backend SHALL persist the log and return the created log record in the response

#### Scenario: Invalid payload is rejected
- **WHEN** a client submits a payload that fails validation
- **THEN** the backend SHALL return a validation error and SHALL NOT create a log record

### Requirement: Backend supports batch log generation with safe limits
The backend SHALL expose a batch generation endpoint that creates multiple logs using shared parameters with optional per-item overrides.

#### Scenario: Batch request returns per-item results
- **WHEN** a client submits a batch generation request
- **THEN** the backend SHALL return the number of successful creations and a list of failures with reasons

#### Scenario: Batch size limit is enforced
- **WHEN** a client submits a batch generation request with count above the configured max
- **THEN** the backend SHALL reject the request with an explicit error indicating the max allowed value

### Requirement: Generated logs are identifiable as web-generated
The backend SHALL record a marker indicating logs were generated from the web UI (for auditability and filtering).

#### Scenario: Web-generated marker is stored
- **WHEN** a log is created via the batch generation endpoint
- **THEN** the created log record SHALL include a stored marker (e.g., sourceType or metadata field) identifying it as web-generated
