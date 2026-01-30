import { createContext } from 'react';

import type { MusicControlContextType } from '../MusicControlContextType';

export const MusicControlContext = createContext<
  MusicControlContextType | null
>(null);
