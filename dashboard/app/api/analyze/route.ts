import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { storage } from '../../../../server/storage';
import { ProjectScopeAnalyzer, ProjectMetadata } from '@/lib/analyzer';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const { document, project_name, project_type, industry, team_size, timeline, quick } = data;

    if (!document) {
      return NextResponse.json({ error: 'Document content is required' }, { status: 400 });
    }

    // Check if API key is available
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

    let score: number | null = null;
    let risk_level: string;
    let results: any = {};
    let report: string;

    if (hasApiKey) {
      // Real AI-powered analysis
      const metadata: ProjectMetadata = {
        project_name: project_name || 'Unknown Project',
        project_type: project_type || 'software development',
        industry: industry || 'technology',
        team_size: team_size || 'not specified',
        timeline: timeline || 'not specified',
      };

      const analyzer = new ProjectScopeAnalyzer({
        runMainAnalysis: true,
        runRequirementsQuality: !quick,
        runRiskAssessment: !quick,
        runTechnicalComplexity: !quick,
        runScopeCreepDetection: !quick,
        runStakeholderQuestions: !quick,
        runAssumptionExtraction: !quick,
        verbose: false,
      });

      // Run analysis
      results = await analyzer.analyze(document, metadata);

      // Generate report
      report = await analyzer.generateReport(results);

      // Extract score and risk level
      score = analyzer.extractScore(results.main_analysis || '');
      risk_level = analyzer.calculateRiskLevel(results);
    } else {
      // Fallback to mock analysis
      score = Math.floor(Math.random() * 40) + 60;
      risk_level = score >= 80 ? 'LOW' : score >= 65 ? 'MEDIUM' : 'HIGH';

      results = {
        main_analysis: `Mock Analysis: Project "${project_name}" analyzed. Document length: ${document.length} characters.`,
        requirements_quality: 'Requirements analysis completed (mock).',
        risk_assessment: `Risk level: ${risk_level}`,
        technical_complexity: 'Complexity assessment completed (mock).',
        scope_creep: 'Scope creep analysis completed (mock).',
        stakeholder_questions: 'Stakeholder questions generated (mock).',
        assumptions: 'Assumptions extracted (mock).'
      };

      report = `# Project Scope Analysis Report (Mock Mode)

## Project: ${project_name}

**Scope Clarity Score:** ${score}/100
**Risk Level:** ${risk_level}
**Analysis Date:** ${new Date().toLocaleString()}

## ⚠️ Using Mock Analysis

Set your ANTHROPIC_API_KEY environment variable to enable real AI-powered analysis.

## Document Statistics
- Document Length: ${document.length} characters
- Project Type: ${project_type}
- Industry: ${industry}
- Team Size: ${team_size}
- Timeline: ${timeline}

## What Real Analysis Provides

With an API key configured, you'll get:
- Detailed scope clarity assessment by AI
- INVEST criteria evaluation for each requirement
- Comprehensive risk matrix with mitigation strategies
- Technical complexity breakdown with hidden challenges
- Scope creep detection with specific red flags
- Targeted stakeholder questions by role
- Assumption extraction with validation plans

## How to Enable Real Analysis

1. Get an API key from https://console.anthropic.com/
2. Set environment variable: ANTHROPIC_API_KEY=your_key_here
3. Restart the application
4. Re-run analysis

Your analysis will then be powered by Claude AI!`;
    }

    // Save project to database
    const project = await storage.createProject({
      userId: session.userId,
      name: project_name || 'Unknown Project',
      type: project_type || 'software development',
      industry: industry || 'technology',
      teamSize: team_size || 'not specified',
      timeline: timeline || 'not specified',
      score: score || 0,
      riskLevel: risk_level,
      status: 'completed',
      document: document,
      analysisData: JSON.stringify({ results, report, metadata: { project_type, industry, team_size, timeline } }),
    });

    return NextResponse.json({
      success: true,
      project,
      analysis: {
        score,
        risk_level,
        report,
        stages_completed: Object.keys(results).length,
        using_ai: hasApiKey
      }
    });
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json({
      error: error.message,
      details: error.stack
    }, { status: 500 });
  }
}
