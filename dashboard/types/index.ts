export interface Project {
  id: string
  name: string
  description: string
  status: 'planning' | 'in-progress' | 'review' | 'completed' | 'on-hold'
  scopeScore?: number
  riskLevel?: 'low' | 'medium' | 'high' | 'critical'
  createdAt: string
  updatedAt: string
  dueDate?: string
  teamMembers: string[]
  tags: string[]
  analysisId?: string
}

export interface Task {
  id: string
  projectId: string
  title: string
  description: string
  status: 'todo' | 'in-progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee?: string
  dueDate?: string
  createdAt: string
  updatedAt: string
  tags: string[]
}

export interface Analysis {
  id: string
  projectId: string
  score: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  createdAt: string
  documentName: string
  criticalIssues: number
  missingElements: number
  stakeholderQuestions: number
}

