import { mockAccounts, type MockAccount } from './mockAccounts';

const STORAGE_KEY = 'mockAccountIndex';

export function getNextMockAccount(): MockAccount {
  if (typeof window === 'undefined') {
    return mockAccounts[0];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let index = stored ? parseInt(stored, 10) : 0;
    
    // Get next account (round-robin)
    const account = mockAccounts[index];
    
    // Increment and wrap
    index = (index + 1) % mockAccounts.length;
    localStorage.setItem(STORAGE_KEY, index.toString());
    
    return account;
  } catch (error) {
    console.error('Failed to get mock account:', error);
    return mockAccounts[0];
  }
}

export function getAllMockAccounts(): MockAccount[] {
  return mockAccounts;
}
