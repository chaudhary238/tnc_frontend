export interface Policy {
  id: string;
  policy_name: string;
  policy_summary: string;
}

export interface ImportantTerm {
    term: string;
    description: string;
    details?: string[];
    user_must_know: string;
}

export interface Message {
  from: 'user' | 'ai';
  text: string;
  policies?: Policy[];
  recommendedPoliciesWithMetrics?: RecommendedPolicyWithMetrics[];
}

export interface RecommendedPolicyWithMetrics {
  policy: Policy;
  insurer_metrics: { [key: string]: unknown };
}

export interface InitialQueryResponse {
  action: 'show_policies' | 'ask_clarification' | 'unrelated_to_health_insurance' | 'general_insurance_query' | 'recommend_policies' | 'error';
  policies?: Policy[];
  message?: string;
  user_requirements?: string; // New field from backend
  recommended_policies_with_metrics?: RecommendedPolicyWithMetrics[]; // New field
}

export interface ChatInfo {
  id: string;
  title: string;
} 