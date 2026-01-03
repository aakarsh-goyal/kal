export interface RemedialMeasure {
  category: string;
  items: string[];
}

export interface KeyHighlight {
  label: string;
  value: string;
}

export interface AstrologyReport {
  clientName: string;
  // New Academic Structure Fields
  ascendant: string;
  moonSign: string;
  keyObservations: string[];
  
  timelineAnalysis: {
    label: string;
    value: string;
  }[];
  
  personalityHealth: {
    temperament: string;
    caution: string;
    physical: string;
    advice: string;
  };
  
  structuredRemedies: {
    gemstones: string;
    rudraksha: string;
    rituals: string[];
    lifestyle: string[];
  };
  
  botanicalRemedies: string[]; // List of trees
  
  spiritualPilgrimage: string[]; // List of temples
  
  // Visual Generation Fields
  summaryHighlights: KeyHighlight[];
  visualThemeDescription: string;
  visualSymbolismExplanation: string;
  // Removed generated image fields
}

export interface GenerationState {
  isLoading: boolean;
  error: string | null;
  report: AstrologyReport | null;
}