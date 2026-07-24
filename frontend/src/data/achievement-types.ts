export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  category: 'story' | 'collection' | 'battle' | 'exploration' | 'challenge';
  icon?: string;
}
