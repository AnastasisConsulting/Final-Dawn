// Final_Dawn_of_Eideus/apps/dawn-ui/hooks/useKernel.tsx

import React, { createContext, useContext, useEffect, useMemo, useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import masterIndex from '../src/world/master_locations_index.json';
import { bindWorldBundle } from '@eideus/world-bundle-binder';
import { CoordinateMapper } from '@eideus/universe-mapper';

/**
 * The Kernel is the central orchestration hook for the Dawn UI.
 */
type KernelState = {
  activeWorldBundle: any;
  visitedNodes: string[];
  address: { full: string; localId: string };
  locationData: any;
  isWarping: boolean;
  navContext: {
    civId?: string;
    civIndex?: number;
    cityId?: string;
    cityIndex?: number;
    locId?: string;
    locIndex?: number;
    sessionId?: string;
  };
};

type KernelAction =
  | { type: 'SET_WARP_STATE'; active: boolean }
  | { type: 'SET_WORLD_BUNDLE'; payload: any }
  | { type: 'SET_ADDRESS'; payload: { full: string; localId: string } }
  | { type: 'SET_NAV_CONTEXT'; payload: Partial<KernelState['navContext']> }
  | { type: 'HYDRATE_KERNEL'; payload: Partial<KernelState> };

type KernelContextValue = {
  state: KernelState;
  dispatch: (action: KernelAction) => void;
  loadLocationFromAddress: (addressKey: string) => Promise<string | undefined>;
  ensureGlobalSession: () => Promise<string | undefined>;
  hydrate: (data: Partial<KernelState>) => void;
};

const KernelContext = createContext<KernelContextValue | null>(null);

export const KernelProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // --- Real Reactive State ---
  const [isWarping, setIsWarping] = useState(false);
  const [activeWorldBundle, setActiveWorldBundle] = useState<any>(null);
  const [address, setAddress] = useState({ full: '', localId: '' });
  const [navContext, setNavContext] = useState<KernelState['navContext']>({});

  // Placeholder for visited nodes/location data
  const [visitedNodes] = useState<string[]>([]);
  const [locationData] = useState<any>(null);

  /**
   * We still use useMemo to expose the state as a single object 
   * to maintain compatibility with your existing panel components.
   */
  const state = useMemo(() => ({
    activeWorldBundle,
    visitedNodes,
    address,
    locationData,
    isWarping,
    navContext
  }), [activeWorldBundle, visitedNodes, address, locationData, isWarping, navContext]);

  /**
   * Central Dispatcher: Now correctly triggers re-renders
   */
  const dispatch = useCallback((action: KernelAction) => {
    console.log("[Kernel Dispatch]", action);

    switch (action.type) {
      case 'SET_WARP_STATE':
        setIsWarping(action.active);
        break;
      case 'SET_WORLD_BUNDLE':
        setActiveWorldBundle(action.payload);
        break;
      case 'SET_ADDRESS':
        setAddress(action.payload);
        break;
      case 'SET_NAV_CONTEXT':
        setNavContext((prev) => ({ ...prev, ...action.payload }));
        break;
      case 'HYDRATE_KERNEL':
        if (action.payload.address) setAddress(action.payload.address);
        if (action.payload.navContext) setNavContext(action.payload.navContext);
        break;
      default:
        break;
    }
  }, []);

  /**
   * Location Loader: Fetches associated planet JSONs.
   */
  const loadLocationFromAddress = useCallback(async (addressKey: string) => {
    const registry = (masterIndex as any).registry;
    if (!registry) return;

    const entry = registry[addressKey];
    if (!entry) {
      console.error(`[Kernel] Failed to resolve address: ${addressKey}`);
      return;
    }

    try {
      const rootDir = masterIndex.meta.root_directory;
      const base = `${rootDir}/${entry.directory}`;

      const [act, lore, quests, map, sourceSeed] = await Promise.all([
        fetch(`/${base}/${entry.files.act}`).then(r => r.json()),
        fetch(`/${base}/${entry.files.lorebook}`).then(r => r.json()),
        fetch(`/${base}/${entry.files.quests}`).then(r => r.json()),
        fetch(`/${base}/${entry.files.sector_map}`).then(r => r.json()),
        fetch(`/${base}/source_seed.json`).then(r => (r.ok ? r.json() : null)).catch(() => null)
      ]);

      let worldBindings: any = null;
      try {
        worldBindings = bindWorldBundle({ lorebook: lore, sectorMap: map, quests, sourceSeed });
      } catch (bindErr) {
        console.warn('[Kernel] World bundle bind failed:', bindErr);
      }

      const worldSeed = String(lore?.world_id ?? addressKey);
      const worldRng = CoordinateMapper.createSeededRng(worldSeed);

      const bundle = {
        id: addressKey,
        name: entry.name,
        directory: entry.directory,
        act,
        lore,
        quests,
        map,
        sectorMap: map,
        sourceSeed,
        worldSeed,
        worldRng,
        worldBindings,
        textureUrl: entry.files.texture ? `/${base}/${entry.files.texture}` : `/${base}/texture.png`,
        timestamp: Date.now()
      };

      // INIT BACKEND SESSION
      try {
        const sessionId = `sess_${addressKey}_${Date.now()}`;
        console.log('[Kernel] Initializing Orchestrator Session:', sessionId);

        console.log('[Kernel] Sending /land request...'); // DEBUG
        const response = await fetch('http://localhost:4000/land', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            planetCode: addressKey,
            playerAffinity: { buckets: [] }, // TODO: pulling real affinity
            worldFiles: {
              lorebook: lore,
              sectorMap: map,
              quests: quests,
              sourceSeed: sourceSeed
            }
          })
        });
        console.log('[Kernel] /land response status:', response.status); // DEBUG

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server responded with ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log("[Kernel] Session established:", data);

        // Correctly dispatching using the new state setters
        dispatch({ type: 'SET_WORLD_BUNDLE', payload: bundle });
        dispatch({ type: 'SET_ADDRESS', payload: { full: addressKey, localId: entry.name } });
        dispatch({ type: 'SET_NAV_CONTEXT', payload: { sessionId } });

        // Broadcast for Flight Engine
        window.dispatchEvent(new CustomEvent('orbitgen-assets-ready', { detail: { id: addressKey, textureUrl: bundle.textureUrl } }));

        return sessionId;

      } catch (landErr) {
        console.error('[Kernel] CRITICAL: Failed to initialize backend session:', landErr);
        // Dispatch session anyway so UI doesn't completely break, but log aggressively
        dispatch({ type: 'SET_WORLD_BUNDLE', payload: bundle });
        dispatch({ type: 'SET_ADDRESS', payload: { full: addressKey, localId: entry.name } });
        return undefined;
      }

    } catch (err) {
      console.error("[Kernel] Error loading planet JSON assets:", err);
      return undefined;
    }
  }, [dispatch]);

  /**
   * Global Session Initializer: Creates a "Void" session if no location is selected.
   */
  const ensureGlobalSession = useCallback(async () => {
    const sessionId = `sess_global_void_${Date.now()}`;
    console.log('[Kernel] Initializing Global Void Session:', sessionId);

    try {
      const response = await fetch('http://localhost:4000/land', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          planetCode: 'GLOBAL_VOID',
          playerAffinity: { buckets: [] },
          worldFiles: {
            lorebook: { world_id: 'void', name: 'The Void' },
            sectorMap: {},
            quests: [],
            sourceSeed: {}
          }
        })
      });

      if (!response.ok) {
        console.warn('[Kernel] Global session init failed (non-critical):', await response.text());
        // We continue anyway because the UI needs *some* session ID to function.
      }

      dispatch({ type: 'SET_NAV_CONTEXT', payload: { sessionId } });
      return sessionId;

    } catch (err) {
      console.error('[Kernel] Failed to contact backend for global session:', err);
      // Fallback: return a local session ID so UI doesn't block, even if backend is dead.
      dispatch({ type: 'SET_NAV_CONTEXT', payload: { sessionId } });
      return sessionId;
    }
  }, [dispatch]);

  /**
   * Boot Listener: Detects incoming flight-to-ground handoffs.
   */
  useEffect(() => {
    const handoffKey = searchParams.get('land_at');

    if (handoffKey) {
      loadLocationFromAddress(handoffKey);

      const newParams = new URLSearchParams(searchParams);
      newParams.delete('land_at');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, loadLocationFromAddress, setSearchParams]);

  const value = useMemo(() => ({
    state,
    dispatch,
    loadLocationFromAddress,
    ensureGlobalSession,
    hydrate: (data: Partial<KernelState>) => dispatch({ type: 'HYDRATE_KERNEL', payload: data })
  }), [state, dispatch, loadLocationFromAddress, ensureGlobalSession]);

  return (
    <KernelContext.Provider value={value}>
      {children}
    </KernelContext.Provider>
  );
};

/**
 * Accessor hook for the Kernel context.
 * Ensures all consumers share a single source of truth.
 */
export const useKernel = () => {
  const ctx = useContext(KernelContext);
  if (!ctx) {
    throw new Error('useKernel must be used within a KernelProvider');
  }
  return ctx;
};
