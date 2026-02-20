import React from 'react';

const Logo = () => {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Lesion Tracker"
      width={150}
      height={150}
      className="h-16 w-16 sm:h-20 sm:w-20 object-contain"
      fetchPriority="high"
    />
  );
};

export default Logo;
