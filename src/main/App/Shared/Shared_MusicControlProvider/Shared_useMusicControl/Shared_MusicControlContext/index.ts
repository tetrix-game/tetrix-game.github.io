import { createContext } from 'react';

import type { Shared_MusicControlContextType } from '../../types';

export const Shared_MusicControlContext =
  createContext<Shared_MusicControlContextType | null>(null);
