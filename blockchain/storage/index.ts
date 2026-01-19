
import { Block } from '../block';

// Updated to use backend API instead of localStorage
const API_BASE_URL = typeof window !== 'undefined' && window.location ? 
  `${window.location.protocol}//${window.location.hostname}:3001/api` : 
  'http://localhost:3001/api';

export const BlockchainStorage = {
  saveChain: async (blocks: Block[]): Promise<void> => {
    console.warn('Direct chain storage not supported in client. Use backend API.');
  },

  getChain: async (): Promise<Block[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/blockchain/blocks`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching blockchain from backend:', error);
      return [];
    }
  },

  appendBlock: async (block: Block): Promise<void> => {
    console.warn('Direct block appending not supported in client. Use backend API.');
  },

  getLastBlock: async (): Promise<Block | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/blockchain/length`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { length } = await response.json();
      
      if (length === 0) return null;
      
      const blockResponse = await fetch(`${API_BASE_URL}/blockchain/block/${length - 1}`);
      if (!blockResponse.ok) {
        throw new Error(`HTTP error! status: ${blockResponse.status}`);
      }
      return await blockResponse.json();
    } catch (error) {
      console.error('Error fetching last block from backend:', error);
      return null;
    }
  }
};
