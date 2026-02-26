export interface MockAccount {
  id: string;
  name: string;
  email: string;
  password: string;
}

export const mockAccounts: MockAccount[] = [
  {
    id: 'mock-nathan',
    name: 'Nathan Adams',
    email: 'nathan@example.com',
    password: 'ilovegolf',
  },
  {
    id: 'mock-sam',
    name: 'Sam Walters',
    email: 'sam@example.com',
    password: 'ilovegolf',
  },
  {
    id: 'mock-eliza',
    name: 'Eliza Smith',
    email: 'eliza@example.com',
    password: 'ilovegolf',
  },
  {
    id: 'mock-ozge',
    name: 'Ozge Osman',
    email: 'ozge@example.com',
    password: 'ilovegolf',
  },
  {
    id: 'mock-jeff',
    name: 'Jeff Freeman',
    email: 'jeff@example.com',
    password: 'ilovegolf',
  },
  {
    id: 'mock-brian',
    name: 'Brian Krump',
    email: 'brian@example.com',
    password: 'ilovegolf',
  },
];
