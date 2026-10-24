namespace sap.compliance;

using {cuid, managed} from '@sap/cds/common';

type RiskLevel    : String enum {
    LOW;
    MEDIUM;
    HIGH;
    CRITICAL;
}

type RiskCategory : String enum {
    INSOLVENCY;
    LEGAL;
    SANCTION;
    TAX;
    BANKING;
    CREDIT_RATING;
    POSTING_BLOCK;
    CLEAN;
}

type RiskAlert {
    category : RiskCategory;
    severity : RiskLevel;
    message  : String;
    details  : String;
}

type AuditReport {
    bpId                : String;
    fullName            : String;
    country             : String;
    cityName            : String;
    riskScore           : Integer;
    riskLevel           : RiskLevel;
    alerts              : array of RiskAlert;
    isBankrupt          : Boolean;
    hasLegalProceedings : Boolean;
    isPostingBlocked    : Boolean;
    taxMissing          : Boolean;
    bankCount           : Integer;
    ratingGrade         : String;
    ratingTrend         : String;
    aiExecutiveSummary  : LargeString;
    aiRecommendations   : array of String;
    auditedAt           : DateTime;
}

type PortfolioStats {
    totalMonitored        : Integer;
    criticalRiskCount     : Integer;
    highRiskCount         : Integer;
    cleanCount            : Integer;
    avgComplianceScore    : Decimal(5, 2);
    sanctionAlertsCount   : Integer;
    insolvencyAlertsCount : Integer;
}

type BusinessPartnerSummary {
    ID                   : String;
    fullName             : String;
    category             : String;
    country              : String;
    cityName             : String;
    taxNumber            : String;
    identificationNumber : String;
    isBlocked            : Boolean;
    riskScore            : Integer;
    riskLevel            : RiskLevel;
    riskAlertCount       : Integer;
    topRiskCategory      : String;
}

entity AuditLogs : cuid, managed {
    businessPartnerId   : String(10);
    businessPartnerName : String(100);
    riskScore           : Integer;
    riskLevel           : RiskLevel;
    isBankrupt          : Boolean;
    hasLegalProceedings : Boolean;
    taxMissing          : Boolean;
    aiSummary           : LargeString;
    rawFindingsJson     : LargeString;
}
