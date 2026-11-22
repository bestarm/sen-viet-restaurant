import { useState, useEffect } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export interface BreakpointState {
  isMobile: boolean;    // < 640px (Điện thoại cầm tay)
  isTablet: boolean;    // 640px - 1024px (iPad / Kiosk bếp)
  isDesktop: boolean;   // >= 1024px (PC / Laptop quản lý)
  width: number;
  breakpoint: Breakpoint;
}

/**
 * Hook xác định kích thước màn hình và thiết bị theo chuẩn Tailwind Breakpoints.
 * - Mobile: < 640px (sm)
 * - Tablet: 640px - 1024px (md - lg)
 * - Desktop: >= 1024px (lg+)
 */
export function useBreakpoint(): BreakpointState {
  const getBreakpointState = (width: number): BreakpointState => {
    const isMobile = width < 640;
    const isTablet = width >= 640 && width < 1024;
    const isDesktop = width >= 1024;
    const breakpoint: Breakpoint = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

    return {
      isMobile,
      isTablet,
      isDesktop,
      width,
      breakpoint,
    };
  };

  const [state, setState] = useState<BreakpointState>(() => {
    if (typeof window !== 'undefined') {
      return getBreakpointState(window.innerWidth);
    }
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      width: 1280,
      breakpoint: 'desktop',
    };
  });

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleResize = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setState(getBreakpointState(window.innerWidth));
      }, 50);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return state;
}

export default useBreakpoint;
