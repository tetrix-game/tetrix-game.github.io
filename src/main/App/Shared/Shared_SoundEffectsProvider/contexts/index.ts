import { createContext } from 'react';

import type { Shared_SoundEffectsContextValue } from './types';

export const Shared_SoundEffectsContext = createContext<Shared_SoundEffectsContextValue | undefined>(undefined);
