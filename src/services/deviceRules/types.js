// Parsed wire shape of `rules.<platform>.json` plus the device signals the
// classifier consumes. Each tier entry is a thin, flat candidate; the app
// synthesizes the minimal `{hfModel, modelFile}` pair `hfAsModel` reads at
// stub-build time and defers HF-derivable data (oid/lfs/templates) to download.
export {};
