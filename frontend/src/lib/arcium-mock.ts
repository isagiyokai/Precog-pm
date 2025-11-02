import { EncryptedBetData } from '../types';

/**
 * Mock Arcium encryption service
 * In production, this would use @arcium-hq/client
 */
export const encryptBet = async (data: EncryptedBetData): Promise<string> => {
  // Simulate encryption delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Generate mock encrypted blob
  const jsonString = JSON.stringify(data);
  const base64 = btoa(jsonString);
  const mockBlob = `0x${Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('')}`;
  
  return mockBlob;
};

export const generateNonce = (): string => {
  return Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
};

export const getMxeProgramId = (): string => {
  return `mxe_${Array.from({ length: 8 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('')}`;
};
