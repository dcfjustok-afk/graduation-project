## Requirements

### Requirement: User can create a single log from the web UI
The system SHALL provide a web page that allows a user to input log attributes and submit a single log to the backend.

#### Scenario: Submit single log successfully
- **WHEN** the user fills required fields and clicks the submit action
- **THEN** the system creates exactly one log and shows a success message including the created log identifier

#### Scenario: Validation error is shown to the user
- **WHEN** the user submits with missing required fields or invalid values
- **THEN** the system SHALL prevent submission or show a clear error message and SHALL NOT claim the log was created

### Requirement: User can generate logs in batch for demo/testing
The system SHALL provide a batch generation workflow that submits multiple logs using user-configured parameters.

#### Scenario: Generate multiple logs with a count parameter
- **WHEN** the user sets a count and submits the batch generation action
- **THEN** the system SHALL create that number of logs or return a per-item failure list to the user

#### Scenario: Batch generation is limited to safe bounds
- **WHEN** the user requests a batch size greater than the configured maximum
- **THEN** the system SHALL reject the request and display the maximum allowed batch size

### Requirement: UI provides templates and quick-fill presets
The system SHALL provide presets that pre-fill the generation form for common scenarios (e.g., INFO/WARN/ERROR) to reduce manual input.

#### Scenario: Apply preset fills the form
- **WHEN** the user selects a preset
- **THEN** the system SHALL populate the form fields with preset values without submitting automatically

### Requirement: UI supports real/mock data modes consistently
The system SHALL keep the same UI flows in mock mode and real API mode.

#### Scenario: Mock mode generates local entries
- **WHEN** the UI is configured to use mock data
- **THEN** the system SHALL create logs in the mock data store and the user can see them in the logs list

#### Scenario: Real mode calls backend API
- **WHEN** the UI is configured to use real API data
- **THEN** the system SHALL call the backend endpoints and render server responses
