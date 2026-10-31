import { useRef, useState } from 'react';
export const useMenuAnchor = () => {
    const ref = useRef(null);
    const [anchor, setAnchor] = useState({ x: 0, y: 0 });
    const [visible, setVisible] = useState(false);
    const open = () => ref.current?.measure((x, y, width, height, pageX, pageY) => {
        setAnchor({ x: pageX, y: pageY + height });
        setVisible(true);
    });
    return {
        buttonRef: ref,
        anchor,
        visible,
        open,
        close: () => setVisible(false),
    };
};
