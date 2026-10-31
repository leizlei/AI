const warn = (err) => console.warn('[stop] failed:', err);
export function stopQuietly(stop) {
    try {
        Promise.resolve(stop()).catch(warn);
    }
    catch (err) {
        warn(err);
    }
}
