import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Hero from '../landing_page/home/Hero';


//Teast suite for the Hero component
describe('Hero component', () => {
  test('renders the Hero component with correct content', () => {
    render(<Hero />);
    const heroElement = screen.getByAltText('Hero Image');
    expect(heroElement).toBeInTheDocument();
    expect(heroElement).toHaveAttribute('src', "media/images/homeHero.png");
  });

    test('renders the signup button with correct text', () => {
      render(<Hero />);
      const signupButton = screen.getByRole('button', { name: /signup/i});
      expect(signupButton).toBeInTheDocument();
      expect(signupButton).toHaveClass('btn-primary');
    });
});