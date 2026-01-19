
// Updated to use backend API instead of local storage
// Using native fetch instead of axios to avoid additional dependencies

// Base API URL - configurable for different environments
const API_BASE_URL = typeof window !== 'undefined' && window.location ? 
  `${window.location.protocol}//${window.location.hostname}:3001/api` : 
  'http://localhost:3001/api';

export const BlockchainAPI = {
  /**
   * Submit a transaction to the backend blockchain
   */
  submit: async (txData: any, actorGLN: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/blockchain/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payload: txData,
          actorGLN
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error submitting transaction:', error);
      throw error;
    }
  },

  /**
   * Fetch all blocks from the backend
   */
  getBlocks: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/blockchain/blocks`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching blocks:', error);
      return [];
    }
  },

  /**
   * Get blockchain status from the backend
   */
  getStatus: async () => {
    try {
      // Fetch blockchain length
      const lengthResponse = await fetch(`${API_BASE_URL}/blockchain/length`);
      
      if (!lengthResponse.ok) {
        throw new Error(`HTTP error! status: ${lengthResponse.status}`);
      }
      
      const lengthData = await lengthResponse.json();
      const height = lengthData.length;
      
      // Fetch validation status
      const validateResponse = await fetch(`${API_BASE_URL}/blockchain/validate`);
      
      if (!validateResponse.ok) {
        throw new Error(`HTTP error! status: ${validateResponse.status}`);
      }
      
      const validation = await validateResponse.json();
      
      return {
        network: 'E-Ledger Permissioned Mainnet',
        height,
        status: validation.valid ? 'SYNCHRONIZED' : 'TAMPERED',
        lastBlock: null // We can enhance this with an API to get the latest block
      };
    } catch (error) {
      console.error('Error getting status:', error);
      return {
        network: 'E-Ledger Permissioned Mainnet',
        height: 0,
        status: 'ERROR',
        lastBlock: null
      };
    }
  }
};
