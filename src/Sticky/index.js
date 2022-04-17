import React, { useContext, useRef } from "react";

import {
  useStickyActions,
  useStickyState,
  StickySectionContext,
  StickyProvider
} from "./Context";

import {
  useObserveTopSentinels,
  useObserveBottomSentinels,
  useSentinelOffsets
} from "./hooks";

import styles from "./index.module.scss";

// https://stackoverflow.com/questions/40032592/typescript-workaround-for-rest-props-in-react
/**
 * Делаем элемент липким
 */
function Sticky({ children, as = "div", className = "", ...rest }) {
  const { topSentinelRef, bottomSentinelRef } = useContext(
    StickySectionContext
  );
  const dispatch = useStickyActions();

  // Так мы можем получить правильный дочерний целевой элемент
  // из верхнего или нижнего датчика.
  const addStickyRef = stickyRef => {
    dispatch.addStickyRef(topSentinelRef, bottomSentinelRef, stickyRef);
  };

  const Component = as;

  return (
    <Component
      ref={addStickyRef}
      className={styles.sticky + className || ` ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
}

const noop = () => {};

/**
 * Раздел, в котором наблюдается элемент <Sticky/>
 */
function StickyBoundary({
  as = "section",
  onChange = noop,
  onStuck = noop,
  onUnstuck = noop,
  children,
  ...rest
}) {
  const Component = as;

  const { debug } = useStickyState();

  const topSentinelRef = useRef(null);
  const bottomSentinelRef = useRef(null);

  const { bottomSentinelHeight, topSentinelMarginTop } = useSentinelOffsets(
    topSentinelRef
  );

  useObserveTopSentinels(topSentinelRef, {
    events: {
      onChange,
      onStuck,
      onUnstuck
    }
  });

  useObserveBottomSentinels(bottomSentinelRef, {
    events: {
      onChange,
      onStuck,
      onUnstuck
    }
  });

  const value = { topSentinelRef, bottomSentinelRef };

  return (
    <StickySectionContext.Provider value={value}>
      <Component className={styles.sticky__section} {...rest}>
        <div
          ref={topSentinelRef}
          style={{ marginTop: `-${topSentinelMarginTop}` }}
          className={
            styles.sticky__sentinel_top +
            (debug ? " sticky__sentinel_debug" : "")
          }
        >
          от шапки
        </div>
        {children}
        <div
          ref={bottomSentinelRef}
          style={{
            height: `${bottomSentinelHeight}`
          }}
          className={
            styles.sticky__sentinel_bottom +
            (debug ? " sticky__sentinel_debug" : "")
          }
        >
          до тапки
        </div>
      </Component>
    </StickySectionContext.Provider>
  );
}

/**
 * Ссылка на липкое окно просмотра
 */
function StickyRoot({ children, as: Component = "div", ...rest }) {
  const dispatch = useStickyActions();

  const addContainerRef = containerRef => {
    dispatch.setContainerRef(containerRef);
  };

  return (
    <Component ref={addContainerRef} {...rest}>
      <section style={{ zIndex: 1000, position: "absolute" }}>
        <button style={{ height: "4rem" }} onClick={dispatch.toggleDebug}>
          Отладка i/o
        </button>
      </section>
      {children}
    </Component>
  );
}

/**
 * Предоставляет липкий контекст для дерева липких компонентов.
 */
function StickyViewport({ children, as = "div", ...rest }) {
  return (
    <StickyProvider>
      <StickyRoot as={as} {...rest}>
        {children}
      </StickyRoot>
    </StickyProvider>
  );
}

export { StickyViewport, StickyBoundary, Sticky };
