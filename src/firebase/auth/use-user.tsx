'use client';

import { useRole } from '../provider';

/**
 * Compatibility hook that maps the new Role system 
 * to the previous user interface expectations.
 */
export function useUser() {
  const { role, isLoadingRole } = useRole();
  
  // Return a mock user object if role is set, 
  // otherwise null to trigger login/selection UI
  return { 
    user: role ? { uid: role, role } : null, 
    loading: isLoadingRole 
  };
}
