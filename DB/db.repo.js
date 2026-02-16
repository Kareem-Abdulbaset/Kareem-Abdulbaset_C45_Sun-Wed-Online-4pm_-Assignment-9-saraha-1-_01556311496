

export const findOne = async ({
    model,
    filter = {},
    select = '',
    options = {}
} = {}) => {
    return await model.findOne(filter).select(select)
}

export const create = async ({
    model,
    filter = {},
    select = '',
    options = {}
} = {}) => {
    return await model.findOne(filter).select(select)
}

export const createOne = async ({
    model,
    data = {},
    select = '',
    options = { validateBeforeSave: true }
} = {}) => {
    return await model.createOne(data).select(select)
}