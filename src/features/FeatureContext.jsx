import React, { createContext, useContext } from 'react';

const FeatureContext = createContext(null);

export const FeatureProvider = ({ value, children }) => (
  <FeatureContext.Provider value={value}>{children}</FeatureContext.Provider>
);

export const useFeatureContext = () => {
  const value = useContext(FeatureContext);
  if (!value) {
    throw new Error('useFeatureContext must be used inside FeatureProvider');
  }
  return value;
};
