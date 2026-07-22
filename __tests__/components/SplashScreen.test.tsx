import React from 'react';
import { render, screen, act } from '@testing-library/react';
import SplashScreen from '@/components/SplashScreen';

// Mock framer-motion to avoid animation issues in jsdom
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('SplashScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders without crashing and shows the logo', () => {
    render(<SplashScreen isVisible={true} type="login" />);
    
    // Check if the logo is rendered
    const logoImg = screen.getByAltText('Logo');
    expect(logoImg).toBeInTheDocument();
    
    // The component does not render the text "AZM Transport System"
    // Instead, if type="logout", it renders "Logging out..."
  });

  it('renders logout text when type is logout', () => {
    render(<SplashScreen isVisible={true} type="logout" />);
    expect(screen.getByText('Logging out...')).toBeInTheDocument();
  });
});
