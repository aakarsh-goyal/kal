export interface RemedialMeasure {
  category: string;
  items: string[];
}

export interface KeyHighlight {
  label: string;
  value: string;
}

export interface GeneratedVisuals {
  pilgrimageMap?: string;    // Base64 string of the generated map
  botanicalSketch?: string;  // Base64 string of the botanical illustration
  careerVisual?: string;     // Base64 string of the career symbolism
  gemstoneVisual?: string;   // Base64 string for the gemstone
  personalityVisual?: string;// Base64 string for personality aura/symbol
  planetaryVisual?: string;  // Base64 string for general planetary alignment
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
  
  // Holds the AI generated images
  generatedVisuals?: GeneratedVisuals;
}

export interface GenerationState {
  isLoading: boolean;
  error: string | null;
  report: AstrologyReport | null;
}