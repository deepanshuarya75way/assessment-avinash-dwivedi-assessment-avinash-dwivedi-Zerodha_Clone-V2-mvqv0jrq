import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Signup from '../landing_page/signup/Signup';

describe('Signup component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders account and logout actions when a user is already signed in', () => {
    localStorage.setItem(
      'zerodhaUser',
      JSON.stringify({
        fullName: 'John Doe',
        email: 'john@example.com',
        mobile: '9876543210',
      })
    );

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /account/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
    expect(screen.queryByText(/create account/i)).not.toBeInTheDocument();
  });
});
