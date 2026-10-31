import React, { forwardRef, memo, useCallback, useEffect, useRef } from 'react';
import { TextInput, } from 'react-native';
import { BottomSheetScrollView, } from '@gorhom/bottom-sheet';
import { revealOffset } from './revealOffset';
const SheetScrollViewComponent = forwardRef(({ children, onScroll, onLayout, onContentSizeChange, ...props }, ref) => {
    const scrollRef = useRef(null);
    const geometry = useRef({ offsetY: 0, viewportHeight: 0, contentHeight: 0 });
    const pendingFrame = useRef(null);
    const reveal = useCallback(() => {
        pendingFrame.current = null;
        const scroll = scrollRef.current;
        const innerView = scroll?.getInnerViewRef();
        const focused = TextInput.State.currentlyFocusedInput();
        if (!scroll || !innerView || !focused) {
            return;
        }
        focused.measureLayout(innerView, (_x, inputY, _width, inputHeight) => {
            const y = revealOffset({ inputY, inputHeight, ...geometry.current });
            if (y !== null) {
                scroll.scrollTo({ y, animated: false });
            }
        }, () => { });
    }, []);
    const scheduleReveal = useCallback(() => {
        if (pendingFrame.current === null) {
            pendingFrame.current = requestAnimationFrame(reveal);
        }
    }, [reveal]);
    useEffect(() => () => {
        if (pendingFrame.current !== null) {
            cancelAnimationFrame(pendingFrame.current);
        }
    }, []);
    const setRef = useCallback((instance) => {
        scrollRef.current = instance;
        if (typeof ref === 'function') {
            ref(instance);
        }
        else if (ref) {
            ref.current = instance;
        }
    }, [ref]);
    const handleScroll = useCallback((event) => {
        geometry.current.offsetY = event.nativeEvent.contentOffset.y;
        onScroll?.(event);
    }, [onScroll]);
    const handleLayout = useCallback((event) => {
        const { height } = event.nativeEvent.layout;
        const shrank = height < geometry.current.viewportHeight;
        geometry.current.viewportHeight = height;
        if (shrank) {
            scheduleReveal();
        }
        onLayout?.(event);
    }, [onLayout, scheduleReveal]);
    const handleContentSizeChange = useCallback((width, height) => {
        geometry.current.contentHeight = height;
        scheduleReveal();
        onContentSizeChange?.(width, height);
    }, [onContentSizeChange, scheduleReveal]);
    return (<BottomSheetScrollView {...props} ref={setRef} onScroll={handleScroll} onLayout={handleLayout} onContentSizeChange={handleContentSizeChange}>
      {children}
    </BottomSheetScrollView>);
});
SheetScrollViewComponent.displayName = 'SheetScrollView';
export const SheetScrollView = memo(SheetScrollViewComponent);
