/**
 * Email Notification Templates
 * Styled HTML templates for notification emails
 */

export interface EmailTemplateData {
    recipientName: string;
    [key: string]: unknown;
}

const emailStyles = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: #4F1D91; color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header .subtitle { opacity: 0.8; font-size: 14px; margin-top: 5px; }
    .content { padding: 30px; }
    .content h2 { color: #333; margin-top: 0; }
    .alert { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .alert.danger { background: #FEE2E2; border-color: #EF4444; }
    .alert.success { background: #D1FAE5; border-color: #10B981; }
    .button { display: inline-block; background: #4F1D91; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #666; font-size: 12px; }
    .stats { display: flex; gap: 20px; margin: 20px 0; }
    .stat { flex: 1; background: #f9fafb; padding: 15px; border-radius: 6px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: 700; color: #4F1D91; }
    .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; }
`;

/**
 * Case Escalated Email Template
 */
export function caseEscalatedEmail(data: {
    recipientName: string;
    caseNumber: string;
    customerName: string;
    reason: string;
    priority: string;
    escalatedBy: string;
    dashboardUrl: string;
}): string {
    return `
<!DOCTYPE html>
<html>
<head><style>${emailStyles}</style></head>
<body>
    <div class="container">
        <div class="header">
            <h1>FedEx DCA Control Tower</h1>
            <div class="subtitle">Case Escalation Alert</div>
        </div>
        <div class="content">
            <h2>Case Escalated</h2>
            <p>Hi ${data.recipientName},</p>
            <div class="alert danger">
                <strong>Case ${data.caseNumber}</strong> has been escalated and requires your immediate attention.
            </div>
            <table>
                <tr><th>Customer</th><td>${data.customerName}</td></tr>
                <tr><th>Priority</th><td>${data.priority}</td></tr>
                <tr><th>Reason</th><td>${data.reason}</td></tr>
                <tr><th>Escalated By</th><td>${data.escalatedBy}</td></tr>
            </table>
            <p style="text-align: center; margin-top: 30px;">
                <a href="${data.dashboardUrl}" class="button">View Case Details</a>
            </p>
        </div>
        <div class="footer">
            FedEx DCA Control Tower • This is an automated notification<br>
            Please do not reply to this email
        </div>
    </div>
</body>
</html>`;
}

/**
 * SLA Breach Warning Email
 */
export function slaBreachEmail(data: {
    recipientName: string;
    caseNumber: string;
    slaName: string;
    dueDate: string;
    hoursRemaining: number;
    dashboardUrl: string;
}): string {
    const urgency = data.hoursRemaining <= 4 ? 'danger' : '';
    return `
<!DOCTYPE html>
<html>
<head><style>${emailStyles}</style></head>
<body>
    <div class="container">
        <div class="header">
            <h1>FedEx DCA Control Tower</h1>
            <div class="subtitle">SLA Breach Warning</div>
        </div>
        <div class="content">
            <h2>⚠️ SLA Breach Imminent</h2>
            <p>Hi ${data.recipientName},</p>
            <div class="alert ${urgency}">
                <strong>${data.slaName}</strong> for Case ${data.caseNumber} is about to breach.<br>
                <strong>${data.hoursRemaining} hours remaining</strong>
            </div>
            <table>
                <tr><th>Case Number</th><td>${data.caseNumber}</td></tr>
                <tr><th>SLA Type</th><td>${data.slaName}</td></tr>
                <tr><th>Due Date</th><td>${data.dueDate}</td></tr>
            </table>
            <p style="text-align: center; margin-top: 30px;">
                <a href="${data.dashboardUrl}" class="button">Take Action</a>
            </p>
        </div>
        <div class="footer">
            FedEx DCA Control Tower • Automated SLA Alert
        </div>
    </div>
</body>
</html>`;
}

/**
 * Weekly Performance Report Email
 */
export function weeklyReportEmail(data: {
    recipientName: string;
    weekEnding: string;
    totalCases: number;
    casesResolved: number;
    totalRecovered: string;
    recoveryRate: string;
    topDca: string;
    dashboardUrl: string;
}): string {
    return `
<!DOCTYPE html>
<html>
<head><style>${emailStyles}</style></head>
<body>
    <div class="container">
        <div class="header">
            <h1>FedEx DCA Control Tower</h1>
            <div class="subtitle">Weekly Performance Report</div>
        </div>
        <div class="content">
            <h2>Week Ending ${data.weekEnding}</h2>
            <p>Hi ${data.recipientName}, here's your weekly collection summary:</p>
            <div class="stats" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                <div class="stat">
                    <div class="stat-value">${data.totalCases}</div>
                    <div class="stat-label">Total Cases</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${data.casesResolved}</div>
                    <div class="stat-label">Resolved</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${data.totalRecovered}</div>
                    <div class="stat-label">Recovered</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${data.recoveryRate}</div>
                    <div class="stat-label">Recovery Rate</div>
                </div>
            </div>
            <div class="alert success">
                <strong>Top Performer:</strong> ${data.topDca}
            </div>
            <p style="text-align: center; margin-top: 30px;">
                <a href="${data.dashboardUrl}" class="button">View Full Report</a>
            </p>
        </div>
        <div class="footer">
            FedEx DCA Control Tower • Weekly Digest
        </div>
    </div>
</body>
</html>`;
}

/**
 * Case Assignment Email
 */
export function caseAssignmentEmail(data: {
    recipientName: string;
    dcaName: string;
    casesAssigned: number;
    totalAmount: string;
    priority: string;
    dashboardUrl: string;
}): string {
    return `
<!DOCTYPE html>
<html>
<head><style>${emailStyles}</style></head>
<body>
    <div class="container">
        <div class="header">
            <h1>FedEx DCA Control Tower</h1>
            <div class="subtitle">New Case Assignment</div>
        </div>
        <div class="content">
            <h2>Cases Assigned to ${data.dcaName}</h2>
            <p>Hi ${data.recipientName},</p>
            <p>New cases have been assigned for collection:</p>
            <div class="stats" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                <div class="stat">
                    <div class="stat-value">${data.casesAssigned}</div>
                    <div class="stat-label">Cases Assigned</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${data.totalAmount}</div>
                    <div class="stat-label">Total Amount</div>
                </div>
            </div>
            <table>
                <tr><th>Priority Level</th><td>${data.priority}</td></tr>
                <tr><th>Assigned To</th><td>${data.dcaName}</td></tr>
            </table>
            <p style="text-align: center; margin-top: 30px;">
                <a href="${data.dashboardUrl}" class="button">View Cases</a>
            </p>
        </div>
        <div class="footer">
            FedEx DCA Control Tower • Case Assignment Notification
        </div>
    </div>
</body>
</html>`;
}
