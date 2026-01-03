# Case Lifecycle Diagram

```mermaid
stateDiagram-v2
    [*] --> OPEN: SYSTEM creates case
    
    OPEN --> IN_PROGRESS: DCA_AGENT starts work
    
    IN_PROGRESS --> CONTACTED: DCA_AGENT contacts customer
    
    CONTACTED --> PROMISE_TO_PAY: Customer promises payment
    CONTACTED --> FAILED: Customer unresponsive
    
    PROMISE_TO_PAY --> PARTIALLY_RECOVERED: Partial payment received
    PROMISE_TO_PAY --> RECOVERED: Full payment received
    PROMISE_TO_PAY --> FAILED: Promise broken
    
    PARTIALLY_RECOVERED --> RECOVERED: Remaining collected
    PARTIALLY_RECOVERED --> FAILED: Cannot collect more
    
    IN_PROGRESS --> ESCALATED: SLA breach detected
    CONTACTED --> ESCALATED: SLA breach detected
    PROMISE_TO_PAY --> ESCALATED: DCA_MANAGER escalates
    
    RECOVERED --> CLOSED: FEDEX_ADMIN closes
    FAILED --> CLOSED: FEDEX_ADMIN closes
    ESCALATED --> IN_PROGRESS: Reassigned
    ESCALATED --> CLOSED: FEDEX_ADMIN closes
    
    CLOSED --> [*]
```

## State Definitions

| State | Description | Terminal |
|-------|-------------|----------|
| `OPEN` | Case created, pending assignment | No |
| `IN_PROGRESS` | DCA actively working | No |
| `CONTACTED` | Customer has been contacted | No |
| `PROMISE_TO_PAY` | Customer committed to pay | No |
| `PARTIALLY_RECOVERED` | Some amount collected | No |
| `RECOVERED` | Full amount collected | Yes* |
| `FAILED` | Collection failed | Yes* |
| `ESCALATED` | Requires attention | No |
| `CLOSED` | Final terminal state | Yes |

*Requires FEDEX_ADMIN to transition to CLOSED

## Transition Rules

| From | To | Allowed Roles |
|------|----|---------------|
| OPEN | IN_PROGRESS | DCA_AGENT |
| IN_PROGRESS | CONTACTED | DCA_AGENT |
| CONTACTED | PROMISE_TO_PAY | DCA_AGENT |
| CONTACTED | FAILED | DCA_AGENT |
| ANY | ESCALATED | DCA_MANAGER |
| RECOVERED | CLOSED | FEDEX_ADMIN |
| FAILED | CLOSED | FEDEX_ADMIN |
| ESCALATED | IN_PROGRESS | FEDEX_ADMIN |
| ESCALATED | CLOSED | FEDEX_ADMIN |

## SLA Breach Detection

```mermaid
flowchart LR
    A["SLA Job (every 15 min)"] --> B{due_at < now?}
    B -->|Yes| C{Case status terminal?}
    B -->|No| D["Skip"]
    C -->|No| E["Mark BREACHED"]
    C -->|Yes| D
    E --> F{Auto-escalate?}
    F -->|Yes| G["Create escalation"]
    F -->|No| H["Log only"]
    G --> I["Update case to ESCALATED"]
```
