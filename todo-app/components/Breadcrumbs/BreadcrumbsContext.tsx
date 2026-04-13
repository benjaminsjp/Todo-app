'use client';

import React from 'react';

const BreadcrumbLabelContext = React.createContext<{
  labels: Record<string, string>;
  setLabel: (segment: string, label: string) => void;
  rootLabel: string;
}>({
  labels: {},
  setLabel: () => {},
  rootLabel: 'Hjem',
});

export function BreadcrumbProvider({
  children,
  rootLabel = 'Hjem',
}: {
  children: React.ReactNode;
  rootLabel?: string;
}) {
  const [labels, setLabels] = React.useState<Record<string, string>>({});

  const setLabel = React.useCallback((segment: string, label: string) => {
    setLabels((prev) => {
      if (prev[segment] === label) return prev;
      return { ...prev, [segment]: label };
    });
  }, []);

  return (
    <BreadcrumbLabelContext.Provider value={{ labels, setLabel, rootLabel }}>
      {children}
    </BreadcrumbLabelContext.Provider>
  );
}

export function useBreadcrumbLabels() {
  return React.useContext(BreadcrumbLabelContext);
}

export function useSetBreadcrumbLabel(segment: string, label: string) {
  const { setLabel } = useBreadcrumbLabels();
  React.useEffect(() => {
    if (segment && label) setLabel(segment, label);
  }, [segment, label, setLabel]);
}