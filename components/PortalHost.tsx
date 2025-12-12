import React, { createContext, useCallback, useContext, useState } from 'react';
import { StyleSheet, View } from 'react-native';

export interface PortalElement {
  id: string;
  component: React.ReactNode;
}

interface PortalContextType {
  addPortal: (id: string, component: React.ReactNode) => void;
  removePortal: (id: string) => void;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

export const PortalHost = ({ children }: { children: React.ReactNode }) => {
  const [portals, setPortals] = useState<Map<string, React.ReactNode>>(new Map());

  const addPortal = useCallback((id: string, component: React.ReactNode) => {
    setPortals((prev) => {
      const newMap = new Map(prev);
      newMap.set(id, component);
      return newMap;
    });
  }, []);

  const removePortal = useCallback((id: string) => {
    setPortals((prev) => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  return (
    <PortalContext.Provider value={{ addPortal, removePortal }}>
      {children}
      {/* Portal container: renders all portaled content on top */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {Array.from(portals.values()).map((component, index) => (
          <React.Fragment key={index}>{component}</React.Fragment>
        ))}
      </View>
    </PortalContext.Provider>
  );
};

export const usePortal = () => {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error('usePortal must be used within a PortalHost');
  }
  return context;
};
