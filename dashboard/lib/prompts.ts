/**
 * Prompt templates for Project Scope Analysis
 */

export class PromptTemplates {
  static mainAnalysis(
    projectName: string,
    projectType: string,
    industry: string,
    teamSize: string,
    timeline: string,
    document: string
  ): string {
    return `You are an expert Project Manager and Business Analyst with 15+ years of experience reviewing project requirements and identifying risks.

Your task is to analyze the provided project documentation and provide a comprehensive scope analysis.

## CONTEXT

- Project Name: ${projectName}
- Project Type: ${projectType} (web app, mobile app, integration, etc.)
- Industry: ${industry}
- Team Size: ${teamSize}
- Timeline: ${timeline}

## DOCUMENTATION TO ANALYZE

${document}

## YOUR ANALYSIS MUST INCLUDE:

### 1. SCOPE CLARITY SCORE (0-100)

Rate the overall clarity and completeness of the scope definition.

### 2. MISSING CRITICAL ELEMENTS

Identify what's missing from the documentation:

- Objective & Goals: Is the "why" clear?
- Success Metrics: How will success be measured?
- User Stories/Use Cases: Are they defined?
- Technical Requirements: Are they specified?
- Constraints: Budget, timeline, resources mentioned?
- Assumptions: What assumptions are being made?
- Out of Scope: What's explicitly excluded?
- Dependencies: External systems, teams, data sources?
- Acceptance Criteria: How to know when it's "done"?
- Stakeholders: Who needs to approve/review?

### 3. AMBIGUITY & RISK FLAGS

Identify vague, unclear, or potentially problematic statements:

- Quote the ambiguous text
- Explain why it's problematic
- Suggest how to clarify it
- Rate the risk level (Low/Medium/High/Critical)

### 4. SCOPE CREEP RISKS

Identify areas likely to expand uncontrollably:

- Vague features that could balloon
- "Nice to have" items disguised as requirements
- Features with undefined boundaries
- Integration points that could expand

### 5. HIDDEN COMPLEXITY

Identify seemingly simple requirements that are actually complex:

- Features that require significant infrastructure
- Integrations that need extensive coordination
- Security/compliance implications
- Scalability considerations
- Edge cases not addressed

### 6. CONFLICTING REQUIREMENTS

Find contradictions or competing priorities:

- Requirements that conflict with constraints
- Features that oppose each other
- Timeline vs scope mismatches

### 7. CLARIFYING QUESTIONS (Top 10)

Generate the most important questions to ask stakeholders:

- Prioritize by impact
- Focus on decision-making questions
- Group by category (technical, business, process)

### 8. RECOMMENDED BREAKDOWN

Suggest how to break this into phases/sprints:

- MVP scope
- Phase 2 features
- Future considerations

### 9. EFFORT ESTIMATE CONFIDENCE

Rate your confidence in estimating this project:

- High: Clear, well-defined scope
- Medium: Some ambiguity exists
- Low: Major unknowns present

Explain why.

## OUTPUT FORMAT:

Use clear headings, bullet points, and specific examples.
Be direct and actionable. Flag critical issues prominently.`;
  }

  static requirementsQuality(document: string): string {
    return `Analyze each requirement using the INVEST criteria:

For each requirement in the document:

**Requirement:** {quote the requirement}

**INVEST Analysis:**

- ✅/❌ Independent: Can it be developed separately?
- ✅/❌ Negotiable: Is there flexibility in implementation?
- ✅/❌ Valuable: Does it deliver clear business value?
- ✅/❌ Estimable: Can the team estimate the effort?
- ✅/❌ Small: Is it small enough for one sprint?
- ✅/❌ Testable: Can we verify it's done correctly?

**Score:** X/6

**Recommendation:** [How to improve this requirement]

---

Repeat for all requirements, then provide:

- Overall INVEST Score
- Top 5 requirements needing improvement
- Suggested rewrites

## DOCUMENT TO ANALYZE:

${document}`;
  }

  static riskAssessment(document: string): string {
    return `You are a risk management expert. Analyze this project for potential risks.

## DOCUMENT:

${document}

## IDENTIFY RISKS IN THESE CATEGORIES:

### Technical Risks

- Technology choices
- Integration complexity
- Performance/scalability
- Security vulnerabilities
- Technical debt

### Scope Risks

- Unclear boundaries
- Feature creep potential
- Changing requirements
- Undocumented assumptions

### Resource Risks

- Skill gaps
- Availability issues
- Dependencies on others
- Single points of failure

### Timeline Risks

- Unrealistic deadlines
- Dependencies causing delays
- Buffer time missing
- Milestone ambiguity

### Stakeholder Risks

- Misaligned expectations
- Approval bottlenecks
- Communication gaps
- Decision-making delays

## FOR EACH RISK:

- **Risk:** [Description]
- **Likelihood:** Low/Medium/High
- **Impact:** Low/Medium/High
- **Priority:** [Likelihood × Impact]
- **Mitigation:** [Specific action to reduce risk]
- **Owner:** [Who should manage this]

## PROVIDE:

- Risk Matrix (visual representation)
- Top 5 Critical Risks
- Immediate action items`;
  }

  static technicalComplexity(document: string): string {
    return `You are a Senior Software Architect. Analyze this project for hidden technical complexity.

## DOCUMENT:

${document}

## ANALYZE:

### For Each Feature/Requirement:

**Feature:** {feature name}

**Apparent Complexity:** Simple / Medium / Complex

**Actual Complexity:** Simple / Medium / Complex / Very Complex

**Complexity Drivers:**

- Data model complexity
- Business logic complexity
- Integration requirements
- UI/UX complexity
- Performance requirements
- Security considerations
- Scalability needs
- Testing complexity

**Hidden Challenges:**

- Edge cases not documented
- Error handling scenarios
- Data migration needs
- Backwards compatibility
- Cross-browser/device issues
- Internationalization needs

**Infrastructure Requirements:**

- Databases needed
- Third-party services
- Caching layers
- Background jobs
- APIs to develop

**Estimated Development Time:**

- Optimistic: X days
- Realistic: Y days
- Pessimistic: Z days

**Recommendation:**

- Break into smaller pieces? Yes/No
- Suggested breakdown: [if yes]
- Dependencies: [other features needed first]
- Risk level: Low/Medium/High`;
  }

  static scopeCreepDetector(document: string): string {
    return `Analyze this project for scope creep indicators.

## DOCUMENT:

${document}

## DETECT:

### 🚩 Red Flags:

Identify phrases that indicate potential scope creep:

- "And also..." / "While we're at it..."
- "It would be nice if..."
- "Eventually we'll need..."
- "Just a small addition..."
- Vague words: "flexible," "robust," "scalable," "user-friendly"
- Open-ended requirements
- Features without defined boundaries

### For Each Red Flag:

- **Quote:** [exact text]
- **Why it's a problem:** [explanation]
- **Scope creep risk:** Low/Medium/High
- **Recommended action:**
  - Move to Phase 2
  - Define clear boundaries
  - Break into separate project
  - Get specific requirements

### 🎯 Boundary Recommendations:

Suggest clear boundaries for vague features:

- What's IN scope
- What's OUT of scope
- Definition of "done"
- Success metrics

### 📋 Suggested Scope Statement:

Rewrite the scope with clear boundaries and exclusions.`;
  }

  static stakeholderQuestions(document: string): string {
    return `Based on this project document, generate targeted questions for different stakeholders.

## DOCUMENT:

${document}

## QUESTIONS FOR EACH STAKEHOLDER:

### For Product Owner / Business Sponsor:

- Strategic alignment questions
- ROI and value questions
- Priority and trade-off questions
- Success criteria questions

### For End Users:

- Workflow and usability questions
- Pain point validation
- Feature priority questions
- Acceptance criteria questions

### For Technical Lead / Architect:

- Technical feasibility questions
- Architecture decisions
- Integration questions
- Performance requirements

### For QA / Testing:

- Testing scope questions
- Acceptance criteria clarity
- Edge case scenarios
- Non-functional requirements

### For DevOps / Operations:

- Deployment requirements
- Monitoring needs
- Maintenance considerations
- Infrastructure requirements

### For Security / Compliance:

- Security requirements
- Data privacy concerns
- Compliance needs
- Audit requirements

## FORMAT:

- 5-7 questions per stakeholder
- Prioritize by importance
- Make questions specific and actionable
- Indicate if answer is "blocking" (must have before starting)`;
  }

  static assumptionExtractor(document: string): string {
    return `Identify all implicit and explicit assumptions in this project document.

## DOCUMENT:

${document}

## FIND ASSUMPTIONS ABOUT:

### Technology Assumptions:

- Infrastructure available
- Tools/frameworks to use
- Integration capabilities
- Performance characteristics
- Browser/device support

### Team Assumptions:

- Skills available
- Team size
- Availability
- Working hours/location

### Business Assumptions:

- User behavior
- Market conditions
- Competition
- Budget availability
- Timeline feasibility

### Data Assumptions:

- Data availability
- Data quality
- Data sources
- Data format
- Migration needs

### Process Assumptions:

- Approval processes
- Development methodology
- Deployment process
- Testing approach
- Review cycles

## FOR EACH ASSUMPTION:

**Assumption:** [statement]

**Type:** Explicit / Implicit

**Risk if wrong:** Low / Medium / High / Critical

**Validation needed:** Yes / No

**How to validate:** [specific action]

**Decision maker:** [who can confirm this]

## PROVIDE:

- Total assumptions found: X
- Critical assumptions needing validation: Y
- Recommended validation plan`;
  }

  static formatReport(analyses: string, questions: string): string {
    return `Format the following analysis results into a comprehensive report.

## ANALYSIS RESULTS:

${analyses}

## QUESTIONS GENERATED:

${questions}

## FORMAT YOUR REPORT AS:

# Project Scope Analysis Report

## Executive Summary (2-3 paragraphs)

- Overall assessment
- Key findings
- Critical actions needed

## Scope Clarity Score: X/100

Brief explanation of the score.

## 🚨 Critical Issues (Top 3-5)

Issues that could derail the project:

1. [Issue] - [Impact] - [Recommendation]

## 📊 Detailed Analysis

### Missing Elements

[Organized list]

### Ambiguous Requirements

[Quote, risk level, recommendation]

### Hidden Complexity

[Feature-by-feature breakdown]

### Risk Assessment

[Categorized risks with mitigation]

## ❓ Questions for Stakeholders

Organized by stakeholder type, prioritized

## ✅ Recommendations

### Immediate Actions (Do before starting):

1. [Action]
2. [Action]

### Scope Refinement:

- MVP scope
- Phase 2
- Future considerations

### Process Improvements:

What to add to the requirements process

## 📈 Confidence Assessment

- Readiness to start: Ready / Needs work / Not ready
- Estimation confidence: High / Medium / Low
- Overall risk level: Low / Medium / High / Critical

---

Use clear language and actionable recommendations.
Provide specific examples from the analysis.
Highlight critical items with appropriate emphasis.`;
  }
}
