export var ModelOrigin;
(function (ModelOrigin) {
    ModelOrigin["PRESET"] = "preset";
    ModelOrigin["LOCAL"] = "local";
    ModelOrigin["HF"] = "hf";
    ModelOrigin["REMOTE"] = "remote";
})(ModelOrigin || (ModelOrigin = {}));
export var ModelType;
(function (ModelType) {
    ModelType["PROJECTION"] = "projection";
    ModelType["VISION"] = "vision";
    ModelType["LLM"] = "llm";
    ModelType["DRAFT"] = "draft";
})(ModelType || (ModelType = {}));
export var CacheType;
(function (CacheType) {
    CacheType["F16"] = "f16";
    CacheType["F32"] = "f32";
    CacheType["Q8_0"] = "q8_0";
    CacheType["Q4_0"] = "q4_0";
    CacheType["Q4_1"] = "q4_1";
    CacheType["IQ4_NL"] = "iq4_nl";
    CacheType["Q5_0"] = "q5_0";
    CacheType["Q5_1"] = "q5_1";
})(CacheType || (CacheType = {}));
