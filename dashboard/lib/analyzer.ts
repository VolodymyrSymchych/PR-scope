/**
 * Project Scope Analyzer - TypeScript/Node.js version
 */

import Anthropic from '@anthropic-ai/sdk';
import { PromptTemplates } from './prompts';

export interface ProjectMetadata {
  project_name: string;
  project_type: string;
  industry: string;
  team_size: string;
  timeline: string;
}

export interface AnalyzerConfig {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  runMainAnalysis?: boolean;
  runRequirementsQuality?: boolean;
  runRiskAssessment?: boolean;
  runTechnicalComplexity?: boolean;
  runScopeCreepDetection?: boolean;
  runStakeholderQuestions?: boolean;
  runAssumptionExtraction?: boolean;
  verbose?: boolean;
}

export interface AnalysisResults {
  [key: string]: string;
}

export interface ProgressCallback {
  (stage: string, status: 'started' | 'completed', progress: number): void;
}

export class ProjectScopeAnalyzer {
  private client: Anthropic;
  private config: Required<AnalyzerConfig>;
  private prompts: typeof PromptTemplates;

  constructor(config: AnalyzerConfig = {}) {
    const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error(
        'API key not found. Set ANTHROPIC_API_KEY environment variable or provide it in the config.'
      );
    }

    this.client = new Anthropic({ apiKey });
    this.prompts = PromptTemplates;

    this.config = {
      apiKey,
      model: config.model || 'claude-sonnet-4-20250514',
      maxTokens: config.maxTokens || 4096,
      temperature: config.temperature || 0.7,
      runMainAnalysis: config.runMainAnalysis !== false,
      runRequirementsQuality: config.runRequirementsQuality !== false,
      runRiskAssessment: config.runRiskAssessment !== false,
      runTechnicalComplexity: config.runTechnicalComplexity !== false,
      runScopeCreepDetection: config.runScopeCreepDetection !== false,
      runStakeholderQuestions: config.runStakeholderQuestions !== false,
      runAssumptionExtraction: config.runAssumptionExtraction !== false,
      verbose: config.verbose || false,
    };
  }

  private async callClaude(prompt: string, stageName: string): Promise<string> {
    if (this.config.verbose) {
      console.log(`Running ${stageName}...`);
    }

    try {
      const message = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const textContent = message.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in response');
      }

      return textContent.text;
    } catch (error: any) {
      console.error(`Error in ${stageName}:`, error.message);
      return `Error occurred during ${stageName}: ${error.message}`;
    }
  }

  async analyze(
    document: string,
    metadata: ProjectMetadata,
    onProgress?: ProgressCallback
  ): Promise<AnalysisResults> {
    const results: AnalysisResults = {};
    let totalStages = 0;
    let completedStages = 0;

    // Count total stages
    if (this.config.runMainAnalysis) totalStages++;
    if (this.config.runRequirementsQuality) totalStages++;
    if (this.config.runRiskAssessment) totalStages++;
    if (this.config.runTechnicalComplexity) totalStages++;
    if (this.config.runScopeCreepDetection) totalStages++;
    if (this.config.runStakeholderQuestions) totalStages++;
    if (this.config.runAssumptionExtraction) totalStages++;

    const updateProgress = (stage: string, status: 'started' | 'completed') => {
      if (status === 'completed') completedStages++;
      const progress = Math.round((completedStages / totalStages) * 100);
      onProgress?.(stage, status, progress);
    };

    // Stage 1: Main Analysis
    if (this.config.runMainAnalysis) {
      updateProgress('Main Analysis', 'started');
      const prompt = this.prompts.mainAnalysis(
        metadata.project_name,
        metadata.project_type,
        metadata.industry,
        metadata.team_size,
        metadata.timeline,
        document
      );
      results.main_analysis = await this.callClaude(prompt, 'Main Analysis');
      updateProgress('Main Analysis', 'completed');
    }

    // Stage 2: Requirements Quality Check
    if (this.config.runRequirementsQuality) {
      updateProgress('Requirements Quality', 'started');
      const prompt = this.prompts.requirementsQuality(document);
      results.requirements_quality = await this.callClaude(
        prompt,
        'Requirements Quality Check'
      );
      updateProgress('Requirements Quality', 'completed');
    }

    // Stage 3: Risk Assessment
    if (this.config.runRiskAssessment) {
      updateProgress('Risk Assessment', 'started');
      const prompt = this.prompts.riskAssessment(document);
      results.risk_assessment = await this.callClaude(prompt, 'Risk Assessment');
      updateProgress('Risk Assessment', 'completed');
    }

    // Stage 4: Technical Complexity Analysis
    if (this.config.runTechnicalComplexity) {
      updateProgress('Technical Complexity', 'started');
      const prompt = this.prompts.technicalComplexity(document);
      results.technical_complexity = await this.callClaude(
        prompt,
        'Technical Complexity Analysis'
      );
      updateProgress('Technical Complexity', 'completed');
    }

    // Stage 5: Scope Creep Detection
    if (this.config.runScopeCreepDetection) {
      updateProgress('Scope Creep Detection', 'started');
      const prompt = this.prompts.scopeCreepDetector(document);
      results.scope_creep = await this.callClaude(prompt, 'Scope Creep Detection');
      updateProgress('Scope Creep Detection', 'completed');
    }

    // Stage 6: Stakeholder Questions
    if (this.config.runStakeholderQuestions) {
      updateProgress('Stakeholder Questions', 'started');
      const prompt = this.prompts.stakeholderQuestions(document);
      results.stakeholder_questions = await this.callClaude(
        prompt,
        'Stakeholder Questions'
      );
      updateProgress('Stakeholder Questions', 'completed');
    }

    // Stage 7: Assumption Extraction
    if (this.config.runAssumptionExtraction) {
      updateProgress('Assumption Extraction', 'started');
      const prompt = this.prompts.assumptionExtractor(document);
      results.assumptions = await this.callClaude(prompt, 'Assumption Extraction');
      updateProgress('Assumption Extraction', 'completed');
    }

    return results;
  }

  async generateReport(results: AnalysisResults): Promise<string> {
    console.log('Generating final report...');

    // Combine all results
    const combined = Object.entries(results)
      .map(([key, value]) => {
        const title = key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());
        return `# ${title}\n\n${value}`;
      })
      .join('\n\n---\n\n');

    // Format into final report
    const prompt = this.prompts.formatReport(
      combined,
      results.stakeholder_questions || ''
    );

    const report = await this.callClaude(prompt, 'Report Generation');

    console.log('Report generation complete');
    return report;
  }

  extractScore(mainAnalysis: string): number | null {
    // Look for patterns like "Score: 75/100" or "75/100" or "Score: 75"
    const patterns = [
      /Score:\s*(\d+)\/100/i,
      /Score:\s*(\d+)/i,
      /(\d+)\/100/,
      /SCOPE CLARITY SCORE.*?(\d+)/i,
    ];

    for (const pattern of patterns) {
      const match = mainAnalysis.match(pattern);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    return null;
  }

  calculateRiskLevel(results: AnalysisResults): string {
    const riskKeywords: { [key: string]: number } = {
      critical: 10,
      high: 5,
      medium: 2,
      low: 1,
    };

    let totalScore = 0;

    Object.values(results).forEach((result) => {
      const resultLower = result.toLowerCase();
      Object.entries(riskKeywords).forEach(([keyword, score]) => {
        const matches = resultLower.match(new RegExp(keyword, 'g'));
        if (matches) {
          totalScore += matches.length * score;
        }
      });
    });

    if (totalScore >= 50) return 'CRITICAL';
    if (totalScore >= 30) return 'HIGH';
    if (totalScore >= 15) return 'MEDIUM';
    return 'LOW';
  }
}
