/**
 * TetrixReducer - Re-exports the combined reducer from the reducers module
 * 
 * This file maintains backward compatibility while delegating to the new
 * modular reducer structure in src/reducers/
 */

// Re-export everything from the new combined reducer
export { tetrixReducer, initialState, makeTileKey, parseTileKey } from '../../reducers';
