'use client';

import React from 'react';
import StaggeredMenu from './staggered-menu';

export const StaggeredMenuDemo = () => {
  const menuItems = [
    { label: 'Venues & Estates', ariaLabel: 'Go to venues', link: '#/discover' },
    { label: 'Spatial Planner', ariaLabel: 'Open planner', link: '#/plans' },
    { label: 'Saved Estates', ariaLabel: 'View saved', link: '#/saved' },
    { label: 'Client Portal', ariaLabel: 'Open account', link: '#/account' },
    { label: 'Home Portal', ariaLabel: 'Return home', link: '#/' },
  ];

  const socialItems = [
    { label: 'LinkedIn', link: 'https://linkedin.com' },
    { label: 'Instagram', link: 'https://instagram.com' },
    { label: 'X', link: 'https://x.com' },
    { label: 'Facebook', link: 'https://facebook.com' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a1a', position: 'relative' }}>
      <StaggeredMenu
        position="right"
        items={menuItems}
        socialItems={socialItems}
        displaySocials={true}
        displayItemNumbering={true}
        menuButtonColor="#fff"
        openMenuButtonColor="#fff"
        changeMenuColorOnOpen={true}
        colors={['#1b190d', '#2c2514', '#c5a880']}
        accentColor="#c5a880"
        onMenuOpen={() => console.log('StaggeredMenu opened')}
        onMenuClose={() => console.log('StaggeredMenu closed')}
      />
    </div>
  );
};

export default StaggeredMenuDemo;
