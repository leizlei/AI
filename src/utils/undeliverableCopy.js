import { Platform } from 'react-native';
export const undeliverableText = (record, copy) => {
    if (Platform.OS !== 'android') {
        return copy.noLongerAvailable;
    }
    return record?.withdrawnAfterDelivery
        ? copy.withdrawnRefunding
        : copy.notCompleted;
};
