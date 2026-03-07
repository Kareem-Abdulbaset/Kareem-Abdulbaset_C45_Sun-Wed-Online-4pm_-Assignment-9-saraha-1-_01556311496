const normalizeFindArgs = (modelOrConfig, filter, select, options) => {
    if (modelOrConfig && modelOrConfig.model) {
        return {
            model: modelOrConfig.model,
            filter: modelOrConfig.filter || {},
            select: modelOrConfig.select || "",
            options: modelOrConfig.options || {},
        };
    }

    return {
        model: modelOrConfig,
        filter: filter || {},
        select: select || "",
        options: options || {},
    };
};

const normalizeCreateArgs = (modelOrConfig, data, options) => {
    if (modelOrConfig && modelOrConfig.model) {
        return {
            model: modelOrConfig.model,
            data: modelOrConfig.data || {},
            options: modelOrConfig.options || {},
        };
    }

    return {
        model: modelOrConfig,
        data: data || {},
        options: options || {},
    };
};

export const findOne = async (modelOrConfig, filter = {}, select = "", options = {}) => {
    const normalized = normalizeFindArgs(modelOrConfig, filter, select, options);
    return await normalized.model.findOne(normalized.filter, null, normalized.options).select(normalized.select);
};

export const createOne = async (modelOrConfig, data = {}, options = {}) => {
    const normalized = normalizeCreateArgs(modelOrConfig, data, options);
    return await normalized.model.create(normalized.data, normalized.options);
};

export const create = createOne;
