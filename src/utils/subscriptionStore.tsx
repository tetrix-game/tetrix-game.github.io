import { createContext, useContext, useRef, useState, useEffect, useCallback, ReactNode } from 'react';

export function deepFreeze<T>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Object.isFrozen(obj)) {
    return obj;
  }

  const propNames = Object.getOwnPropertyNames(obj);

  for (const name of propNames) {
    // @ts-ignore
    const value = obj[name];
    if (value && typeof value === 'object') {
      deepFreeze(value);
    }
  }

  return Object.freeze(obj);
}

export type Listener = () => void;

export interface Store<State, Action = any> {
  getState: () => State;
  subscribe: (listener: Listener) => () => void;
  dispatch: (action: Action) => void;
}

export function createSubscriptionStore<State, Action>(
  reducer: (state: State, action: Action) => State,
  initialState: State,
  name: string = 'Store'
) {
  const StoreContext = createContext<Store<State, Action> | null>(null);

  function Provider({ children, initialState: propInitialState }: { children: ReactNode, initialState?: State }) {
    // Allow overriding initial state via props, useful for testing or hydration
    const stateRef = useRef(deepFreeze(propInitialState !== undefined ? propInitialState : initialState));
    const listenersRef = useRef(new Set<Listener>());

    const getState = useCallback(() => stateRef.current, []);

    const subscribe = useCallback((listener: Listener) => {
      listenersRef.current.add(listener);
      return () => {
        listenersRef.current.delete(listener);
      };
    }, []);

    const dispatch = useCallback((action: Action) => {
      const newState = reducer(stateRef.current, action);
      if (newState !== stateRef.current) {
        stateRef.current = deepFreeze(newState);
        listenersRef.current.forEach((listener) => listener());
      }
    }, []);

    // Stable store object
    const store = useRef({
      getState,
      subscribe,
      dispatch
    }).current;

    return (
      <StoreContext.Provider value={store}>
        {children}
      </StoreContext.Provider>
    );
  }

  function useStore<Selected>(selector: (state: State) => Selected): Selected {
    const store = useContext(StoreContext);
    if (!store) {
      throw new Error(`use${name}Store must be used within a ${name}Provider`);
    }
    
    if (typeof selector !== 'function') {
        throw new Error(`use${name}Store must be called with a selector function.`);
    }

    const { subscribe, getState } = store;
    const [selectedSlice, setSelectedSlice] = useState(() => selector(getState()));

    useEffect(() => {
      const checkForUpdates = () => {
        const globalState = getState();
        const newSlice = selector(globalState);

        if (newSlice !== selectedSlice) {
          setSelectedSlice(newSlice);
        }
      };

      const unsubscribe = subscribe(checkForUpdates);
      // Check immediately in case state changed before subscription
      checkForUpdates();
      
      return unsubscribe;
    }, [selector, getState, selectedSlice, subscribe]);

    return selectedSlice;
  }

  function useDispatch() {
    const store = useContext(StoreContext);
    if (!store) {
      throw new Error(`use${name}Dispatch must be used within a ${name}Provider`);
    }
    return store.dispatch;
  }

  return { Provider, useStore, useDispatch, StoreContext };
}
