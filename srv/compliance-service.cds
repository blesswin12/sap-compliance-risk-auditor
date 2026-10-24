using { sap.compliance as db } from '../db/schema';

service ComplianceService @(path: '/api') {

    @readonly entity AuditLogs as projection on db.AuditLogs;
    function getPortfolioStats() returns db.PortfolioStats;
    function getBusinessPartners(search: String, filter: String) returns array of db.BusinessPartnerSummary;
    function auditPartner(bpId: String) returns db.AuditReport;
    function generateExecutiveReport() returns LargeString;
}