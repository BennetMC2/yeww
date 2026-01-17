// Barrel export for all prompt sections
export {
  buildIdentitySection,
  buildMissionSection,
  buildUserContextSection,
} from './identity';

export {
  buildHealthKnowledgeSection,
  buildCurrentMetricsSection,
} from './healthKnowledge';

export {
  buildConversationSection,
  buildSessionContextSection,
} from './conversation';

export { buildVoiceSection } from './voice';

export { buildSafetySection } from './safety';

export { buildExamplesSection } from './examples';

export {
  buildPatternGuidelines,
  buildActivePatterns,
} from './patterns';

export { buildFormattingSection } from './formatting';
