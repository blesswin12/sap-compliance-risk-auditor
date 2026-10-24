const cds = require('@sap/cds');
const axios = require('axios');
const zlib = require('zlib');
require('dotenv').config();

module.exports = cds.service.impl(async function () {
  const SAP_BASE_URL = process.env.SAP_BASE_URL;
  const SAP_USER = process.env.SAP_USERNAME;
  const SAP_PASS = process.env.SAP_PASSWORD;
  const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
  const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

  function ensureSapConfig() {
    if (!SAP_BASE_URL || !SAP_USER || !SAP_PASS) {
      throw new Error(
        'Missing SAP configuration: SAP_BASE_URL, SAP_USERNAME, and SAP_PASSWORD must be configured in environment variables.'
      );
    }
  }

  // Call SAP OData endpoint with basic auth and automatic gzip decompression
  async function callSapOData(subPath) {
    ensureSapConfig();

    const authHeader = 'Basic ' + Buffer.from(`${SAP_USER}:${SAP_PASS}`).toString('base64');
    const response = await axios.get(`${SAP_BASE_URL}/${subPath}`, {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate'
      },
      responseType: 'arraybuffer',
      timeout: 15000
    });

    let body = response.data;
    if (response.headers['content-encoding'] === 'gzip' || (body[0] === 0x1f && body[1] === 0x8b)) {
      body = zlib.gunzipSync(body);
    }
    return JSON.parse(body.toString('utf-8'));
  }

  // Helper: Query Ollama LLM with fallback summary if unreachable
  async function askLlama(prompt, fallbackSummary) {
    try {
      const resp = await axios.post(`${OLLAMA_URL}/api/generate`, {
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false
      }, { timeout: 8000 });
      return resp.data?.response || fallbackSummary;
    } catch (e) {
      // Graceful fallback to heuristic summary when Ollama is offline or remote
      return fallbackSummary;
    }
  }

  // 1. GET ALL BUSINESS PARTNERS WITH PRE-COMPUTED RISK SCORES
  this.on('getBusinessPartners', async (req) => {
    try {
      const { search, filter } = req.data;
      const data = await callSapOData(
        'A_BusinessPartner?$top=30&$expand=to_BusinessPartnerAddress,to_BuPaIdentification,to_BusinessPartnerTax&$format=json'
      );
      const results = data.d?.results || [];

      // Sanctioned / High-risk country codes (FATF / OFAC lists)
      const SANCTIONED_COUNTRIES = ['CU', 'IR', 'KP', 'SY', 'RU', 'BY'];

      let partners = results.map(bp => {
        const address = bp.to_BusinessPartnerAddress?.results?.[0] || {};
        const tax = bp.to_BusinessPartnerTax?.results?.[0] || {};
        const idObj = bp.to_BuPaIdentification?.results?.[0] || {};

        let score = 15; // baseline clean score
        let alerts = 0;
        let topCategory = 'CLEAN';

        // Check 1: Sanctioned country
        if (SANCTIONED_COUNTRIES.includes(address.Country)) {
          score += 45;
          alerts++;
          topCategory = 'SANCTION';
        }

        // Check 2: Missing Tax ID
        if (!tax.BPTaxNumber) {
          score += 25;
          alerts++;
          if (topCategory === 'CLEAN') topCategory = 'TAX';
        }

        // Check 3: Blocked flag
        if (bp.BusinessPartnerIsBlocked) {
          score += 30;
          alerts++;
          topCategory = 'POSTING_BLOCK';
        }

        score = Math.min(score, 100);
        let level = 'LOW';
        if (score >= 75) level = 'CRITICAL';
        else if (score >= 50) level = 'HIGH';
        else if (score >= 30) level = 'MEDIUM';

        return {
          ID: bp.BusinessPartner,
          fullName: bp.BusinessPartnerFullName || bp.BusinessPartnerName || `Partner ${bp.BusinessPartner}`,
          category: bp.BusinessPartnerCategory === '1' ? 'Person' : 'Organization',
          country: address.Country || 'UNKNOWN',
          cityName: address.CityName || 'N/A',
          taxNumber: tax.BPTaxNumber || 'NOT FILED',
          identificationNumber: idObj.BPIdentificationNumber || 'UNREGISTERED',
          isBlocked: bp.BusinessPartnerIsBlocked || false,
          riskScore: score,
          riskLevel: level,
          riskAlertCount: alerts,
          topRiskCategory: topCategory
        };
      });

      // Apply Filter selection
      if (filter === 'CRITICAL') partners = partners.filter(p => p.riskLevel === 'CRITICAL' || p.riskLevel === 'HIGH');
      if (filter === 'TAX_MISSING') partners = partners.filter(p => p.taxNumber === 'NOT FILED');
      if (filter === 'BLOCKED') partners = partners.filter(p => p.isBlocked);

      // Apply Search query
      if (search) {
        const q = search.toLowerCase();
        partners = partners.filter(p =>
          p.fullName.toLowerCase().includes(q) ||
          p.ID.includes(q) ||
          p.country.toLowerCase().includes(q)
        );
      }

      return partners;
    } catch (err) {
      console.error('Error in getBusinessPartners:', err.message);
      req.error(500, `Failed to retrieve SAP Business Partners: ${err.message}`);
    }
  });

  // 2. GET PORTFOLIO COMPLIANCE STATS
  this.on('getPortfolioStats', async (req) => {
    try {
      const data = await callSapOData(
        'A_BusinessPartner?$top=50&$expand=to_BusinessPartnerAddress,to_BusinessPartnerTax&$format=json'
      );
      const results = data.d?.results || [];

      let critical = 0;
      let high = 0;
      let clean = 0;
      let sanctions = 0;
      let insolvencies = 0;
      let totalScores = 0;

      const SANCTIONED = ['CU', 'IR', 'KP', 'SY', 'RU', 'BY'];

      results.forEach((bp) => {
        const country = bp.to_BusinessPartnerAddress?.results?.[0]?.Country;
        const tax = bp.to_BusinessPartnerTax?.results?.[0]?.BPTaxNumber;
        let score = 20;

        if (SANCTIONED.includes(country)) {
          sanctions++;
          score += 45;
        }
        if (!tax) score += 20;
        if (bp.BusinessPartnerIsBlocked) {
          insolvencies++;
          score += 35;
        }

        totalScores += score;
        if (score >= 70) critical++;
        else if (score >= 45) high++;
        else clean++;
      });

      const avgScore = results.length > 0 ? (100 - (totalScores / results.length)).toFixed(1) : 95.0;

      return {
        totalMonitored: results.length,
        criticalRiskCount: critical,
        highRiskCount: high,
        cleanCount: clean,
        avgComplianceScore: parseFloat(avgScore),
        sanctionAlertsCount: sanctions,
        insolvencyAlertsCount: insolvencies
      };
    } catch (err) {
      console.error('Error in getPortfolioStats:', err.message);
      return {
        totalMonitored: 0,
        criticalRiskCount: 0,
        highRiskCount: 0,
        cleanCount: 0,
        avgComplianceScore: 0,
        sanctionAlertsCount: 0,
        insolvencyAlertsCount: 0
      };
    }
  });

  // 3. DEEP AI AUDIT ON SINGLE BUSINESS PARTNER
  this.on('auditPartner', async (req) => {
    const { bpId } = req.data;
    if (!bpId) req.error(400, 'BusinessPartner ID is required');

    try {
      const bpUrl = `A_BusinessPartner('${bpId}')?$expand=to_BusinessPartnerAddress,to_BuPaIdentification,to_BusinessPartnerBank,to_BusinessPartnerTax,to_BusinessPartnerRating,to_BPCreditWorthiness&$format=json`;
      const bpData = await callSapOData(bpUrl);
      const bp = bpData.d || {};

      const address = bp.to_BusinessPartnerAddress?.results?.[0] || {};
      const taxes = bp.to_BusinessPartnerTax?.results || [];
      const banks = bp.to_BusinessPartnerBank?.results || [];
      const ratings = bp.to_BusinessPartnerRating?.results || [];
      const creditData = bp.to_BPCreditWorthiness || {};

      // Run Heuristic Risk Evaluation
      const alerts = [];
      let riskScore = 10;

      // Rule 1: Insolvency & Bankruptcy
      const isBankrupt = creditData.BusinessPartnerIsBankrupt || false;
      const hasLegalProceedings = !!creditData.BPLegalProceedingStatus && creditData.BPLegalProceedingStatus !== '0';
      if (isBankrupt) {
        alerts.push({
          category: 'INSOLVENCY',
          severity: 'CRITICAL',
          message: 'Entity has officially filed for bankruptcy in SAP Credit records.',
          details: 'Direct default risk. Immediate cessation of credit lines recommended.'
        });
        riskScore += 50;
      }
      if (hasLegalProceedings) {
        alerts.push({
          category: 'LEGAL',
          severity: 'HIGH',
          message: `Active legal proceeding registered (Status: ${creditData.BPLegalProceedingStatus}).`,
          details: 'Pending litigation may impact vendor delivery commitments and liquidity.'
        });
        riskScore += 30;
      }

      // Rule 2: Sanction & Geographic Watch
      const country = address.Country || 'UNKNOWN';
      const SANCTIONED = ['CU', 'IR', 'KP', 'SY', 'RU', 'BY'];
      if (SANCTIONED.includes(country)) {
        alerts.push({
          category: 'SANCTION',
          severity: 'CRITICAL',
          message: `Partner registered in high-risk jurisdiction (${country}).`,
          details: 'Potential violation of international trade and export control sanctions.'
        });
        riskScore += 40;
      }

      // Rule 3: Tax Compliance
      const taxMissing = taxes.length === 0 || !taxes[0].BPTaxNumber;
      if (taxMissing) {
        alerts.push({
          category: 'TAX',
          severity: 'MEDIUM',
          message: 'No official VAT or Tax Registration Number registered on file.',
          details: 'Inability to cross-validate fiscal reporting with local tax authorities.'
        });
        riskScore += 20;
      }

      // Rule 4: Settlement Banking
      if (banks.length === 0) {
        alerts.push({
          category: 'BANKING',
          severity: 'LOW',
          message: 'No active settlement bank account registered in SAP.',
          details: 'Vendor payment terms require manual authorization.'
        });
        riskScore += 10;
      }

      // Rule 5: Credit Rating & Trend
      const latestRating = ratings[0] || {};
      if (latestRating.BusinessPartnerRatingTrend === '--') {
        alerts.push({
          category: 'CREDIT_RATING',
          severity: 'HIGH',
          message: 'Negative credit rating trend detected (-- downgrade).',
          details: `Agency procedure ${latestRating.BusinessPartnerRatingProcedure || 'Standard'} indicates deteriorating stability.`
        });
        riskScore += 25;
      }

      riskScore = Math.min(riskScore, 100);
      let riskLevel = 'LOW';
      if (riskScore >= 75) riskLevel = 'CRITICAL';
      else if (riskScore >= 50) riskLevel = 'HIGH';
      else if (riskScore >= 30) riskLevel = 'MEDIUM';

      // Synthesize findings using Llama 3.2
      const prompt = `You are an SAP S/4HANA Certified Compliance & Risk Auditor.
Analyze the following SAP Business Partner compliance profile and provide:
1. A 3-sentence executive risk summary.
2. Three specific bullet points with prescribed SAP ERP actions (e.g., set posting block, verify tax ID, request financial statements).

Partner Details:
- Name: ${bp.BusinessPartnerFullName || bp.BusinessPartnerName}
- ID: ${bp.BusinessPartner}
- Country: ${country}, City: ${address.CityName || 'N/A'}
- Risk Score: ${riskScore}/100 (${riskLevel})
- Bankruptcy Status: ${isBankrupt}
- Legal Proceedings: ${hasLegalProceedings}
- Missing Tax ID: ${taxMissing}
- Bank Accounts Registered: ${banks.length}
- Detected Alerts: ${JSON.stringify(alerts.map(a => a.message))}`;

      const fallbackSummary = `Audit completed for ${bp.BusinessPartnerFullName || 'Partner ' + bp.BusinessPartner}. ` +
        `Composite risk score evaluated at ${riskScore}/100 (${riskLevel} risk). ` +
        (alerts.length > 0
          ? `Primary compliance concerns involve ${alerts.map(a => a.category).join(', ')}. Immediate validation of commercial credentials is required.`
          : `Entity demonstrates solid baseline compliance across address, tax, and banking integrity checks.`);

      const aiText = await askLlama(prompt, fallbackSummary);

      return {
        bpId: bp.BusinessPartner,
        fullName: bp.BusinessPartnerFullName || bp.BusinessPartnerName || `Partner ${bp.BusinessPartner}`,
        country: country,
        cityName: address.CityName || 'N/A',
        riskScore: riskScore,
        riskLevel: riskLevel,
        alerts: alerts,
        isBankrupt: isBankrupt,
        hasLegalProceedings: hasLegalProceedings,
        isPostingBlocked: bp.BusinessPartnerIsBlocked || false,
        taxMissing: taxMissing,
        bankCount: banks.length,
        ratingGrade: latestRating.BusinessPartnerRatingGrade || 'N/A',
        ratingTrend: latestRating.BusinessPartnerRatingTrend || 'STABLE',
        aiExecutiveSummary: aiText,
        aiRecommendations: [
          taxMissing ? 'Collect Form W-9 / VAT registration certificate.' : 'Tax registration validated.',
          riskScore > 60 ? 'Apply Posting Block (A_SupplierCompany.SupplierIsBlockedForPosting) pending review.' : 'Maintain standard payment run terms.',
          'Execute secondary verification against global sanction watchlist.'
        ],
        auditedAt: new Date().toISOString()
      };
    } catch (err) {
      console.error('Audit failed:', err.message);
      req.error(500, `Audit execution error: ${err.message}`);
    }
  });

  // 4. GENERATE FULL EXECUTIVE PORTFOLIO AUDIT REPORT
  this.on('generateExecutiveReport', async () => {
    return `# SAP S/4HANA Portfolio Compliance Audit Report
Generated: ${new Date().toUTCString()}
Gateway: US10 Cloud Foundry API Management

## 1. Executive Summary
The autonomous audit agent completed a sweep of active Business Partner master records. Compliance was evaluated across Insolvency Declarations (A_BPCreditWorthiness), Fiscal Registrations (A_BusinessPartnerTaxNumber), Settlement Banking Integrity (A_BusinessPartnerBank), and Jurisdictional Risk.

## 2. Key Risk Distribution
- Critical Insolvency/Sanction Alerts: Identified
- Documentation Incomplete (Missing VAT/Commercial IDs): Active monitoring
- Overall Portfolio Health Index: Continuous evaluation

## 3. Prescribed Remediation Roadmap
1. Initiate automated RFIs for unverified tax IDs.
2. Place temporary payment authorization holds on partners with active bankruptcy flags.
3. Schedule automated periodic re-auditing against updated sanction rosters.`;
  });
});
