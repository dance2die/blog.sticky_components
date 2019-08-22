import { useState, useRef, useEffect } from "react";

import { useStickyState } from "./Context";

/**
 * Retrieve TOP & BOTTOM sentinel refs
 * and calculated dimensions to adjust their positions
 * within sticky boundary
 */
function useSentinels() {
  const [targetHeight, setTargetHeight] = useState("");
  const [sentinelMarginTop, setSentinelMarginTop] = useState("");
  const { stickyRefs } = useStickyState();
  const topSentinelRef = useRef(null);
  const bottomSentinelRef = useRef(null);

  // Move the sentinel up by the top margin of the sticky component
  useEffect(() => {
    const topSentinel = stickyRefs.get(topSentinelRef.current);

    const topStyle = window.getComputedStyle(topSentinel);
    const getProp = name => topStyle.getPropertyValue(name);
    const paddingtop = getProp("padding-top");
    const paddingBottom = getProp("padding-bottom");
    const height = getProp("height");
    const marginTop = getProp("margin-top");

    const targetHeight = `calc(${marginTop} +
        ${paddingtop} +
        ${height} +
        ${paddingBottom})`;

    setTargetHeight(targetHeight);
    setSentinelMarginTop(marginTop);
  }, [stickyRefs]);

  return { targetHeight, sentinelMarginTop, topSentinelRef, bottomSentinelRef };
}

/**
 * Observe the TOP sentinel and dispatch sticky events
 * @param {React.MutableRefObject<T>} topSentinelRef Ref to underlying TOP sentinel
 */
// https://developers.google.com/web/updates/2017/09/sticky-headers
function useObserveTopSentinels(
  topSentinelRef,
  {
    /**
     * @param {Function} onStuck dispatched when TOP sentinel is unstuck
     * @param {Function} onUnstuck dispatched when TOP sentinel is stuck
     * @param {Function} onChange dispatched when TOP sentinel is either stuck or unstuck
     */
    events: { onStuck, onUnstuck, onChange }
  }
) {
  const { stickyRefs, containerRef } = useStickyState();

  useEffect(() => {
    if (!containerRef) return;
    if (!containerRef.current) return;

    const root = containerRef.current;
    const options = { threshold: [0], root };

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const target = stickyRefs.get(entry.target);
        const targetInfo = entry.boundingClientRect;
        const rootBoundsInfo = entry.rootBounds;

        let type = undefined;
        // Started sticking.
        if (targetInfo.bottom < rootBoundsInfo.top) {
          type = "stuck";
          onStuck(target);
        }

        // Stopped sticking.
        if (
          targetInfo.bottom >= rootBoundsInfo.top &&
          targetInfo.bottom < rootBoundsInfo.bottom
        ) {
          type = "unstuck";
          onUnstuck(target);
        }

        type && onChange({ type, target });
      });
    }, options);

    const sentinel = topSentinelRef.current;
    sentinel && observer.observe(sentinel);
    return () => {
      observer.unobserve(sentinel);
    };
  }, [topSentinelRef, onChange, onStuck, onUnstuck, stickyRefs, containerRef]);
}

/**
 * Observe the BOTTOM sentinel and dispatch sticky events
 * @param {React.MutableRefObject<T>} topSentinelRef Ref to underlying BOTTOM sentinel
 */
function useObserveBottomSentinels(
  bottomSentinelRef,
  {
    /**
     * @param {Function} onStuck dispatched when TOP sentinel is unstuck
     * @param {Function} onUnstuck dispatched when TOP sentinel is stuck
     * @param {Function} onChange dispatched when TOP sentinel is either stuck or unstuck
     */ events: { onStuck, onUnstuck, onChange }
  }
) {
  const { stickyRefs, containerRef } = useStickyState();

  useEffect(() => {
    if (!containerRef) return;
    if (!containerRef.current) return;

    const root = containerRef.current;
    const options = { threshold: [1], root };

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const target = stickyRefs.get(entry.target);
        const targetInfo = entry.boundingClientRect;
        const rootBoundsInfo = entry.rootBounds;
        const ratio = entry.intersectionRatio;

        let type = undefined;
        // Started sticking.
        if (targetInfo.bottom > rootBoundsInfo.top && ratio === 1) {
          type = "stuck";
          onStuck(target);
        }

        // Stopped sticking.
        if (
          targetInfo.top < rootBoundsInfo.top &&
          targetInfo.bottom < rootBoundsInfo.bottom
        ) {
          type = "unstuck";
          onUnstuck(target);
        }

        type && onChange({ type, target });
      });
    }, options);

    const sentinel = bottomSentinelRef.current;
    sentinel && observer.observe(sentinel);
    return () => {
      observer.unobserve(sentinel);
    };
  }, [
    bottomSentinelRef,
    onChange,
    onStuck,
    onUnstuck,
    stickyRefs,
    containerRef
  ]);
}

export { useSentinels, useObserveTopSentinels, useObserveBottomSentinels };
