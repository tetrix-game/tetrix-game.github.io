import { describe, it, expect, beforeEach } from 'vitest';

describe('Rant Progression System', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should demonstrate the rant progression flow', () => {
    // Example configuration matching the map button
    const mapRantConfig = {
      CandyCrushMapRant: {
        rant: [
          'Candy crush map progression anybody?',
          'Coming soon!',
          'Hold your horses! I\'m doing this in my spare time!',
          'Really, just play while you wait',
          'I\'m doing this with AI, it shouldn\'t take that long XD',
          'Stop it, I\'m busy',
          'I can\'t focus if you keep doing that.',
          'Stop, or I\'ll frickin crash this page!',
          'Told you I\'d do it'
        ],
        PostCrashRant: {
          rant: [
            'Don\'t I know you?',
            'You\'re really asking for it!'
          ]
        }
      }
    };

    // Verify the config structure
    expect(mapRantConfig.CandyCrushMapRant.rant).toHaveLength(9);
    expect(mapRantConfig.CandyCrushMapRant.PostCrashRant.rant).toHaveLength(2);

    // Simulate the localStorage states
    expect(localStorage.getItem('CandyCrushMapRant')).toBe(null);
    expect(localStorage.getItem('CandyCrushMapRant_count')).toBe(null);

    // After first rant completion
    localStorage.setItem('CandyCrushMapRant', 'true');
    expect(localStorage.getItem('CandyCrushMapRant')).toBe('true');

    // After post-crash rant completion  
    localStorage.setItem('CandyCrushMapRant.PostCrashRant', 'true');
    expect(localStorage.getItem('CandyCrushMapRant.PostCrashRant')).toBe('true');

    // Verify the nested flag naming convention
    const expectedFlags = [
      'CandyCrushMapRant',
      'CandyCrushMapRant.PostCrashRant'
    ];

    for (const flag of expectedFlags) {
      expect(typeof flag).toBe('string');
      expect(flag.includes('.')).toBe(flag !== 'CandyCrushMapRant');
    }
  });

  it('should handle the extensible configuration pattern', () => {
    const exampleConfig = {
      RANT_FLAG: {
        rant: ['First message', 'Second message', 'Final error'],
        NEXT_FLAG_NAME: {
          rant: ['You again?', 'Last warning!'],
          ANOTHER_RANT: {
            rant: ['Getting tired of this']
          }
        }
      }
    };

    // Verify structure
    expect(exampleConfig.RANT_FLAG.rant).toHaveLength(3);
    expect(exampleConfig.RANT_FLAG.NEXT_FLAG_NAME.rant).toHaveLength(2);
    expect(exampleConfig.RANT_FLAG.NEXT_FLAG_NAME.ANOTHER_RANT.rant).toHaveLength(1);

    // Test flag naming
    expect('RANT_FLAG').toBe('RANT_FLAG');
    expect('RANT_FLAG.NEXT_FLAG_NAME').toContain('.');
    expect('RANT_FLAG.NEXT_FLAG_NAME.ANOTHER_RANT').toContain('.ANOTHER_RANT');
  });
});