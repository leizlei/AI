import * as React from 'react';
export const usePrevious = (value) => {
    const ref = React.useRef(undefined);
    React.useEffect(() => {
        ref.current = value;
    }, [value]);
    return ref.current;
};
