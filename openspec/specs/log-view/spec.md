## Requirements

### Requirement: User can view logs in the web UI
The system SHALL provide a logs list page that can display newly created logs shortly after creation.

#### Scenario: Newly created log appears after refresh
- **WHEN** a user creates a log via the log generator UI and returns to the logs list
- **THEN** the logs list SHALL show the newly created log after a manual refresh or automatic reload

#### Scenario: Logs list supports search across key fields
- **WHEN** the user enters a keyword in the logs list search box
- **THEN** the system SHALL filter logs by matching id, task, source, level, status, or hash
