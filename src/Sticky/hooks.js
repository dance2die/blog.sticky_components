import { useState, useEffect } from "react";

import { useStickyState } from "./Context";

function useSentinelOffsets(topSentinelRef) {
  const { stickyRefs } = useStickyState();
  const [bottomSentinelHeight, setBottomSentinelHeight] = useState("");
  const [topSentinelMarginTop, setTopSentinelMarginTop] = useState("");

  // Переместите датчик вверх по верхнему краю липкого компонента
  useEffect(() => {
    const stickyNode = stickyRefs.get(topSentinelRef.current);

    const topStyle = window.getComputedStyle(stickyNode);
    const getProp = name => topStyle.getPropertyValue(name);
    const paddingtop = getProp("padding-top");
    const paddingBottom = getProp("padding-bottom");
    const height = getProp("height");
    const marginTop = getProp("margin-top");

    const bottomSentinelHeight = `calc(${marginTop} +
        ${paddingtop} +
        ${height} +
        ${paddingBottom})`;

    setBottomSentinelHeight(bottomSentinelHeight);
    setTopSentinelMarginTop(marginTop);
  }, [stickyRefs, topSentinelRef]);

  return { bottomSentinelHeight, topSentinelMarginTop };
}

/**
 * Соблюдайте ТОП датчик и отправляйте липкие события
 * @param {React.MutableRefObject<T>} topSentinelRef Ссылка на базовый верхний датчик
 */
// https://developers.google.com/web/updates/2017/09/sticky-headers
function useObserveTopSentinels(
  topSentinelRef,
  {
    /**
     * @param {Function} onStuck отправляется, когда верхний датчик отлип
     * @param {Function} onUnstuck отправляется, когда верхний датчик влип
     * @param {Function} onChange отправляется, когда верхний датчик влип или отлип
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
        // Начало прилипания.
        if (targetInfo.bottom < rootBoundsInfo.top) {
          type = "stuck";
          onStuck(target);
        }

        // Перестал прилипать (отлип).
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
 * Соблюдайте НИЖний датчик и отправляйте липкие события
 * @param {React.MutableRefObject<T>} topSentinelRef Ссылка на нижний датчик BOTTOM
 */
function useObserveBottomSentinels(
  bottomSentinelRef,
  {
    /**
     * @param {Function} onStuck Отправляется при отключении датчика TOP
     * @param {Function} onUnstuck Отправляется, когда датчик TOP застрял
     * @param {Function} onChange Отправляется, когда датчик TOP либо застрял, либо снят
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
        const targetRect = target.getBoundingClientRect();
        const bottomSentinelRect = entry.boundingClientRect;
        const rootBounds = entry.rootBounds;
        const intersectionRatio = entry.intersectionRatio;

        let type = undefined;

        if (
          bottomSentinelRect.top >= rootBounds.top &&
          bottomSentinelRect.bottom <= rootBounds.bottom &&
          intersectionRatio === 1 &&
          targetRect.y === 0
        ) {
          type = "stuck";
          onStuck(target);
        }

        if (bottomSentinelRect.top <= rootBounds.top) {
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

export {
  useSentinelOffsets,
  useObserveTopSentinels,
  useObserveBottomSentinels
};
