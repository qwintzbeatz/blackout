## Recommendation: Review `repCalculator.ts` Usage for Client-Side Performance

While the `repCalculator.ts` functions themselves (like `calculateRep`) are not computationally intensive given the small number of graffiti types, their frequent or unoptimized invocation can still contribute to perceived slowness and unnecessary client-side processing, especially if they trigger numerous re-renders.

Now that we've addressed server-side data loading optimizations, let's examine how `repCalculator.ts` is used to ensure client-side performance is also robust.

### Potential Areas for Optimization:

1.  **Identify Call Sites:**
    *   Pinpoint all locations in your React components where functions from `repCalculator.ts` are called. This includes `calculateRep`, `recalculateRep`, `getQuickRep`, `calculateAllRepForSurface`, `getSurfaceRepRanking`, and `getRankProgress`.
    *   Pay particular attention to calls made directly in render functions or within `useEffect` hooks that might lack proper dependency arrays or cleanup.

2.  **Memoize Expensive Calculations (if applicable):**
    *   If any `repCalculator` function is called directly within a component's render logic, and its inputs (`surface`, `graffitiType`, `rep`, `options`) are stable across re-renders, wrap the call with `useMemo`. This prevents recalculation unless the inputs actually change.
    *   **Example (conceptual):**
        ```typescript
        const { rep, breakdown, tips } = useMemo(() => 
          calculateRep(selectedSurface, selectedGraffitiType, { hasStreakBonus: dailyStreak }),
          [selectedSurface, selectedGraffitiType, dailyStreak] 
        );
        ```

3.  **Memoize Components Displaying REP Information:**
    *   If components primarily display REP values (e.g., a `RepDisplay` component showing a player's current REP, rank, or progress), ensure they are wrapped in `React.memo`. This prevents them from re-rendering if their props haven't changed.
    *   **Example:**
        ```typescript
        // In RepDisplay.tsx
        const RepDisplay = ({ currentRep, rank, progress }) => { /* ... */ };
        export default React.memo(RepDisplay);
        ```

4.  **Debounce/Throttle Frequent Updates:**
    *   If REP calculations are tied to highly frequent events (e.g., continuous GPS updates, rapid map movements, or very fast user input), consider debouncing or throttling the function calls. This limits how often the calculation is performed.
    *   For example, if a "live REP preview" updates with every tiny movement, you might only want to update it every 500ms.

5.  **Review `calculateAllRepForSurface` and `getSurfaceRepRanking` Usage:**
    *   These functions iterate over all `GRAFFITI_TYPES`. While the list is small (11 items), if these functions are called frequently in a hot path (e.g., during every pixel scroll of a list of graffiti types), consider if their results can be memoized higher up in the component tree or even pre-calculated if the inputs are static.

By systematically reviewing where and how your REP calculations are performed and applying memoization techniques, you can prevent unnecessary work on the client-side, leading to a smoother and more responsive user experience.

This addresses the final point of optimizing other data loading/processing functions for better overall performance.

I will now update the task list.